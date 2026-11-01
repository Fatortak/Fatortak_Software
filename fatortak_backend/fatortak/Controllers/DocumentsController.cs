using fatortak.Dtos.Documents;
using fatortak.Dtos.Shared;
using fatortak.Services.DocumentService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/documents")]
    [ApiController]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentRevisionService _service;

        public DocumentsController(IDocumentRevisionService service)
        {
            _service = service;
        }

        [HttpGet("{documentType}/{documentId}/revisions")]
        public async Task<ActionResult<ServiceResult<List<DocumentRevisionDto>>>> Revisions(
            string documentType, Guid documentId)
        {
            var result = await _service.GetRevisionsAsync(documentType, documentId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
