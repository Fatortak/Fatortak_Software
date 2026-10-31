using fatortak.Context;
using fatortak.Dtos.Procurement;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.Procurement
{
    public interface IRfqService
    {
        Task<ServiceResult<PagedResponseDto<RfqDto>>> GetAsync(RfqFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<RfqDto>> GetAsync(Guid id);
        Task<ServiceResult<RfqDto>> CreateAsync(RfqCreateDto dto);
        Task<ServiceResult<RfqDto>> UpdateAsync(Guid id, RfqUpdateDto dto);
        Task<ServiceResult<bool>> DeleteAsync(Guid id);
        Task<ServiceResult<RfqDto>> UpdateStatusAsync(Guid id, string status);
        Task<ServiceResult<RfqDto>> RecordQuoteAsync(Guid id, Guid supplierId, RfqSupplierQuoteDto dto);
        Task<ServiceResult<RfqDto>> AwardAsync(Guid id, Guid supplierId, AwardRfqDto dto);
    }

    public class RfqService : IRfqService
    {
        private const string Prefix = "RFQ-";
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RfqService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RfqService(
            ApplicationDbContext context,
            ILogger<RfqService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<RfqDto>>> GetAsync(
            RfqFilterDto filter, PaginationDto pagination)
        {
            var query = _context.RequestForQuotations
                .Where(r => r.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(r =>
                    r.RfqNumber.ToLower().Contains(term) ||
                    r.Title.ToLower().Contains(term));
            }
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(r => r.Status == filter.Status);
            if (filter.FromDate.HasValue)
                query = query.Where(r => r.IssueDate >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(r => r.IssueDate <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = await query.GroupBy(r => 1).Select(g => new
            {
                total = g.Count(),
                draft = g.Count(r => r.Status == "Draft"),
                sent = g.Count(r => r.Status == "Sent"),
                responsesReceived = g.Count(r => r.Status == "ResponsesReceived"),
                awarded = g.Count(r => r.Status == "Awarded"),
                cancelled = g.Count(r => r.Status == "Cancelled")
            }).FirstOrDefaultAsync() ?? new
            {
                total = 0,
                draft = 0,
                sent = 0,
                responsesReceived = 0,
                awarded = 0,
                cancelled = 0
            };

            var items = await BaseQuery()
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            var orderByRfq = await _context.PurchaseOrders
                .Where(o => o.TenantId == TenantId && o.RequestForQuotationId != null)
                .Select(o => new { o.RequestForQuotationId, o.Id, o.PoNumber })
                .ToListAsync();

            return ServiceResult<PagedResponseDto<RfqDto>>.SuccessResult(
                new PagedResponseDto<RfqDto>
                {
                    Data = items.Select(r =>
                    {
                        var order = orderByRfq.FirstOrDefault(o => o.RequestForQuotationId == r.Id);
                        return Map(r, order?.Id, order?.PoNumber);
                    }).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<RfqDto>> GetAsync(Guid id)
        {
            var rfq = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (rfq == null)
                return ServiceResult<RfqDto>.Failure("Request for quotation not found");

            var order = await _context.PurchaseOrders
                .Where(o => o.TenantId == TenantId && o.RequestForQuotationId == id)
                .Select(o => new { o.Id, o.PoNumber })
                .FirstOrDefaultAsync();

            return ServiceResult<RfqDto>.SuccessResult(Map(rfq, order?.Id, order?.PoNumber));
        }

        public async Task<ServiceResult<RfqDto>> CreateAsync(RfqCreateDto dto)
        {
            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<RfqDto>.Failure(validation);

            var last = await _context.RequestForQuotations
                .Where(r => r.TenantId == TenantId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => r.RfqNumber)
                .FirstOrDefaultAsync();
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);

            var rfq = new RequestForQuotation
            {
                TenantId = TenantId,
                RfqNumber = DocumentNumberHelper.Next(Prefix, last),
                PurchaseRequisitionId = dto.PurchaseRequisitionId,
                Title = dto.Title.Trim(),
                IssueDate = dto.IssueDate,
                DueDate = dto.DueDate,
                Status = "Draft",
                Notes = dto.Notes,
                Currency = dto.Currency ?? company?.Currency,
                UserId = TryGetUserId()
            };
            AddItems(rfq, dto.Items);
            AddSuppliers(rfq, dto.SupplierIds);

            _context.RequestForQuotations.Add(rfq);
            await _context.SaveChangesAsync();
            return await GetAsync(rfq.Id);
        }

        public async Task<ServiceResult<RfqDto>> UpdateAsync(Guid id, RfqUpdateDto dto)
        {
            var rfq = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (rfq == null)
                return ServiceResult<RfqDto>.Failure("Request for quotation not found");
            if (rfq.Status != "Draft")
                return ServiceResult<RfqDto>.Failure("Only draft RFQs can be edited.");

            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<RfqDto>.Failure(validation);

            _context.RfqSupplierItems.RemoveRange(rfq.Suppliers.SelectMany(s => s.Items));
            var supplierIdsToKeep = dto.SupplierIds.Distinct().ToHashSet();
            var removedSuppliers = rfq.Suppliers.Where(s => !supplierIdsToKeep.Contains(s.SupplierId)).ToList();
            _context.RfqSuppliers.RemoveRange(removedSuppliers);
            var retainedIds = rfq.Suppliers
                .Where(s => supplierIdsToKeep.Contains(s.SupplierId))
                .Select(s => s.SupplierId)
                .ToHashSet();
            rfq.Suppliers = rfq.Suppliers.Where(s => retainedIds.Contains(s.SupplierId)).ToList();
            foreach (var supplier in rfq.Suppliers)
            {
                _context.RfqSupplierItems.RemoveRange(supplier.Items);
                supplier.Items.Clear();
                supplier.Status = "Invited";
                supplier.QuotedAt = null;
                supplier.ValidUntil = null;
                supplier.Total = 0;
                supplier.Notes = null;
            }
            _context.RfqItems.RemoveRange(rfq.Items);
            rfq.Items.Clear();

            rfq.PurchaseRequisitionId = dto.PurchaseRequisitionId;
            rfq.Title = dto.Title.Trim();
            rfq.IssueDate = dto.IssueDate;
            rfq.DueDate = dto.DueDate;
            rfq.Notes = dto.Notes;
            rfq.Currency = dto.Currency;
            rfq.UpdatedAt = DateTime.UtcNow;
            AddItems(rfq, dto.Items);
            var newSupplierIds = supplierIdsToKeep.Where(id => !retainedIds.Contains(id)).ToList();
            AddSuppliers(rfq, newSupplierIds);
            foreach (var item in rfq.Items)
                _context.RfqItems.Add(item);
            foreach (var supplier in rfq.Suppliers.Where(s => newSupplierIds.Contains(s.SupplierId)))
                _context.RfqSuppliers.Add(supplier);

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
        {
            var rfq = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (rfq == null)
                return ServiceResult<bool>.Failure("Request for quotation not found");
            if (rfq.Status != "Draft")
                return ServiceResult<bool>.Failure("Only draft RFQs can be deleted.");

            _context.RequestForQuotations.Remove(rfq);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<RfqDto>> UpdateStatusAsync(Guid id, string status)
        {
            var rfq = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (rfq == null)
                return ServiceResult<RfqDto>.Failure("Request for quotation not found");

            var target = status?.Trim();
            var allowed = rfq.Status switch
            {
                "Draft" => target is "Sent" or "Cancelled",
                "Sent" => target is "Cancelled",
                "ResponsesReceived" => target is "Cancelled",
                _ => false
            };
            if (!allowed)
                return ServiceResult<RfqDto>.Failure($"Cannot change a {rfq.Status.ToLower()} RFQ to {target}.");

            rfq.Status = target!;
            rfq.UpdatedAt = DateTime.UtcNow;
            if (target == "Sent")
                rfq.SentAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<RfqDto>> RecordQuoteAsync(
            Guid id, Guid supplierId, RfqSupplierQuoteDto dto)
        {
            var rfq = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (rfq == null)
                return ServiceResult<RfqDto>.Failure("Request for quotation not found");
            if (rfq.Status is not ("Sent" or "ResponsesReceived"))
                return ServiceResult<RfqDto>.Failure("Send the RFQ before recording supplier quotes.");
            if (rfq.AwardedSupplierId.HasValue)
                return ServiceResult<RfqDto>.Failure("This RFQ has already been awarded.");

            var supplier = rfq.Suppliers.FirstOrDefault(s => s.SupplierId == supplierId);
            if (supplier == null)
                return ServiceResult<RfqDto>.Failure("Supplier is not invited to this RFQ.");
            if (dto.Items == null || dto.Items.Count == 0)
                return ServiceResult<RfqDto>.Failure("A supplier quote needs at least one line.");
            if (dto.Items.Any(i => i.UnitPrice < 0))
                return ServiceResult<RfqDto>.Failure("Quote prices cannot be negative.");

            var rfqItems = rfq.Items.ToDictionary(i => i.Id);
            if (dto.Items.Any(i => !rfqItems.ContainsKey(i.RfqItemId)))
                return ServiceResult<RfqDto>.Failure("A quote line does not belong to this RFQ.");
            if (dto.Items.Select(i => i.RfqItemId).Distinct().Count() != rfqItems.Count)
                return ServiceResult<RfqDto>.Failure("The supplier quote must cover every RFQ line.");

            _context.RfqSupplierItems.RemoveRange(supplier.Items);
            supplier.Items.Clear();
            foreach (var line in dto.Items)
            {
                var rfqItem = rfqItems[line.RfqItemId];
                var quoteLine = new RfqSupplierItem
                {
                    TenantId = TenantId,
                    RfqSupplierId = supplier.Id,
                    RfqItemId = rfqItem.Id,
                    UnitPrice = line.UnitPrice,
                    LineTotal = rfqItem.Quantity * line.UnitPrice
                };
                supplier.Items.Add(quoteLine);
                _context.RfqSupplierItems.Add(quoteLine);
            }

            supplier.Status = "Quoted";
            supplier.QuotedAt = DateTime.UtcNow;
            supplier.ValidUntil = dto.ValidUntil;
            supplier.Notes = dto.Notes;
            supplier.Total = supplier.Items.Sum(i => i.LineTotal);
            rfq.Status = "ResponsesReceived";
            rfq.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<RfqDto>> AwardAsync(Guid id, Guid supplierId, AwardRfqDto dto)
        {
            var rfq = await BaseQuery().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);
            if (rfq == null)
                return ServiceResult<RfqDto>.Failure("Request for quotation not found");
            if (rfq.AwardedSupplierId.HasValue)
                return ServiceResult<RfqDto>.Failure("This RFQ has already been awarded.");
            if (rfq.Status is not ("Sent" or "ResponsesReceived"))
                return ServiceResult<RfqDto>.Failure("The RFQ must be sent before it can be awarded.");

            var supplier = rfq.Suppliers.FirstOrDefault(s => s.SupplierId == supplierId);
            if (supplier == null)
                return ServiceResult<RfqDto>.Failure("Supplier is not invited to this RFQ.");
            if (supplier.Status != "Quoted" || supplier.Items.Count == 0)
                return ServiceResult<RfqDto>.Failure("Record a supplier quote before awarding the RFQ.");

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);
            var last = await _context.PurchaseOrders
                .Where(o => o.TenantId == TenantId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => o.PoNumber)
                .FirstOrDefaultAsync();

            var order = new PurchaseOrder
            {
                TenantId = TenantId,
                PoNumber = DocumentNumberHelper.Next("PO-", last),
                SupplierId = supplier.SupplierId,
                PurchaseRequisitionId = rfq.PurchaseRequisitionId,
                RequestForQuotationId = rfq.Id,
                RfqSupplierId = supplier.Id,
                UserId = TryGetUserId(),
                IssueDate = DateTime.UtcNow,
                ExpectedDate = dto.ExpectedDate ?? DateTime.UtcNow.AddDays(14),
                Status = "Ordered",
                OrderedAt = DateTime.UtcNow,
                Currency = rfq.Currency ?? company?.Currency,
                Notes = dto.Notes ?? rfq.Notes,
                Terms = dto.Terms
            };

            var quotePrices = supplier.Items.ToDictionary(i => i.RfqItemId, i => i.UnitPrice);
            foreach (var item in rfq.Items)
            {
                var unitPrice = quotePrices.GetValueOrDefault(item.Id);
                var vatRate = company?.DefaultVatRate ?? 0;
                var net = item.Quantity * unitPrice;
                order.Items.Add(new PurchaseOrderItem
                {
                    TenantId = TenantId,
                    ItemId = item.ItemId,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = unitPrice,
                    VatRate = vatRate,
                    Discount = 0,
                    LineTotal = net + net * vatRate
                });
            }
            order.Subtotal = order.Items.Sum(i => i.Quantity * i.UnitPrice);
            order.VatAmount = order.Items.Sum(i => i.Quantity * i.UnitPrice * (1 - i.Discount) * (i.VatRate ?? 0));
            order.TotalDiscount = order.Items.Sum(i => i.Quantity * i.UnitPrice * i.Discount);
            order.Total = order.Subtotal + order.VatAmount - order.TotalDiscount;

            _context.PurchaseOrders.Add(order);
            rfq.Status = "Awarded";
            rfq.AwardedSupplierId = supplier.SupplierId;
            rfq.AwardedAt = DateTime.UtcNow;
            rfq.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        private IQueryable<RequestForQuotation> BaseQuery() =>
            _context.RequestForQuotations
                .Include(r => r.PurchaseRequisition)
                .Include(r => r.AwardedSupplier)
                .Include(r => r.Items)
                .Include(r => r.Suppliers).ThenInclude(s => s.Supplier)
                .Include(r => r.Suppliers).ThenInclude(s => s.Items);

        private async Task<string?> ValidateAsync(RfqCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return "RFQ title is required.";
            if (dto.DueDate.Date < dto.IssueDate.Date)
                return "The due date cannot be before the issue date.";
            if (dto.Items == null || dto.Items.Count == 0)
                return "At least one RFQ line is required.";
            if (dto.Items.Any(i => string.IsNullOrWhiteSpace(i.Description)))
                return "Every RFQ line needs a description.";
            if (dto.Items.Any(i => i.Quantity <= 0))
                return "RFQ quantities must be greater than zero.";
            if (dto.Items.Any(i => i.TargetUnitPrice < 0))
                return "Target prices cannot be negative.";

            var supplierIds = (dto.SupplierIds ?? new List<Guid>()).Distinct().ToList();
            if (supplierIds.Count == 0)
                return "Invite at least one supplier.";
            var suppliers = await _context.Customers
                .Where(c => c.TenantId == TenantId && !c.IsDeleted && supplierIds.Contains(c.Id))
                .CountAsync();
            if (suppliers != supplierIds.Count)
                return "One or more selected suppliers could not be found.";

            if (dto.PurchaseRequisitionId.HasValue)
            {
                var exists = await _context.PurchaseRequisitions
                    .AnyAsync(r => r.Id == dto.PurchaseRequisitionId && r.TenantId == TenantId);
                if (!exists)
                    return "The linked purchase requisition could not be found.";
            }
            return null;
        }

        private void AddItems(RequestForQuotation rfq, IEnumerable<RfqItemCreateDto> items)
        {
            foreach (var item in items)
            {
                rfq.Items.Add(new RfqItem
                {
                    TenantId = TenantId,
                    ItemId = item.ItemId,
                    Description = item.Description.Trim(),
                    Quantity = item.Quantity,
                    TargetUnitPrice = item.TargetUnitPrice,
                    LineTotal = item.Quantity * item.TargetUnitPrice
                });
            }
        }

        private void AddSuppliers(RequestForQuotation rfq, IEnumerable<Guid> supplierIds)
        {
            foreach (var supplierId in supplierIds.Distinct())
            {
                rfq.Suppliers.Add(new RfqSupplier
                {
                    TenantId = TenantId,
                    SupplierId = supplierId,
                    Status = "Invited"
                });
            }
        }

        private static RfqDto Map(RequestForQuotation rfq, Guid? orderId, string? orderNumber) => new()
        {
            Id = rfq.Id,
            RfqNumber = rfq.RfqNumber,
            PurchaseRequisitionId = rfq.PurchaseRequisitionId,
            PurchaseRequisitionNumber = rfq.PurchaseRequisition?.RequestNumber,
            Title = rfq.Title,
            IssueDate = rfq.IssueDate,
            DueDate = rfq.DueDate,
            Status = rfq.Status,
            Notes = rfq.Notes,
            Currency = rfq.Currency,
            AwardedSupplierId = rfq.AwardedSupplierId,
            AwardedSupplierName = rfq.AwardedSupplier?.Name,
            PurchaseOrderId = orderId,
            PurchaseOrderNumber = orderNumber,
            CreatedAt = rfq.CreatedAt,
            SentAt = rfq.SentAt,
            AwardedAt = rfq.AwardedAt,
            TotalTargetValue = rfq.Items.Sum(i => i.LineTotal),
            Items = rfq.Items.Select(i => new RfqItemDto
            {
                Id = i.Id,
                ItemId = i.ItemId,
                Description = i.Description,
                Quantity = i.Quantity,
                TargetUnitPrice = i.TargetUnitPrice,
                LineTotal = i.LineTotal
            }).ToList(),
            Suppliers = rfq.Suppliers.Select(s => new RfqSupplierDto
            {
                Id = s.Id,
                SupplierId = s.SupplierId,
                SupplierName = s.Supplier?.Name ?? string.Empty,
                Status = s.Status,
                QuotedAt = s.QuotedAt,
                ValidUntil = s.ValidUntil,
                Total = s.Total,
                Notes = s.Notes,
                Items = s.Items.Select(i => new RfqSupplierItemDto
                {
                    RfqItemId = i.RfqItemId,
                    UnitPrice = i.UnitPrice,
                    LineTotal = i.LineTotal
                }).ToList()
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
