using fatortak.Dtos.Sessions;
using fatortak.Dtos.Shared;
using fatortak.Helpers;
using fatortak.Services.SessionService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/sessions")]
    [ApiController]
    [Authorize]
    public class SessionsController : ControllerBase
    {
        private readonly ISessionService _service;

        public SessionsController(ISessionService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<List<UserSessionDto>>>> Get()
        {
            var userId = GetUserId();
            if (!userId.HasValue)
                return Unauthorized(ServiceResult<List<UserSessionDto>>.Failure("Invalid user."));

            var result = await _service.GetAsync(userId.Value);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{sessionId}/revoke")]
        public async Task<ActionResult<ServiceResult<bool>>> Revoke(Guid sessionId)
        {
            var userId = GetUserId();
            if (!userId.HasValue)
                return Unauthorized(ServiceResult<bool>.Failure("Invalid user."));

            var result = await _service.RevokeAsync(userId.Value, sessionId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("revoke-others")]
        public async Task<ActionResult<ServiceResult<int>>> RevokeOthers()
        {
            var userId = GetUserId();
            if (!userId.HasValue)
                return Unauthorized(ServiceResult<int>.Failure("Invalid user."));

            var result = await _service.RevokeOthersAsync(userId.Value);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        private static Guid? GetUserId()
        {
            var raw = UserHelper.GetUserId();
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
