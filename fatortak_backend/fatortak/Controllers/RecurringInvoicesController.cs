using fatortak.Dtos.RecurringInvoice;
using fatortak.Dtos.Shared;
using fatortak.Services.RecurringInvoiceService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/recurringinvoices")]
    [ApiController]
    [Authorize]
    public class RecurringInvoicesController : ControllerBase
    {
        private readonly IRecurringInvoiceService _service;

        public RecurringInvoicesController(IRecurringInvoiceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<RecurringInvoiceDto>>>> Get(
            [FromQuery] RecurringInvoiceFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<RecurringInvoiceDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<RecurringInvoiceDto>>> Create(
            [FromBody] RecurringInvoiceCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("update/{id}")]
        public async Task<ActionResult<ServiceResult<RecurringInvoiceDto>>> Update(
            Guid id, [FromBody] RecurringInvoiceUpdateDto dto)
        {
            var result = await _service.UpdateAsync(id, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("delete/{id}")]
        public async Task<ActionResult<ServiceResult<bool>>> Delete(Guid id)
        {
            var result = await _service.DeleteAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/status")]
        public async Task<ActionResult<ServiceResult<RecurringInvoiceDto>>> Status(
            Guid id, [FromBody] UpdateRecurringInvoiceStatusDto dto)
        {
            var result = await _service.UpdateStatusAsync(id, dto.Status);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/run-now")]
        public async Task<ActionResult<ServiceResult<RecurringInvoiceDto>>> RunNow(Guid id)
        {
            var result = await _service.RunNowAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }

    public class UpdateRecurringInvoiceStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
