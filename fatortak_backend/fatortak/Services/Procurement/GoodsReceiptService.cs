using fatortak.Context;
using fatortak.Dtos.Procurement;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.Procurement
{
    public interface IGoodsReceiptService
    {
        Task<ServiceResult<PagedResponseDto<GoodsReceiptDto>>> GetAsync(GoodsReceiptFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<GoodsReceiptDto>> GetAsync(Guid id);
        Task<ServiceResult<GoodsReceiptDto>> CreateAsync(GoodsReceiptCreateDto dto);
        Task<ServiceResult<GoodsReceiptDto>> UpdateAsync(Guid id, GoodsReceiptUpdateDto dto);
        Task<ServiceResult<GoodsReceiptDto>> PostAsync(Guid id);
        Task<ServiceResult<GoodsReceiptDto>> UpdateStatusAsync(Guid id, string status);
        Task<ServiceResult<bool>> DeleteAsync(Guid id);
    }

    public class GoodsReceiptService : IGoodsReceiptService
    {
        private const string Prefix = "GRN-";
        private readonly ApplicationDbContext _context;
        private readonly ILogger<GoodsReceiptService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public GoodsReceiptService(
            ApplicationDbContext context,
            ILogger<GoodsReceiptService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<GoodsReceiptDto>>> GetAsync(
            GoodsReceiptFilterDto filter, PaginationDto pagination)
        {
            var query = _context.GoodsReceiptNotes
                .Where(g => g.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(g =>
                    g.GrnNumber.ToLower().Contains(term) ||
                    g.PurchaseOrder.PoNumber.ToLower().Contains(term) ||
                    g.Supplier.Name.ToLower().Contains(term));
            }
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(g => g.Status == filter.Status);
            if (filter.PurchaseOrderId.HasValue)
                query = query.Where(g => g.PurchaseOrderId == filter.PurchaseOrderId.Value);
            if (filter.FromDate.HasValue)
                query = query.Where(g => g.ReceivedDate >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(g => g.ReceivedDate <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = new
            {
                total,
                draft = await query.CountAsync(g => g.Status == "Draft"),
                posted = await query.CountAsync(g => g.Status == "Posted"),
                cancelled = await query.CountAsync(g => g.Status == "Cancelled"),
                receivedValue = await query
                    .Where(g => g.Status == "Posted")
                    .SelectMany(g => g.Items)
                    .SumAsync(i => i.LineTotal)
            };

            var receipts = await BaseQuery()
                .OrderByDescending(g => g.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<GoodsReceiptDto>>.SuccessResult(
                new PagedResponseDto<GoodsReceiptDto>
                {
                    Data = receipts.Select(Map).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<GoodsReceiptDto>> GetAsync(Guid id)
        {
            var receipt = await BaseQuery().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == TenantId);
            return receipt == null
                ? ServiceResult<GoodsReceiptDto>.Failure("Goods receipt not found")
                : ServiceResult<GoodsReceiptDto>.SuccessResult(Map(receipt));
        }

        public async Task<ServiceResult<GoodsReceiptDto>> CreateAsync(GoodsReceiptCreateDto dto)
        {
            var order = await _context.PurchaseOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == dto.PurchaseOrderId && o.TenantId == TenantId);
            if (order == null)
                return ServiceResult<GoodsReceiptDto>.Failure("Purchase order not found");
            if (order.Status is not ("Ordered" or "PartiallyReceived"))
                return ServiceResult<GoodsReceiptDto>.Failure("Only ordered purchase orders can receive goods.");

            var lines = BuildItems(order, dto.Items);
            if (lines.Error != null)
                return ServiceResult<GoodsReceiptDto>.Failure(lines.Error);

            var last = await _context.GoodsReceiptNotes
                .Where(g => g.TenantId == TenantId)
                .OrderByDescending(g => g.CreatedAt)
                .Select(g => g.GrnNumber)
                .FirstOrDefaultAsync();

            var receipt = new GoodsReceiptNote
            {
                TenantId = TenantId,
                GrnNumber = DocumentNumberHelper.Next(Prefix, last),
                PurchaseOrderId = order.Id,
                SupplierId = order.SupplierId,
                ReceivedByUserId = TryGetUserId(),
                ReceivedDate = dto.ReceivedDate,
                Status = "Draft",
                Notes = dto.Notes
            };
            foreach (var line in lines.Items)
                receipt.Items.Add(line);

            _context.GoodsReceiptNotes.Add(receipt);
            await _context.SaveChangesAsync();
            return await GetAsync(receipt.Id);
        }

        public async Task<ServiceResult<GoodsReceiptDto>> UpdateAsync(Guid id, GoodsReceiptUpdateDto dto)
        {
            var receipt = await BaseQuery().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == TenantId);
            if (receipt == null)
                return ServiceResult<GoodsReceiptDto>.Failure("Goods receipt not found");
            if (receipt.Status != "Draft")
                return ServiceResult<GoodsReceiptDto>.Failure("Only draft goods receipts can be edited.");
            if (dto.PurchaseOrderId != receipt.PurchaseOrderId)
                return ServiceResult<GoodsReceiptDto>.Failure("The purchase order cannot be changed.");

            var order = await _context.PurchaseOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == receipt.PurchaseOrderId && o.TenantId == TenantId);
            if (order == null)
                return ServiceResult<GoodsReceiptDto>.Failure("Purchase order not found");

            var lines = BuildItems(order, dto.Items);
            if (lines.Error != null)
                return ServiceResult<GoodsReceiptDto>.Failure(lines.Error);

            _context.GoodsReceiptItems.RemoveRange(receipt.Items);
            receipt.Items.Clear();
            receipt.ReceivedDate = dto.ReceivedDate;
            receipt.Notes = dto.Notes;
            receipt.UpdatedAt = DateTime.UtcNow;
            foreach (var line in lines.Items)
            {
                receipt.Items.Add(line);
                _context.GoodsReceiptItems.Add(line);
            }

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<GoodsReceiptDto>> PostAsync(Guid id)
        {
            var receipt = await BaseQuery().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == TenantId);
            if (receipt == null)
                return ServiceResult<GoodsReceiptDto>.Failure("Goods receipt not found");
            if (receipt.Status != "Draft")
                return ServiceResult<GoodsReceiptDto>.Failure("Only draft goods receipts can be posted.");
            if (receipt.Items.Count == 0)
                return ServiceResult<GoodsReceiptDto>.Failure("Add at least one received line before posting.");

            var order = await _context.PurchaseOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == receipt.PurchaseOrderId && o.TenantId == TenantId);
            if (order == null)
                return ServiceResult<GoodsReceiptDto>.Failure("Purchase order not found");
            if (order.Status is not ("Ordered" or "PartiallyReceived"))
                return ServiceResult<GoodsReceiptDto>.Failure("The purchase order cannot receive more goods.");

            foreach (var line in receipt.Items)
            {
                var poItem = order.Items.FirstOrDefault(i => i.Id == line.PurchaseOrderItemId);
                if (poItem == null)
                    return ServiceResult<GoodsReceiptDto>.Failure("A receipt line no longer matches the purchase order.");

                var accounted = poItem.ReceivedQuantity + poItem.RejectedQuantity;
                var available = poItem.Quantity - accounted;
                if (line.ReceivedQuantity + line.RejectedQuantity > available)
                    return ServiceResult<GoodsReceiptDto>.Failure(
                        $"Receipt exceeds the remaining quantity for {poItem.Description}.");

                poItem.ReceivedQuantity += line.ReceivedQuantity;
                poItem.RejectedQuantity += line.RejectedQuantity;

                if (poItem.ItemId.HasValue && line.ReceivedQuantity > 0)
                {
                    var item = await _context.Items
                        .FirstOrDefaultAsync(i => i.Id == poItem.ItemId.Value && i.TenantId == TenantId);
                    if (item != null)
                    {
                        var currentQty = item.Quantity ?? 0;
                        var currentCost = item.PurchaseUnitPrice ?? 0;
                        var newQty = currentQty + line.ReceivedQuantity;
                        item.PurchaseUnitPrice = newQty > 0
                            ? ((currentQty * currentCost) + (line.ReceivedQuantity * line.UnitPrice)) / newQty
                            : line.UnitPrice;
                        item.Quantity = newQty;
                        item.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            receipt.Status = "Posted";
            receipt.PostedAt = DateTime.UtcNow;
            receipt.UpdatedAt = DateTime.UtcNow;

            var fullyAccounted = order.Items.All(i =>
                i.ReceivedQuantity + i.RejectedQuantity >= i.Quantity);
            var anyReceived = order.Items.Any(i => i.ReceivedQuantity > 0);
            order.Status = fullyAccounted ? "Received" : anyReceived ? "PartiallyReceived" : order.Status;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<GoodsReceiptDto>> UpdateStatusAsync(Guid id, string status)
        {
            var receipt = await BaseQuery().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == TenantId);
            if (receipt == null)
                return ServiceResult<GoodsReceiptDto>.Failure("Goods receipt not found");
            if (status?.Trim() != "Cancelled" || receipt.Status != "Draft")
                return ServiceResult<GoodsReceiptDto>.Failure("Only draft goods receipts can be cancelled.");

            receipt.Status = "Cancelled";
            receipt.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
        {
            var receipt = await BaseQuery().FirstOrDefaultAsync(g => g.Id == id && g.TenantId == TenantId);
            if (receipt == null)
                return ServiceResult<bool>.Failure("Goods receipt not found");
            if (receipt.Status != "Draft")
                return ServiceResult<bool>.Failure("Only draft goods receipts can be deleted.");

            _context.GoodsReceiptNotes.Remove(receipt);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        private IQueryable<GoodsReceiptNote> BaseQuery() =>
            _context.GoodsReceiptNotes
                .Include(g => g.PurchaseOrder)
                .Include(g => g.Supplier)
                .Include(g => g.ReceivedByUser)
                .Include(g => g.Items);

        private (List<GoodsReceiptItem> Items, string? Error) BuildItems(
            PurchaseOrder order, IEnumerable<GoodsReceiptItemCreateDto> requested)
        {
            if (requested == null)
                return (new List<GoodsReceiptItem>(), "Add at least one received line.");

            var items = new List<GoodsReceiptItem>();
            foreach (var line in requested.Where(l => l.ReceivedQuantity > 0 || l.RejectedQuantity > 0))
            {
                if (line.ReceivedQuantity < 0 || line.RejectedQuantity < 0)
                    return (items, "Received and rejected quantities cannot be negative.");

                var poItem = order.Items.FirstOrDefault(i => i.Id == line.PurchaseOrderItemId);
                if (poItem == null)
                    return (items, "A receipt line does not belong to the purchase order.");

                var available = poItem.Quantity - (poItem.ReceivedQuantity + poItem.RejectedQuantity);
                if (line.ReceivedQuantity + line.RejectedQuantity > available)
                    return (items, $"Received quantity exceeds the remaining quantity for {poItem.Description}.");

                items.Add(new GoodsReceiptItem
                {
                    TenantId = TenantId,
                    PurchaseOrderItemId = poItem.Id,
                    Description = poItem.Description,
                    OrderedQuantity = poItem.Quantity,
                    ReceivedQuantity = line.ReceivedQuantity,
                    RejectedQuantity = line.RejectedQuantity,
                    UnitPrice = poItem.UnitPrice,
                    LineTotal = line.ReceivedQuantity * poItem.UnitPrice
                });
            }

            if (items.Count == 0)
                return (items, "Add at least one received line.");

            return (items, null);
        }

        private static GoodsReceiptDto Map(GoodsReceiptNote receipt) => new()
        {
            Id = receipt.Id,
            GrnNumber = receipt.GrnNumber,
            PurchaseOrderId = receipt.PurchaseOrderId,
            PoNumber = receipt.PurchaseOrder?.PoNumber ?? string.Empty,
            SupplierId = receipt.SupplierId,
            SupplierName = receipt.Supplier?.Name ?? string.Empty,
            ReceivedDate = receipt.ReceivedDate,
            Status = receipt.Status,
            Notes = receipt.Notes,
            ReceivedByName = receipt.ReceivedByUser == null
                ? null
                : $"{receipt.ReceivedByUser.FirstName} {receipt.ReceivedByUser.LastName}".Trim(),
            CreatedAt = receipt.CreatedAt,
            PostedAt = receipt.PostedAt,
            ReceivedValue = receipt.Items.Sum(i => i.LineTotal),
            Items = receipt.Items.Select(i => new GoodsReceiptItemDto
            {
                Id = i.Id,
                PurchaseOrderItemId = i.PurchaseOrderItemId,
                Description = i.Description,
                OrderedQuantity = i.OrderedQuantity,
                ReceivedQuantity = i.ReceivedQuantity,
                RejectedQuantity = i.RejectedQuantity,
                UnitPrice = i.UnitPrice,
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
