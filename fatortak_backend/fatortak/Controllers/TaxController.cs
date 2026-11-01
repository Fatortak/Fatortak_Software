using fatortak.Dtos.Shared;
using fatortak.Dtos.Tax;
using fatortak.Services.TaxService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/tax")]
    [ApiController]
    [Authorize]
    public class TaxController : ControllerBase
    {
        private readonly ITaxService _service;

        public TaxController(ITaxService service)
        {
            _service = service;
        }

        [HttpGet("vat-return")]
        public async Task<ActionResult<ServiceResult<VatReturnDto>>> VatReturn(
            [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
        {
            var result = await _service.GetVatReturnAsync(fromDate, toDate);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("e-invoices")]
        public async Task<ActionResult<ServiceResult<EInvoiceExportDto>>> EInvoices(
            [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
        {
            var result = await _service.GetEInvoiceExportAsync(fromDate, toDate);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
