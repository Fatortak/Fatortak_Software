using fatortak.Common.Enum;
using fatortak.Context;
using fatortak.Dtos.PurchaseRequisition;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace fatortak.Services.PurchaseRequisitionService
{
    public class PurchaseRequisitionService : IPurchaseRequisitionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PurchaseRequisitionService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PurchaseRequisitionService(
            ApplicationDbContext context,
            ILogger<PurchaseRequisitionService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<PurchaseRequisitionDto>>> GetAsync(
            PurchaseRequisitionFilterDto filter, PaginationDto pagination)
        {
            var query = _context.PurchaseRequisitions
                .Where(r => r.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.ToLower();
                query = query.Where(r =>
                    r.RequestNumber.ToLower().Contains(term) ||
                    r.Title.ToLower().Contains(term) ||
                    (r.Notes != null && r.Notes.ToLower().Contains(term)));
            }

            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(r => r.Status == filter.Status);

            if (filter.FromDate.HasValue)
                query = query.Where(r => r.NeededBy >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(r => r.NeededBy <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = await query.GroupBy(r => 1).Select(g => new
            {
                total = g.Count(),
                draft = g.Count(r => r.Status == "Draft"),
                submitted = g.Count(r => r.Status == "Submitted"),
                approved = g.Count(r => r.Status == "Approved"),
                rejected = g.Count(r => r.Status == "Rejected"),
                totalValue = g.Sum(r => r.Total)
            }).FirstOrDefaultAsync() ?? new
            {
                total = 0,
                draft = 0,
                submitted = 0,
                approved = 0,
                rejected = 0,
                totalValue = 0m
            };

            var items = await query
                .Include(r => r.User)
                .Include(r => r.ApprovedByUser)
                .Include(r => r.Items)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<PurchaseRequisitionDto>>.SuccessResult(
                new PagedResponseDto<PurchaseRequisitionDto>
                {
                    Data = items.Select(Map).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<PurchaseRequisitionDto>> GetAsync(Guid id)
        {
            var item = await GetWithRelations(id);
            return item == null
                ? ServiceResult<PurchaseRequisitionDto>.Failure("Purchase requisition not found")
                : ServiceResult<PurchaseRequisitionDto>.SuccessResult(Map(item));
        }

        public async Task<ServiceResult<PurchaseRequisitionDto>> CreateAsync(
            PurchaseRequisitionCreateDto dto)
        {
            var validation = Validate(dto);
            if (validation != null)
                return ServiceResult<PurchaseRequisitionDto>.Failure(validation);

            var last = await _context.PurchaseRequisitions
                .Where(r => r.TenantId == TenantId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => r.RequestNumber)
                .FirstOrDefaultAsync();

            var requisition = new PurchaseRequisition
            {
                TenantId = TenantId,
                RequestNumber = GenerateNumber(last),
                Title = dto.Title.Trim(),
                NeededBy = dto.NeededBy,
                Notes = dto.Notes,
                Status = PurchaseRequisitionStatus.Draft.ToString(),
                UserId = TryGetUserId()
            };

            AddItems(requisition, dto.Items);
            _context.PurchaseRequisitions.Add(requisition);
            await _context.SaveChangesAsync();

            var saved = await GetWithRelations(requisition.Id);
            return ServiceResult<PurchaseRequisitionDto>.SuccessResult(Map(saved!));
        }

        public async Task<ServiceResult<PurchaseRequisitionDto>> UpdateAsync(
            Guid id, PurchaseRequisitionUpdateDto dto)
        {
            var requisition = await GetWithRelations(id);
            if (requisition == null)
                return ServiceResult<PurchaseRequisitionDto>.Failure("Purchase requisition not found");

            if (requisition.Status != "Draft")
                return ServiceResult<PurchaseRequisitionDto>.Failure("Only draft requisitions can be edited.");

            var validation = Validate(dto);
            if (validation != null)
                return ServiceResult<PurchaseRequisitionDto>.Failure(validation);

            var oldItems = requisition.Items.ToList();
            _context.PurchaseRequisitionItems.RemoveRange(oldItems);
            requisition.Items.Clear();

            requisition.Title = dto.Title.Trim();
            requisition.NeededBy = dto.NeededBy;
            requisition.Notes = dto.Notes;
            requisition.UpdatedAt = DateTime.UtcNow;
            AddItems(requisition, dto.Items);
            var newItems = requisition.Items.ToList();
            requisition.Items.Clear();
            foreach (var item in newItems)
            {
                item.PurchaseRequisitionId = requisition.Id;
                _context.PurchaseRequisitionItems.Add(item);
            }

            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            var saved = await GetWithRelations(id);
            return ServiceResult<PurchaseRequisitionDto>.SuccessResult(Map(saved!));
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
        {
            var requisition = await GetWithRelations(id);
            if (requisition == null)
                return ServiceResult<bool>.Failure("Purchase requisition not found");
            if (requisition.Status != "Draft")
                return ServiceResult<bool>.Failure("Only draft requisitions can be deleted.");

            _context.PurchaseRequisitions.Remove(requisition);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<PurchaseRequisitionDto>> UpdateStatusAsync(Guid id, string status)
        {
            var requisition = await GetWithRelations(id);
            if (requisition == null)
                return ServiceResult<PurchaseRequisitionDto>.Failure("Purchase requisition not found");

            if (!Enum.TryParse<PurchaseRequisitionStatus>(status, true, out var target))
                return ServiceResult<PurchaseRequisitionDto>.Failure("Invalid requisition status.");

            var allowed = requisition.Status switch
            {
                "Draft" => target is PurchaseRequisitionStatus.Submitted or PurchaseRequisitionStatus.Cancelled,
                "Submitted" => target is PurchaseRequisitionStatus.Approved or PurchaseRequisitionStatus.Rejected or PurchaseRequisitionStatus.Cancelled,
                "Approved" => target == PurchaseRequisitionStatus.Cancelled,
                _ => false
            };

            if (!allowed)
                return ServiceResult<PurchaseRequisitionDto>.Failure(
                    $"Cannot change a {requisition.Status.ToLower()} requisition to {target}.");

            requisition.Status = target.ToString();
            requisition.UpdatedAt = DateTime.UtcNow;

            if (target == PurchaseRequisitionStatus.Submitted)
                requisition.SubmittedAt = DateTime.UtcNow;
            if (target == PurchaseRequisitionStatus.Approved)
            {
                requisition.ApprovedAt = DateTime.UtcNow;
                requisition.ApprovedByUserId = TryGetUserId();
            }
            if (target == PurchaseRequisitionStatus.Rejected)
                requisition.RejectedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return ServiceResult<PurchaseRequisitionDto>.SuccessResult(Map(requisition));
        }

        private async Task<PurchaseRequisition?> GetWithRelations(Guid id) =>
            await _context.PurchaseRequisitions
                .Include(r => r.User)
                .Include(r => r.ApprovedByUser)
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == TenantId);

        private static string? Validate(PurchaseRequisitionCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return "Requisition title is required.";
            if (dto.Items == null || dto.Items.Count == 0)
                return "At least one requisition line is required.";
            if (dto.Items.Any(i => string.IsNullOrWhiteSpace(i.Description)))
                return "Every line needs a description.";
            if (dto.Items.Any(i => i.Quantity <= 0))
                return "Item quantity must be greater than zero.";
            if (dto.Items.Any(i => i.EstimatedUnitPrice < 0))
                return "Estimated price cannot be negative.";
            return null;
        }

        private void AddItems(PurchaseRequisition requisition, IEnumerable<PurchaseRequisitionItemCreateDto> items)
        {
            var total = 0m;
            foreach (var item in items)
            {
                var lineTotal = item.Quantity * item.EstimatedUnitPrice;
                total += lineTotal;
                requisition.Items.Add(new PurchaseRequisitionItem
                {
                    TenantId = TenantId,
                    Description = item.Description.Trim(),
                    Quantity = item.Quantity,
                    EstimatedUnitPrice = item.EstimatedUnitPrice,
                    LineTotal = lineTotal
                });
            }
            requisition.Total = total;
        }

        private static PurchaseRequisitionDto Map(PurchaseRequisition requisition) => new()
        {
            Id = requisition.Id,
            RequestNumber = requisition.RequestNumber,
            Title = requisition.Title,
            RequesterName = requisition.User == null
                ? null
                : $"{requisition.User.FirstName} {requisition.User.LastName}".Trim(),
            ApprovedByName = requisition.ApprovedByUser == null
                ? null
                : $"{requisition.ApprovedByUser.FirstName} {requisition.ApprovedByUser.LastName}".Trim(),
            NeededBy = requisition.NeededBy,
            Status = requisition.Status,
            Notes = requisition.Notes,
            Total = requisition.Total,
            CreatedAt = requisition.CreatedAt,
            SubmittedAt = requisition.SubmittedAt,
            ApprovedAt = requisition.ApprovedAt,
            RejectedAt = requisition.RejectedAt,
            Items = requisition.Items.Select(i => new PurchaseRequisitionItemDto
            {
                Id = i.Id,
                Description = i.Description,
                Quantity = i.Quantity,
                EstimatedUnitPrice = i.EstimatedUnitPrice,
                LineTotal = i.LineTotal
            }).ToList()
        };

        private static string GenerateNumber(string? last)
        {
            if (string.IsNullOrEmpty(last))
                return "PR-0001";
            var match = Regex.Match(last, @"\d+$");
            if (match.Success && long.TryParse(match.Value, out var number))
                return $"{last[..match.Index]}{(number + 1).ToString().PadLeft(match.Value.Length, '0')}";
            return "PR-0001";
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
