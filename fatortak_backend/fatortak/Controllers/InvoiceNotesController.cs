using fatortak.Dtos.Invoice;
using fatortak.Dtos.Shared;
using fatortak.Services.InvoiceNoteService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/invoicenotes")]
    [ApiController]
    [Authorize]
    public class InvoiceNotesController : ControllerBase
    {
        private readonly IInvoiceNoteService _service;

        public InvoiceNotesController(IInvoiceNoteService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<InvoiceNoteDto>>>> Get(
            [FromQuery] InvoiceNoteFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<InvoiceNoteDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<InvoiceNoteDto>>> Create(
            [FromBody] InvoiceNoteCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("update/{id}")]
        public async Task<ActionResult<ServiceResult<InvoiceNoteDto>>> Update(
            Guid id, [FromBody] InvoiceNoteUpdateDto dto)
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

        [HttpPost("{id}/post")]
        public async Task<ActionResult<ServiceResult<InvoiceNoteDto>>> Post(Guid id)
        {
            var result = await _service.PostAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<ActionResult<ServiceResult<InvoiceNoteDto>>> Cancel(Guid id)
        {
            var result = await _service.CancelAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
