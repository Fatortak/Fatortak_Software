using fatortak.Dtos.Audit;
using fatortak.Dtos.Shared;
using fatortak.Services.AuditService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/audit")]
    [ApiController]
    [Authorize]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _service;

        public AuditController(IAuditService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<AuditLogDto>>>> Get(
            [FromQuery] AuditLogFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
