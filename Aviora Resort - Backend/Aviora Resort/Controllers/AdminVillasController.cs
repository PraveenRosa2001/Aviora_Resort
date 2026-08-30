using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Villa management. Every write to dbo.Villas passes through here.
///
/// [Authorize(Roles = "admin")] sits on the class, so a route added later is
/// protected without anyone remembering to repeat the attribute. This is the
/// only place villas can be created, changed or retired - VillasController is
/// read-only, and no guest-facing endpoint touches these procedures.
///
/// A guest calling any of these gets 403 before the method body runs, whatever
/// their browser's localStorage says.
/// </summary>
[ApiController]
[Route("api/admin/villas")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminVillasController : ControllerBase
{
    private readonly IVillaService _villas;

    public AdminVillasController(IVillaService villas) => _villas = villas;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private string FirstValidationError() =>
        ModelState.Values.SelectMany(v => v.Errors)
                         .Select(e => e.ErrorMessage)
                         .FirstOrDefault() ?? "Invalid request.";

    /// <summary>
    /// GET /api/admin/villas?includeInactive=true
    /// Every villa including retired ones, with IsActive and timestamps.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = true)
        => FromResult(await _villas.GetVillasForAdminAsync(includeInactive));

    /// <summary>POST /api/admin/villas</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveVillaRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        var result = await _villas.CreateVillaAsync(request);

        return result.Success
            ? CreatedAtAction(nameof(GetAll), new { }, result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    /// <summary>
    /// PUT /api/admin/villas/canopy-villa-01
    /// The code in the route wins; a different code in the body is ignored, so
    /// one villa's form cannot overwrite another.
    /// </summary>
    [HttpPut("{villaCode}")]
    public async Task<IActionResult> Update(string villaCode, [FromBody] SaveVillaRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromResult(await _villas.UpdateVillaAsync(villaCode, request));
    }

    /// <summary>
    /// DELETE /api/admin/villas/canopy-villa-01
    ///
    /// Soft by default: IsActive = 0 hides the villa from guests but keeps its
    /// reviews and future reservation history. ?force=true removes the row
    /// permanently and is refused once bookings reference it.
    /// </summary>
    [HttpDelete("{villaCode}")]
    public async Task<IActionResult> Delete(string villaCode, [FromQuery] bool force = false)
    {
        var result = await _villas.DeleteVillaAsync(villaCode, force);

        return result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    /// <summary>POST /api/admin/villas/canopy-villa-01/restore</summary>
    [HttpPost("{villaCode}/restore")]
    public async Task<IActionResult> Restore(string villaCode)
    {
        var result = await _villas.RestoreVillaAsync(villaCode);

        return result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }
}