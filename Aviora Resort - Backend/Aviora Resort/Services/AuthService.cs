using AvioraResort.Models.DTOs;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;
using AvioraResort.Security;

namespace AvioraResort.Services;

/// <summary>
/// Business rules for authentication. No SQL here, no HTTP types here.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IConfiguration _config;

    public AuthService(IUserRepository users, IPasswordHasher hasher,
                       IJwtTokenService jwt, IConfiguration config)
    {
        _users = users;
        _hasher = hasher;
        _jwt = jwt;
        _config = config;
    }

    /* Lockout policy is tighter for administrators: fewer attempts, longer
       lockout. A guest account protects one person's bookings; an admin
       account protects every guest record in the system. */
    private (int MaxAttempts, int LockoutMinutes) PolicyFor(User user) =>
        user.IsAdmin
            ? (ReadInt("Lockout:AdminMaxAttempts", 3), ReadInt("Lockout:AdminMinutes", 30))
            : (ReadInt("Lockout:GuestMaxAttempts", 5), ReadInt("Lockout:GuestMinutes", 15));

    private int ReadInt(string key, int fallback) =>
        int.TryParse(_config[key], out var v) ? v : fallback;

    /* ------------------------------------------------------------------ */
    /*  REGISTER                                                           */
    /* ------------------------------------------------------------------ */
    public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(
        RegisterRequestDto request, LoginContext context)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _users.EmailExistsAsync(email))
            return ServiceResult<AuthResponseDto>.Fail(
                "An account with this email address already exists. Please sign in.", 409);

        var firstName = request.FirstName.Trim();
        var lastName = request.LastName.Trim();

        // usp_User_Register always assigns the guest role. The admin role
        // cannot be obtained through this endpoint by any request body.
        var user = new User
        {
            UserCode = $"usr-guest-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            PasswordHash = _hasher.Hash(request.Password),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Country = request.Country.Trim(),
            MembershipTier = "Aviora Privilege Member",
            AvatarUrl = BuildInitialsAvatar(firstName, lastName)
        };

        var newId = await _users.RegisterAsync(user);
        if (newId <= 0)
            return ServiceResult<AuthResponseDto>.Fail(
                "An account with this email address already exists. Please sign in.", 409);

        var created = await _users.GetByIdAsync(newId);
        if (created is null)
            return ServiceResult<AuthResponseDto>.Fail("Registration failed. Please try again.", 500);

        await _users.LoginSucceededAsync(created.UserId, context.IpAddress);
        await _users.WriteLoginAuditAsync(created.UserId, created.Email, created.RoleName,
                                          true, "Registration", context.IpAddress, context.UserAgent);

        return ServiceResult<AuthResponseDto>.Ok(BuildAuthResponse(created));
    }

    /* ------------------------------------------------------------------ */
    /*  LOGIN                                                              */
    /* ------------------------------------------------------------------ */
    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(
        LoginRequestDto request, LoginContext context)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.GetByEmailAsync(email);

        // Unknown e-mail. Audited, but the caller gets the same message as a
        // wrong password so the endpoint cannot be used to discover which
        // addresses are registered.
        if (user is null)
        {
            await _users.WriteLoginAuditAsync(null, email, null, false, "UnknownEmail",
                                              context.IpAddress, context.UserAgent);
            return InvalidCredentials();
        }

        // Locked out. Checked before the password so a locked account cannot
        // be probed at all.
        if (user.IsLockedOut)
        {
            await _users.WriteLoginAuditAsync(user.UserId, email, user.RoleName, false, "Locked",
                                              context.IpAddress, context.UserAgent);

            var minutesLeft = (int)Math.Ceiling(
                (user.LockoutEndUtc!.Value - DateTime.UtcNow).TotalMinutes);

            return ServiceResult<AuthResponseDto>.Fail(
                $"This account is temporarily locked after repeated failed attempts. " +
                $"Please try again in {Math.Max(minutesLeft, 1)} minute(s).", 423);
        }

        if (!user.IsActive)
        {
            await _users.WriteLoginAuditAsync(user.UserId, email, user.RoleName, false, "Inactive",
                                              context.IpAddress, context.UserAgent);
            return ServiceResult<AuthResponseDto>.Fail(
                "This account has been deactivated. Please contact the resort.", 403);
        }

        if (!_hasher.Verify(request.Password, user.PasswordHash))
        {
            var (maxAttempts, lockoutMinutes) = PolicyFor(user);
            var (attempts, lockoutEnd) =
                await _users.LoginFailedAsync(user.UserId, maxAttempts, lockoutMinutes);

            await _users.WriteLoginAuditAsync(user.UserId, email, user.RoleName, false,
                                              "InvalidPassword", context.IpAddress, context.UserAgent);

            if (lockoutEnd.HasValue && lockoutEnd.Value > DateTime.UtcNow)
                return ServiceResult<AuthResponseDto>.Fail(
                    $"Too many failed attempts. This account is locked for {lockoutMinutes} minutes.", 423);

            var remaining = maxAttempts - attempts;
            if (remaining is > 0 and <= 2)
                return ServiceResult<AuthResponseDto>.Fail(
                    $"Invalid email or password. {remaining} attempt(s) remaining before the " +
                    $"account is locked.", 401);

            return InvalidCredentials();
        }

        await _users.LoginSucceededAsync(user.UserId, context.IpAddress);
        await _users.WriteLoginAuditAsync(user.UserId, email, user.RoleName, true, null,
                                          context.IpAddress, context.UserAgent);

        // Re-read so the response carries the freshly stamped LastLoginAtUtc
        var refreshed = await _users.GetByIdAsync(user.UserId) ?? user;

        return ServiceResult<AuthResponseDto>.Ok(BuildAuthResponse(refreshed));
    }

    private static ServiceResult<AuthResponseDto> InvalidCredentials() =>
        ServiceResult<AuthResponseDto>.Fail(
            "Invalid email or password. Please verify your credentials and try again.", 401);

    /* ------------------------------------------------------------------ */
    /*  PROFILE                                                            */
    /* ------------------------------------------------------------------ */
    public async Task<ServiceResult<UserDto>> GetProfileAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId);
        return user is null
            ? ServiceResult<UserDto>.Fail("User not found.", 404)
            : ServiceResult<UserDto>.Ok(ToDto(user));
    }

    /// <summary>
    /// Confirms from the database - not from the token alone - that this user
    /// still holds the admin role. Backs GET /api/admin/session.
    /// </summary>
    public async Task<ServiceResult<AdminSessionDto>> GetAdminSessionAsync(
        int userId, DateTime tokenExpiresAtUtc)
    {
        var user = await _users.GetByIdAsync(userId);

        if (user is null || !user.IsActive || !user.IsAdmin)
            return ServiceResult<AdminSessionDto>.Fail(
                "Administrator privileges are required for this area.", 403);

        return ServiceResult<AdminSessionDto>.Ok(new AdminSessionDto
        {
            UserCode = user.UserCode,
            Name = $"{user.FirstName} {user.LastName}",
            Email = user.Email,
            Role = user.RoleName,
            LastLoginAtUtc = user.LastLoginAtUtc,
            LastLoginIp = user.LastLoginIp,
            TokenExpiresAtUtc = tokenExpiresAtUtc
        });
    }

    public async Task<ServiceResult<UserDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
    {
        var updated = await _users.UpdateProfileAsync(
            userId,
            request.FirstName.Trim(),
            request.LastName.Trim(),
            string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            string.IsNullOrWhiteSpace(request.Country) ? null : request.Country.Trim(),
            string.IsNullOrWhiteSpace(request.Avatar) ? null : request.Avatar.Trim());

        if (!updated)
            return ServiceResult<UserDto>.Fail("User not found.", 404);

        var user = await _users.GetByIdAsync(userId);
        return ServiceResult<UserDto>.Ok(ToDto(user!));
    }

    /* ------------------------------------------------------------------ */
    /*  PASSWORDS                                                          */
    /* ------------------------------------------------------------------ */
    public async Task<ServiceResult<string>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
    {
        var user = await _users.GetByIdAsync(userId);
        if (user is null)
            return ServiceResult<string>.Fail("User not found.", 404);

        if (!_hasher.Verify(request.CurrentPassword, user.PasswordHash))
            return ServiceResult<string>.Fail("Your current password is incorrect.", 400);

        await _users.UpdatePasswordAsync(userId, _hasher.Hash(request.NewPassword));
        return ServiceResult<string>.Ok("Password updated successfully.");
    }

    public async Task<ServiceResult<string>> ForgotPasswordAsync(ForgotPasswordRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var rawToken = _jwt.GenerateResetToken();
        var tokenHash = _jwt.HashResetToken(rawToken);

        var created = await _users.CreateResetTokenAsync(email, tokenHash, DateTime.UtcNow.AddHours(1));

        // TODO: replace with a real e-mail once the mail service is added.
        //       Link format: https://aviora-resort.com/reset-password?token={rawToken}
        if (created)
            Console.WriteLine($"[DEV] Password reset token for {email}: {rawToken}");

        return ServiceResult<string>.Ok(
            "If an account exists for this address, recovery instructions have been sent.");
    }

    public async Task<ServiceResult<string>> ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        var tokenHash = _jwt.HashResetToken(request.Token);
        var userId = await _users.ConsumeResetTokenAsync(tokenHash);

        if (userId is null)
            return ServiceResult<string>.Fail("This reset link is invalid or has expired.", 400);

        await _users.UpdatePasswordAsync(userId.Value, _hasher.Hash(request.NewPassword));
        return ServiceResult<string>.Ok("Password has been reset. You may now sign in.");
    }

    /* ------------------------------------------------------------------ */
    /*  HELPERS                                                            */
    /* ------------------------------------------------------------------ */
    private AuthResponseDto BuildAuthResponse(User user)
    {
        var (token, expiresAt) = _jwt.CreateToken(user);
        return new AuthResponseDto { Token = token, ExpiresAt = expiresAt, User = ToDto(user) };
    }

    private static UserDto ToDto(User u) => new()
    {
        Id = u.UserCode,
        Name = $"{u.FirstName} {u.LastName}",
        FirstName = u.FirstName,
        LastName = u.LastName,
        Email = u.Email,
        Role = u.RoleName,
        Title = u.Title,
        Phone = u.Phone,
        Country = u.Country,
        Avatar = u.AvatarUrl,
        MembershipTier = u.MembershipTier,
        MemberSince = u.MemberSince?.ToString()
    };

    private static string BuildInitialsAvatar(string firstName, string lastName)
    {
        var seed = Uri.EscapeDataString($"{firstName} {lastName}");
        return $"https://api.dicebear.com/7.x/initials/svg?seed={seed}&backgroundColor=883700&textColor=ffffff";
    }
}