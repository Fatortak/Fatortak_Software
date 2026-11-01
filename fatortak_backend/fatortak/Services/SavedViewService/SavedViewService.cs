using fatortak.Context;
using fatortak.Dtos.SavedViews;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.SavedViewService
{
    public interface ISavedViewService
    {
        Task<ServiceResult<List<SavedViewDto>>> GetAsync(string pageKey);
        Task<ServiceResult<SavedViewDto>> CreateAsync(SavedViewCreateDto dto);
        Task<ServiceResult<SavedViewDto>> UpdateAsync(Guid id, SavedViewUpdateDto dto);
        Task<ServiceResult<bool>> DeleteAsync(Guid id);
    }

    public class SavedViewService : ISavedViewService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public SavedViewService(
            ApplicationDbContext context,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult<List<SavedViewDto>>> GetAsync(string pageKey)
        {
            var userId = GetUserId();
            if (!userId.HasValue)
                return ServiceResult<List<SavedViewDto>>.Failure("Invalid user.");

            var views = await _context.SavedViews
                .Include(v => v.User)
                .Where(v => v.TenantId == TenantId &&
                            v.PageKey == pageKey &&
                            (v.UserId == userId.Value || v.IsShared))
                .OrderByDescending(v => v.IsShared)
                .ThenBy(v => v.Name)
                .Select(v => new SavedViewDto
                {
                    Id = v.Id,
                    UserId = v.UserId,
                    PageKey = v.PageKey,
                    Name = v.Name,
                    QueryJson = v.QueryJson,
                    IsShared = v.IsShared,
                    IsOwner = v.UserId == userId.Value,
                    UserName = v.User == null ? null : (v.User.FirstName + " " + v.User.LastName),
                    CreatedAt = v.CreatedAt,
                    UpdatedAt = v.UpdatedAt
                })
                .ToListAsync();

            return ServiceResult<List<SavedViewDto>>.SuccessResult(views);
        }

        public async Task<ServiceResult<SavedViewDto>> CreateAsync(SavedViewCreateDto dto)
        {
            var userId = GetUserId();
            if (!userId.HasValue)
                return ServiceResult<SavedViewDto>.Failure("Invalid user.");
            if (string.IsNullOrWhiteSpace(dto.PageKey))
                return ServiceResult<SavedViewDto>.Failure("Page key is required.");
            if (string.IsNullOrWhiteSpace(dto.Name))
                return ServiceResult<SavedViewDto>.Failure("View name is required.");

            var count = await _context.SavedViews.CountAsync(v =>
                v.TenantId == TenantId && v.UserId == userId.Value);
            if (count >= 50)
                return ServiceResult<SavedViewDto>.Failure("You can save up to 50 views per account.");

            var view = new SavedView
            {
                TenantId = TenantId,
                UserId = userId.Value,
                PageKey = dto.PageKey.Trim(),
                Name = dto.Name.Trim(),
                QueryJson = string.IsNullOrWhiteSpace(dto.QueryJson) ? "{}" : dto.QueryJson,
                IsShared = dto.IsShared
            };
            _context.SavedViews.Add(view);
            await _context.SaveChangesAsync();

            return ServiceResult<SavedViewDto>.SuccessResult(Map(view, userId.Value));
        }

        public async Task<ServiceResult<SavedViewDto>> UpdateAsync(Guid id, SavedViewUpdateDto dto)
        {
            var userId = GetUserId();
            var view = await _context.SavedViews
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == TenantId);
            if (view == null)
                return ServiceResult<SavedViewDto>.Failure("Saved view not found.");
            if (view.UserId != userId)
                return ServiceResult<SavedViewDto>.Failure("Only the owner can change this view.");
            if (string.IsNullOrWhiteSpace(dto.Name))
                return ServiceResult<SavedViewDto>.Failure("View name is required.");

            view.Name = dto.Name.Trim();
            view.QueryJson = string.IsNullOrWhiteSpace(dto.QueryJson) ? "{}" : dto.QueryJson;
            view.IsShared = dto.IsShared;
            view.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return ServiceResult<SavedViewDto>.SuccessResult(Map(view, userId));
        }

        public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
        {
            var userId = GetUserId();
            var view = await _context.SavedViews
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == TenantId);
            if (view == null)
                return ServiceResult<bool>.Failure("Saved view not found.");
            if (view.UserId != userId)
                return ServiceResult<bool>.Failure("Only the owner can delete this view.");

            _context.SavedViews.Remove(view);
            await _context.SaveChangesAsync();
            return ServiceResult<bool>.SuccessResult(true);
        }

        private static SavedViewDto Map(SavedView view, Guid? currentUserId) => new()
        {
            Id = view.Id,
            UserId = view.UserId,
            PageKey = view.PageKey,
            Name = view.Name,
            QueryJson = view.QueryJson,
            IsShared = view.IsShared,
            IsOwner = view.UserId == currentUserId,
            CreatedAt = view.CreatedAt,
            UpdatedAt = view.UpdatedAt
        };

        private Guid? GetUserId()
        {
            var raw = UserHelper.GetUserId();
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        private Guid TenantId =>
            (_httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant)?.Id ?? Guid.Empty;
    }
}
