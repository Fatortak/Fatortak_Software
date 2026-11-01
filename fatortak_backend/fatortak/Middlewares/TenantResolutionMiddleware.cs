using fatortak.Common.Enum;
using fatortak.Context;
using fatortak.Entities;
using fatortak.Services.Deployment;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace fatortak.Middlewares
{
    /// <summary>
    /// Resolves the tenant for authenticated requests only.
    ///
    /// Security rules:
    /// - An unauthenticated request never receives a tenant.
    /// - A tenant is selected from the JWT claim or a host subdomain, but only
    ///   after the user has been loaded and validated.
    /// - A non-SysAdmin can only access the tenant they belong to.
    /// - The host header can select a tenant for a SysAdmin, or confirm the
    ///   user's own tenant for everyone else. It can never grant access by itself.
    /// </summary>
    public class TenantResolutionMiddleware
    {
        private static readonly ConcurrentDictionary<Guid, DateTime> LastSeenTouch = new();
        private readonly RequestDelegate _next;

        public TenantResolutionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(
            HttpContext context,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext dbContext,
            IDeploymentMode deployment)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                await _next(context);
                return;
            }

            var userIdClaim = context.User.FindFirst("UserId")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                await RejectAsync(context, StatusCodes.Status401Unauthorized, "Invalid authentication token.");
                return;
            }

            var user = await userManager.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            if (user == null)
            {
                await RejectAsync(context, StatusCodes.Status401Unauthorized, "User is not active.");
                return;
            }

            var now = DateTime.UtcNow;
            var sessionClaim = context.User.FindFirst("session_id")?.Value;
            if (Guid.TryParse(sessionClaim, out var sessionId))
            {
                var activeSession = await dbContext.UserSessions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == sessionId &&
                                              s.UserId == userId &&
                                              s.RevokedAt == null &&
                                              s.ExpiresAt > now);
                if (activeSession == null)
                {
                    await RejectAsync(context, StatusCodes.Status401Unauthorized,
                        "This session has expired or been revoked. Sign in again.");
                    return;
                }

                context.Items["CurrentSessionId"] = sessionId;
            }

            if (!LastSeenTouch.TryGetValue(user.Id, out var lastTouch) ||
                now - lastTouch > TimeSpan.FromMinutes(1))
            {
                LastSeenTouch[user.Id] = now;
                await dbContext.Users
                    .Where(u => u.Id == user.Id)
                    .ExecuteUpdateAsync(setters => setters.SetProperty(u => u.LastSeenAt, now));

                if (Guid.TryParse(sessionClaim, out var touchSessionId))
                {
                    await dbContext.UserSessions
                        .Where(s => s.Id == touchSessionId && s.UserId == user.Id)
                        .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.LastSeenAt, now));
                }
            }

            var isSysAdmin = string.Equals(user.Role, RoleEnum.SysAdmin.ToString(), StringComparison.OrdinalIgnoreCase);

            if (deployment.IsSelfHosted)
            {
                var installationTenant = user.TenantId.HasValue
                    ? await dbContext.Tenants.AsNoTracking()
                        .FirstOrDefaultAsync(t => t.Id == user.TenantId.Value)
                    : await dbContext.Tenants.AsNoTracking()
                        .OrderBy(t => t.CreatedAt)
                        .FirstOrDefaultAsync();

                if (installationTenant == null)
                {
                    await RejectAsync(context, StatusCodes.Status503ServiceUnavailable,
                        "The installation has no tenant. Run the initial setup first.");
                    return;
                }

                context.Items["CurrentTenant"] = installationTenant;
                await _next(context);
                return;
            }

            if (user.TenantId == null && !isSysAdmin)
            {
                await RejectAsync(context, StatusCodes.Status403Forbidden, "User has no tenant.");
                return;
            }

            Guid? requestedTenantId = user.TenantId;
            var claimTenantId = context.User.FindFirst("tenant_id")?.Value;
            if (Guid.TryParse(claimTenantId, out var claimTenant))
            {
                requestedTenantId = claimTenant;
            }

            // A tenant subdomain may select the tenant only when it matches the
            // user's own tenant, or when the caller is a SysAdmin.
            var host = context.Request.Host.Host;
            var subdomain = host.Split('.')[0];
            var reservedSubdomains = new[] { "www", "app", "mail", "api", "localhost" };

            if (!string.IsNullOrWhiteSpace(subdomain) &&
                !reservedSubdomains.Contains(subdomain.ToLowerInvariant()) &&
                !System.Net.IPAddress.TryParse(host, out _))
            {
                var hostTenant = await dbContext.Tenants
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Subdomain == subdomain);

                if (hostTenant != null)
                {
                    if (!isSysAdmin && hostTenant.Id != user.TenantId.Value)
                    {
                        await RejectAsync(context, StatusCodes.Status403Forbidden, "Access to tenant denied.");
                        return;
                    }

                    requestedTenantId = hostTenant.Id;
                }
            }

            if (requestedTenantId == null)
            {
                if (isSysAdmin)
                {
                    await _next(context);
                    return;
                }

                await RejectAsync(context, StatusCodes.Status403Forbidden, "Tenant not found.");
                return;
            }

            var tenant = await dbContext.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == requestedTenantId.Value);

            if (tenant == null)
            {
                if (isSysAdmin)
                {
                    await _next(context);
                    return;
                }

                await RejectAsync(context, StatusCodes.Status403Forbidden, "Tenant not found.");
                return;
            }

            if (!tenant.IsActive && !isSysAdmin)
            {
                await RejectAsync(context, StatusCodes.Status403Forbidden, "Tenant is inactive.");
                return;
            }

            if (!isSysAdmin && tenant.Id != user.TenantId.Value)
            {
                await RejectAsync(context, StatusCodes.Status403Forbidden, "Access to tenant denied.");
                return;
            }

            context.Items["CurrentTenant"] = tenant;
            await _next(context);
        }

        private static async Task RejectAsync(HttpContext context, int statusCode, string message)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { success = false, errorMessage = message });
        }
    }
}
