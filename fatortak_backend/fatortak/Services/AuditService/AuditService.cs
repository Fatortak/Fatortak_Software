using fatortak.Context;
using fatortak.Dtos.Audit;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.AuditService
{
    public interface IAuditService
    {
        Task<ServiceResult<PagedResponseDto<AuditLogDto>>> GetAsync(AuditLogFilterDto filter, PaginationDto pagination);
    }

    public class AuditService : IAuditService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult<PagedResponseDto<AuditLogDto>>> GetAsync(
            AuditLogFilterDto filter, PaginationDto pagination)
        {
            var tenantId = GetTenantId();
            var query = _context.AuditLogs
                .Where(a => a.TenantId == tenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(a =>
                    a.EntityLabel != null && a.EntityLabel.ToLower().Contains(term) ||
                    a.EntityType.ToLower().Contains(term) ||
                    a.EntityId.ToLower().Contains(term));
            }
            if (!string.IsNullOrWhiteSpace(filter.EntityType))
                query = query.Where(a => a.EntityType == filter.EntityType);
            if (!string.IsNullOrWhiteSpace(filter.Action))
                query = query.Where(a => a.Action == filter.Action);
            if (filter.UserId.HasValue)
                query = query.Where(a => a.UserId == filter.UserId.Value);
            if (filter.FromDate.HasValue)
                query = query.Where(a => a.CreatedAt >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(a => a.CreatedAt <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = new
            {
                total,
                created = await query.CountAsync(a => a.Action == "Added"),
                updated = await query.CountAsync(a => a.Action == "Modified"),
                deleted = await query.CountAsync(a => a.Action == "Deleted"),
                users = await query.Where(a => a.UserId != null).Select(a => a.UserId).Distinct().CountAsync()
            };

            var logs = await query
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    EntityLabel = a.EntityLabel,
                    Changes = a.Changes,
                    UserName = a.User == null ? null : (a.User.FirstName + " " + a.User.LastName),
                    IpAddress = a.IpAddress,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return ServiceResult<PagedResponseDto<AuditLogDto>>.SuccessResult(
                new PagedResponseDto<AuditLogDto>
                {
                    Data = logs,
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        private Guid GetTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }
    }
}
