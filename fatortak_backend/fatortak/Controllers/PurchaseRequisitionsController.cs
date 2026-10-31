using fatortak.Dtos.PurchaseRequisition;
using fatortak.Dtos.Shared;
using fatortak.Services.PurchaseRequisitionService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PurchaseRequisitionsController : ControllerBase
    {
        private readonly IPurchaseRequisitionService _service;

        public PurchaseRequisitionsController(IPurchaseRequisitionService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<PurchaseRequisitionDto>>>> Get(
            [FromQuery] PurchaseRequisitionFilterDto filter,
            [FromQuery] PaginationDto pagination)
        {
            var result = await _service.GetAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceResult<PurchaseRequisitionDto>>> Get(Guid id)
        {
            var result = await _service.GetAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<PurchaseRequisitionDto>>> Create(
            [FromBody] PurchaseRequisitionCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result);
        }

        [HttpPost("update/{id}")]
        public async Task<ActionResult<ServiceResult<PurchaseRequisitionDto>>> Update(
            Guid id, [FromBody] PurchaseRequisitionUpdateDto dto)
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
        public async Task<ActionResult<ServiceResult<PurchaseRequisitionDto>>> Status(
            Guid id, [FromBody] UpdateRequisitionStatusDto dto)
        {
            var result = await _service.UpdateStatusAsync(id, dto.Status);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }

    public class UpdateRequisitionStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
