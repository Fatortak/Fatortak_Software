using fatortak.Common.Enum;
using fatortak.Context;
using fatortak.Dtos.Commission;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.CommissionService
{
    public interface ICommissionService
    {
        Task<ServiceResult<List<CommissionRuleDto>>> GetRulesAsync();
        Task<ServiceResult<CommissionRuleDto>> CreateRuleAsync(CommissionRuleCreateDto dto);
        Task<ServiceResult<CommissionRuleDto>> UpdateRuleAsync(Guid id, CommissionRuleUpdateDto dto);
        Task<ServiceResult<bool>> DeleteRuleAsync(Guid id);
        Task<ServiceResult<PagedResponseDto<SalesCommissionDto>>> GetCommissionsAsync(CommissionFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<SalesCommissionDto>> GenerateAsync(GenerateCommissionDto dto);
        Task<ServiceResult<SalesCommissionDto>> ApproveAsync(Guid id);
        Task<ServiceResult<SalesCommissionDto>> PayAsync(Guid id);
        Task<ServiceResult<SalesCommissionDto>> CancelAsync(Guid id);
    }

    public class CommissionService : ICommissionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CommissionService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CommissionService(
            ApplicationDbContext context,
            ILogger<CommissionService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<List<CommissionRuleDto>>> GetRulesAsync()
        {
            var rules = await _context.CommissionRules
                .Include(r => r.User)
                .Where(r => r.TenantId == TenantId)
                .OrderByDescending(r => r.IsActive)
                .ThenBy(r => r.Name)
                .ToListAsync();
            return ServiceResult<List<CommissionRuleDto>>.SuccessResult(rules.Select(MapRule).ToList());
        }

        public async Task<ServiceResult<CommissionRuleDto>> CreateRuleAsync(CommissionRuleCreateDto dto)
        {
            var validation = ValidateRule(dto);
            if (validation != null) return ServiceResult<CommissionRuleDto>.Failure(validation);

            var rule = new CommissionRule
            {
                TenantId = TenantId,
                Name = dto.Name.Trim(),
                UserId = dto.UserId,
                Rate = dto.Rate,
                Basis = dto.Basis,
                IsActive = dto.IsActive,
                EffectiveFrom = dto.EffectiveFrom.Date,
                EffectiveTo = dto.EffectiveTo?.Date
            };
            _context.CommissionRules.Add(rule);
            await _context.SaveChangesAsync();
            return ServiceResult<CommissionRuleDto>.SuccessResult(MapRule(rule));
        }

        public async Task<ServiceResult<CommissionRuleDto>> UpdateRuleAsync(Guid id, CommissionRuleUpdateDto dto)
        {
            var rule = await _context.CommissionRules
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (rule == null) return ServiceResult<CommissionRuleDto>.Failure("Commission rule not found");

            var validation = ValidateRule(dto);
            if (validation != null) return ServiceResult<CommissionRuleDto>.Failure(validation);

            rule.Name = dto.Name.Trim();
            rule.UserId = dto.UserId;
            rule.Rate = dto.Rate;
            rule.Basis = dto.Basis;
            rule.IsActive = dto.IsActive;
            rule.EffectiveFrom = dto.EffectiveFrom.Date;
            rule.EffectiveTo = dto.EffectiveTo?.Date;
            rule.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return ServiceResult<CommissionRuleDto>.SuccessResult(MapRule(rule));
        }

        public async Task<ServiceResult<bool>> DeleteRuleAsync(Guid id)
        {
            var rule = await _context.CommissionRules
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (rule == null) return ServiceResult<bool>.Failure("Commission rule not found");

            var used = await _context.SalesCommissions.AnyAsync(c => c.RuleId == id && c.TenantId == TenantId);
            if (used) return ServiceResult<bool>.Failure("Rules that have generated commissions cannot be deleted; deactivate them instead.");

            _context.CommissionRules.Remove(rule);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<PagedResponseDto<SalesCommissionDto>>> GetCommissionsAsync(
            CommissionFilterDto filter, PaginationDto pagination)
        {
            var query = _context.SalesCommissions
                .Where(c => c.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(c =>
                    c.Invoice.InvoiceNumber.ToLower().Contains(term) ||
                    c.Rule.Name.ToLower().Contains(term));
            }
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(c => c.Status == filter.Status);
            if (filter.UserId.HasValue)
                query = query.Where(c => c.UserId == filter.UserId.Value);

            var total = await query.CountAsync();
            var stats = new
            {
                total,
                pending = await query.CountAsync(c => c.Status == "Pending"),
                approved = await query.CountAsync(c => c.Status == "Approved"),
                paid = await query.CountAsync(c => c.Status == "Paid"),
                pendingValue = await query.Where(c => c.Status == "Pending").SumAsync(c => c.Amount),
                paidValue = await query.Where(c => c.Status == "Paid").SumAsync(c => c.Amount)
            };

            var commissions = await BaseQuery()
                .OrderByDescending(c => c.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<SalesCommissionDto>>.SuccessResult(
                new PagedResponseDto<SalesCommissionDto>
                {
                    Data = commissions.Select(MapCommission).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<SalesCommissionDto>> GenerateAsync(GenerateCommissionDto dto)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId &&
                                          i.TenantId == TenantId &&
                                          i.InvoiceType == "Sell" &&
                                          i.DocumentType == "Invoice");
            if (invoice == null)
                return ServiceResult<SalesCommissionDto>.Failure("Sales invoice not found");

            var today = DateTime.UtcNow.Date;
            var rule = dto.RuleId.HasValue
                ? await _context.CommissionRules.FirstOrDefaultAsync(r =>
                    r.Id == dto.RuleId && r.TenantId == TenantId && r.IsActive)
                : await _context.CommissionRules
                    .Where(r => r.TenantId == TenantId &&
                                r.IsActive &&
                                r.EffectiveFrom <= today &&
                                (r.EffectiveTo == null || r.EffectiveTo >= today) &&
                                (r.UserId == null || r.UserId == invoice.UserId))
                    .OrderByDescending(r => r.UserId != null)
                    .FirstOrDefaultAsync();

            if (rule == null)
                return ServiceResult<SalesCommissionDto>.Failure("No active commission rule applies to this invoice.");
            if (rule.Rate <= 0)
                return ServiceResult<SalesCommissionDto>.Failure("The commission rate must be greater than zero.");

            var alreadyExists = await _context.SalesCommissions.AnyAsync(c =>
                c.TenantId == TenantId && c.InvoiceId == invoice.Id && c.RuleId == rule.Id);
            if (alreadyExists)
                return ServiceResult<SalesCommissionDto>.Failure("A commission already exists for this invoice and rule.");

            var isCollected = rule.Basis == "Collected";
            var basisAmount = isCollected
                ? invoice.AmountPaid.GetValueOrDefault()
                : invoice.Total;
            if (basisAmount <= 0)
                return ServiceResult<SalesCommissionDto>.Failure(
                    isCollected
                        ? "The invoice has no collected amount yet."
                        : "The invoice has no amount to commission.");

            var commission = new SalesCommission
            {
                TenantId = TenantId,
                InvoiceId = invoice.Id,
                RuleId = rule.Id,
                UserId = invoice.UserId ?? rule.UserId,
                BasisAmount = basisAmount,
                Rate = rule.Rate,
                Amount = Math.Round(basisAmount * rule.Rate, 2),
                Status = "Pending",
                Basis = rule.Basis,
                Notes = dto.Notes
            };
            _context.SalesCommissions.Add(commission);
            await _context.SaveChangesAsync();
            return ServiceResult<SalesCommissionDto>.SuccessResult(
                MapCommission((await BaseQuery().FirstAsync(c => c.Id == commission.Id))));
        }

        public async Task<ServiceResult<SalesCommissionDto>> ApproveAsync(Guid id)
        {
            var commission = await BaseQuery().FirstOrDefaultAsync(c => c.Id == id && c.TenantId == TenantId);
            if (commission == null) return ServiceResult<SalesCommissionDto>.Failure("Commission not found");
            if (commission.Status != "Pending")
                return ServiceResult<SalesCommissionDto>.Failure("Only pending commissions can be approved.");
            if (!await IsApproverAsync())
                return ServiceResult<SalesCommissionDto>.Failure("Only an administrator can approve commissions.");

            commission.Status = "Approved";
            commission.ApprovedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return ServiceResult<SalesCommissionDto>.SuccessResult(MapCommission(commission));
        }

        public async Task<ServiceResult<SalesCommissionDto>> PayAsync(Guid id)
        {
            var commission = await BaseQuery().FirstOrDefaultAsync(c => c.Id == id && c.TenantId == TenantId);
            if (commission == null) return ServiceResult<SalesCommissionDto>.Failure("Commission not found");
            if (commission.Status != "Approved")
                return ServiceResult<SalesCommissionDto>.Failure("Only approved commissions can be paid.");
            if (!await IsApproverAsync())
                return ServiceResult<SalesCommissionDto>.Failure("Only an administrator can pay commissions.");

            var expense = await GetOrCreateAccountAsync("6100", "Commission Expense", AccountType.Expense);
            var payable = await GetOrCreateAccountAsync("2300", "Commission Payable", AccountType.Liability);
            if (expense == null || payable == null)
                return ServiceResult<SalesCommissionDto>.Failure("Commission accounts could not be created.");

            var entryNumber = await GenerateEntryNumberAsync();
            var entry = new JournalEntry
            {
                Id = Guid.NewGuid(),
                TenantId = TenantId,
                EntryNumber = entryNumber,
                Date = DateTime.UtcNow.Date,
                ReferenceType = JournalEntryReferenceType.Manual,
                ReferenceId = commission.Id,
                Description = $"Sales commission {commission.Invoice?.InvoiceNumber}",
                IsPosted = true,
                PostedAt = DateTime.UtcNow,
                PostedBy = TryGetUserId(),
                CreatedAt = DateTime.UtcNow,
                CreatedBy = TryGetUserId()
            };
            _context.JournalEntries.Add(entry);
            _context.JournalEntryLines.Add(new JournalEntryLine
            {
                Id = Guid.NewGuid(),
                JournalEntryId = entry.Id,
                AccountId = expense.Id,
                Debit = commission.Amount,
                Credit = 0,
                Description = "Commission expense"
            });
            _context.JournalEntryLines.Add(new JournalEntryLine
            {
                Id = Guid.NewGuid(),
                JournalEntryId = entry.Id,
                AccountId = payable.Id,
                Debit = 0,
                Credit = commission.Amount,
                Description = "Commission payable"
            });

            commission.Status = "Paid";
            commission.PaidAt = DateTime.UtcNow;
            commission.JournalEntryId = entry.Id;
            await _context.SaveChangesAsync();
            return ServiceResult<SalesCommissionDto>.SuccessResult(MapCommission(commission));
        }

        public async Task<ServiceResult<SalesCommissionDto>> CancelAsync(Guid id)
        {
            var commission = await BaseQuery().FirstOrDefaultAsync(c => c.Id == id && c.TenantId == TenantId);
            if (commission == null) return ServiceResult<SalesCommissionDto>.Failure("Commission not found");
            if (commission.Status is "Paid" or "Cancelled")
                return ServiceResult<SalesCommissionDto>.Failure("Paid or cancelled commissions cannot be cancelled.");

            commission.Status = "Cancelled";
            await _context.SaveChangesAsync();
            return ServiceResult<SalesCommissionDto>.SuccessResult(MapCommission(commission));
        }

        private IQueryable<SalesCommission> BaseQuery() =>
            _context.SalesCommissions
                .Include(c => c.Invoice).ThenInclude(i => i.Customer)
                .Include(c => c.Rule)
                .Include(c => c.User);

        private async Task<Account?> GetOrCreateAccountAsync(string code, string name, AccountType type)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.TenantId == TenantId && a.AccountCode == code);
            if (account != null) return account;

            account = new Account
            {
                Id = Guid.NewGuid(),
                TenantId = TenantId,
                AccountCode = code,
                Name = name,
                AccountType = type,
                IsPostable = true,
                IsSystem = true,
                IsActive = true,
                Level = 1,
                CreatedAt = DateTime.UtcNow
            };
            _context.Accounts.Add(account);
            return account;
        }

        private async Task<string> GenerateEntryNumberAsync()
        {
            var prefix = $"JE-{DateTime.UtcNow:yyyyMMdd}";
            var count = await _context.JournalEntries
                .CountAsync(j => j.TenantId == TenantId && j.EntryNumber.StartsWith(prefix));
            return $"{prefix}-{count + 1:0000}";
        }

        private async Task<bool> IsApproverAsync()
        {
            var userId = TryGetUserId();
            if (!userId.HasValue) return false;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            return user?.Role == "Admin" || user?.Role == "SysAdmin";
        }

        private string? ValidateRule(CommissionRuleCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return "Rule name is required.";
            if (dto.Rate <= 0 || dto.Rate > 1) return "Rate must be between 0 and 1 (for example 0.05 = 5%).";
            if (dto.Basis is not ("Collected" or "Invoiced")) return "Basis must be Collected or Invoiced.";
            if (dto.EffectiveTo.HasValue && dto.EffectiveTo.Value.Date < dto.EffectiveFrom.Date)
                return "The effective-to date cannot be before the effective-from date.";
            return null;
        }

        private static CommissionRuleDto MapRule(CommissionRule rule) => new()
        {
            Id = rule.Id,
            Name = rule.Name,
            UserId = rule.UserId,
            UserName = rule.User == null ? null : $"{rule.User.FirstName} {rule.User.LastName}".Trim(),
            Rate = rule.Rate,
            Basis = rule.Basis,
            IsActive = rule.IsActive,
            EffectiveFrom = rule.EffectiveFrom,
            EffectiveTo = rule.EffectiveTo
        };

        private static SalesCommissionDto MapCommission(SalesCommission commission) => new()
        {
            Id = commission.Id,
            InvoiceId = commission.InvoiceId,
            InvoiceNumber = commission.Invoice?.InvoiceNumber ?? string.Empty,
            CustomerName = commission.Invoice?.Customer?.Name,
            RuleId = commission.RuleId,
            RuleName = commission.Rule?.Name ?? string.Empty,
            UserId = commission.UserId,
            UserName = commission.User == null ? null : $"{commission.User.FirstName} {commission.User.LastName}".Trim(),
            BasisAmount = commission.BasisAmount,
            Rate = commission.Rate,
            Amount = commission.Amount,
            Status = commission.Status,
            Basis = commission.Basis,
            CreatedAt = commission.CreatedAt,
            ApprovedAt = commission.ApprovedAt,
            PaidAt = commission.PaidAt,
            Notes = commission.Notes
        };

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
