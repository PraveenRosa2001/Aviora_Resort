using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;

// IJwtTokenService lives in AvioraResort.Security, not .Services - the same
// using AuthService.cs already carries. Its absence is what produced the two
// CS8130s at BuildResponse: _jwt could not be resolved, so CreateToken had no
// known return type and the (token, expiresAt) deconstruction had nothing to
// infer from.
using AvioraResort.Security;

namespace AvioraResort.Services;

/// <summary>
/// Google Sign-In.
///
/// This class is the entire security boundary of the feature. Everything
/// downstream — the procedures, the JWT, the role — trusts what comes out of
/// here, so the rules are worth stating plainly:
///
///   1. The ID token is validated WITH GOOGLE, by signature, on the server.
///      Nothing the browser says about who the user is, is believed. A
///      request carrying `{"email":"admin@aviora.com"}` and no valid token
///      gets nowhere.
///
///   2. The audience must be OUR client id. A token minted for a different
///      application is a perfectly valid Google token — and accepting it
///      would let any other site's sign-in button log people into this one.
///
///   3. `email_verified` must be true before any existing account is linked.
///      Without that check, anyone who can create a Google account bearing a
///      registered address takes over that account.
///
///   4. A Google sign-in NEVER grants a role. New accounts are guests, full
///      stop. Existing accounts keep whatever they already had.
///
///   5. The `sub` claim, not the email, identifies a returning user. An email
///      can change; a sub cannot.
/// </summary>
public class GoogleAuthService : IGoogleAuthService
{
    private readonly IUserRepository _users;
    private readonly IJwtTokenService _jwt;
    private readonly GoogleAuthSettings _settings;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(IUserRepository users,
                             IJwtTokenService jwt,
                             IOptions<GoogleAuthSettings> settings,
                             ILogger<GoogleAuthService> logger)
    {
        _users = users;
        _jwt = jwt;
        _settings = settings.Value;
        _logger = logger;
    }

    /// <summary>Written into PasswordHash for accounts that have no password.</summary>
    public const string NoPasswordSentinel = "GOOGLE_ONLY_NO_PASSWORD";

    /// <summary>
    /// Administrators sign in with a password, full stop.
    ///
    /// Admin sessions last 120 minutes against a guest's 7 days, and admin
    /// lockout is 3 attempts against 5 - a policy chosen because a stolen
    /// admin token exposes every guest record. A Google sign-in walks past
    /// both: no lockout counter is touched, and the only thing protecting the
    /// console becomes the state of somebody's Google account, including
    /// whether they ever turned on 2-Step Verification.
    ///
    /// Checked in THREE places - here on the returning path, here on the
    /// linking path, and again in usp_User_LinkGoogle. A boundary that exists
    /// in one layer is a boundary somebody can route around.
    /// </summary>
    private const string AdminRefusal =
        "Administrator accounts sign in with an email address and password. " +
        "Please use the form above.";

    private static bool IsAdmin(string? roleName) =>
        string.Equals(roleName, "admin", StringComparison.OrdinalIgnoreCase);

