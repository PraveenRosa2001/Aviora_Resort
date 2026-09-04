using Microsoft.Data.SqlClient;
using AvioraResort.Data;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

/// <summary>
/// Data access for dbo.Users and dbo.LoginAuditLog.
/// The only place ADO.NET touches user data. No business rules here.
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly SqlHelper _db;

    public UserRepository(SqlHelper db) => _db = db;

    /// <summary>Single mapping point - both SELECT procedures return these columns.</summary>
    private static User MapUser(SqlDataReader rd) => new()
    {
        UserId = rd.GetInt("UserId"),
        UserCode = rd.GetStringValue("UserCode"),
        FirstName = rd.GetStringValue("FirstName"),
        LastName = rd.GetStringValue("LastName"),
        Email = rd.GetStringValue("Email"),
        PasswordHash = rd.GetStringValue("PasswordHash"),
        Phone = rd.GetNullableString("Phone"),
        Country = rd.GetNullableString("Country"),
        RoleName = rd.GetStringValue("RoleName"),
        Title = rd.GetNullableString("Title"),
        AvatarUrl = rd.GetNullableString("AvatarUrl"),
        MembershipTier = rd.GetNullableString("MembershipTier"),
        MemberSince = rd.GetNullableInt("MemberSince"),
        IsActive = rd.GetBool("IsActive"),
        CreatedAt = rd.GetDate("CreatedAt"),
        UpdatedAt = rd.GetNullableDate("UpdatedAt"),

        FailedLoginAttempts = rd.GetInt("FailedLoginAttempts"),
        LockoutEndUtc = rd.GetNullableDate("LockoutEndUtc"),
        LastLoginAtUtc = rd.GetNullableDate("LastLoginAtUtc"),
        LastLoginIp = rd.GetNullableString("LastLoginIp")
    };

    public Task<bool> EmailExistsAsync(string email) =>
        _db.ExecuteScalarAsync<bool>("dbo.usp_User_EmailExists",
            p => p.AddWithValue("@Email", email));

    public Task<int> RegisterAsync(User user) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_User_Register", p =>
        {
            p.AddWithValue("@UserCode", user.UserCode);
            p.AddWithValue("@FirstName", user.FirstName);
            p.AddWithValue("@LastName", user.LastName);
            p.AddWithValue("@Email", user.Email);
            p.AddWithValue("@PasswordHash", user.PasswordHash);
            p.AddWithValue("@Phone", (object?)user.Phone ?? DBNull.Value);
            p.AddWithValue("@Country", (object?)user.Country ?? DBNull.Value);
            p.AddWithValue("@AvatarUrl", (object?)user.AvatarUrl ?? DBNull.Value);
            p.AddWithValue("@MembershipTier", (object?)user.MembershipTier ?? DBNull.Value);
        });

    public Task<User?> GetByEmailAsync(string email) =>
        _db.QuerySingleAsync("dbo.usp_User_GetByEmail",
            p => p.AddWithValue("@Email", email), MapUser);

    public Task<User?> GetByIdAsync(int userId) =>
        _db.QuerySingleAsync("dbo.usp_User_GetById",
            p => p.AddWithValue("@UserId", userId), MapUser);

    public async Task<bool> UpdateProfileAsync(int userId, string firstName, string lastName,
                                               string? phone, string? country, string? avatarUrl)
    {
        var rows = await _db.ExecuteScalarAsync<int>("dbo.usp_User_UpdateProfile", p =>
        {
            p.AddWithValue("@UserId", userId);
            p.AddWithValue("@FirstName", firstName);
            p.AddWithValue("@LastName", lastName);
            p.AddWithValue("@Phone", (object?)phone ?? DBNull.Value);
            p.AddWithValue("@Country", (object?)country ?? DBNull.Value);
            p.AddWithValue("@AvatarUrl", (object?)avatarUrl ?? DBNull.Value);
        });
        return rows > 0;
    }

    public async Task<bool> UpdatePasswordAsync(int userId, string passwordHash)
    {
        var rows = await _db.ExecuteScalarAsync<int>("dbo.usp_User_UpdatePassword", p =>
        {
            p.AddWithValue("@UserId", userId);
            p.AddWithValue("@PasswordHash", passwordHash);
        });
        return rows > 0;
    }

    public Task<bool> CreateResetTokenAsync(string email, string tokenHash, DateTime expiresAt) =>
        _db.ExecuteScalarAsync<bool>("dbo.usp_PasswordReset_Create", p =>
        {
            p.AddWithValue("@Email", email);
            p.AddWithValue("@TokenHash", tokenHash);
            p.AddWithValue("@ExpiresAt", expiresAt);
        });

    public Task<int?> ConsumeResetTokenAsync(string tokenHash) =>
        _db.QuerySingleAsync("dbo.usp_PasswordReset_Consume",
            p => p.AddWithValue("@TokenHash", tokenHash),
            rd => rd.GetNullableInt("UserId"));

    /* ---------------- login hardening ---------------- */

    public Task LoginSucceededAsync(int userId, string? ipAddress) =>
        _db.ExecuteNonQueryAsync("dbo.usp_User_LoginSucceeded", p =>
        {
            p.AddWithValue("@UserId", userId);
            p.AddWithValue("@IpAddress", (object?)ipAddress ?? DBNull.Value);
        });

    public async Task<(int Attempts, DateTime? LockoutEndUtc)> LoginFailedAsync(
        int userId, int maxAttempts, int lockoutMinutes)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_User_LoginFailed", p =>
        {
            p.AddWithValue("@UserId", userId);
            p.AddWithValue("@MaxAttempts", maxAttempts);
            p.AddWithValue("@LockoutMinutes", lockoutMinutes);
        },
        rd => (
            Attempts: rd.GetInt("FailedLoginAttempts"),
            LockoutEndUtc: rd.GetNullableDate("LockoutEndUtc")
        ));

        return row;
    }

    public Task WriteLoginAuditAsync(int? userId, string email, string? roleName,
                                     bool succeeded, string? failureReason,
                                     string? ipAddress, string? userAgent) =>
        _db.ExecuteNonQueryAsync("dbo.usp_LoginAudit_Insert", p =>
        {
            p.AddWithValue("@UserId", (object?)userId ?? DBNull.Value);
            p.AddWithValue("@Email", email);
            p.AddWithValue("@RoleName", (object?)roleName ?? DBNull.Value);
            p.AddWithValue("@Succeeded", succeeded);
            p.AddWithValue("@FailureReason", (object?)failureReason ?? DBNull.Value);
            p.AddWithValue("@IpAddress", (object?)ipAddress ?? DBNull.Value);
            p.AddWithValue("@UserAgent", (object?)userAgent ?? DBNull.Value);
        });
}