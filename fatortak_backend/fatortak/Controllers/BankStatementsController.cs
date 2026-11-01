using fatortak.Dtos.BankReconciliation;
using fatortak.Dtos.Shared;
using fatortak.Services.BankReconciliationService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/bankstatements")]
    [ApiController]
    [Authorize]
    public class BankStatementsController : ControllerBase
    {
        private readonly IBankReconciliationService _service;

        public BankStatementsController(IBankReconciliationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<BankStatementDto>>>> Get(
            [FromQuery] BankStatementFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<BankStatementDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost("import")]
        public async Task<ActionResult<ServiceResult<BankStatementDto>>> Import(
            [FromBody] BankStatementImportDto dto)
        {
            var result = await _service.ImportAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("{statementId}/lines/{lineId}/match")]
        public async Task<ActionResult<ServiceResult<BankStatementDto>>> Match(
            Guid statementId, Guid lineId, [FromBody] MatchBankLineDto dto)
        {
            var result = await _service.MatchAsync(statementId, lineId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{statementId}/lines/{lineId}/unmatch")]
        public async Task<ActionResult<ServiceResult<BankStatementDto>>> Unmatch(
            Guid statementId, Guid lineId)
        {
            var result = await _service.UnmatchAsync(statementId, lineId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{statementId}/lines/{lineId}/ignore")]
        public async Task<ActionResult<ServiceResult<BankStatementDto>>> Ignore(
            Guid statementId, Guid lineId)
        {
            var result = await _service.ToggleIgnoreAsync(statementId, lineId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{statementId}/lines/{lineId}/adjustment")]
        public async Task<ActionResult<ServiceResult<BankStatementDto>>> Adjustment(
            Guid statementId, Guid lineId)
        {
            var result = await _service.AddAdjustmentAsync(statementId, lineId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{statementId}/reconcile")]
        public async Task<ActionResult<ServiceResult<BankStatementDto>>> Reconcile(Guid statementId)
        {
            var result = await _service.ReconcileAsync(statementId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("delete/{statementId}")]
        public async Task<ActionResult<ServiceResult<bool>>> Delete(Guid statementId)
        {
            var result = await _service.DeleteAsync(statementId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{statementId}/lines/{lineId}/candidates")]
        public async Task<ActionResult<ServiceResult<List<BankTransactionCandidateDto>>>> Candidates(
            Guid statementId, Guid lineId)
        {
            var result = await _service.GetCandidatesAsync(statementId, lineId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
