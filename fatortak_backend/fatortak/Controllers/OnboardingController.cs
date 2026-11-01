using fatortak.Dtos.Onboarding;
using fatortak.Dtos.Shared;
using fatortak.Services.OnboardingService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [Route("api/onboarding")]
    [ApiController]
    [Authorize]
    public class OnboardingController : ControllerBase
    {
        private readonly IOnboardingService _service;

        public OnboardingController(IOnboardingService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ServiceResult<OnboardingProgressDto>>> Get()
        {
            var result = await _service.GetProgressAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("demo-data")]
        [Authorize(Roles = "Admin,SysAdmin")]
        public async Task<ActionResult<ServiceResult<DemoDataResultDto>>> DemoData()
        {
            var result = await _service.SeedDemoDataAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
