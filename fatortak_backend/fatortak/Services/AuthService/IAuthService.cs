using fatortak.Dtos.Auth;
using fatortak.Dtos.Platform;
using fatortak.Dtos.Shared;

namespace fatortak.Services.AuthService
{
    public interface IAuthService
    {
        Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterDto dto);
        Task<ServiceResult<SubdomainAvailabilityDto>> CheckSubdomainAsync(string value);
        Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginDto dto);
        Task<ServiceResult<AuthResponseDto>> SwitchTenantAsync(Guid userId, Guid tenantId);
        Task<ServiceResult<AuthResponseDto>> GetSessionAsync(Guid userId);

        Task<ServiceResult<string>> ForgetPasswordRequestAsync(string email);
        Task<ServiceResult<string>> SetNewPassword(string userId ,string token, string NewPassword);
    }
}
