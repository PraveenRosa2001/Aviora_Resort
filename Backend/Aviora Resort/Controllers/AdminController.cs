using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Every administrator endpoint lives under this controller.
///
/// [Authorize(Roles = "admin")] at the class level is the real security
/// boundary of the application. ProtectedRoute in React only hides a page;
/// this attribute is what actually refuses the data.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IAuthService _auth;

    public AdminController(IAuthService auth) => _auth = auth;

    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue("uid"), out var id) ? id : null;

    /// <summary>Reads the exp claim so the client can show a session countdown.</summary>
    private DateTime TokenExpiresAtUtc
    {
        get
        {
            var exp = User.FindFirstValue(JwtRegisteredClaimNames.Exp);
            return long.TryParse(exp, out var seconds)
                ? DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime
                : DateTime.UtcNow;
        }
    }

    /// <summary>
    /// GET /api/admin/session
    ///
    /// The React admin route calls this before rendering. Three things have to
    /// be true to get a 200: the JWT is valid and unexpired, its role claim is
    /// admin, and the account still holds the admin role in dbo.Users right now.
    ///
    /// Forging localStorage cannot produce a 200 - there is no valid signed
    /// token behind it, so the request fails at [Authorize] before this method
    /// is ever entered.
    /// </summary>
    [HttpGet("session")]
    public async Task<IActionResult> Session()
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));

        var result = await _auth.GetAdminSessionAsync(CurrentUserId.Value, TokenExpiresAtUtc);

        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    // Future admin endpoints go here. They inherit [Authorize(Roles = "admin")]
    // from the class, so each one is protected without repeating the attribute:
    //
    //   [HttpGet("bookings")]      public async Task<IActionResult> GetBookings(...)
    //   [HttpGet("dashboard/kpis")] public async Task<IActionResult> GetKpis(...)
}