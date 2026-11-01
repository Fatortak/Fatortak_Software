using fatortak.Dtos.Search;
using fatortak.Dtos.Shared;
using fatortak.Services.SearchService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/search")]
    [ApiController]
    [Authorize]
    public class GlobalSearchController : ControllerBase
    {
        private readonly IGlobalSearchService _service;

        public GlobalSearchController(IGlobalSearchService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<List<GlobalSearchResultDto>>>> Search(
            [FromQuery] string term)
        {
            var result = await _service.SearchAsync(term);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
