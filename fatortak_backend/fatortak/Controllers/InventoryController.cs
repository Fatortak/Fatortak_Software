using fatortak.Dtos.Inventory;
using fatortak.Dtos.Shared;
using fatortak.Services.InventoryService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/inventory")]
    [ApiController]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _service;

        public InventoryController(IInventoryService service)
        {
            _service = service;
        }

        [HttpGet("valuations")]
        public async Task<ActionResult<ServiceResult<InventoryValuationSummaryDto>>> Valuations()
        {
            var result = await _service.GetValuationAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("adjustments")]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<StockAdjustmentDto>>>> Adjustments(
            [FromQuery] StockAdjustmentFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAdjustmentsAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("adjustments")]
        public async Task<ActionResult<ServiceResult<StockAdjustmentDto>>> CreateAdjustment(
            [FromBody] StockAdjustmentCreateDto dto)
        {
            var result = await _service.CreateAdjustmentAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
