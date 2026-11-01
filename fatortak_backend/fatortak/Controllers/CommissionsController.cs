using fatortak.Dtos.Commission;
using fatortak.Dtos.Shared;
using fatortak.Services.CommissionService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/commissions")]
    [ApiController]
    [Authorize]
    public class CommissionsController : ControllerBase
    {
        private readonly ICommissionService _service;

        public CommissionsController(ICommissionService service)
        {
            _service = service;
        }

        [HttpGet("rules")]
        public async Task<ActionResult<ServiceResult<List<CommissionRuleDto>>>> Rules()
        {
            var result = await _service.GetRulesAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("rules")]
        public async Task<ActionResult<ServiceResult<CommissionRuleDto>>> CreateRule(
            [FromBody] CommissionRuleCreateDto dto)
        {
            var result = await _service.CreateRuleAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("rules/update/{id}")]
        public async Task<ActionResult<ServiceResult<CommissionRuleDto>>> UpdateRule(
            Guid id, [FromBody] CommissionRuleUpdateDto dto)
        {
            var result = await _service.UpdateRuleAsync(id, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("rules/delete/{id}")]
        public async Task<ActionResult<ServiceResult<bool>>> DeleteRule(Guid id)
        {
            var result = await _service.DeleteRuleAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<SalesCommissionDto>>>> Get(
            [FromQuery] CommissionFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetCommissionsAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("generate")]
        public async Task<ActionResult<ServiceResult<SalesCommissionDto>>> Generate(
            [FromBody] GenerateCommissionDto dto)
        {
            var result = await _service.GenerateAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/approve")]
        public async Task<ActionResult<ServiceResult<SalesCommissionDto>>> Approve(Guid id)
        {
            var result = await _service.ApproveAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/pay")]
        public async Task<ActionResult<ServiceResult<SalesCommissionDto>>> Pay(Guid id)
        {
            var result = await _service.PayAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<ActionResult<ServiceResult<SalesCommissionDto>>> Cancel(Guid id)
        {
            var result = await _service.CancelAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
