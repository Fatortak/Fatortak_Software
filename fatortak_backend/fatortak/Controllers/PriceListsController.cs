using fatortak.Dtos.Pricing;
using fatortak.Dtos.Shared;
using fatortak.Services.PricingService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/pricelists")]
    [ApiController]
    [Authorize]
    public class PriceListsController : ControllerBase
    {
        private readonly IPricingService _service;

        public PriceListsController(IPricingService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<PriceListDto>>>> Get(
            [FromQuery] PriceListFilterDto filter, [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<PriceListDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<PriceListDto>>> Create(
            [FromBody] PriceListCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("update/{id}")]
        public async Task<ActionResult<ServiceResult<PriceListDto>>> Update(
            Guid id, [FromBody] PriceListUpdateDto dto)
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

        [HttpPost("{id}/customers")]
        public async Task<ActionResult<ServiceResult<PriceListDto>>> Assign(
            Guid id, [FromBody] AssignPriceListDto dto)
        {
            var result = await _service.AssignCustomerAsync(id, dto.CustomerId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/customers/{customerId}/remove")]
        public async Task<ActionResult<ServiceResult<PriceListDto>>> Unassign(Guid id, Guid customerId)
        {
            var result = await _service.UnassignCustomerAsync(id, customerId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("resolve")]
        public async Task<ActionResult<ServiceResult<ResolvePriceDto>>> Resolve(
            [FromQuery] Guid customerId, [FromQuery] Guid itemId, [FromQuery] int quantity = 1)
        {
            var result = await _service.ResolveAsync(customerId, itemId, quantity);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
