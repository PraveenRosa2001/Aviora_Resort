//using System.IdentityModel.Tokens.Jwt;
//using System.Security.Claims;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.RateLimiting;
//using AvioraResort.Models.Common;
//using AvioraResort.Models.DTOs;
//using AvioraResort.Services;
//using AvioraResort.Models.DTOs;

//namespace AvioraResort.Controllers;

//[ApiController]
//[Route("api/auth")]
//[Produces("application/json")]
//public class AuthController : ControllerBase
//{
//    private readonly IAuthService _auth;

//    public AuthController(IAuthService auth) => _auth = auth;

//    private int? CurrentUserId =>
//        int.TryParse(User.FindFirstValue("uid"), out var id) ? id : null;

//    /// <summary>
//    /// Collects request metadata so AuthService never touches HttpContext.
//    /// </summary>
//    private LoginContext BuildContext() => new()
//    {
//        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
//        UserAgent = Request.Headers.UserAgent.ToString() is { Length: > 0 } ua
//                    ? (ua.Length > 400 ? ua[..400] : ua)
//                    : null
//    };

//    private IActionResult FromResult<T>(ServiceResult<T> result) =>
//        result.Success
//            ? Ok(result.Data)
//            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

//    private string FirstValidationError() =>
//        ModelState.Values.SelectMany(v => v.Errors)
//                         .Select(e => e.ErrorMessage)
//                         .FirstOrDefault() ?? "Invalid request.";

//    // POST /api/auth/register
//    [HttpPost("register")]
//    [AllowAnonymous]
//    [EnableRateLimiting("auth")]
//    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
//    {
//        if (!ModelState.IsValid)
//            return BadRequest(new ErrorResponseDto(FirstValidationError()));

//        return FromResult(await _auth.RegisterAsync(request, BuildContext()));
//    }

//    // POST /api/auth/login
//    [HttpPost("login")]
//    [AllowAnonymous]
//    [EnableRateLimiting("auth")]
//    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
//    {
//        if (!ModelState.IsValid)
//            return BadRequest(new ErrorResponseDto(FirstValidationError()));

//        return FromResult(await _auth.LoginAsync(request, BuildContext()));
//    }

//    // GET /api/auth/me
//    [HttpGet("me")]
//    [Authorize]
//    public async Task<IActionResult> Me()
//    {
//        if (CurrentUserId is null)
//            return Unauthorized(new ErrorResponseDto("Invalid session."));

//        return FromResult(await _auth.GetProfileAsync(CurrentUserId.Value));
//    }

//    // PUT /api/auth/profile
//    [HttpPut("profile")]
//    [Authorize]
//    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
//    {
//        if (CurrentUserId is null)
//            return Unauthorized(new ErrorResponseDto("Invalid session."));
//        if (!ModelState.IsValid)
//            return BadRequest(new ErrorResponseDto(FirstValidationError()));

//        return FromResult(await _auth.UpdateProfileAsync(CurrentUserId.Value, request));
//    }

//    // POST /api/auth/change-password
//    [HttpPost("change-password")]
//    [Authorize]
//    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
//    {
//        if (CurrentUserId is null)
//            return Unauthorized(new ErrorResponseDto("Invalid session."));
//        if (!ModelState.IsValid)
//            return BadRequest(new ErrorResponseDto(FirstValidationError()));

//        var result = await _auth.ChangePasswordAsync(CurrentUserId.Value, request);
//        return result.Success
//            ? Ok(new { message = result.Data })
//            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
//    }

//    // POST /api/auth/forgot-password
//    [HttpPost("forgot-password")]
//    [AllowAnonymous]
//    [EnableRateLimiting("auth")]
//    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
//    {
//        if (!ModelState.IsValid)
//            return BadRequest(new ErrorResponseDto(FirstValidationError()));

//        // Always 200. A 500 on an unknown address and a 200 on a known one
//        // is the enumeration leak the identical message exists to prevent.
//        var result = await _auth.ForgotPasswordAsync(request, BuildContext());
//        return Ok(new { message = result.Data });
//    }

