using fatortak.Dtos.Import;
using fatortak.Dtos.Shared;
using fatortak.Services.ImportService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/import")]
    [ApiController]
    [Authorize]
    public class ImportController : ControllerBase
    {
        private readonly IImportService _service;

        public ImportController(IImportService service)
        {
            _service = service;
        }

        [HttpPost("preview")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ServiceResult<ImportPreviewDto>>> Preview(
            [FromForm] IFormFile file,
            [FromForm] string entityType = "customers",
            [FromForm] bool isSupplier = false)
        {
            var result = await _service.PreviewAsync(file, entityType, isSupplier);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("execute")]
        public async Task<ActionResult<ServiceResult<ImportResultDto>>> Execute(
            [FromBody] ImportExecuteDto dto)
        {
            var result = await _service.ExecuteAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("customers")]
        public async Task<ActionResult<ServiceResult<ImportResultDto>>> Customers(
            [FromBody] CsvImportDto dto)
        {
            var result = await _service.ImportCustomersAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("items")]
        public async Task<ActionResult<ServiceResult<ImportResultDto>>> Items(
            [FromBody] CsvImportDto dto)
        {
            var result = await _service.ImportItemsAsync(dto.Csv);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
