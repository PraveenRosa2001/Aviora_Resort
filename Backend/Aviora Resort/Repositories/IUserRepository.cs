//using AvioraResort.Models.Entities;

//namespace AvioraResort.Repositories;

//public interface IUserRepository
//{
//    Task<bool> EmailExistsAsync(string email);
//    Task<int> RegisterAsync(User user);                       // -1 = duplicate e-mail
//    Task<User?> GetByEmailAsync(string email);
//    Task<User?> GetByIdAsync(int userId);
//    Task<bool> UpdateProfileAsync(int userId, string firstName, string lastName,
//                                   string? phone, string? country, string? avatarUrl);
//    Task<bool> UpdatePasswordAsync(int userId, string passwordHash);
//    /// <summary>
//    /// Issues a reset token and supersedes any live one for the account.
//    /// Returns the name so the email can be addressed - never returned to the
//    /// caller of the API, which answers identically whether or not the address
//    /// exists.
//    ///
//    /// Status: 1 issued, 0 no such active account.
//    /// </summary>
//    Task<(int Status, string? FirstName, string? LastName, string? Email)>
//        CreateResetTokenAsync(string email, string tokenHash, DateTime expiresAtUtc, string? requestedIp);

//    /// <summary>
//    /// Claims the token AND sets the password in ONE transaction.
//    ///
//    /// The old signature returned a user id, which forced the password update
//    /// to be a second call - and two calls cannot be atomic. A failure between
//    /// them burnt the token without changing the password.
//    ///
//    /// Status: 1 reset, -1 unknown / used / superseded / expired, -2 inactive.
//    /// </summary>
//    Task<(int Status, string? Email, string? FirstName, string? RoleName)>
//        ConsumeResetTokenAsync(string tokenHash, string newPasswordHash, string? consumedIp);

//    // Added by 02_Auth_Security.sql
//    Task LoginSucceededAsync(int userId, string? ipAddress);
//    Task<(int Attempts, DateTime? LockoutEndUtc)> LoginFailedAsync(
//        int userId, int maxAttempts, int lockoutMinutes);
//    Task WriteLoginAuditAsync(int? userId, string email, string? roleName,
//                              bool succeeded, string? failureReason,
//                              string? ipAddress, string? userAgent);
//}


using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IUserRepository
{
    Task<bool> EmailExistsAsync(string email);
    Task<int> RegisterAsync(User user);                       // -1 = duplicate e-mail
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int userId);
    Task<bool> UpdateProfileAsync(int userId, string firstName, string lastName,
                                   string? phone, string? country, string? avatarUrl);
    Task<bool> UpdatePasswordAsync(int userId, string passwordHash);
    /// <summary>
    /// Issues a reset token and supersedes any live one for the account.
    /// Returns the name so the email can be addressed - never returned to the
    /// caller of the API, which answers identically whether or not the address
    /// exists.
    ///
    /// Status: 1 issued, 0 no such active account.
    /// </summary>
    Task<(int Status, string? FirstName, string? LastName, string? Email)>
        CreateResetTokenAsync(string email, string tokenHash, DateTime expiresAtUtc, string? requestedIp);

    /// <summary>
    /// Claims the token AND sets the password in ONE transaction.
    ///
    /// The old signature returned a user id, which forced the password update
    /// to be a second call - and two calls cannot be atomic. A failure between
    /// them burnt the token without changing the password.
    ///
    /// Status: 1 reset, -1 unknown / used / superseded / expired, -2 inactive.
    /// </summary>
    Task<(int Status, string? Email, string? FirstName, string? RoleName)>
        ConsumeResetTokenAsync(string tokenHash, string newPasswordHash, string? consumedIp);

    /* ---------- Google Sign-In ---------- */

    /// <summary>
    /// The returning-user lookup. Keyed on the Google 'sub' claim, never on
    /// email - an email can change, a sub cannot.
    /// </summary>
    Task<User?> GetByGoogleSubjectAsync(string googleSubjectId);

    /// <summary>
    /// Attaches a Google identity to an account that already exists. Called
    /// only after the API has confirmed Google marked the address verified.
    ///
    /// Status: 1 linked, -1 no such active account,
    ///        -2 already linked to a DIFFERENT Google account,
    ///        -3 that Google account belongs to a different user.
    /// </summary>
    Task<int> LinkGoogleAsync(string email, string googleSubjectId, string? avatarUrl);

    /// <summary>
    /// Creates a new GUEST from a Google identity. There is deliberately no
    /// role parameter - an administrator is created by an administrator.
    ///
    /// Status: 1 created, -1 email taken, -2 Google account taken.
    /// </summary>
    Task<(int Status, int? UserId)> RegisterGoogleAsync(
        string userCode, string firstName, string lastName,
        string email, string googleSubjectId, string? avatarUrl);

    /// <summary>Detaches it. Refused when no password is set.</summary>
    Task<int> UnlinkGoogleAsync(int userId);

    // Added by 02_Auth_Security.sql
    Task LoginSucceededAsync(int userId, string? ipAddress);
    Task<(int Attempts, DateTime? LockoutEndUtc)> LoginFailedAsync(
        int userId, int maxAttempts, int lockoutMinutes);
    Task WriteLoginAuditAsync(int? userId, string email, string? roleName,
                              bool succeeded, string? failureReason,
                              string? ipAddress, string? userAgent);
}