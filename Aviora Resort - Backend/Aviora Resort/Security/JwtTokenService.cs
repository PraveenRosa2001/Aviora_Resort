using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using AvioraResort.Models.Entities;

namespace AvioraResort.Security;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config) => _config = config;

    public (string Token, DateTime ExpiresAt) CreateToken(User user)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];

        // A stolen guest token exposes one person's bookings. A stolen admin
        // token exposes every reservation and every guest record, so admin
        // sessions expire in hours rather than days.
        DateTime expiresAt;
        if (user.IsAdmin)
        {
            var minutes = int.TryParse(_config["Jwt:AdminExpiryMinutes"], out var m) ? m : 120;
            expiresAt = DateTime.UtcNow.AddMinutes(minutes);
        }
        else
        {
            var days = int.TryParse(_config["Jwt:ExpiryDays"], out var d) ? d : 7;
            expiresAt = DateTime.UtcNow.AddDays(days);
        }

        var claims = new[]
        {
            new Claim("uid",            user.UserId.ToString()),
            new Claim("userCode",       user.UserCode),
            new Claim(ClaimTypes.Name,  $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role,  user.RoleName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public string GenerateResetToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
                      .Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    public string HashResetToken(string rawToken)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
}