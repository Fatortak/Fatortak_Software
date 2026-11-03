using fatortak.Common.Enum;
using fatortak.Context;
using fatortak.Dtos.Platform;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace fatortak.Services.PlatformService
{
    public interface IPlatformService
    {
        Task<ServiceResult<PlatformOverviewDto>> GetOverviewAsync();
        Task<ServiceResult<PagedResponseDto<PlatformTenantDto>>> GetTenantsAsync(
            PlatformTenantFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<PagedResponseDto<PlatformUserDto>>> GetUsersAsync(
            PlatformUserFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<bool>> SetTenantStatusAsync(Guid tenantId, bool isActive);
        Task<ServiceResult<bool>> SetUserStatusAsync(Guid userId, bool isActive);
        Task<ServiceResult<bool>> SetUserRoleAsync(Guid userId, string role);
    }

    public class PlatformService : IPlatformService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PlatformService(
            ApplicationDbContext context,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult<PlatformOverviewDto>> GetOverviewAsync()
        {
            var today = DateTime.UtcNow.Date;
            var monthAgo = DateTime.UtcNow.AddDays(-30);
            var currentUserId = GetCurrentUserId();

            var tenants = await _context.Tenants.AsNoTracking().ToListAsync();
            var users = await _context.Users.AsNoTracking().ToListAsync();
            var subscriptions = await _context.Subscriptions.AsNoTracking().ToListAsync();

            var overview = new PlatformOverviewDto
            {
                Tenants = tenants.Count,
                ActiveTenants = tenants.Count(t => t.IsActive),
                SuspendedTenants = tenants.Count(t => !t.IsActive),
                Users = users.Count,
                ActiveUsers = users.Count(u => u.IsActive),
                NewUsersLast30Days = users.Count(u => u.CreatedAt >= monthAgo),
                Invoices = await _context.Invoices.CountAsync(),
                Customers = await _context.Customers.CountAsync(c => !c.IsDeleted),
                Items = await _context.Items.CountAsync(i => !i.IsDeleted),
                ActiveSubscriptions = subscriptions.Count(s => s.EndDate == null || s.EndDate >= today),
                TotalInvoiced = await _context.Invoices.SumAsync(i => (decimal?)i.Total) ?? 0,
                TotalCollected = await _context.Invoices.SumAsync(i => (decimal?)i.AmountPaid) ?? 0,
                PlanBreakdown = subscriptions
                    .GroupBy(s => s.Plan.ToString())
                    .ToDictionary(g => g.Key, g => g.Count())
            };

            overview.RecentTenants = await MapTenantsAsync(
                _context.Tenants.AsNoTracking()
                    .OrderByDescending(t => t.CreatedAt)
                    .Take(5));
            overview.RecentUsers = await MapUsersAsync(
                _context.Users.AsNoTracking()
                    .Include(u => u.Tenant)
                    .OrderByDescending(u => u.CreatedAt)
                    .Take(5),
                currentUserId);
            overview.RecentActivity = await _context.AuditLogs.AsNoTracking()
                .Include(a => a.Tenant)
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new PlatformActivityDto
                {
                    Id = a.Id,
                    TenantName = a.Tenant == null ? null : a.Tenant.Name,
                    UserName = a.User == null
                        ? null
                        : (a.User.FirstName + " " + a.User.LastName),
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityLabel = a.EntityLabel,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return ServiceResult<PlatformOverviewDto>.SuccessResult(overview);
        }

        public async Task<ServiceResult<PagedResponseDto<PlatformTenantDto>>> GetTenantsAsync(
            PlatformTenantFilterDto filter, PaginationDto pagination)
        {
            var query = _context.Tenants.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(t =>
                    t.Name.ToLower().Contains(term) ||
                    (t.Subdomain != null && t.Subdomain.ToLower().Contains(term)));
            }
            if (!string.IsNullOrWhiteSpace(filter.Status))
            {
                if (string.Equals(filter.Status, "Active", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(t => t.IsActive);
                else if (string.Equals(filter.Status, "Suspended", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(t => !t.IsActive);
            }

            var total = await query.CountAsync();
            var page = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();
            var data = await MapTenantsAsync(page);

            return ServiceResult<PagedResponseDto<PlatformTenantDto>>.SuccessResult(
                new PagedResponseDto<PlatformTenantDto>
                {
                    Data = data,
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = new
                    {
                        total,
                        active = await _context.Tenants.CountAsync(t => t.IsActive),
                        suspended = await _context.Tenants.CountAsync(t => !t.IsActive)
                    }
                });
        }

        public async Task<ServiceResult<PagedResponseDto<PlatformUserDto>>> GetUsersAsync(
            PlatformUserFilterDto filter, PaginationDto pagination)
        {
            var query = _context.Users.AsNoTracking()
                .Include(u => u.Tenant)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(u =>
                    (u.Email != null && u.Email.ToLower().Contains(term)) ||
                    u.FirstName.ToLower().Contains(term) ||
                    u.LastName.ToLower().Contains(term));
            }
            if (filter.TenantId.HasValue)
                query = query.Where(u => u.TenantId == filter.TenantId.Value);
            if (!string.IsNullOrWhiteSpace(filter.Role))
                query = query.Where(u => u.Role == filter.Role);
            if (filter.IsActive.HasValue)
                query = query.Where(u => u.IsActive == filter.IsActive.Value);

            var total = await query.CountAsync();
            var page = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<PlatformUserDto>>.SuccessResult(
                new PagedResponseDto<PlatformUserDto>
                {
                    Data = page.Select(u => MapUser(u, GetCurrentUserId())).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = new
                    {
                        total,
                        active = await _context.Users.CountAsync(u => u.IsActive),
                        owners = await _context.Users.CountAsync(u => u.Role == RoleEnum.SysAdmin.ToString())
                    }
                });
        }

        public async Task<ServiceResult<bool>> SetTenantStatusAsync(Guid tenantId, bool isActive)
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant == null)
                return ServiceResult<bool>.Failure("Tenant not found.");
            if (!isActive && tenantId == GetCurrentTenantId())
                return ServiceResult<bool>.Failure(
                    "You cannot suspend the workspace you are currently using. Switch workspace first.");

            tenant.IsActive = isActive;
            tenant.UpdatedAt = DateTime.UtcNow;
            AddAudit(
                tenant.Id,
                isActive ? "Activated" : "Suspended",
                nameof(Tenant),
                tenant.Id,
                tenant.Name);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<bool>> SetUserStatusAsync(Guid userId, bool isActive)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return ServiceResult<bool>.Failure("User not found.");
            if (!isActive && userId == GetCurrentUserId())
                return ServiceResult<bool>.Failure("You cannot deactivate your own account.");

            if (!isActive && user.Role == RoleEnum.SysAdmin.ToString())
            {
                var activeOwners = await _context.Users.CountAsync(u =>
                    u.Role == RoleEnum.SysAdmin.ToString() && u.IsActive && u.Id != userId);
                if (activeOwners == 0)
                    return ServiceResult<bool>.Failure(
                        "The last active platform owner cannot be deactivated.");
            }

            user.IsActive = isActive;
            AddAudit(
                user.TenantId ?? GetCurrentTenantId() ?? Guid.Empty,
                isActive ? "Activated" : "Deactivated",
                "User",
                user.Id,
                $"{user.FirstName} {user.LastName}".Trim());
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<bool>> SetUserRoleAsync(Guid userId, string role)
        {
            if (!Enum.TryParse<RoleEnum>(role, true, out var parsed) ||
                parsed == RoleEnum.SysAdmin)
                return ServiceResult<bool>.Failure(
                    "Choose Admin, Editor or Watcher. Platform owner roles cannot be changed here.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return ServiceResult<bool>.Failure("User not found.");
            if (user.Role == RoleEnum.SysAdmin.ToString())
                return ServiceResult<bool>.Failure("The platform owner role is protected.");

            user.Role = parsed.ToString();
            AddAudit(
                user.TenantId ?? GetCurrentTenantId() ?? Guid.Empty,
                "RoleChanged",
                "User",
                user.Id,
                $"{user.FirstName} {user.LastName}".Trim(),
                JsonSerializer.Serialize(new { role = parsed.ToString() }));
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        private async Task<List<PlatformTenantDto>> MapTenantsAsync(IEnumerable<Tenant> query)
        {
            var tenants = query.ToList();
            var ids = tenants.Select(t => t.Id).ToList();
            var currentTenantId = GetCurrentTenantId();

            var userCounts = await _context.Users
                .Where(u => ids.Contains(u.TenantId ?? Guid.Empty))
                .GroupBy(u => u.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TenantId, x => x.Count);
            var invoiceCounts = await _context.Invoices
                .Where(i => ids.Contains(i.TenantId))
                .GroupBy(i => i.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TenantId, x => x.Count);
            var customerCounts = await _context.Customers
                .Where(c => ids.Contains(c.TenantId) && !c.IsDeleted)
                .GroupBy(c => c.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TenantId, x => x.Count);
            var itemCounts = await _context.Items
                .Where(i => ids.Contains(i.TenantId) && !i.IsDeleted)
                .GroupBy(i => i.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TenantId, x => x.Count);
            var subscriptions = await _context.Subscriptions
                .Where(s => ids.Contains(s.TenantId))
                .ToDictionaryAsync(s => s.TenantId);
            var lastActivity = await _context.AuditLogs
                .Where(a => ids.Contains(a.TenantId))
                .GroupBy(a => a.TenantId)
                .Select(g => new { TenantId = g.Key, Last = g.Max(a => a.CreatedAt) })
                .ToDictionaryAsync(x => x.TenantId, x => x.Last);

            return tenants.Select(t =>
            {
                subscriptions.TryGetValue(t.Id, out var subscription);
                return new PlatformTenantDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Subdomain = t.Subdomain,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    UserCount = userCounts.GetValueOrDefault(t.Id),
                    InvoiceCount = invoiceCounts.GetValueOrDefault(t.Id),
                    CustomerCount = customerCounts.GetValueOrDefault(t.Id),
                    ItemCount = itemCounts.GetValueOrDefault(t.Id),
                    Plan = subscription?.Plan.ToString(),
                    SubscriptionEndsAt = subscription?.EndDate,
                    LastActivityAt = lastActivity.GetValueOrDefault(t.Id),
                    IsCurrent = t.Id == currentTenantId
                };
            }).ToList();
        }

        private async Task<List<PlatformUserDto>> MapUsersAsync(
            IQueryable<ApplicationUser> query, Guid? currentUserId)
        {
            var users = await query.ToListAsync();
            return users.Select(u => MapUser(u, currentUserId)).ToList();
        }

        private static PlatformUserDto MapUser(ApplicationUser user, Guid? currentUserId) => new()
        {
            Id = user.Id,
            FullName = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            TenantId = user.TenantId,
            TenantName = user.Tenant?.Name,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            LastSeenAt = user.LastSeenAt,
            IsOwner = string.Equals(user.Role, RoleEnum.SysAdmin.ToString(), StringComparison.OrdinalIgnoreCase),
            IsCurrent = user.Id == currentUserId
        };

        private void AddAudit(
            Guid tenantId,
            string action,
            string entityType,
            Guid entityId,
            string? entityLabel,
            string? changes = null)
        {
            if (tenantId == Guid.Empty) return;

            _context.AuditLogs.Add(new AuditLog
            {
                TenantId = tenantId,
                UserId = GetCurrentUserId(),
                Action = action,
                EntityType = entityType,
                EntityId = entityId.ToString(),
                EntityLabel = entityLabel,
                Changes = changes,
                IpAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString()
            });
        }

        private Guid? GetCurrentUserId()
        {
            var raw = UserHelper.GetUserId();
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        private Guid? GetCurrentTenantId() =>
            (_httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant)?.Id;
    }
}
