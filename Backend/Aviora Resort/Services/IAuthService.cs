using AvioraResort.Models.DTOs;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IAuthService
{
    Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto request, LoginContext context);
    Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto request, LoginContext context);
    Task<ServiceResult<UserDto>> GetProfileAsync(int userId);
    Task<ServiceResult<AdminSessionDto>> GetAdminSessionAsync(int userId, DateTime tokenExpiresAtUtc);
    Task<ServiceResult<UserDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
    Task<ServiceResult<string>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
    /// <summary>
    /// Always succeeds, with the same message whether or not the address is
    /// registered. LoginContext carries the requesting IP, which goes onto the
    /// token row and into the email footer.
    /// </summary>
    Task<ServiceResult<string>> ForgotPasswordAsync(ForgotPasswordRequestDto request, LoginContext context);

    Task<ServiceResult<PasswordResetResultDto>> ResetPasswordAsync(
        ResetPasswordRequestDto request, LoginContext context);
}