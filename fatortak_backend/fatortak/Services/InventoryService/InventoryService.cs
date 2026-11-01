using fatortak.Context;
using fatortak.Dtos.Inventory;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.InventoryService
{
    public interface IInventoryService
    {
        Task<ServiceResult<PagedResponseDto<StockAdjustmentDto>>> GetAdjustmentsAsync(StockAdjustmentFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<StockAdjustmentDto>> CreateAdjustmentAsync(StockAdjustmentCreateDto dto);
        Task<ServiceResult<InventoryValuationSummaryDto>> GetValuationAsync();
    }

    public class InventoryService : IInventoryService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public InventoryService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<StockAdjustmentDto>>> GetAdjustmentsAsync(
            StockAdjustmentFilterDto filter, PaginationDto pagination)
        {
            var query = _context.StockAdjustments
                .Where(a => a.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(a =>
                    a.Item.Name.ToLower().Contains(term) ||
                    a.Reason.ToLower().Contains(term));
            }
            if (filter.ItemId.HasValue)
                query = query.Where(a => a.ItemId == filter.ItemId.Value);
            if (filter.FromDate.HasValue)
                query = query.Where(a => a.Date >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(a => a.Date <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = new
            {
                total,
                increases = await query.CountAsync(a => a.QuantityChange > 0),
                decreases = await query.CountAsync(a => a.QuantityChange < 0),
                netQuantity = await query.SumAsync(a => a.QuantityChange)
            };

            var adjustments = await query
                .Include(a => a.Item)
                .Include(a => a.User)
                .OrderByDescending(a => a.Date)
                .ThenByDescending(a => a.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<StockAdjustmentDto>>.SuccessResult(
                new PagedResponseDto<StockAdjustmentDto>
                {
                    Data = adjustments.Select(Map).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<StockAdjustmentDto>> CreateAdjustmentAsync(StockAdjustmentCreateDto dto)
        {
            if (dto.QuantityChange == 0)
                return ServiceResult<StockAdjustmentDto>.Failure("Quantity change cannot be zero.");
            if (string.IsNullOrWhiteSpace(dto.Reason))
                return ServiceResult<StockAdjustmentDto>.Failure("A reason is required for the adjustment.");
            if (dto.UnitCost.HasValue && dto.UnitCost < 0)
                return ServiceResult<StockAdjustmentDto>.Failure("Unit cost cannot be negative.");

            var item = await _context.Items
                .FirstOrDefaultAsync(i => i.Id == dto.ItemId && i.TenantId == TenantId && !i.IsDeleted);
            if (item == null)
                return ServiceResult<StockAdjustmentDto>.Failure("Item not found");

            var currentQty = item.Quantity ?? 0;
            var newQty = currentQty + dto.QuantityChange;
            if (newQty < 0)
                return ServiceResult<StockAdjustmentDto>.Failure(
                    $"Adjustment would make stock negative. Available: {currentQty}.");

            if (dto.QuantityChange > 0 && dto.UnitCost.HasValue && newQty > 0)
            {
                var currentCost = item.PurchaseUnitPrice ?? 0;
                item.PurchaseUnitPrice = ((currentQty * currentCost) + (dto.QuantityChange * dto.UnitCost.Value)) / newQty;
            }

            item.Quantity = newQty;
            item.UpdatedAt = DateTime.UtcNow;

            var adjustment = new StockAdjustment
            {
                TenantId = TenantId,
                ItemId = dto.ItemId,
                Date = dto.Date.Date,
                QuantityChange = dto.QuantityChange,
                UnitCost = dto.UnitCost,
                Reason = dto.Reason.Trim(),
                Notes = dto.Notes,
                UserId = TryGetUserId()
            };
            _context.StockAdjustments.Add(adjustment);
            await _context.SaveChangesAsync();

            adjustment.Item = item;
            return ServiceResult<StockAdjustmentDto>.SuccessResult(Map(adjustment));
        }

        public async Task<ServiceResult<InventoryValuationSummaryDto>> GetValuationAsync()
        {
            var items = await _context.Items
                .Where(i => i.TenantId == TenantId && !i.IsDeleted)
                .OrderBy(i => i.Name)
                .ToListAsync();

            var rows = items.Select(item =>
            {
                var qty = item.Quantity ?? 0;
                var cost = item.PurchaseUnitPrice ?? 0;
                return new InventoryValuationDto
                {
                    ItemId = item.Id,
                    ItemName = item.Name,
                    Code = item.Code,
                    Quantity = qty,
                    UnitCost = cost,
                    Value = qty * cost,
                    LowStock = qty <= 10
                };
            }).ToList();

            return ServiceResult<InventoryValuationSummaryDto>.SuccessResult(new InventoryValuationSummaryDto
            {
                ItemCount = rows.Count,
                TotalQuantity = rows.Sum(r => r.Quantity),
                TotalValue = rows.Sum(r => r.Value),
                LowStockCount = rows.Count(r => r.LowStock),
                Items = rows
            });
        }

        private static StockAdjustmentDto Map(StockAdjustment adjustment) => new()
        {
            Id = adjustment.Id,
            ItemId = adjustment.ItemId,
            ItemName = adjustment.Item?.Name ?? string.Empty,
            Date = adjustment.Date,
            QuantityChange = adjustment.QuantityChange,
            UnitCost = adjustment.UnitCost,
            Reason = adjustment.Reason,
            Notes = adjustment.Notes,
            UserName = adjustment.User == null
                ? null
                : $"{adjustment.User.FirstName} {adjustment.User.LastName}".Trim(),
            CreatedAt = adjustment.CreatedAt
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
