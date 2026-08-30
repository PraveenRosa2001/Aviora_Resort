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
    Task<bool> CreateResetTokenAsync(string email, string tokenHash, DateTime expiresAt);
    Task<int?> ConsumeResetTokenAsync(string tokenHash);       // null = invalid or expired

    // Added by 02_Auth_Security.sql
    Task LoginSucceededAsync(int userId, string? ipAddress);
    Task<(int Attempts, DateTime? LockoutEndUtc)> LoginFailedAsync(
        int userId, int maxAttempts, int lockoutMinutes);
    Task WriteLoginAuditAsync(int? userId, string email, string? roleName,
                              bool succeeded, string? failureReason,
                              string? ipAddress, string? userAgent);
}