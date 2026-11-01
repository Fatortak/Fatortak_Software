using fatortak.Dtos.SavedViews;
using fatortak.Dtos.Shared;
using fatortak.Services.SavedViewService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/saved-views")]
    [ApiController]
    [Authorize]
    public class SavedViewsController : ControllerBase
    {
        private readonly ISavedViewService _service;

        public SavedViewsController(ISavedViewService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<List<SavedViewDto>>>> Get(
            [FromQuery] string pageKey)
        {
            var result = await _service.GetAsync(pageKey);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<ActionResult<ServiceResult<SavedViewDto>>> Create(
            [FromBody] SavedViewCreateDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("update/{id}")]
        public async Task<ActionResult<ServiceResult<SavedViewDto>>> Update(
            Guid id, [FromBody] SavedViewUpdateDto dto)
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
    }
}
