import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  Clock,
  X,
} from "lucide-react";
import { submitPasswordReset } from "../../features/auth/authSlice";

const RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "A number", test: (v) => /\d/.test(v) },
];

const inputClass =
  "w-full pl-10 pr-11 py-3 text-xs sm:text-sm bg-white border border-outline-variant/60 rounded-2xl " +
  "text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "focus:outline-none shadow-xs transition-all placeholder:text-deep-wood/40";

export default function ResetPasswordModal({ isOpen = true, onClose }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [isLoading, setIsLoading] = useState(false);

  const passed = useMemo(() => RULES.filter((r) => r.test(password)), [password]);
  const strong = passed.length === RULES.length;
  const matches = password.length > 0 && password === confirm;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/login");
    }
  };

  /* On success, transition smoothly to sign in */
  useEffect(() => {
    if (!done) return;
    if (countdown <= 0) {
      handleClose();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [done, countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!strong) {
      setError("Please choose a password that meets all four requirements.");
      return;
    }
    if (!matches) {
      setError("The two passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await submitPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err?.message ||
          "This reset link is invalid, has expired, or has already been used.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderHeader = (label, title, Icon) => (
    <div className="px-6 sm:px-8 py-5 bg-deep-wood text-resort-white relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
            <Icon size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300 block font-mono mb-0.5">
              {label}
            </span>
            <h2
              className="text-lg sm:text-xl font-bold text-sand italic leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {title}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close recovery modal"
          className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-wood/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden relative my-auto"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {/* Arrived without token */}
          {!token && (
            <>
              {renderHeader("Account Security", "Link Not Recognised", AlertTriangle)}
              <div className="p-6 sm:p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3.5">
                  <AlertTriangle size={28} />
                </div>
                <h3
                  className="text-lg font-bold text-deep-wood mb-1.5"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Invalid Recovery Link
                </h3>
                <p className="text-xs sm:text-sm text-deep-wood/75 leading-relaxed mb-6">
                  This recovery dialog opens from a secure link sent to your email.
                  Please request a password reset link from the sign-in screen.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-[0.99]"
                >
                  Back to Sign In <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {/* Password reset completed */}
          {token && done && (
            <>
              {renderHeader("Account Security", "Password Changed", CheckCircle2)}
              <div className="p-6 sm:p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3.5">
                  <CheckCircle2 size={32} />
                </div>
                <h3
                  className="text-lg font-bold text-deep-wood mb-1.5"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Password Updated
                </h3>
                <p className="text-xs sm:text-sm text-deep-wood/80 leading-relaxed mb-2 font-medium">
                  Your password has been successfully updated and your reset token is spent.
                </p>
                <p className="text-xs text-deep-wood/60 leading-relaxed mb-6">
                  If your account was temporarily locked, that has also been cleared. You can now sign in.
                </p>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  Sign In Now <ArrowRight size={14} />
                </button>

                <p className="mt-3 text-[11px] text-deep-wood/50 font-medium">
                  Taking you to sign in in {countdown}s…
                </p>
              </div>
            </>
          )}

          {/* New password form */}
          {token && !done && (
            <>
              {renderHeader("Account Security", "Choose a New Password", KeyRound)}

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-surface-container-low border border-primary/20">
                  <Clock size={15} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-deep-wood/75 leading-relaxed font-medium">
                    This link works once and expires 30 minutes after dispatch. If it has lapsed, request another from the sign-in page.
                  </p>
                </div>

                {/* New Password Input */}
                <div>
                  <label
                    htmlFor="new-password-modal"
                    className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5"
                  >
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-wood/40 pointer-events-none"
                    />
                    <input
                      id="new-password-modal"
                      type={showPassword ? "text" : "password"}
                      className={inputClass}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-deep-wood/40 hover:text-deep-wood cursor-pointer p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Rules Indicators */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 p-3 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30">
                  {RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <span
                        key={rule.id}
                        className={[
                          "text-[11px] font-semibold flex items-center gap-1.5 transition-colors",
                          ok ? "text-emerald-700" : "text-deep-wood/45",
                        ].join(" ")}
                      >
                        <CheckCircle2 size={12} className={ok ? "text-emerald-600 shrink-0" : "opacity-35 shrink-0"} />
                        <span>{rule.label}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label
                    htmlFor="confirm-password-modal"
                    className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <ShieldCheck
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-wood/40 pointer-events-none"
                    />
                    <input
                      id="confirm-password-modal"
                      type={showPassword ? "text" : "password"}
                      className={[
                        inputClass,
                        confirm.length > 0 && !matches
                          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                          : "",
                      ].join(" ")}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                    />
                  </div>
                  {confirm.length > 0 && !matches && (
                    <p className="mt-1.5 text-[11px] text-red-600 font-semibold flex items-center gap-1">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>The two passwords do not match.</span>
                    </p>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
                    <div className="flex-1">
                      <p>{error}</p>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mt-1 text-[11px] underline font-bold hover:text-red-900 cursor-pointer"
                      >
                        Request a new link
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !strong || !matches}
                  className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  <span>Change My Password</span>
                </button>

                <p className="text-[10px] text-center text-deep-wood/50 leading-relaxed pt-1">
                  Aviora Resort will never ask for your password by email or telephone.
                </p>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
