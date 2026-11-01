using fatortak.Context;
using fatortak.Dtos.Pricing;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.PricingService
{
    public interface IPricingService
    {
        Task<ServiceResult<PagedResponseDto<PriceListDto>>> GetAsync(PriceListFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<PriceListDto>> GetAsync(Guid id);
        Task<ServiceResult<PriceListDto>> CreateAsync(PriceListCreateDto dto);
        Task<ServiceResult<PriceListDto>> UpdateAsync(Guid id, PriceListUpdateDto dto);
        Task<ServiceResult<bool>> DeleteAsync(Guid id);
        Task<ServiceResult<PriceListDto>> AssignCustomerAsync(Guid id, Guid customerId);
        Task<ServiceResult<PriceListDto>> UnassignCustomerAsync(Guid id, Guid customerId);
        Task<ServiceResult<ResolvePriceDto>> ResolveAsync(Guid customerId, Guid itemId, int quantity);
    }

    public class PricingService : IPricingService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PricingService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<PriceListDto>>> GetAsync(
            PriceListFilterDto filter, PaginationDto pagination)
        {
            var query = _context.PriceLists.Where(p => p.TenantId == TenantId).AsQueryable();
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(term));
            }
            if (filter.IsActive.HasValue)
                query = query.Where(p => p.IsActive == filter.IsActive.Value);

            var total = await query.CountAsync();
            var stats = new
            {
                total,
                active = await query.CountAsync(p => p.IsActive),
                defaultLists = await query.CountAsync(p => p.IsDefault),
                assignedCustomers = await _context.CustomerPriceLists.CountAsync(c => c.TenantId == TenantId)
            };

            var lists = await BaseQuery()
                .OrderByDescending(p => p.IsDefault)
                .ThenBy(p => p.Name)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<PriceListDto>>.SuccessResult(
                new PagedResponseDto<PriceListDto>
                {
                    Data = lists.Select(Map).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<PriceListDto>> GetAsync(Guid id)
        {
            var list = await BaseQuery().FirstOrDefaultAsync(p => p.Id == id && p.TenantId == TenantId);
            return list == null
                ? ServiceResult<PriceListDto>.Failure("Price list not found")
                : ServiceResult<PriceListDto>.SuccessResult(Map(list));
        }

        public async Task<ServiceResult<PriceListDto>> CreateAsync(PriceListCreateDto dto)
        {
            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<PriceListDto>.Failure(validation);

            if (dto.IsDefault)
            {
                var current = await _context.PriceLists
                    .Where(p => p.TenantId == TenantId && p.IsDefault)
                    .ToListAsync();
                current.ForEach(p => p.IsDefault = false);
            }

            var list = new PriceList
            {
                TenantId = TenantId,
                Name = dto.Name.Trim(),
                Currency = dto.Currency,
                ValidFrom = dto.ValidFrom.Date,
                ValidTo = dto.ValidTo?.Date,
                IsActive = dto.IsActive,
                IsDefault = dto.IsDefault,
                Notes = dto.Notes
            };
            AddItems(list, dto.Items);

            _context.PriceLists.Add(list);
            await _context.SaveChangesAsync();
            return await GetAsync(list.Id);
        }

        public async Task<ServiceResult<PriceListDto>> UpdateAsync(Guid id, PriceListUpdateDto dto)
        {
            var list = await BaseQuery().FirstOrDefaultAsync(p => p.Id == id && p.TenantId == TenantId);
            if (list == null)
                return ServiceResult<PriceListDto>.Failure("Price list not found");

            var validation = await ValidateAsync(dto);
            if (validation != null)
                return ServiceResult<PriceListDto>.Failure(validation);

            if (dto.IsDefault && !list.IsDefault)
            {
                var current = await _context.PriceLists
                    .Where(p => p.TenantId == TenantId && p.IsDefault && p.Id != id)
                    .ToListAsync();
                current.ForEach(p => p.IsDefault = false);
            }

            _context.PriceListItems.RemoveRange(list.Items);
            list.Items.Clear();

            list.Name = dto.Name.Trim();
            list.Currency = dto.Currency;
            list.ValidFrom = dto.ValidFrom.Date;
            list.ValidTo = dto.ValidTo?.Date;
            list.IsActive = dto.IsActive;
            list.IsDefault = dto.IsDefault;
            list.Notes = dto.Notes;
            list.UpdatedAt = DateTime.UtcNow;
            AddItems(list, dto.Items);
            foreach (var item in list.Items)
                _context.PriceListItems.Add(item);

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
        {
            var list = await BaseQuery().FirstOrDefaultAsync(p => p.Id == id && p.TenantId == TenantId);
            if (list == null)
                return ServiceResult<bool>.Failure("Price list not found");

            _context.PriceLists.Remove(list);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<PriceListDto>> AssignCustomerAsync(Guid id, Guid customerId)
        {
            var list = await _context.PriceLists
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == TenantId);
            if (list == null)
                return ServiceResult<PriceListDto>.Failure("Price list not found");

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == TenantId && !c.IsDeleted);
            if (customer == null)
                return ServiceResult<PriceListDto>.Failure("Customer not found");

            var assignment = await _context.CustomerPriceLists
                .FirstOrDefaultAsync(c => c.TenantId == TenantId && c.CustomerId == customerId);
            if (assignment == null)
            {
                _context.CustomerPriceLists.Add(new CustomerPriceList
                {
                    TenantId = TenantId,
                    CustomerId = customerId,
                    PriceListId = id
                });
            }
            else
            {
                assignment.PriceListId = id;
                assignment.AssignedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<PriceListDto>> UnassignCustomerAsync(Guid id, Guid customerId)
        {
            var assignment = await _context.CustomerPriceLists
                .FirstOrDefaultAsync(c => c.TenantId == TenantId &&
                                          c.CustomerId == customerId &&
                                          c.PriceListId == id);
            if (assignment == null)
                return ServiceResult<PriceListDto>.Failure("Customer assignment not found");

            _context.CustomerPriceLists.Remove(assignment);
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<ResolvePriceDto>> ResolveAsync(
            Guid customerId, Guid itemId, int quantity)
        {
            if (quantity <= 0) quantity = 1;
            var today = DateTime.UtcNow.Date;

            var customerListId = await _context.CustomerPriceLists
                .Where(c => c.TenantId == TenantId && c.CustomerId == customerId)
                .Select(c => (Guid?)c.PriceListId)
                .FirstOrDefaultAsync();

            PriceList? list = null;
            if (customerListId.HasValue)
            {
                list = await BaseQuery().FirstOrDefaultAsync(p =>
                    p.Id == customerListId.Value &&
                    p.IsActive &&
                    p.ValidFrom <= today &&
                    (p.ValidTo == null || p.ValidTo >= today));
            }
            list ??= await BaseQuery()
                .Where(p => p.IsActive && p.IsDefault &&
                            p.ValidFrom <= today &&
                            (p.ValidTo == null || p.ValidTo >= today))
                .FirstOrDefaultAsync();

            if (list != null)
            {
                var line = list.Items
                    .Where(i => i.ItemId == itemId &&
                                i.MinQuantity <= quantity &&
                                (i.MaxQuantity == null || i.MaxQuantity >= quantity))
                    .OrderByDescending(i => i.MinQuantity)
                    .FirstOrDefault();
                if (line != null)
                {
                    return ServiceResult<ResolvePriceDto>.SuccessResult(new ResolvePriceDto
                    {
                        UnitPrice = line.UnitPrice,
                        PriceListName = list.Name,
                        Source = "PriceList"
                    });
                }
            }

            var item = await _context.Items
                .FirstOrDefaultAsync(i => i.Id == itemId && i.TenantId == TenantId);
            if (item == null)
                return ServiceResult<ResolvePriceDto>.Failure("Item not found");

            return ServiceResult<ResolvePriceDto>.SuccessResult(new ResolvePriceDto
            {
                UnitPrice = item.UnitPrice ?? 0,
                Source = "Item"
            });
        }

        private IQueryable<PriceList> BaseQuery() =>
            _context.PriceLists
                .Include(p => p.Items).ThenInclude(i => i.Item)
                .Include(p => p.Customers).ThenInclude(c => c.Customer);

        private async Task<string?> ValidateAsync(PriceListCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Price list name is required.";
            if (dto.ValidTo.HasValue && dto.ValidTo.Value.Date < dto.ValidFrom.Date)
                return "The valid-to date cannot be before the valid-from date.";
            if (dto.Items == null || dto.Items.Count == 0)
                return "Add at least one price list line.";
            if (dto.Items.Any(i => i.UnitPrice < 0))
                return "Prices cannot be negative.";
            if (dto.Items.Any(i => i.MinQuantity <= 0))
                return "Minimum quantities must be greater than zero.";
            if (dto.Items.Any(i => i.MaxQuantity.HasValue && i.MaxQuantity.Value < i.MinQuantity))
                return "Maximum quantity cannot be below the minimum quantity.";

            var ids = dto.Items.Select(i => i.ItemId).Distinct().ToList();
            var found = await _context.Items
                .CountAsync(i => i.TenantId == TenantId && !i.IsDeleted && ids.Contains(i.Id));
            if (found != ids.Count)
                return "One or more price list items could not be found.";

            return null;
        }

        private void AddItems(PriceList list, IEnumerable<PriceListItemCreateDto> items)
        {
            foreach (var item in items)
            {
                list.Items.Add(new PriceListItem
                {
                    TenantId = TenantId,
                    ItemId = item.ItemId,
                    UnitPrice = item.UnitPrice,
                    MinQuantity = item.MinQuantity,
                    MaxQuantity = item.MaxQuantity
                });
            }
        }

        private static PriceListDto Map(PriceList list) => new()
        {
            Id = list.Id,
            Name = list.Name,
            Currency = list.Currency,
            ValidFrom = list.ValidFrom,
            ValidTo = list.ValidTo,
            IsActive = list.IsActive,
            IsDefault = list.IsDefault,
            Notes = list.Notes,
            CreatedAt = list.CreatedAt,
            ItemCount = list.Items.Count,
            CustomerCount = list.Customers.Count,
            Items = list.Items.Select(i => new PriceListItemDto
            {
                Id = i.Id,
                ItemId = i.ItemId,
                ItemName = i.Item?.Name ?? string.Empty,
                UnitPrice = i.UnitPrice,
                MinQuantity = i.MinQuantity,
                MaxQuantity = i.MaxQuantity
            }).ToList(),
            CustomerIds = list.Customers.Select(c => c.CustomerId).ToList(),
            CustomerNames = list.Customers.Select(c => c.Customer?.Name ?? string.Empty).ToList()
        };

        private Guid GetTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }
    }
}
