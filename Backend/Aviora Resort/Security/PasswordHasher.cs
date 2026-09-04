namespace AvioraResort.Security;

/// <summary>
/// BCrypt wrapper (NuGet: BCrypt.Net-Next).
/// The salt is generated per password and stored inside the hash string,
/// which is why dbo.Users has no separate salt column.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 11;

    public string Hash(string plainPassword) =>
        BCrypt.Net.BCrypt.HashPassword(plainPassword, WorkFactor);

    public bool Verify(string plainPassword, string storedHash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(plainPassword, storedHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;   // corrupt or truncated hash in the database
        }
    }
}