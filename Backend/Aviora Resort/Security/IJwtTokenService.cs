using AvioraResort.Models.Entities;
using AvioraResort.Models.Entities;

namespace AvioraResort.Security;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(User user);
    string GenerateResetToken();
    string HashResetToken(string rawToken);
}