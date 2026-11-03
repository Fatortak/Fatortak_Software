using fatortak.Common.Enum;
using fatortak.Dtos.Platform;
using fatortak.Dtos.Shared;
using fatortak.Services.PlatformService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/platform")]
    [ApiController]
    [Authorize(Roles = nameof(RoleEnum.SysAdmin))]
    public class PlatformController : ControllerBase
    {
        private readonly IPlatformService _service;

        public PlatformController(IPlatformService service)
        {
            _service = service;
        }

        [HttpGet("overview")]
        public async Task<ActionResult<ServiceResult<PlatformOverviewDto>>> Overview()
        {
            var result = await _service.GetOverviewAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("tenants")]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<PlatformTenantDto>>>> Tenants(
            [FromQuery] PlatformTenantFilterDto filter,
            [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetTenantsAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("users")]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<PlatformUserDto>>>> Users(
            [FromQuery] PlatformUserFilterDto filter,
            [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetUsersAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("tenants/{tenantId}/status")]
        public async Task<ActionResult<ServiceResult<bool>>> TenantStatus(
            Guid tenantId, [FromBody] PlatformStatusDto dto)
        {
            var result = await _service.SetTenantStatusAsync(tenantId, dto.IsActive);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("users/{userId}/status")]
        public async Task<ActionResult<ServiceResult<bool>>> UserStatus(
            Guid userId, [FromBody] PlatformStatusDto dto)
        {
            var result = await _service.SetUserStatusAsync(userId, dto.IsActive);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("users/{userId}/role")]
        public async Task<ActionResult<ServiceResult<bool>>> UserRole(
            Guid userId, [FromBody] PlatformRoleDto dto)
        {
            var result = await _service.SetUserRoleAsync(userId, dto.Role);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
