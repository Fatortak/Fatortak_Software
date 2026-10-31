using fatortak.Dtos.Quotation;
using fatortak.Dtos.Shared;
using fatortak.Services.QuotationService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class QuotationsController : ControllerBase
    {
        private readonly IQuotationService _quotationService;
        private readonly ILogger<QuotationsController> _logger;

        public QuotationsController(
            IQuotationService quotationService,
            ILogger<QuotationsController> logger)
        {
            _quotationService = quotationService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<PagedResponseDto<QuotationDto>>>> GetQuotations(
            [FromQuery] QuotationFilterDto filter,
            [FromQuery] PaginationDto pagination)
        {
            var result = await _quotationService.GetQuotationsAsync(filter, pagination);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{quotationId}")]
        public async Task<ActionResult<ServiceResult<QuotationDto>>> GetQuotation(Guid quotationId)
        {
            var result = await _quotationService.GetQuotationAsync(quotationId);
            if (result.Success) return Ok(result);
            return result.ErrorMessage == "Quotation not found" ? NotFound(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<QuotationDto>>> CreateQuotation(
            [FromBody] QuotationCreateDto dto)
        {
            var result = await _quotationService.CreateQuotationAsync(dto);
            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(GetQuotation), new { quotationId = result.Data.Id }, result);
        }

        [HttpPost("update/{quotationId}")]
        public async Task<ActionResult<ServiceResult<QuotationDto>>> UpdateQuotation(
            Guid quotationId, [FromBody] QuotationUpdateDto dto)
        {
            var result = await _quotationService.UpdateQuotationAsync(quotationId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("delete/{quotationId}")]
        public async Task<ActionResult<ServiceResult<bool>>> DeleteQuotation(Guid quotationId)
        {
            var result = await _quotationService.DeleteQuotationAsync(quotationId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{quotationId}/status")]
        public async Task<ActionResult<ServiceResult<QuotationDto>>> UpdateStatus(
            Guid quotationId, [FromBody] UpdateQuotationStatusDto dto)
        {
            var result = await _quotationService.UpdateStatusAsync(quotationId, dto.Status);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{quotationId}/send")]
        public async Task<ActionResult<ServiceResult<bool>>> SendQuotation(Guid quotationId)
        {
            var result = await _quotationService.SendQuotationAsync(quotationId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{quotationId}/duplicate")]
        public async Task<ActionResult<ServiceResult<QuotationDto>>> DuplicateQuotation(Guid quotationId)
        {
            var result = await _quotationService.DuplicateQuotationAsync(quotationId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{quotationId}/convert-to-sales-order")]
        public async Task<ActionResult<ServiceResult<QuotationDto>>> ConvertToSalesOrder(Guid quotationId)
        {
            var result = await _quotationService.ConvertToSalesOrderAsync(quotationId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{quotationId}/convert-to-invoice")]
        public async Task<ActionResult<ServiceResult<ConvertQuotationResultDto>>> ConvertToInvoice(
            Guid quotationId, [FromBody] ConvertQuotationDto dto)
        {
            try
            {
                var result = await _quotationService.ConvertToInvoiceAsync(quotationId, dto);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting quotation {QuotationId}", quotationId);
                return BadRequest(ServiceResult<ConvertQuotationResultDto>.Failure("Failed to convert quotation"));
            }
        }
    }

    public class UpdateQuotationStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
