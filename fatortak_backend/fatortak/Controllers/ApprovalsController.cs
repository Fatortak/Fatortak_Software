using fatortak.Dtos.Approval;
using fatortak.Dtos.Shared;
using fatortak.Services.ApprovalService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/approvals")]
    [ApiController]
    [Authorize]
    public class ApprovalsController : ControllerBase
    {
        private readonly IApprovalService _service;

        public ApprovalsController(IApprovalService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<ApprovalRequestDto>>>> Get(
            [FromQuery] ApprovalRequestFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<ApprovalRequestDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("candidates")]
        public async Task<ActionResult<ServiceResult<List<ApprovalCandidateDto>>>> Candidates(
            [FromQuery] string documentType)
        {
            var result = await _service.GetCandidatesAsync(documentType);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<ApprovalRequestDto>>> Create(
            [FromBody] ApprovalRequestCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("{id}/approve")]
        public async Task<ActionResult<ServiceResult<ApprovalRequestDto>>> Approve(
            Guid id, [FromBody] ApprovalDecisionDto dto)
        {
            var result = await _service.ApproveAsync(id, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/reject")]
        public async Task<ActionResult<ServiceResult<ApprovalRequestDto>>> Reject(
            Guid id, [FromBody] ApprovalDecisionDto dto)
        {
            var result = await _service.RejectAsync(id, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<ActionResult<ServiceResult<ApprovalRequestDto>>> Cancel(Guid id)
        {
            var result = await _service.CancelAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("policies")]
        public async Task<ActionResult<ServiceResult<List<ApprovalPolicyDto>>>> Policies()
        {
            var result = await _service.GetPoliciesAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("policies")]
        public async Task<ActionResult<ServiceResult<ApprovalPolicyDto>>> SavePolicy(
            [FromBody] ApprovalPolicyUpdateDto dto)
        {
            var result = await _service.SavePolicyAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
