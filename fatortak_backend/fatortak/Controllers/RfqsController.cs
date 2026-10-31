using fatortak.Dtos.Procurement;
using fatortak.Dtos.Shared;
using fatortak.Services.Procurement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/rfqs")]
    [ApiController]
    [Authorize]
    public class RfqsController : ControllerBase
    {
        private readonly IRfqService _service;

        public RfqsController(IRfqService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<RfqDto>>>> Get(
            [FromQuery] RfqFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<RfqDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<RfqDto>>> Create([FromBody] RfqCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("update/{id}")]
        public async Task<ActionResult<ServiceResult<RfqDto>>> Update(Guid id, [FromBody] RfqUpdateDto dto)
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
        public async Task<ActionResult<ServiceResult<RfqDto>>> Status(Guid id, [FromBody] UpdateRfqStatusDto dto)
        {
            var result = await _service.UpdateStatusAsync(id, dto.Status);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/suppliers/{supplierId}/quote")]
        public async Task<ActionResult<ServiceResult<RfqDto>>> Quote(
            Guid id, Guid supplierId, [FromBody] RfqSupplierQuoteDto dto)
        {
            var result = await _service.RecordQuoteAsync(id, supplierId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/award/{supplierId}")]
        public async Task<ActionResult<ServiceResult<RfqDto>>> Award(
            Guid id, Guid supplierId, [FromBody] AwardRfqDto dto)
        {
            var result = await _service.AwardAsync(id, supplierId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }

    public class UpdateRfqStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
