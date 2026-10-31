using fatortak.Dtos.Procurement;
using fatortak.Dtos.Shared;
using fatortak.Services.Procurement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/goodsreceipts")]
    [ApiController]
    [Authorize]
    public class GoodsReceiptsController : ControllerBase
    {
        private readonly IGoodsReceiptService _service;

        public GoodsReceiptsController(IGoodsReceiptService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<GoodsReceiptDto>>>> Get(
            [FromQuery] GoodsReceiptFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<GoodsReceiptDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<GoodsReceiptDto>>> Create(
            [FromBody] GoodsReceiptCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("update/{id}")]
        public async Task<ActionResult<ServiceResult<GoodsReceiptDto>>> Update(
            Guid id, [FromBody] GoodsReceiptUpdateDto dto)
        {
            var result = await _service.UpdateAsync(id, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/post")]
        public async Task<ActionResult<ServiceResult<GoodsReceiptDto>>> Post(Guid id)
        {
            var result = await _service.PostAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/status")]
        public async Task<ActionResult<ServiceResult<GoodsReceiptDto>>> Status(
            Guid id, [FromBody] UpdateGoodsReceiptStatusDto dto)
        {
            var result = await _service.UpdateStatusAsync(id, dto.Status);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("delete/{id}")]
        public async Task<ActionResult<ServiceResult<bool>>> Delete(Guid id)
        {
            var result = await _service.DeleteAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }

    public class UpdateGoodsReceiptStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