    public async Task<ServiceResult<AuthResponseDto>> SignInAsync(
        GoogleSignInRequestDto request, LoginContext context)
    {
        if (!_settings.IsConfigured)
        {
            _logger.LogError("Google Sign-In attempted but GoogleAuth:ClientId is not set.");
            return ServiceResult<AuthResponseDto>.Fail(
                "Google sign-in is not available on this server.", 503);
        }

        if (string.IsNullOrWhiteSpace(request.IdToken))
            return ServiceResult<AuthResponseDto>.Fail("No Google credential was supplied.", 400);

        /* ---------- 1. Validate with Google ---------- */

        GoogleJsonWebSignature.Payload payload;

        try
        {
            // ValidateAsync checks the signature against Google's published
            // keys, the expiry, and the issuer. Audience is ours to state -
            // and it is the check that stops a token minted for somebody
            // else's application being replayed here.
            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _settings.ClientId }
                });
        }
        catch (InvalidJwtException ex)
        {
            // Expired, wrong audience, tampered, or not a Google token at
            // all. The guest gets one message; the log gets the reason.
            _logger.LogWarning("Google token rejected from {Ip}: {Reason}",
                               context.IpAddress, ex.Message);

            await _users.WriteLoginAuditAsync(
                null, "unknown", null, false, "Google token rejected",
                context.IpAddress, context.UserAgent);

            return ServiceResult<AuthResponseDto>.Fail(
                "That Google sign-in could not be verified. Please try again.", 401);
        }
        catch (Exception ex)
        {
            // Google unreachable, DNS, TLS. Not the guest's fault and not a
            // credential problem, so it must not be reported as one.
            _logger.LogError(ex, "Google token validation failed to complete");
            return ServiceResult<AuthResponseDto>.Fail(
                "Google sign-in is temporarily unavailable. Please use your password.", 503);
        }

        /* ---------- 2. The claims we will act on ---------- */

        var googleSub = payload.Subject;
        var email = (payload.Email ?? string.Empty).Trim().ToLowerInvariant();
        var emailVerified = payload.EmailVerified;

        if (string.IsNullOrWhiteSpace(googleSub))
            return ServiceResult<AuthResponseDto>.Fail(
                "That Google account is missing an identifier.", 400);

        /* ---------- 3. A returning user, keyed on sub ---------- */

        var existing = await _users.GetByGoogleSubjectAsync(googleSub);

        if (existing is not null)
        {
            if (!existing.IsActive)
                return ServiceResult<AuthResponseDto>.Fail(
                    "This account is no longer active. Please contact the resort.", 403);

            // The link may predate the promotion. A guest who connected Google
            // and was later made an administrator would otherwise keep a way
            // in that bypasses the admin policy entirely - and nothing would
            // have re-run usp_User_LinkGoogle to catch it.
            if (IsAdmin(existing.RoleName))
            {
                _logger.LogWarning(
                    "Google sign-in refused for ADMIN account {Email} from {Ip}",
                    existing.Email, context.IpAddress);

                await _users.WriteLoginAuditAsync(
                    existing.UserId, existing.Email, existing.RoleName, false,
                    "Google sign-in refused: administrator",
                    context.IpAddress, context.UserAgent);

                return ServiceResult<AuthResponseDto>.Fail(AdminRefusal, 403);
            }

            await _users.LoginSucceededAsync(existing.UserId, context.IpAddress);

            await _users.WriteLoginAuditAsync(
                existing.UserId, existing.Email, existing.RoleName, true,
                "Google sign-in", context.IpAddress, context.UserAgent);

            _logger.LogInformation("Google sign-in for {Email} ({Role})",
                                   existing.Email, existing.RoleName);

            return ServiceResult<AuthResponseDto>.Ok(BuildResponse(existing));
        }

        /* ---------- 4. First time. Link, or create. ---------- */

        if (string.IsNullOrWhiteSpace(email))
            return ServiceResult<AuthResponseDto>.Fail(
                "That Google account did not share an email address.", 400);

        // THE check. Google says whether it has confirmed the address; an
        // unverified one proves nothing about who controls that inbox, and
        // linking on it would hand over any account registered to it.
        if (!emailVerified)
        {
            _logger.LogWarning(
                "Google sign-in refused for {Email} from {Ip}: email_verified was false",
                email, context.IpAddress);

            return ServiceResult<AuthResponseDto>.Fail(
                "Google has not verified the email address on that account. " +
                "Please verify it with Google, or sign in with your password.", 403);
        }

        var byEmail = await _users.GetByEmailAsync(email);

        if (byEmail is not null)
        {
            if (!byEmail.IsActive)
                return ServiceResult<AuthResponseDto>.Fail(
                    "This account is no longer active. Please contact the resort.", 403);

            // Refused before the link is even attempted, so an administrator's
            // row never acquires a GoogleSubjectId in the first place.
            if (IsAdmin(byEmail.RoleName))
            {
                _logger.LogWarning(
                    "Google link refused for ADMIN account {Email} from {Ip}",
                    email, context.IpAddress);

                await _users.WriteLoginAuditAsync(
                    byEmail.UserId, byEmail.Email, byEmail.RoleName, false,
                    "Google link refused: administrator",
                    context.IpAddress, context.UserAgent);

                return ServiceResult<AuthResponseDto>.Fail(AdminRefusal, 403);
            }

            var link = await _users.LinkGoogleAsync(email, googleSub, payload.Picture);

            if (link == -4)
                // The procedure's own copy of the admin rule. Reaching here
                // means the service check above was bypassed somehow, which is
                // exactly why it exists.
                return ServiceResult<AuthResponseDto>.Fail(AdminRefusal, 403);

            if (link != 1)
            {
                // -2 and -3 both mean the identities disagree about who owns
                // what. Not something a guest can fix, and not something to
                // paper over.
                _logger.LogWarning(
                    "Google link refused for {Email} (status {Status}) from {Ip}",
                    email, link, context.IpAddress);

                return ServiceResult<AuthResponseDto>.Fail(
                    "This account is already connected to a different Google account. " +
                    "Please sign in with your password, or contact the resort.", 409);
            }

            // Re-read so the response carries the linked state, and so the
            // role comes from the database rather than from anything Google
            // sent.
            var linked = await _users.GetByGoogleSubjectAsync(googleSub)
                         ?? byEmail;

            await _users.LoginSucceededAsync(linked.UserId, context.IpAddress);

            await _users.WriteLoginAuditAsync(
                linked.UserId, linked.Email, linked.RoleName, true,
                "Google account linked and signed in", context.IpAddress, context.UserAgent);

            _logger.LogInformation(
                "Google account linked to existing user {Email} ({Role})",
                linked.Email, linked.RoleName);

            return ServiceResult<AuthResponseDto>.Ok(BuildResponse(linked));
        }

        /* ---------- 5. A new guest ---------- */

        var firstName = FirstNameFrom(payload);
        var lastName = LastNameFrom(payload);
        // Matches the convention AuthService.RegisterAsync already uses
        // ("usr-guest-{unixms}"), so the two sources of accounts produce codes
        // that look alike in the admin console.
        var userCode = $"usr-google-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

        var (status, userId) = await _users.RegisterGoogleAsync(
            userCode, firstName, lastName, email, googleSub, payload.Picture);

        if (status != 1 || userId is null)
        {
            _logger.LogWarning("Google registration refused for {Email}, status {Status}",
                               email, status);

            return ServiceResult<AuthResponseDto>.Fail(
                "An account already exists for that address. Please sign in with your password.",
                409);
        }

        var created = await _users.GetByIdAsync(userId.Value);

        if (created is null)
            return ServiceResult<AuthResponseDto>.Fail("The account could not be created.", 500);

        await _users.WriteLoginAuditAsync(
            created.UserId, created.Email, created.RoleName, true,
            "Google account created", context.IpAddress, context.UserAgent);

        _logger.LogInformation("New guest created from Google sign-in: {Email}", created.Email);

        return ServiceResult<AuthResponseDto>.Ok(BuildResponse(created));
    }

    /* ================= helpers ================= */

    /// <summary>
    /// Our own token, from our own signing key, carrying the role that is in
    /// our own database. Google's token goes no further than this class.
    /// </summary>
    private AuthResponseDto BuildResponse(User user)
    {
        var (token, expiresAt) = _jwt.CreateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = user.UserCode,
                Name = $"{user.FirstName} {user.LastName}".Trim(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.RoleName,
                Title = user.Title,
                Phone = user.Phone,
                Country = user.Country,
                Avatar = user.AvatarUrl,
                MembershipTier = user.MembershipTier,
                MemberSince = user.MemberSince?.ToString()
            }
        };
    }

    /// <summary>
    /// Google supplies GivenName and FamilyName for most accounts, but not
    /// all - a single-field name is common outside Europe, and some accounts
    /// share only a display name. Falling back through Name and then the
    /// local part of the email means nobody ends up called "null".
    /// </summary>
    private static string FirstNameFrom(GoogleJsonWebSignature.Payload p)
    {
        if (!string.IsNullOrWhiteSpace(p.GivenName)) return p.GivenName.Trim();

        if (!string.IsNullOrWhiteSpace(p.Name))
        {
            var first = p.Name.Trim().Split(' ')[0];
            if (!string.IsNullOrWhiteSpace(first)) return first;
        }

        var local = (p.Email ?? "guest").Split('@')[0];
        return string.IsNullOrWhiteSpace(local) ? "Guest" : local;
    }

    private static string LastNameFrom(GoogleJsonWebSignature.Payload p)
    {
        if (!string.IsNullOrWhiteSpace(p.FamilyName)) return p.FamilyName.Trim();

        if (!string.IsNullOrWhiteSpace(p.Name))
        {
            var parts = p.Name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 1) return string.Join(' ', parts[1..]);
        }

        // EMPTY, not a placeholder.
        //
        // dbo.Users.LastName is NOT NULL, which an empty string satisfies -
        // NOT NULL is not the same as non-empty. An earlier version returned
        // "." to be safe, and that was wrong in a way worth naming: the
        // checkout pre-fill is `if (!guestInfo.lastName && currentUser.lastName)`,
        // and "." is truthy. The guest would have got a reservation voucher
        // and a tax invoice made out to "Praveen ." and no obvious way to see
        // why.
        //
        // Empty is falsy, so the pre-fill skips it, the field stays blank, and
        // the checkout's own "Last name is required" makes the guest supply a
        // real one. The system asks rather than inventing.
        return string.Empty;
    }
}