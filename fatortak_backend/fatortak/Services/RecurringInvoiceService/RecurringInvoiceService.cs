using fatortak.Context;
using fatortak.Dtos.RecurringInvoice;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.RecurringInvoiceService
{
    public interface IRecurringInvoiceService
    {
        Task<ServiceResult<PagedResponseDto<RecurringInvoiceDto>>> GetAsync(RecurringInvoiceFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<RecurringInvoiceDto>> GetAsync(Guid id);
        Task<ServiceResult<RecurringInvoiceDto>> CreateAsync(RecurringInvoiceCreateDto dto);
        Task<ServiceResult<RecurringInvoiceDto>> UpdateAsync(Guid id, RecurringInvoiceUpdateDto dto);
        Task<ServiceResult<bool>> DeleteAsync(Guid id);
        Task<ServiceResult<RecurringInvoiceDto>> UpdateStatusAsync(Guid id, string status);
        Task<ServiceResult<RecurringInvoiceDto>> RunNowAsync(Guid id);
        Task<int> GenerateDueForTenantAsync(Guid tenantId);
        Task<int> GenerateAllDueAsync();
    }

    public class RecurringInvoiceService : IRecurringInvoiceService
    {
        private const string Prefix = "REC-";
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RecurringInvoiceService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RecurringInvoiceService(
            ApplicationDbContext context,
            ILogger<RecurringInvoiceService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<RecurringInvoiceDto>>> GetAsync(
            RecurringInvoiceFilterDto filter, PaginationDto pagination)
        {
            var query = _context.RecurringInvoices
                .Where(r => r.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(r =>
                    r.RecurringNumber.ToLower().Contains(term) ||
                    r.Name.ToLower().Contains(term) ||
                    r.Customer.Name.ToLower().Contains(term));
            }
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(r => r.Status == filter.Status);
            if (!string.IsNullOrWhiteSpace(filter.Frequency))
                query = query.Where(r => r.Frequency == filter.Frequency);
            if (filter.CustomerId.HasValue)
                query = query.Where(r => r.CustomerId == filter.CustomerId.Value);

            var total = await query.CountAsync();
            var today = DateTime.UtcNow.Date;
            var stats = new
            {
                total,
                active = await query.CountAsync(r => r.Status == "Active"),
                paused = await query.CountAsync(r => r.Status == "Paused"),
                completed = await query.CountAsync(r => r.Status == "Completed"),
                due = await query.CountAsync(r => r.Status == "Active" && r.NextRunDate <= today)
            };

            var schedules = await query
                .Include(r => r.Customer)
                .Include(r => r.Items)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<RecurringInvoiceDto>>.SuccessResult(
                new PagedResponseDto<RecurringInvoiceDto>
                {
                    Data = schedules.Select(Map).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<RecurringInvoiceDto>> GetAsync(Guid id)
        {
            var schedule = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            return schedule == null
                ? ServiceResult<RecurringInvoiceDto>.Failure("Recurring invoice not found")
                : ServiceResult<RecurringInvoiceDto>.SuccessResult(Map(schedule));
        }

        public async Task<ServiceResult<RecurringInvoiceDto>> CreateAsync(RecurringInvoiceCreateDto dto)
        {
            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<RecurringInvoiceDto>.Failure(validation);

            var last = await _context.RecurringInvoices
                .Where(r => r.TenantId == TenantId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => r.RecurringNumber)
                .FirstOrDefaultAsync();
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);

            var schedule = new RecurringInvoice
            {
                TenantId = TenantId,
                RecurringNumber = DocumentNumberHelper.Next(Prefix, last),
                Name = dto.Name.Trim(),
                CustomerId = dto.CustomerId,
                BranchId = dto.BranchId,
                ProjectId = dto.ProjectId,
                UserId = TryGetUserId(),
                InvoiceType = dto.InvoiceType,
                Frequency = NormalizeFrequency(dto.Frequency),
                StartDate = dto.StartDate.Date,
                EndDate = dto.EndDate?.Date,
                NextRunDate = dto.StartDate.Date,
                DueDays = dto.DueDays,
                AutoSend = dto.AutoSend,
                Status = "Active",
                Currency = dto.Currency ?? company?.Currency,
                Notes = dto.Notes,
                Terms = dto.Terms
            };
            AddItems(schedule, dto.Items, company?.DefaultVatRate ?? 0);

            _context.RecurringInvoices.Add(schedule);
            await _context.SaveChangesAsync();
            return await GetAsync(schedule.Id);
        }

        public async Task<ServiceResult<RecurringInvoiceDto>> UpdateAsync(Guid id, RecurringInvoiceUpdateDto dto)
        {
            var schedule = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (schedule == null)
                return ServiceResult<RecurringInvoiceDto>.Failure("Recurring invoice not found");
            if (schedule.Status is "Completed" or "Cancelled")
                return ServiceResult<RecurringInvoiceDto>.Failure("Completed or cancelled schedules cannot be edited.");

            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<RecurringInvoiceDto>.Failure(validation);

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);
            _context.RecurringInvoiceItems.RemoveRange(schedule.Items);
            schedule.Items.Clear();

            schedule.Name = dto.Name.Trim();
            schedule.CustomerId = dto.CustomerId;
            schedule.BranchId = dto.BranchId;
            schedule.ProjectId = dto.ProjectId;
            schedule.InvoiceType = dto.InvoiceType;
            schedule.Frequency = NormalizeFrequency(dto.Frequency);
            schedule.StartDate = dto.StartDate.Date;
            schedule.EndDate = dto.EndDate?.Date;
            schedule.NextRunDate = dto.StartDate.Date;
            schedule.DueDays = dto.DueDays;
            schedule.AutoSend = dto.AutoSend;
            schedule.Currency = dto.Currency;
            schedule.Notes = dto.Notes;
            schedule.Terms = dto.Terms;
            schedule.UpdatedAt = DateTime.UtcNow;
            AddItems(schedule, dto.Items, company?.DefaultVatRate ?? 0);
            foreach (var item in schedule.Items)
                _context.RecurringInvoiceItems.Add(item);

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
        {
            var schedule = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (schedule == null)
                return ServiceResult<bool>.Failure("Recurring invoice not found");
            if (schedule.RunCount > 0)
                return ServiceResult<bool>.Failure("Schedules that have already generated invoices cannot be deleted; cancel them instead.");

            _context.RecurringInvoices.Remove(schedule);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<RecurringInvoiceDto>> UpdateStatusAsync(Guid id, string status)
        {
            var schedule = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (schedule == null)
                return ServiceResult<RecurringInvoiceDto>.Failure("Recurring invoice not found");

            var target = status?.Trim();
            var allowed = schedule.Status switch
            {
                "Active" => target is "Paused" or "Cancelled",
                "Paused" => target is "Active" or "Cancelled",
                _ => false
            };
            if (!allowed || (target != "Active" && target != "Paused" && target != "Cancelled"))
                return ServiceResult<RecurringInvoiceDto>.Failure(
                    $"Cannot change a {schedule.Status.ToLower()} schedule to {target}.");

            schedule.Status = target!;
            schedule.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<RecurringInvoiceDto>> RunNowAsync(Guid id)
        {
            var schedule = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (schedule == null)
                return ServiceResult<RecurringInvoiceDto>.Failure("Recurring invoice not found");
            if (schedule.Status is "Completed" or "Cancelled")
                return ServiceResult<RecurringInvoiceDto>.Failure("This schedule is no longer active.");

            await GenerateInvoiceAsync(schedule, TenantId);
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<int> GenerateDueForTenantAsync(Guid tenantId)
        {
            var today = DateTime.UtcNow.Date;
            var due = await _context.RecurringInvoices
                .Include(r => r.Items)
                .Where(r => r.TenantId == tenantId &&
                            r.Status == "Active" &&
                            r.NextRunDate <= today &&
                            (r.EndDate == null || r.NextRunDate <= r.EndDate))
                .OrderBy(r => r.NextRunDate)
                .ToListAsync();

            var generated = 0;
            foreach (var schedule in due)
            {
                var runs = 0;
                while (schedule.Status == "Active" &&
                       schedule.NextRunDate <= today &&
                       (schedule.EndDate == null || schedule.NextRunDate <= schedule.EndDate) &&
                       runs < 12)
                {
                    await GenerateInvoiceAsync(schedule, tenantId);
                    generated++;
                    runs++;
                }
                await _context.SaveChangesAsync();
            }
            return generated;
        }

        public async Task<int> GenerateAllDueAsync()
        {
            var tenantIds = await _context.Tenants.Select(t => t.Id).ToListAsync();
            var total = 0;
            foreach (var tenantId in tenantIds)
                total += await GenerateDueForTenantAsync(tenantId);
            return total;
        }

        private async Task<Invoice> GenerateInvoiceAsync(RecurringInvoice schedule, Guid tenantId)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == tenantId);
            var last = await _context.Invoices
                .Where(i => i.TenantId == tenantId && i.DocumentType == "Invoice")
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            var issueDate = schedule.NextRunDate.Date;
            var invoice = new Invoice
            {
                TenantId = tenantId,
                InvoiceNumber = DocumentNumberHelper.Next(
                    string.IsNullOrWhiteSpace(company?.InvoicePrefix) ? "INV-" : company!.InvoicePrefix!,
                    last),
                CustomerId = schedule.CustomerId,
                BranchId = schedule.BranchId,
                ProjectId = schedule.ProjectId,
                UserId = schedule.UserId ?? TryGetUserId(),
                IssueDate = issueDate,
                DueDate = issueDate.AddDays(schedule.DueDays),
                Status = schedule.AutoSend ? "Pending" : "Draft",
                InvoiceType = schedule.InvoiceType,
                DocumentType = "Invoice",
                RecurringInvoiceId = schedule.Id,
                SentAt = schedule.AutoSend ? DateTime.UtcNow : null,
                Currency = schedule.Currency,
                Notes = schedule.Notes,
                Terms = schedule.Terms
            };

            foreach (var item in schedule.Items)
            {
                var net = item.Quantity * item.UnitPrice * (1 - item.Discount);
                invoice.InvoiceItems.Add(new InvoiceItem
                {
                    TenantId = tenantId,
                    InvoiceId = invoice.Id,
                    ItemId = item.ItemId,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    VatRate = item.VatRate,
                    Discount = item.Discount,
                    LineTotal = net + net * (item.VatRate ?? 0)
                });
            }

            invoice.Subtotal = invoice.InvoiceItems.Sum(i => i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault());
            invoice.VatAmount = invoice.InvoiceItems.Sum(i =>
                i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault() *
                (1 - i.Discount.GetValueOrDefault()) * i.VatRate.GetValueOrDefault());
            invoice.TotalDiscount = invoice.InvoiceItems.Sum(i =>
                i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault() * i.Discount.GetValueOrDefault());
            invoice.Total = invoice.Subtotal + invoice.VatAmount - invoice.TotalDiscount;

            _context.Invoices.Add(invoice);

            schedule.LastRunAt = DateTime.UtcNow;
            schedule.RunCount += 1;
            schedule.NextRunDate = Advance(schedule.NextRunDate, schedule.Frequency);
            if (schedule.EndDate.HasValue && schedule.NextRunDate > schedule.EndDate.Value)
                schedule.Status = "Completed";
            schedule.UpdatedAt = DateTime.UtcNow;
            return invoice;
        }

        private IQueryable<RecurringInvoice> BaseQuery() =>
            _context.RecurringInvoices
                .Include(r => r.Customer)
                .Include(r => r.Items);

        private async Task<string?> ValidateAsync(RecurringInvoiceCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "A schedule name is required.";
            if (dto.Items == null || dto.Items.Count == 0)
                return "At least one schedule line is required.";
            if (dto.Items.Any(i => string.IsNullOrWhiteSpace(i.Description)))
                return "Every schedule line needs a description.";
            if (dto.Items.Any(i => i.Quantity <= 0))
                return "Schedule quantities must be greater than zero.";
            if (dto.Items.Any(i => i.UnitPrice < 0))
                return "Schedule prices cannot be negative.";
            if (dto.Items.Any(i => i.Discount is < 0 or > 1))
                return "Discounts must be between 0 and 1.";
            if (dto.DueDays < 0 || dto.DueDays > 365)
                return "Due days must be between 0 and 365.";
            if (dto.EndDate.HasValue && dto.EndDate.Value.Date < dto.StartDate.Date)
                return "The end date cannot be before the start date.";
            if (!IsFrequency(dto.Frequency))
                return "Frequency must be Weekly, Monthly, Quarterly or Yearly.";

            var customerExists = await _context.Customers
                .AnyAsync(c => c.Id == dto.CustomerId && c.TenantId == TenantId && !c.IsDeleted);
            if (!customerExists)
                return "The selected customer could not be found.";
            return null;
        }

        private void AddItems(RecurringInvoice schedule, IEnumerable<RecurringInvoiceItemCreateDto> items, decimal defaultVatRate)
        {
            foreach (var item in items)
            {
                var vatRate = item.VatRate ?? defaultVatRate;
                var net = item.Quantity * item.UnitPrice * (1 - item.Discount);
                schedule.Items.Add(new RecurringInvoiceItem
                {
                    TenantId = TenantId,
                    ItemId = item.ItemId,
                    Description = item.Description.Trim(),
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    VatRate = vatRate,
                    Discount = item.Discount,
                    LineTotal = net + net * vatRate
                });
            }
        }

        private static bool IsFrequency(string frequency) =>
            NormalizeFrequencyOrNull(frequency) != null;

        private static string NormalizeFrequency(string frequency) =>
            NormalizeFrequencyOrNull(frequency) ?? "Monthly";

        private static string? NormalizeFrequencyOrNull(string frequency)
        {
            if (frequency.Equals("Weekly", StringComparison.OrdinalIgnoreCase)) return "Weekly";
            if (frequency.Equals("Monthly", StringComparison.OrdinalIgnoreCase)) return "Monthly";
            if (frequency.Equals("Quarterly", StringComparison.OrdinalIgnoreCase)) return "Quarterly";
            if (frequency.Equals("Yearly", StringComparison.OrdinalIgnoreCase)) return "Yearly";
            return null;
        }

        private static DateTime Advance(DateTime date, string frequency) => frequency switch
        {
            "Weekly" => date.AddDays(7),
            "Quarterly" => date.AddMonths(3),
            "Yearly" => date.AddYears(1),
            _ => date.AddMonths(1)
        };

        private static RecurringInvoiceDto Map(RecurringInvoice schedule) => new()
        {
            Id = schedule.Id,
            RecurringNumber = schedule.RecurringNumber,
            Name = schedule.Name,
            CustomerId = schedule.CustomerId,
            CustomerName = schedule.Customer?.Name ?? string.Empty,
            BranchId = schedule.BranchId,
            ProjectId = schedule.ProjectId,
            InvoiceType = schedule.InvoiceType,
            Frequency = schedule.Frequency,
            StartDate = schedule.StartDate,
            EndDate = schedule.EndDate,
            NextRunDate = schedule.NextRunDate,
            DueDays = schedule.DueDays,
            AutoSend = schedule.AutoSend,
            Status = schedule.Status,
            Currency = schedule.Currency,
            Notes = schedule.Notes,
            Terms = schedule.Terms,
            LastRunAt = schedule.LastRunAt,
            RunCount = schedule.RunCount,
            CreatedAt = schedule.CreatedAt,
            Total = schedule.Items.Sum(i => i.LineTotal),
            Items = schedule.Items.Select(i => new RecurringInvoiceItemDto
            {
                Id = i.Id,
                ItemId = i.ItemId,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                VatRate = i.VatRate,
                Discount = i.Discount,
                LineTotal = i.LineTotal
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
