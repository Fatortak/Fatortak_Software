using fatortak.Context;
using fatortak.Dtos.Procurement;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.Procurement
{
    public interface IPurchaseOrderService
    {
        Task<ServiceResult<PagedResponseDto<PurchaseOrderDto>>> GetAsync(PurchaseOrderFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<PurchaseOrderDto>> GetAsync(Guid id);
        Task<ServiceResult<PurchaseOrderDto>> CreateAsync(PurchaseOrderCreateDto dto);
        Task<ServiceResult<PurchaseOrderDto>> UpdateAsync(Guid id, PurchaseOrderUpdateDto dto);
        Task<ServiceResult<bool>> DeleteAsync(Guid id);
        Task<ServiceResult<PurchaseOrderDto>> UpdateStatusAsync(Guid id, string status);
        Task<ServiceResult<SupplierBillMatchingDto>> GetSupplierBillsAsync(Guid id);
        Task<ServiceResult<SupplierBillDto>> CreateSupplierBillAsync(Guid id, SupplierBillCreateDto dto);
    }

    public class PurchaseOrderService : IPurchaseOrderService
    {
        private const string Prefix = "PO-";
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PurchaseOrderService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PurchaseOrderService(
            ApplicationDbContext context,
            ILogger<PurchaseOrderService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<PurchaseOrderDto>>> GetAsync(
            PurchaseOrderFilterDto filter, PaginationDto pagination)
        {
            var query = _context.PurchaseOrders
                .Where(o => o.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(o =>
                    o.PoNumber.ToLower().Contains(term) ||
                    o.Supplier.Name.ToLower().Contains(term));
            }
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(o => o.Status == filter.Status);
            if (filter.SupplierId.HasValue)
                query = query.Where(o => o.SupplierId == filter.SupplierId.Value);
            if (filter.FromDate.HasValue)
                query = query.Where(o => o.IssueDate >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(o => o.IssueDate <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = await query.GroupBy(o => 1).Select(g => new
            {
                total = g.Count(),
                draft = g.Count(o => o.Status == "Draft"),
                ordered = g.Count(o => o.Status == "Ordered"),
                partiallyReceived = g.Count(o => o.Status == "PartiallyReceived"),
                received = g.Count(o => o.Status == "Received"),
                closed = g.Count(o => o.Status == "Closed"),
                cancelled = g.Count(o => o.Status == "Cancelled"),
                totalValue = g.Sum(o => o.Total)
            }).FirstOrDefaultAsync() ?? new
            {
                total = 0,
                draft = 0,
                ordered = 0,
                partiallyReceived = 0,
                received = 0,
                closed = 0,
                cancelled = 0,
                totalValue = 0m
            };

            var orders = await BaseQuery()
                .OrderByDescending(o => o.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<PurchaseOrderDto>>.SuccessResult(
                new PagedResponseDto<PurchaseOrderDto>
                {
                    Data = orders.Select(Map).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<PurchaseOrderDto>> GetAsync(Guid id)
        {
            var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id && o.TenantId == TenantId);
            return order == null
                ? ServiceResult<PurchaseOrderDto>.Failure("Purchase order not found")
                : ServiceResult<PurchaseOrderDto>.SuccessResult(Map(order));
        }

        public async Task<ServiceResult<PurchaseOrderDto>> CreateAsync(PurchaseOrderCreateDto dto)
        {
            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<PurchaseOrderDto>.Failure(validation);

            var last = await _context.PurchaseOrders
                .Where(o => o.TenantId == TenantId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => o.PoNumber)
                .FirstOrDefaultAsync();
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);

            var order = new PurchaseOrder
            {
                TenantId = TenantId,
                PoNumber = DocumentNumberHelper.Next(Prefix, last),
                SupplierId = dto.SupplierId,
                PurchaseRequisitionId = dto.PurchaseRequisitionId,
                UserId = TryGetUserId(),
                IssueDate = dto.IssueDate,
                ExpectedDate = dto.ExpectedDate,
                Status = "Draft",
                Currency = dto.Currency ?? company?.Currency,
                Notes = dto.Notes,
                Terms = dto.Terms
            };
            AddItems(order, dto.Items, company?.DefaultVatRate ?? 0);

            _context.PurchaseOrders.Add(order);
            await _context.SaveChangesAsync();
            return await GetAsync(order.Id);
        }

        public async Task<ServiceResult<PurchaseOrderDto>> UpdateAsync(Guid id, PurchaseOrderUpdateDto dto)
        {
            var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id && o.TenantId == TenantId);
            if (order == null)
                return ServiceResult<PurchaseOrderDto>.Failure("Purchase order not found");
            if (order.Status != "Draft")
                return ServiceResult<PurchaseOrderDto>.Failure("Only draft purchase orders can be edited.");

            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<PurchaseOrderDto>.Failure(validation);

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);
            _context.PurchaseOrderItems.RemoveRange(order.Items);
            order.Items.Clear();

            order.SupplierId = dto.SupplierId;
            order.PurchaseRequisitionId = dto.PurchaseRequisitionId;
            order.IssueDate = dto.IssueDate;
            order.ExpectedDate = dto.ExpectedDate;
            order.Currency = dto.Currency;
            order.Notes = dto.Notes;
            order.Terms = dto.Terms;
            order.UpdatedAt = DateTime.UtcNow;
            AddItems(order, dto.Items, company?.DefaultVatRate ?? 0);
            foreach (var item in order.Items)
                _context.PurchaseOrderItems.Add(item);

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
        {
            var order = await _context.PurchaseOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == TenantId);
            if (order == null)
                return ServiceResult<bool>.Failure("Purchase order not found");
            if (order.Status != "Draft")
                return ServiceResult<bool>.Failure("Only draft purchase orders can be deleted.");

            _context.PurchaseOrders.Remove(order);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<PurchaseOrderDto>> UpdateStatusAsync(Guid id, string status)
        {
            var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id && o.TenantId == TenantId);
            if (order == null)
                return ServiceResult<PurchaseOrderDto>.Failure("Purchase order not found");

            var target = status?.Trim();
            var hasReceipts = await _context.GoodsReceiptNotes
                .AnyAsync(g => g.PurchaseOrderId == order.Id && g.Status == "Posted");

            var allowed = target switch
            {
                "Ordered" => order.Status == "Draft",
                "Closed" => order.Status is "Ordered" or "PartiallyReceived" or "Received",
                "Cancelled" => order.Status is "Draft" or "Ordered" && !hasReceipts,
                _ => false
            };
            if (!allowed)
                return ServiceResult<PurchaseOrderDto>.Failure(
                    $"Cannot change a {order.Status.ToLower()} purchase order to {target}.");

            if (target == "Ordered")
            {
                if (order.Items.Count == 0)
                    return ServiceResult<PurchaseOrderDto>.Failure("Add at least one line before ordering.");
                order.OrderedAt = DateTime.UtcNow;
            }
            if (target == "Closed")
                order.ClosedAt = DateTime.UtcNow;

            order.Status = target!;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<SupplierBillMatchingDto>> GetSupplierBillsAsync(Guid id)
        {
            var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id && o.TenantId == TenantId);
            if (order == null)
                return ServiceResult<SupplierBillMatchingDto>.Failure("Purchase order not found");

            var invoices = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .Where(i => i.TenantId == TenantId && i.PurchaseOrderId == id)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            var postedReceipts = await _context.GoodsReceiptItems
                .Where(i => i.GoodsReceiptNote.PurchaseOrderId == id &&
                            i.GoodsReceiptNote.TenantId == TenantId &&
                            i.GoodsReceiptNote.Status == "Posted")
                .ToListAsync();

            var poPrices = order.Items.ToDictionary(i => i.Id, i => i.UnitPrice);
            var bills = invoices.Select(invoice => MapSupplierBill(invoice, poPrices)).ToList();

            return ServiceResult<SupplierBillMatchingDto>.SuccessResult(new SupplierBillMatchingDto
            {
                PurchaseOrderId = order.Id,
                PoNumber = order.PoNumber,
                ReceivedValue = postedReceipts.Sum(i => i.LineTotal),
                BilledValue = invoices.Sum(i => i.Subtotal),
                HasVariance = bills.Any(b => b.HasVariance),
                Bills = bills
            });
        }

        public async Task<ServiceResult<SupplierBillDto>> CreateSupplierBillAsync(
            Guid id, SupplierBillCreateDto dto)
        {
            var order = await _context.PurchaseOrders
                .Include(o => o.Items)
                .Include(o => o.Supplier)
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == TenantId);
            if (order == null)
                return ServiceResult<SupplierBillDto>.Failure("Purchase order not found");
            if (order.Status is not ("PartiallyReceived" or "Received"))
                return ServiceResult<SupplierBillDto>.Failure("Receive goods before creating a supplier bill.");
            if (string.IsNullOrWhiteSpace(dto.SupplierInvoiceNumber))
                return ServiceResult<SupplierBillDto>.Failure("Supplier invoice number is required.");

            var supplierInvoiceNumber = dto.SupplierInvoiceNumber.Trim();
            var duplicate = await _context.Invoices.AnyAsync(i =>
                i.TenantId == TenantId &&
                i.CustomerId == order.SupplierId &&
                i.SupplierInvoiceNumber == supplierInvoiceNumber);
            if (duplicate)
                return ServiceResult<SupplierBillDto>.Failure(
                    "This supplier invoice number is already recorded.");

            var postedReceipts = await _context.GoodsReceiptItems
                .Where(i => i.GoodsReceiptNote.PurchaseOrderId == id &&
                            i.GoodsReceiptNote.TenantId == TenantId &&
                            i.GoodsReceiptNote.Status == "Posted")
                .ToListAsync();
            if (postedReceipts.Count == 0)
                return ServiceResult<SupplierBillDto>.Failure("No posted goods receipts found for this order.");

            if (dto.GoodsReceiptNoteId.HasValue)
            {
                var receiptExists = await _context.GoodsReceiptNotes.AnyAsync(g =>
                    g.Id == dto.GoodsReceiptNoteId &&
                    g.PurchaseOrderId == id &&
                    g.TenantId == TenantId &&
                    g.Status == "Posted");
                if (!receiptExists)
                    return ServiceResult<SupplierBillDto>.Failure("The selected goods receipt could not be found.");
            }

            var receivedByItem = postedReceipts
                .GroupBy(i => i.PurchaseOrderItemId)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.ReceivedQuantity));

            var requested = dto.Items?.Where(i => i.Quantity > 0).ToList() ?? new List<SupplierBillItemCreateDto>();
            if (requested.Count == 0)
            {
                requested = order.Items
                    .Where(i => i.ReceivedQuantity - i.BilledQuantity > 0)
                    .Select(i => new SupplierBillItemCreateDto
                    {
                        PurchaseOrderItemId = i.Id,
                        Quantity = i.ReceivedQuantity - i.BilledQuantity,
                        UnitPrice = i.UnitPrice,
                        VatRate = i.VatRate,
                        Discount = i.Discount
                    })
                    .ToList();
            }

            if (requested.Count == 0)
                return ServiceResult<SupplierBillDto>.Failure("There are no received quantities left to bill.");
            if (requested.Select(i => i.PurchaseOrderItemId).Distinct().Count() != requested.Count)
                return ServiceResult<SupplierBillDto>.Failure("Each purchase order line can appear only once.");
            if (requested.Any(i => i.UnitPrice < 0))
                return ServiceResult<SupplierBillDto>.Failure("Bill prices cannot be negative.");
            if (requested.Any(i => i.Discount is < 0 or > 1))
                return ServiceResult<SupplierBillDto>.Failure("Discounts must be between 0 and 1.");

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);
            var lastInvoice = await _context.Invoices
                .Where(i => i.TenantId == TenantId)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            var invoice = new Invoice
            {
                TenantId = TenantId,
                InvoiceNumber = DocumentNumberHelper.Next(
                    string.IsNullOrWhiteSpace(company?.InvoicePrefix) ? "BILL-" : company!.InvoicePrefix!,
                    lastInvoice),
                CustomerId = order.SupplierId,
                UserId = TryGetUserId(),
                IssueDate = dto.IssueDate,
                DueDate = dto.DueDate,
                Status = "Draft",
                InvoiceType = "Buy",
                Currency = order.Currency ?? company?.Currency,
                Notes = dto.Notes,
                PurchaseOrderId = order.Id,
                GoodsReceiptNoteId = dto.GoodsReceiptNoteId,
                SupplierInvoiceNumber = supplierInvoiceNumber
            };

            foreach (var line in requested)
            {
                var poItem = order.Items.FirstOrDefault(i => i.Id == line.PurchaseOrderItemId);
                if (poItem == null)
                    return ServiceResult<SupplierBillDto>.Failure("A bill line does not belong to this purchase order.");

                var received = receivedByItem.GetValueOrDefault(poItem.Id, 0);
                var billable = received - poItem.BilledQuantity;
                if (line.Quantity > billable)
                    return ServiceResult<SupplierBillDto>.Failure(
                        $"Billing {poItem.Description} exceeds the received quantity not yet billed.");

                var vatRate = line.VatRate ?? poItem.VatRate ?? company?.DefaultVatRate ?? 0;
                var net = line.Quantity * line.UnitPrice * (1 - line.Discount);
                invoice.InvoiceItems.Add(new InvoiceItem
                {
                    TenantId = TenantId,
                    ItemId = poItem.ItemId,
                    Description = poItem.Description,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    VatRate = vatRate,
                    Discount = line.Discount,
                    LineTotal = net + net * vatRate,
                    PurchaseOrderItemId = poItem.Id
                });
                poItem.BilledQuantity += line.Quantity;
            }

            invoice.Subtotal = invoice.InvoiceItems.Sum(i => i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault());
            invoice.VatAmount = invoice.InvoiceItems.Sum(i =>
                i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault() *
                (1 - i.Discount.GetValueOrDefault()) * i.VatRate.GetValueOrDefault());
            invoice.TotalDiscount = invoice.InvoiceItems.Sum(i =>
                i.Quantity.GetValueOrDefault() * i.UnitPrice.GetValueOrDefault() * i.Discount.GetValueOrDefault());
            invoice.Total = invoice.Subtotal + invoice.VatAmount - invoice.TotalDiscount;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            var poPrices = order.Items.ToDictionary(i => i.Id, i => i.UnitPrice);
            return ServiceResult<SupplierBillDto>.SuccessResult(MapSupplierBill(invoice, poPrices));
        }

        private static SupplierBillDto MapSupplierBill(
            Invoice invoice, IReadOnlyDictionary<Guid, decimal> poPrices)
        {
            var lines = invoice.InvoiceItems.Select(i => new SupplierBillLineDto
            {
                PurchaseOrderItemId = i.PurchaseOrderItemId ?? Guid.Empty,
                Description = i.Description,
                Quantity = i.Quantity.GetValueOrDefault(),
                UnitPrice = i.UnitPrice.GetValueOrDefault(),
                PurchaseOrderUnitPrice = i.PurchaseOrderItemId.HasValue
                    ? poPrices.GetValueOrDefault(i.PurchaseOrderItemId.Value)
                    : 0,
                VatRate = i.VatRate,
                LineTotal = i.LineTotal.GetValueOrDefault()
            }).ToList();

            return new SupplierBillDto
            {
                InvoiceId = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                SupplierInvoiceNumber = invoice.SupplierInvoiceNumber,
                Status = invoice.Status,
                IssueDate = invoice.IssueDate,
                DueDate = invoice.DueDate,
                CreatedAt = invoice.CreatedAt,
                Subtotal = invoice.Subtotal,
                VatAmount = invoice.VatAmount,
                Total = invoice.Total,
                GoodsReceiptNoteId = invoice.GoodsReceiptNoteId,
                HasVariance = lines.Any(l => l.PriceVariance != 0),
                Lines = lines
            };
        }

        private IQueryable<PurchaseOrder> BaseQuery() =>
            _context.PurchaseOrders
                .Include(o => o.Supplier)
                .Include(o => o.RequestForQuotation)
                .Include(o => o.Items)
                .Include(o => o.GoodsReceipts).ThenInclude(g => g.Items);

        private async Task<string?> ValidateAsync(PurchaseOrderCreateDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                return "At least one purchase order line is required.";
            if (dto.Items.Any(i => string.IsNullOrWhiteSpace(i.Description)))
                return "Every purchase order line needs a description.";
            if (dto.Items.Any(i => i.Quantity <= 0))
                return "Purchase order quantities must be greater than zero.";
            if (dto.Items.Any(i => i.UnitPrice < 0))
                return "Purchase order prices cannot be negative.";
            if (dto.Items.Any(i => i.Discount is < 0 or > 1))
                return "Discounts must be between 0 and 1.";
            if (dto.ExpectedDate.Date < dto.IssueDate.Date)
                return "The expected date cannot be before the issue date.";

            var supplierExists = await _context.Customers
                .AnyAsync(c => c.Id == dto.SupplierId && c.TenantId == TenantId && !c.IsDeleted);
            if (!supplierExists)
                return "The selected supplier could not be found.";

            if (dto.PurchaseRequisitionId.HasValue)
            {
                var requisitionExists = await _context.PurchaseRequisitions
                    .AnyAsync(r => r.Id == dto.PurchaseRequisitionId && r.TenantId == TenantId);
                if (!requisitionExists)
                    return "The linked purchase requisition could not be found.";
            }
            return null;
        }

        private void AddItems(PurchaseOrder order, IEnumerable<PurchaseOrderItemCreateDto> items, decimal defaultVatRate)
        {
            foreach (var item in items)
            {
                var vatRate = item.VatRate ?? defaultVatRate;
                var net = item.Quantity * item.UnitPrice * (1 - item.Discount);
                order.Items.Add(new PurchaseOrderItem
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

            order.Subtotal = order.Items.Sum(i => i.Quantity * i.UnitPrice);
            order.VatAmount = order.Items.Sum(i =>
                i.Quantity * i.UnitPrice * (1 - i.Discount) * (i.VatRate ?? 0));
            order.TotalDiscount = order.Items.Sum(i => i.Quantity * i.UnitPrice * i.Discount);
            order.Total = order.Subtotal + order.VatAmount - order.TotalDiscount;
        }

        private static PurchaseOrderDto Map(PurchaseOrder order)
        {
            var postedReceipts = order.GoodsReceipts?.Where(g => g.Status == "Posted").ToList() ?? new();
            return new PurchaseOrderDto
            {
                Id = order.Id,
                PoNumber = order.PoNumber,
                SupplierId = order.SupplierId,
                SupplierName = order.Supplier?.Name ?? string.Empty,
                PurchaseRequisitionId = order.PurchaseRequisitionId,
                RequestForQuotationId = order.RequestForQuotationId,
                RfqNumber = order.RequestForQuotation?.RfqNumber,
                IssueDate = order.IssueDate,
                ExpectedDate = order.ExpectedDate,
                Status = order.Status,
                Currency = order.Currency,
                Notes = order.Notes,
                Terms = order.Terms,
                Subtotal = order.Subtotal,
                VatAmount = order.VatAmount,
                TotalDiscount = order.TotalDiscount,
                Total = order.Total,
                CreatedAt = order.CreatedAt,
                OrderedAt = order.OrderedAt,
                ClosedAt = order.ClosedAt,
                GoodsReceiptCount = postedReceipts.Count,
                ReceivedValue = postedReceipts.SelectMany(g => g.Items).Sum(i => i.LineTotal),
                Items = order.Items.Select(i => new PurchaseOrderItemDto
                {
                    Id = i.Id,
                    ItemId = i.ItemId,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    VatRate = i.VatRate,
                    Discount = i.Discount,
                    LineTotal = i.LineTotal,
                    ReceivedQuantity = i.ReceivedQuantity,
                    RejectedQuantity = i.RejectedQuantity,
                    BilledQuantity = i.BilledQuantity
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
