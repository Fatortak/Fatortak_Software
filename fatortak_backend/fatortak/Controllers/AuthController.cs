using fatortak.Dtos.Auth;
using fatortak.Dtos.Platform;
using fatortak.Dtos.Shared;
using fatortak.Services.AuthService;
using fatortak.Services.Deployment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace fatortak.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("auth")]
    public class AuthController : ControllerBase
    {
        private const string AuthCookieName = "fatortak_at";
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly IDeploymentMode _deployment;
        private readonly IConfiguration _configuration;

        public AuthController(
            IAuthService authService,
            ILogger<AuthController> logger,
            IWebHostEnvironment environment,
            IDeploymentMode deployment,
            IConfiguration configuration)
        {
            _authService = authService;
            _logger = logger;
            _environment = environment;
            _deployment = deployment;
            _configuration = configuration;
        }

        private void SetAuthCookie(string? token)
        {
            if (string.IsNullOrWhiteSpace(token)) return;

            Response.Cookies.Append(AuthCookieName, token, new CookieOptions
            {
                HttpOnly = true,
                // Works for direct HTTPS and for a TLS-terminating reverse proxy
                // that forwards X-Forwarded-Proto; plain HTTP local Docker still works.
                Secure = Request.IsHttps ||
                         string.Equals(Request.Headers["X-Forwarded-Proto"].FirstOrDefault(),
                             "https", StringComparison.OrdinalIgnoreCase),
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddDays(20),
                IsEssential = true
            });
        }

        [AllowAnonymous]
        [HttpGet("registration-options")]
        public ActionResult<ServiceResult<RegistrationOptionsDto>> RegistrationOptions()
        {
            var selfHosted = _deployment.IsSelfHosted;
            var allowRegistration = selfHosted
                ? _configuration.GetValue("SelfHosted:AllowRegistration", true)
                : _configuration.GetValue("MultiTenant:AllowRegistration", true);

            return Ok(ServiceResult<RegistrationOptionsDto>.SuccessResult(
                new RegistrationOptionsDto
                {
                    Mode = selfHosted ? "SelfHosted" : "MultiTenant",
                    AllowRegistration = allowRegistration,
                    RequiresSubdomain = !selfHosted,
                    TrialDays = _configuration.GetValue("Subscriptions:TrialDays", 14)
                }));
        }

        [AllowAnonymous]
        [HttpGet("subdomain-availability")]
        public async Task<ActionResult<ServiceResult<SubdomainAvailabilityDto>>> SubdomainAvailability(
            [FromQuery] string value)
        {
            var result = await _authService.CheckSubdomainAsync(value);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<ServiceResult<AuthResponseDto>>> Register(RegisterDto registerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return BadRequest(ServiceResult<AuthResponseDto>.ValidationError(errors));
                }

                var result = await _authService.RegisterAsync(registerDto);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                SetAuthCookie(result.Data?.Token);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AuthController.Register");
                return StatusCode(500, ServiceResult<AuthResponseDto>.Failure("An unexpected error occurred during registration"));
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<ServiceResult<AuthResponseDto>>> Login(LoginDto loginDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return BadRequest(ServiceResult<AuthResponseDto>.ValidationError(errors));
                }

                var result = await _authService.LoginAsync(loginDto);

                if (!result.Success)
                {
                    return Unauthorized(result);
                }

                SetAuthCookie(result.Data?.Token);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AuthController.Login");
                return StatusCode(500, ServiceResult<AuthResponseDto>.Failure("An unexpected error occurred during login"));
            }
        }

        [Authorize]
        [HttpPost("switch-tenant")]
        public async Task<ActionResult<ServiceResult<AuthResponseDto>>> SwitchTenant(
            [FromBody] SwitchTenantDto dto)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ServiceResult<AuthResponseDto>.Failure("Invalid token."));

            var result = await _authService.SwitchTenantAsync(userId, dto.TenantId);
            if (!result.Success) return BadRequest(result);

            SetAuthCookie(result.Data?.Token);
            return Ok(result);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<ServiceResult<AuthResponseDto>>> Me()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ServiceResult<AuthResponseDto>.Failure("Invalid token."));

            var result = await _authService.GetSessionAsync(userId);
            return result.Success ? Ok(result) : Unauthorized(result);
        }

        [AllowAnonymous]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete(AuthCookieName, new CookieOptions
            {
                Path = "/",
                Secure = Request.IsHttps ||
                         string.Equals(Request.Headers["X-Forwarded-Proto"].FirstOrDefault(),
                             "https", StringComparison.OrdinalIgnoreCase),
                SameSite = SameSiteMode.Lax
            });
            return Ok(new { success = true });
        }

        [AllowAnonymous]
        [HttpPost("ForgetPasswordRequest")]
        public async Task<ActionResult<ServiceResult<string>>> ForgetPasswordRequest([FromBody] ForgotPasswordViewModel model)
        {
            try
            {
                var result = await _authService.ForgetPasswordRequestAsync(model.Email);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AuthController.ForgetPasswordRequest");
                return StatusCode(500, ServiceResult<string>.Failure("An unexpected error occurred during password reset request"));
            }
        }

        [AllowAnonymous]
        [HttpPost("SetNewPassword")]
        public async Task<ActionResult<ServiceResult<string>>> SetNewPassword([FromBody] SetPasswordViewModel model)
        {
            try
            {
                var result = await _authService.SetNewPassword( model.UserId,model.Token, model.NewPassword);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AuthController.SetNewPassword");
                return StatusCode(500, ServiceResult<string>.Failure("An unexpected error occurred during password reset"));
            }
        }

    }
}