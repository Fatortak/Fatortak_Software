using fatortak.Context;
using fatortak.Dtos.Sessions;
using fatortak.Dtos.Shared;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.SessionService
{
    public interface ISessionService
    {
        Task<ServiceResult<List<UserSessionDto>>> GetAsync(Guid userId);
        Task<ServiceResult<bool>> RevokeAsync(Guid userId, Guid sessionId);
        Task<ServiceResult<int>> RevokeOthersAsync(Guid userId);
    }

    public class SessionService : ISessionService
    {
        private readonly ApplicationDbContext _context;

        public SessionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<List<UserSessionDto>>> GetAsync(Guid userId)
        {
            var currentId = GetCurrentSessionId();
            var now = DateTime.UtcNow;
            var sessions = await _context.UserSessions
                .Include(s => s.Tenant)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.RevokedAt == null && s.ExpiresAt > now)
                .ThenByDescending(s => s.LastSeenAt)
                .Take(100)
                .Select(s => new UserSessionDto
                {
                    Id = s.Id,
                    IpAddress = s.IpAddress,
                    UserAgent = s.UserAgent,
                    DeviceLabel = DescribeAgent(s.UserAgent),
                    CreatedAt = s.CreatedAt,
                    LastSeenAt = s.LastSeenAt,
                    ExpiresAt = s.ExpiresAt,
                    RevokedAt = s.RevokedAt,
                    IsActive = s.RevokedAt == null && s.ExpiresAt > now,
                    IsCurrent = s.Id == currentId,
                    TenantName = s.Tenant == null ? null : s.Tenant.Name
                })
                .ToListAsync();

            return ServiceResult<List<UserSessionDto>>.SuccessResult(sessions);
        }

        public async Task<ServiceResult<bool>> RevokeAsync(Guid userId, Guid sessionId)
        {
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            if (session == null)
                return ServiceResult<bool>.Failure("Session not found.");
            if (session.RevokedAt != null)
                return ServiceResult<bool>.SuccessResult(true);

            session.RevokedAt = DateTime.UtcNow;
            session.RevokedByUserId = userId;
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        public async Task<ServiceResult<int>> RevokeOthersAsync(Guid userId)
        {
            var currentId = GetCurrentSessionId();
            var now = DateTime.UtcNow;
            var sessions = await _context.UserSessions
                .Where(s => s.UserId == userId &&
                            s.RevokedAt == null &&
                            s.ExpiresAt > now &&
                            (!currentId.HasValue || s.Id != currentId.Value))
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.RevokedAt = now;
                session.RevokedByUserId = userId;
            }

            await _context.SaveChangesAsync();
            return ServiceResult<int>.SuccessResult(sessions.Count);
        }

        private static Guid? GetCurrentSessionId()
        {
            var raw = UserHelper.GetSessionId();
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        private static string DescribeAgent(string? agent)
        {
            if (string.IsNullOrWhiteSpace(agent)) return "Unknown device";

            var browser = agent.Contains("Edg", StringComparison.OrdinalIgnoreCase)
                ? "Edge"
                : agent.Contains("Chrome", StringComparison.OrdinalIgnoreCase)
                    ? "Chrome"
                    : agent.Contains("Firefox", StringComparison.OrdinalIgnoreCase)
                        ? "Firefox"
                        : agent.Contains("Safari", StringComparison.OrdinalIgnoreCase)
                            ? "Safari"
                            : "Browser";
            var platform = agent.Contains("Windows", StringComparison.OrdinalIgnoreCase)
                ? "Windows"
                : agent.Contains("Android", StringComparison.OrdinalIgnoreCase)
                    ? "Android"
                    : agent.Contains("iPhone", StringComparison.OrdinalIgnoreCase)
                        ? "iPhone"
                        : agent.Contains("Mac", StringComparison.OrdinalIgnoreCase)
                            ? "macOS"
                            : agent.Contains("Linux", StringComparison.OrdinalIgnoreCase)
                                ? "Linux"
                                : null;

            return platform == null ? browser : $"{browser} on {platform}";
        }
    }
}
