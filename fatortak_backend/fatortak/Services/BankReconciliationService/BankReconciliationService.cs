using fatortak.Context;
using fatortak.Dtos.BankReconciliation;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using fatortak.Services.TransactionService;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace fatortak.Services.BankReconciliationService
{
    public interface IBankReconciliationService
    {
        Task<ServiceResult<PagedResponseDto<BankStatementDto>>> GetAsync(BankStatementFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<BankStatementDto>> GetAsync(Guid id);
        Task<ServiceResult<BankStatementDto>> ImportAsync(BankStatementImportDto dto);
        Task<ServiceResult<BankStatementDto>> MatchAsync(Guid statementId, Guid lineId, MatchBankLineDto dto);
        Task<ServiceResult<BankStatementDto>> UnmatchAsync(Guid statementId, Guid lineId);
        Task<ServiceResult<BankStatementDto>> ToggleIgnoreAsync(Guid statementId, Guid lineId);
        Task<ServiceResult<BankStatementDto>> AddAdjustmentAsync(Guid statementId, Guid lineId);
        Task<ServiceResult<BankStatementDto>> ReconcileAsync(Guid statementId);
        Task<ServiceResult<bool>> DeleteAsync(Guid statementId);
        Task<ServiceResult<List<BankTransactionCandidateDto>>> GetCandidatesAsync(Guid statementId, Guid lineId);
    }

    public class BankReconciliationService : IBankReconciliationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BankReconciliationService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITransactionService _transactionService;

        public BankReconciliationService(
            ApplicationDbContext context,
            ILogger<BankReconciliationService> logger,
            IHttpContextAccessor httpContextAccessor,
            ITransactionService transactionService)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _transactionService = transactionService;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<BankStatementDto>>> GetAsync(
            BankStatementFilterDto filter, PaginationDto pagination)
        {
            var query = _context.BankStatements
                .Where(b => b.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(b =>
                    b.Name.ToLower().Contains(term) ||
                    (b.FileName != null && b.FileName.ToLower().Contains(term)));
            }
            if (filter.AccountId.HasValue)
                query = query.Where(b => b.AccountId == filter.AccountId.Value);
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(b => b.Status == filter.Status);
            if (filter.FromDate.HasValue)
                query = query.Where(b => b.PeriodEnd >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(b => b.PeriodStart <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = new
            {
                total,
                open = await query.CountAsync(b => b.Status == "Open"),
                reconciled = await query.CountAsync(b => b.Status == "Reconciled"),
                unmatchedLines = await _context.BankStatementLines
                    .CountAsync(l => l.TenantId == TenantId && l.Status == "Unmatched")
            };

            var statements = await query
                .Include(b => b.Account)
                .Include(b => b.Lines)
                .OrderByDescending(b => b.ImportedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<BankStatementDto>>.SuccessResult(
                new PagedResponseDto<BankStatementDto>
                {
                    Data = statements.Select(Map).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<BankStatementDto>> GetAsync(Guid id)
        {
            var statement = await BaseQuery().FirstOrDefaultAsync(b => b.Id == id && b.TenantId == TenantId);
            return statement == null
                ? ServiceResult<BankStatementDto>.Failure("Bank statement not found")
                : ServiceResult<BankStatementDto>.SuccessResult(Map(statement));
        }

        public async Task<ServiceResult<BankStatementDto>> ImportAsync(BankStatementImportDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return ServiceResult<BankStatementDto>.Failure("Statement name is required.");
            if (dto.PeriodEnd < dto.PeriodStart)
                return ServiceResult<BankStatementDto>.Failure("The period end cannot be before the period start.");

            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == dto.AccountId && a.TenantId == TenantId && a.IsActive);
            if (account == null)
                return ServiceResult<BankStatementDto>.Failure("The selected account could not be found.");

            var lines = dto.Lines?.Where(l => l.Debit != 0 || l.Credit != 0 || !string.IsNullOrWhiteSpace(l.Description)).ToList()
                        ?? new List<BankStatementLineCreateDto>();
            if (lines.Count == 0 && !string.IsNullOrWhiteSpace(dto.Csv))
                lines = ParseCsv(dto.Csv);
            if (lines.Count == 0)
                return ServiceResult<BankStatementDto>.Failure("Add statement lines or a CSV file.");
            if (lines.Any(l => l.Debit < 0 || l.Credit < 0))
                return ServiceResult<BankStatementDto>.Failure("Statement amounts cannot be negative.");
            if (lines.Any(l => l.Debit > 0 && l.Credit > 0))
                return ServiceResult<BankStatementDto>.Failure("A line can be a debit or a credit, not both.");

            var statement = new BankStatement
            {
                TenantId = TenantId,
                AccountId = dto.AccountId,
                Name = dto.Name.Trim(),
                FileName = dto.FileName,
                PeriodStart = dto.PeriodStart.Date,
                PeriodEnd = dto.PeriodEnd.Date,
                OpeningBalance = dto.OpeningBalance,
                ClosingBalance = dto.ClosingBalance,
                Notes = dto.Notes,
                Status = "Open",
                ImportedByUserId = TryGetUserId()
            };

            foreach (var line in lines)
            {
                statement.Lines.Add(new BankStatementLine
                {
                    TenantId = TenantId,
                    Date = line.Date.Date,
                    Description = line.Description.Trim(),
                    Reference = line.Reference,
                    Debit = line.Debit,
                    Credit = line.Credit,
                    Status = "Unmatched"
                });
            }

            _context.BankStatements.Add(statement);
            await _context.SaveChangesAsync();
            return await GetAsync(statement.Id);
        }

        public async Task<ServiceResult<BankStatementDto>> MatchAsync(
            Guid statementId, Guid lineId, MatchBankLineDto dto)
        {
            var statement = await BaseQuery().FirstOrDefaultAsync(b => b.Id == statementId && b.TenantId == TenantId);
            if (statement == null)
                return ServiceResult<BankStatementDto>.Failure("Bank statement not found");
            if (statement.Status == "Reconciled")
                return ServiceResult<BankStatementDto>.Failure("Reconciled statements cannot be changed.");

            var line = statement.Lines.FirstOrDefault(l => l.Id == lineId);
            if (line == null)
                return ServiceResult<BankStatementDto>.Failure("Statement line not found");
            if (line.Status == "Matched")
                return ServiceResult<BankStatementDto>.Failure("This line is already matched.");

            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == dto.TransactionId && t.TenantId == TenantId);
            if (transaction == null)
                return ServiceResult<BankStatementDto>.Failure("Transaction not found.");

            var lineAmount = line.Debit > 0 ? line.Debit : line.Credit;
            if (Math.Abs(transaction.Amount - lineAmount) > 0.01m)
                return ServiceResult<BankStatementDto>.Failure(
                    "The transaction amount does not match the statement line.");

            var alreadyMatched = await _context.BankStatementLines.AnyAsync(l =>
                l.TenantId == TenantId &&
                l.MatchedTransactionId == transaction.Id &&
                l.Status == "Matched");
            if (alreadyMatched)
                return ServiceResult<BankStatementDto>.Failure("That transaction is already matched to another line.");

            line.MatchedTransactionId = transaction.Id;
            line.Status = "Matched";
            line.MatchedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return await GetAsync(statementId);
        }

        public async Task<ServiceResult<BankStatementDto>> UnmatchAsync(Guid statementId, Guid lineId)
        {
            var statement = await BaseQuery().FirstOrDefaultAsync(b => b.Id == statementId && b.TenantId == TenantId);
            if (statement == null)
                return ServiceResult<BankStatementDto>.Failure("Bank statement not found");
            if (statement.Status == "Reconciled")
                return ServiceResult<BankStatementDto>.Failure("Reconciled statements cannot be changed.");

            var line = statement.Lines.FirstOrDefault(l => l.Id == lineId);
            if (line == null)
                return ServiceResult<BankStatementDto>.Failure("Statement line not found");
            if (line.Status != "Matched")
                return ServiceResult<BankStatementDto>.Failure("This line is not matched.");

            line.MatchedTransactionId = null;
            line.MatchedAt = null;
            line.Status = "Unmatched";
            await _context.SaveChangesAsync();
            return await GetAsync(statementId);
        }

        public async Task<ServiceResult<BankStatementDto>> ToggleIgnoreAsync(Guid statementId, Guid lineId)
        {
            var statement = await BaseQuery().FirstOrDefaultAsync(b => b.Id == statementId && b.TenantId == TenantId);
            if (statement == null)
                return ServiceResult<BankStatementDto>.Failure("Bank statement not found");
            if (statement.Status == "Reconciled")
                return ServiceResult<BankStatementDto>.Failure("Reconciled statements cannot be changed.");

            var line = statement.Lines.FirstOrDefault(l => l.Id == lineId);
            if (line == null)
                return ServiceResult<BankStatementDto>.Failure("Statement line not found");
            if (line.Status == "Matched")
                return ServiceResult<BankStatementDto>.Failure("Matched lines cannot be ignored.");

            line.Status = line.Status == "Ignored" ? "Unmatched" : "Ignored";
            await _context.SaveChangesAsync();
            return await GetAsync(statementId);
        }

        public async Task<ServiceResult<BankStatementDto>> AddAdjustmentAsync(Guid statementId, Guid lineId)
        {
            var statement = await BaseQuery().FirstOrDefaultAsync(b => b.Id == statementId && b.TenantId == TenantId);
            if (statement == null)
                return ServiceResult<BankStatementDto>.Failure("Bank statement not found");
            if (statement.Status == "Reconciled")
                return ServiceResult<BankStatementDto>.Failure("Reconciled statements cannot be changed.");

            var line = statement.Lines.FirstOrDefault(l => l.Id == lineId);
            if (line == null)
                return ServiceResult<BankStatementDto>.Failure("Statement line not found");
            if (line.Status == "Matched")
                return ServiceResult<BankStatementDto>.Failure("This line is already matched.");

            var isCredit = line.Credit > 0;
            var result = await _transactionService.AddTransactionAsync(new Transaction
            {
                Id = Guid.NewGuid(),
                TenantId = TenantId,
                TransactionDate = line.Date,
                Type = "BankAdjustment",
                Amount = isCredit ? line.Credit : line.Debit,
                Direction = isCredit ? "Credit" : "Debit",
                ReferenceId = line.Id.ToString(),
                ReferenceType = "BankStatementLine",
                Description = $"Bank adjustment: {line.Description}",
                PaymentMethod = "Bank",
                CreatedBy = TryGetUserId()
            });
            if (!result.Success)
                return ServiceResult<BankStatementDto>.Failure(result.ErrorMessage ?? "Could not create adjustment.");

            line.MatchedTransactionId = result.Data.Id;
            line.Status = "Matched";
            line.MatchedAt = DateTime.UtcNow;
            line.Notes = "Matched to generated bank adjustment";
            await _context.SaveChangesAsync();
            return await GetAsync(statementId);
        }

        public async Task<ServiceResult<BankStatementDto>> ReconcileAsync(Guid statementId)
        {
            var statement = await BaseQuery().FirstOrDefaultAsync(b => b.Id == statementId && b.TenantId == TenantId);
            if (statement == null)
                return ServiceResult<BankStatementDto>.Failure("Bank statement not found");
            if (statement.Status == "Reconciled")
                return ServiceResult<BankStatementDto>.Failure("This statement is already reconciled.");

            var unmatched = statement.Lines.Count(l => l.Status == "Unmatched");
            if (unmatched > 0)
                return ServiceResult<BankStatementDto>.Failure(
                    $"{unmatched} line(s) still need matching or ignoring before reconciliation.");

            statement.Status = "Reconciled";
            await _context.SaveChangesAsync();
            return await GetAsync(statementId);
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid statementId)
        {
            var statement = await BaseQuery().FirstOrDefaultAsync(b => b.Id == statementId && b.TenantId == TenantId);
            if (statement == null)
                return ServiceResult<bool>.Failure("Bank statement not found");
            if (statement.Status == "Reconciled")
                return ServiceResult<bool>.Failure("Reconciled statements cannot be deleted.");

            _context.BankStatements.Remove(statement);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<List<BankTransactionCandidateDto>>> GetCandidatesAsync(
            Guid statementId, Guid lineId)
        {
            var statement = await BaseQuery().FirstOrDefaultAsync(b => b.Id == statementId && b.TenantId == TenantId);
            if (statement == null)
                return ServiceResult<List<BankTransactionCandidateDto>>.Failure("Bank statement not found");
            var line = statement.Lines.FirstOrDefault(l => l.Id == lineId);
            if (line == null)
                return ServiceResult<List<BankTransactionCandidateDto>>.Failure("Statement line not found");

            var amount = line.Debit > 0 ? line.Debit : line.Credit;
            var from = line.Date.AddDays(-7);
            var to = line.Date.AddDays(7);
            var matchedIds = await _context.BankStatementLines
                .Where(l => l.TenantId == TenantId && l.MatchedTransactionId != null && l.Status == "Matched")
                .Select(l => l.MatchedTransactionId!.Value)
                .ToListAsync();

            var candidates = await _context.Transactions
                .Where(t => t.TenantId == TenantId &&
                            t.TransactionDate >= from &&
                            t.TransactionDate <= to &&
                            Math.Abs(t.Amount - amount) <= 0.01m &&
                            !matchedIds.Contains(t.Id))
                .OrderByDescending(t => t.TransactionDate)
                .Take(100)
                .Select(t => new BankTransactionCandidateDto
                {
                    Id = t.Id,
                    Date = t.TransactionDate,
                    Description = t.Description,
                    Amount = t.Amount,
                    Direction = t.Direction,
                    Type = t.Type
                })
                .ToListAsync();

            return ServiceResult<List<BankTransactionCandidateDto>>.SuccessResult(candidates);
        }

        private IQueryable<BankStatement> BaseQuery() =>
            _context.BankStatements
                .Include(b => b.Account)
                .Include(b => b.ImportedByUser)
                .Include(b => b.Lines);

        private static List<BankStatementLineCreateDto> ParseCsv(string csv)
        {
            var result = new List<BankStatementLineCreateDto>();
            var rows = csv.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                .Select(SplitCsvLine)
                .ToList();
            if (rows.Count == 0) return result;

            var header = rows[0].Select(h => h.Trim().ToLowerInvariant()).ToList();
            int dateIndex = header.FindIndex(h => h is "date" or "transaction date" or "value date");
            int descriptionIndex = header.FindIndex(h => h is "description" or "details" or "narration");
            int referenceIndex = header.FindIndex(h => h is "reference" or "ref" or "reference number");
            int debitIndex = header.FindIndex(h => h is "debit" or "withdrawal" or "money out");
            int creditIndex = header.FindIndex(h => h is "credit" or "deposit" or "money in");
            var hasHeader = dateIndex >= 0 && (debitIndex >= 0 || creditIndex >= 0);
            var start = hasHeader ? 1 : 0;

            for (var i = start; i < rows.Count; i++)
            {
                var row = rows[i];
                if (row.Count == 0) continue;

                var dateRaw = row.ElementAtOrDefault(hasHeader ? dateIndex : 0)?.Trim();
                var description = row.ElementAtOrDefault(hasHeader ? descriptionIndex : 1)?.Trim() ?? "Bank line";
                var reference = hasHeader && referenceIndex >= 0
                    ? row.ElementAtOrDefault(referenceIndex)?.Trim()
                    : null;
                var debitRaw = row.ElementAtOrDefault(hasHeader ? debitIndex : 2)?.Trim();
                var creditRaw = row.ElementAtOrDefault(hasHeader ? creditIndex : 3)?.Trim();

                if (!TryParseDate(dateRaw, out var date)) continue;
                result.Add(new BankStatementLineCreateDto
                {
                    Date = date,
                    Description = string.IsNullOrWhiteSpace(description) ? "Bank line" : description,
                    Reference = reference,
                    Debit = ParseAmount(debitRaw),
                    Credit = ParseAmount(creditRaw)
                });
            }

            return result;
        }

        private static List<string> SplitCsvLine(string line)
        {
            var values = new List<string>();
            var current = new System.Text.StringBuilder();
            var inQuotes = false;
            foreach (var ch in line)
            {
                if (ch == '"')
                {
                    inQuotes = !inQuotes;
                    continue;
                }
                if (ch == ',' && !inQuotes)
                {
                    values.Add(current.ToString());
                    current.Clear();
                    continue;
                }
                current.Append(ch);
            }
            values.Add(current.ToString());
            return values;
        }

        private static bool TryParseDate(string? value, out DateTime date)
        {
            var formats = new[]
            {
                "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy", "yyyy/MM/dd"
            };
            return DateTime.TryParseExact(value, formats, CultureInfo.InvariantCulture,
                       DateTimeStyles.None, out date)
                   || DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
        }

        private static decimal ParseAmount(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return 0;
            var cleaned = value.Replace(",", "").Replace(" ", "");
            return decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount)
                ? Math.Abs(amount)
                : 0;
        }

        private static BankStatementDto Map(BankStatement statement)
        {
            var lines = statement.Lines.ToList();
            var totalDebit = lines.Sum(l => l.Debit);
            var totalCredit = lines.Sum(l => l.Credit);
            return new BankStatementDto
            {
                Id = statement.Id,
                AccountId = statement.AccountId,
                AccountName = statement.Account?.Name ?? string.Empty,
                Name = statement.Name,
                FileName = statement.FileName,
                PeriodStart = statement.PeriodStart,
                PeriodEnd = statement.PeriodEnd,
                OpeningBalance = statement.OpeningBalance,
                ClosingBalance = statement.ClosingBalance,
                Status = statement.Status,
                ImportedAt = statement.ImportedAt,
                ImportedByName = statement.ImportedByUser == null
                    ? null
                    : $"{statement.ImportedByUser.FirstName} {statement.ImportedByUser.LastName}".Trim(),
                Notes = statement.Notes,
                LineCount = lines.Count,
                MatchedCount = lines.Count(l => l.Status == "Matched"),
                UnmatchedCount = lines.Count(l => l.Status == "Unmatched"),
                TotalDebit = totalDebit,
                TotalCredit = totalCredit,
                StatementDifference = statement.OpeningBalance + totalCredit - totalDebit - statement.ClosingBalance,
                Lines = lines.OrderBy(l => l.Date).Select(l => new BankStatementLineDto
                {
                    Id = l.Id,
                    Date = l.Date,
                    Description = l.Description,
                    Reference = l.Reference,
                    Debit = l.Debit,
                    Credit = l.Credit,
                    Status = l.Status,
                    MatchedTransactionId = l.MatchedTransactionId,
                    MatchedAt = l.MatchedAt,
                    Notes = l.Notes
                }).ToList()
            };
        }

        private Guid? TryGetUserId()
        {
            var raw = UserHelper.GetUserId();
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        private Guid GetTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }
    }
}
