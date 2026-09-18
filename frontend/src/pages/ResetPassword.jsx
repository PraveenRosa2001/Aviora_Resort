import AuthPage from "./AuthPage";

/**
 * Where an emailed reset link lands (/reset-password?token=...).
 *
 * Rendered with the luxury Sign Up page as the background and the "Choose a New Password"
 * dialog presented as a focused modal overlay with glassmorphism backdrop blur.
 * Automatically clears any active logged-in session so users never recover an account
 * while signed in as another identity or navigating inside the resort website.
 */
export default function ResetPassword() {
  return <AuthPage initialMode="register" isResetPasswordRoute={true} />;
}