//    // POST /api/auth/reset-password
//    [HttpPost("reset-password")]
//    [AllowAnonymous]
//    [EnableRateLimiting("auth")]
//    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
//    {
//        if (!ModelState.IsValid)
//            return BadRequest(new ErrorResponseDto(FirstValidationError()));

//        var result = await _auth.ResetPasswordAsync(request, BuildContext());

//        // The body carries LockoutCleared as well as the message, so the page
//        // can tell a guest their account has been unlocked too.
//        return result.Success
//            ? Ok(result.Data)
//            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
//    }

//    // POST /api/auth/logout
//    [HttpPost("logout")]
//    [Authorize]
//    public IActionResult Logout() => Ok(new { message = "Signed out." });
//}


using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly IGoogleAuthService _google;

    public AuthController(IAuthService auth, IGoogleAuthService google)
    {
        _auth = auth;
        _google = google;
    }

    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue("uid"), out var id) ? id : null;

    /// <summary>
    /// Collects request metadata so AuthService never touches HttpContext.
    /// </summary>
    private LoginContext BuildContext() => new()
    {
        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
        UserAgent = Request.Headers.UserAgent.ToString() is { Length: > 0 } ua
                    ? (ua.Length > 400 ? ua[..400] : ua)
                    : null
    };

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private string FirstValidationError() =>
        ModelState.Values.SelectMany(v => v.Errors)
                         .Select(e => e.ErrorMessage)
                         .FirstOrDefault() ?? "Invalid request.";

    // POST /api/auth/register
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromResult(await _auth.RegisterAsync(request, BuildContext()));
    }

    // POST /api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromResult(await _auth.LoginAsync(request, BuildContext()));
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));

        return FromResult(await _auth.GetProfileAsync(CurrentUserId.Value));
    }

    // PUT /api/auth/profile
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromResult(await _auth.UpdateProfileAsync(CurrentUserId.Value, request));
    }

    // POST /api/auth/change-password
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        var result = await _auth.ChangePasswordAsync(CurrentUserId.Value, request);
        return result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    // POST /api/auth/forgot-password
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        // Always 200. A 500 on an unknown address and a 200 on a known one
        // is the enumeration leak the identical message exists to prevent.
        var result = await _auth.ForgotPasswordAsync(request, BuildContext());
        return Ok(new { message = result.Data });
    }

    // POST /api/auth/reset-password
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        var result = await _auth.ResetPasswordAsync(request, BuildContext());

        // The body carries LockoutCleared as well as the message, so the page
        // can tell a guest their account has been unlocked too.
        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    // POST /api/auth/logout
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout() => Ok(new { message = "Signed out." });

    /* ---------- Google Sign-In ---------- */

    /// <summary>
    /// POST /api/auth/google
    ///
    /// Takes ONLY the Google ID token. The server validates it with Google -
    /// signature, expiry, issuer and audience - and everything about who the
    /// user is comes from that validated payload, never from the request.
    ///
    /// Returns the same AuthResponseDto as password sign-in, carrying our own
    /// JWT. The frontend cannot tell the two apart, and should not need to.
    ///
    /// Rate limited on the same policy as the other credential endpoints: an
    /// endpoint that can create accounts is worth protecting whether or not
    /// the creation involves a password.
    /// </summary>
    [HttpPost("google")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        var result = await _google.SignInAsync(request, BuildContext());

        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    /// <summary>
    /// GET /api/auth/google/config
    ///
    /// Lets the sign-in page show the Google button only when the server can
    /// actually handle it. The client id is public by design - it goes to
    /// Google in the open on every sign-in - so serving it here is not a leak,
    /// and it keeps the value in one place instead of two that drift.
    /// </summary>
    [HttpGet("google/config")]
    [AllowAnonymous]
    public IActionResult GoogleConfig([FromServices] IOptions<GoogleAuthSettings> settings)
        => Ok(new GoogleAuthConfigDto
        {
            Enabled = settings.Value.IsConfigured,
            ClientId = settings.Value.IsConfigured ? settings.Value.ClientId : null
        });
}