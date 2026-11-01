using fatortak.Context;
using fatortak.Dtos.Invoice;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using fatortak.Services.AccountingPostingService;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.InvoiceNoteService
{
    public interface IInvoiceNoteService
    {
        Task<ServiceResult<PagedResponseDto<InvoiceNoteDto>>> GetAsync(InvoiceNoteFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<InvoiceNoteDto>> GetAsync(Guid id);
        Task<ServiceResult<InvoiceNoteDto>> CreateAsync(InvoiceNoteCreateDto dto);
        Task<ServiceResult<InvoiceNoteDto>> UpdateAsync(Guid id, InvoiceNoteUpdateDto dto);
        Task<ServiceResult<bool>> DeleteAsync(Guid id);
        Task<ServiceResult<InvoiceNoteDto>> PostAsync(Guid id);
        Task<ServiceResult<InvoiceNoteDto>> CancelAsync(Guid id);
    }

    public class InvoiceNoteService : IInvoiceNoteService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InvoiceNoteService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAccountingPostingService _accountingPostingService;

        public InvoiceNoteService(
            ApplicationDbContext context,
            ILogger<InvoiceNoteService> logger,
            IHttpContextAccessor httpContextAccessor,
            IAccountingPostingService accountingPostingService)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _accountingPostingService = accountingPostingService;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<InvoiceNoteDto>>> GetAsync(
            InvoiceNoteFilterDto filter, PaginationDto pagination)
        {
            var query = _context.Invoices
                .Where(i => i.TenantId == TenantId &&
                            (i.DocumentType == "CreditNote" || i.DocumentType == "DebitNote"))
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(i =>
                    i.InvoiceNumber.ToLower().Contains(term) ||
                    i.Customer.Name.ToLower().Contains(term) ||
                    (i.NoteReason != null && i.NoteReason.ToLower().Contains(term)));
            }
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(i => i.Status == filter.Status);
            if (!string.IsNullOrWhiteSpace(filter.NoteType))
            {
                var documentType = filter.NoteType.Equals("Debit", StringComparison.OrdinalIgnoreCase)
                    ? "DebitNote"
                    : "CreditNote";
                query = query.Where(i => i.DocumentType == documentType);
            }
            if (!string.IsNullOrWhiteSpace(filter.InvoiceType))
                query = query.Where(i => i.InvoiceType == filter.InvoiceType);
            if (filter.FromDate.HasValue)
                query = query.Where(i => i.IssueDate >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(i => i.IssueDate <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = new
            {
                total,
                draft = await query.CountAsync(i => i.Status == "Draft"),
                posted = await query.CountAsync(i => i.Status == "Posted"),
                creditTotal = Math.Abs(await query
                    .Where(i => i.DocumentType == "CreditNote")
                    .SumAsync(i => i.Total)),
                debitTotal = Math.Abs(await query
                    .Where(i => i.DocumentType == "DebitNote")
                    .SumAsync(i => i.Total))
            };

            var notes = await query
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .OrderByDescending(i => i.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            var originalIds = notes.Select(n => n.OriginalInvoiceId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
            var originals = await _context.Invoices
                .Where(i => originalIds.Contains(i.Id) && i.TenantId == TenantId)
                .Select(i => new { i.Id, i.InvoiceNumber })
                .ToDictionaryAsync(i => i.Id, i => i.InvoiceNumber);

            return ServiceResult<PagedResponseDto<InvoiceNoteDto>>.SuccessResult(
                new PagedResponseDto<InvoiceNoteDto>
                {
                    Data = notes.Select(n => Map(n, n.OriginalInvoiceId.HasValue
                        ? originals.GetValueOrDefault(n.OriginalInvoiceId.Value)
                        : null)).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<InvoiceNoteDto>> GetAsync(Guid id)
        {
            var note = await BaseQuery().FirstOrDefaultAsync(i =>
                i.Id == id && i.TenantId == TenantId &&
                (i.DocumentType == "CreditNote" || i.DocumentType == "DebitNote"));
            if (note == null)
                return ServiceResult<InvoiceNoteDto>.Failure("Credit/debit note not found");

            var originalNumber = note.OriginalInvoiceId.HasValue
                ? await _context.Invoices
                    .Where(i => i.Id == note.OriginalInvoiceId && i.TenantId == TenantId)
                    .Select(i => i.InvoiceNumber)
                    .FirstOrDefaultAsync()
                : null;
            return ServiceResult<InvoiceNoteDto>.SuccessResult(Map(note, originalNumber));
        }

        public async Task<ServiceResult<InvoiceNoteDto>> CreateAsync(InvoiceNoteCreateDto dto)
        {
            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<InvoiceNoteDto>.Failure(validation);

            var original = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == dto.OriginalInvoiceId && i.TenantId == TenantId);
            if (original == null || original.DocumentType != "Invoice")
                return ServiceResult<InvoiceNoteDto>.Failure("The original invoice could not be found.");

            var isCredit = dto.NoteType.Equals("Credit", StringComparison.OrdinalIgnoreCase);
            var documentType = isCredit ? "CreditNote" : "DebitNote";
            var prefix = isCredit ? "CRN-" : "DBN-";
            var last = await _context.Invoices
                .Where(i => i.TenantId == TenantId && i.DocumentType == documentType)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            var note = new Invoice
            {
                TenantId = TenantId,
                InvoiceNumber = DocumentNumberHelper.Next(prefix, last),
                CustomerId = original.CustomerId,
                BranchId = original.BranchId,
                ProjectId = original.ProjectId,
                UserId = TryGetUserId(),
                IssueDate = dto.IssueDate,
                DueDate = dto.IssueDate,
                Status = "Draft",
                InvoiceType = original.InvoiceType,
                DocumentType = documentType,
                OriginalInvoiceId = original.Id,
                NoteReason = dto.Reason.Trim(),
                Currency = original.Currency,
                Notes = dto.Notes
            };
            RebuildItems(note, dto.Items, original.InvoiceType);

            _context.Invoices.Add(note);
            await _context.SaveChangesAsync();
            return await GetAsync(note.Id);
        }

        public async Task<ServiceResult<InvoiceNoteDto>> UpdateAsync(Guid id, InvoiceNoteUpdateDto dto)
        {
            var note = await BaseQuery().FirstOrDefaultAsync(i =>
                i.Id == id && i.TenantId == TenantId && i.DocumentType != "Invoice");
            if (note == null)
                return ServiceResult<InvoiceNoteDto>.Failure("Credit/debit note not found");
            if (note.Status != "Draft")
                return ServiceResult<InvoiceNoteDto>.Failure("Only draft notes can be edited.");
            if (dto.OriginalInvoiceId != note.OriginalInvoiceId)
                return ServiceResult<InvoiceNoteDto>.Failure("The original invoice cannot be changed.");

            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<InvoiceNoteDto>.Failure(validation);

            _context.InvoiceItems.RemoveRange(note.InvoiceItems);
            note.InvoiceItems.Clear();
            note.IssueDate = dto.IssueDate;
            note.DueDate = dto.IssueDate;
            note.NoteReason = dto.Reason.Trim();
            note.Notes = dto.Notes;
            note.UpdatedAt = DateTime.UtcNow;
            RebuildItems(note, dto.Items, note.InvoiceType);
            foreach (var item in note.InvoiceItems)
                _context.InvoiceItems.Add(item);

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
        {
            var note = await BaseQuery().FirstOrDefaultAsync(i =>
                i.Id == id && i.TenantId == TenantId && i.DocumentType != "Invoice");
            if (note == null)
                return ServiceResult<bool>.Failure("Credit/debit note not found");
            if (note.Status != "Draft")
                return ServiceResult<bool>.Failure("Only draft notes can be deleted.");

            _context.Invoices.Remove(note);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<InvoiceNoteDto>> PostAsync(Guid id)
        {
            var note = await BaseQuery().FirstOrDefaultAsync(i =>
                i.Id == id && i.TenantId == TenantId &&
                (i.DocumentType == "CreditNote" || i.DocumentType == "DebitNote"));
            if (note == null)
                return ServiceResult<InvoiceNoteDto>.Failure("Credit/debit note not found");
            if (note.Status != "Draft")
                return ServiceResult<InvoiceNoteDto>.Failure("Only draft notes can be posted.");
            if (note.InvoiceItems.Count == 0)
                return ServiceResult<InvoiceNoteDto>.Failure("Add at least one line before posting.");

            var original = note.OriginalInvoiceId.HasValue
                ? await _context.Invoices.FirstOrDefaultAsync(i =>
                    i.Id == note.OriginalInvoiceId && i.TenantId == TenantId)
                : null;
            if (original == null)
                return ServiceResult<InvoiceNoteDto>.Failure("The original invoice could not be found.");
            if (original.Status == "Cancelled")
                return ServiceResult<InvoiceNoteDto>.Failure("The original invoice is cancelled.");

            var posted = await _accountingPostingService.PostInvoiceAdjustmentAsync(note.Id);
            if (!posted)
                return ServiceResult<InvoiceNoteDto>.Failure("The note could not be posted to accounting.");

            original.AdjustedAmount += note.DocumentType == "CreditNote"
                ? Math.Abs(note.Total)
                : -Math.Abs(note.Total);
            original.UpdatedAt = DateTime.UtcNow;

            note.Status = "Posted";
            note.PostedAt = DateTime.UtcNow;
            note.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<InvoiceNoteDto>> CancelAsync(Guid id)
        {
            var note = await BaseQuery().FirstOrDefaultAsync(i =>
                i.Id == id && i.TenantId == TenantId && i.DocumentType != "Invoice");
            if (note == null)
                return ServiceResult<InvoiceNoteDto>.Failure("Credit/debit note not found");
            if (note.Status != "Draft")
                return ServiceResult<InvoiceNoteDto>.Failure("Only draft notes can be cancelled.");

            note.Status = "Cancelled";
            note.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        private IQueryable<Invoice> BaseQuery() =>
            _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems);

        private async Task<string?> ValidateAsync(InvoiceNoteCreateDto dto)
        {
            if (dto.NoteType is not ("Credit" or "Debit"))
                return "Note type must be Credit or Debit.";
            if (string.IsNullOrWhiteSpace(dto.Reason))
                return "A reason is required for the note.";
            if (dto.Items == null || dto.Items.Count == 0)
                return "At least one note line is required.";
            if (dto.Items.Any(i => string.IsNullOrWhiteSpace(i.Description)))
                return "Every note line needs a description.";
            if (dto.Items.Any(i => i.Quantity <= 0))
                return "Note quantities must be greater than zero.";
            if (dto.Items.Any(i => i.UnitPrice < 0))
                return "Note prices cannot be negative.";
            if (dto.Items.Any(i => i.Discount is < 0 or > 1))
                return "Discounts must be between 0 and 1.";
            if (dto.Items.Any(i => i.VatRate is < 0 or > 1))
                return "VAT rates must be between 0 and 1.";

            var original = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == dto.OriginalInvoiceId && i.TenantId == TenantId);
            if (original == null || original.DocumentType != "Invoice")
                return "The original invoice could not be found.";
            if (original.Status == "Cancelled")
                return "The original invoice is cancelled.";
            await Task.CompletedTask;
            return null;
        }

        private void RebuildItems(Invoice note, IEnumerable<InvoiceNoteItemCreateDto> items, string invoiceType)
        {
            var sign = note.DocumentType == "CreditNote" ? -1m : 1m;
            foreach (var line in items)
            {
                var vatRate = line.VatRate ?? 0;
                var net = line.Quantity * line.UnitPrice * (1 - line.Discount);
                note.InvoiceItems.Add(new InvoiceItem
                {
                    TenantId = TenantId,
                    InvoiceId = note.Id,
                    Description = line.Description.Trim(),
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    VatRate = vatRate,
                    Discount = line.Discount,
                    LineTotal = sign * (net + net * vatRate)
                });
            }

            note.Subtotal = sign * note.InvoiceItems.Sum(i => i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault());
            note.VatAmount = sign * note.InvoiceItems.Sum(i =>
                i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault() *
                (1 - i.Discount.GetValueOrDefault()) * i.VatRate.GetValueOrDefault());
            note.TotalDiscount = sign * note.InvoiceItems.Sum(i =>
                i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault() * i.Discount.GetValueOrDefault());
            note.Total = note.Subtotal + note.VatAmount - note.TotalDiscount;
        }

        private static InvoiceNoteDto Map(Invoice note, string? originalNumber) => new()
        {
            Id = note.Id,
            NoteNumber = note.InvoiceNumber,
            NoteType = note.DocumentType == "CreditNote" ? "Credit" : "Debit",
            InvoiceType = note.InvoiceType,
            OriginalInvoiceId = note.OriginalInvoiceId ?? Guid.Empty,
            OriginalInvoiceNumber = originalNumber,
            PartyName = note.Customer?.Name,
            IssueDate = note.IssueDate,
            Reason = note.NoteReason ?? string.Empty,
            Notes = note.Notes,
            Status = note.Status,
            Subtotal = note.Subtotal,
            VatAmount = note.VatAmount,
            TotalDiscount = note.TotalDiscount,
            Total = note.Total,
            CreatedAt = note.CreatedAt,
            PostedAt = note.PostedAt,
            Items = note.InvoiceItems.Select(i => new InvoiceNoteItemDto
            {
                Id = i.Id,
                Description = i.Description ?? string.Empty,
                Quantity = i.Quantity.GetValueOrDefault(),
                UnitPrice = i.UnitPrice.GetValueOrDefault(),
                VatRate = i.VatRate,
                Discount = i.Discount.GetValueOrDefault(),
                LineTotal = i.LineTotal.GetValueOrDefault()
            }).ToList()
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
