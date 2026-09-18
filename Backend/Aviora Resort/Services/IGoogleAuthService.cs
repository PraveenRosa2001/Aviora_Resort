using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IGoogleAuthService
{
    /// <summary>
    /// Validates a Google ID token with Google, then signs the user in —
    /// linking to an existing account or creating a guest.
    ///
    /// Returns the SAME AuthResponseDto as password sign-in, carrying our own
    /// JWT. Google's token never travels past the service.
    /// </summary>
    Task<ServiceResult<AuthResponseDto>> SignInAsync(
        GoogleSignInRequestDto request, LoginContext context);
}