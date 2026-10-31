using fatortak.Dtos.Procurement;
using fatortak.Dtos.Shared;
using fatortak.Services.Procurement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/purchaseorders")]
    [ApiController]
    [Authorize]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly IPurchaseOrderService _service;

        public PurchaseOrdersController(IPurchaseOrderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<PurchaseOrderDto>>>> Get(
            [FromQuery] PurchaseOrderFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<PurchaseOrderDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<PurchaseOrderDto>>> Create(
            [FromBody] PurchaseOrderCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("update/{id}")]
        public async Task<ActionResult<ServiceResult<PurchaseOrderDto>>> Update(
            Guid id, [FromBody] PurchaseOrderUpdateDto dto)
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
        public async Task<ActionResult<ServiceResult<PurchaseOrderDto>>> Status(
            Guid id, [FromBody] UpdatePurchaseOrderStatusDto dto)
        {
            var result = await _service.UpdateStatusAsync(id, dto.Status);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }

    public class UpdatePurchaseOrderStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
