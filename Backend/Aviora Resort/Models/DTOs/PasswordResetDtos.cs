using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

/// <summary>
/// What the API returns after a reset. The password is changed, so any token
/// the browser is still holding is for an account whose credentials have
/// moved — the client should discard it and sign in again.
/// </summary>
public class PasswordResetResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// True when the account was locked out and the reset cleared it. Worth
    /// telling the guest — being locked out is the most likely reason they
    /// started this, and silence would leave them expecting another refusal.
    /// </summary>
    public bool LockoutCleared { get; set; }
}