import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Crown,
  Compass,
  ArrowLeft,
  X,
  Check,
} from "lucide-react";
import {
   performLogin,
  registerUser,
  clearAuthError,
  requestPasswordReset,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectAuthSuccessMessage,
} from "../features/auth/authSlice";
import { useToast } from "../components/common/Toast";

export default function AuthPage({ initialMode }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const successMessage = useSelector(selectAuthSuccessMessage);

  // Tab mode: 'login' | 'register'
  const isSignUpRoute =
    location.pathname === "/signup" || initialMode === "register";
  const [activeTab, setActiveTab] = useState(
    isSignUpRoute ? "register" : "login",
  );

  useEffect(() => {
    if (location.pathname === "/signup") {
      setActiveTab("register");
    } else if (location.pathname === "/login") {
      setActiveTab("login");
    }
  }, [location.pathname]);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErrors, setLoginErrors] = useState({});

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCountry, setRegCountry] = useState("United States");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [regErrors, setRegErrors] = useState({});

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  // Redirect target if specified e.g. /booking?step=2
  const redirectParam = searchParams.get("redirect");

  // If already authenticated, redirect smoothly
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      showSuccess(`Welcome back, ${currentUser.firstName || "Guest"}!`, { title: "Authentication Success" });
      const target =
        redirectParam || (currentUser.role === "admin" ? "/admin" : "/");
      const timer = setTimeout(() => {
        navigate(target, { replace: true });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser, navigate, redirectParam]);

  // Show auth error toast
  useEffect(() => {
    if (authError) {
      showError(authError, { title: "Authentication Error" });
    }
  }, [authError]);

  // Clean error on unmount or tab switch
  useEffect(() => {
    dispatch(clearAuthError());
    setLoginErrors({});
    setRegErrors({});
  }, [activeTab, dispatch]);

  const validateLogin = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginEmail.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(loginEmail.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!loginPassword) {
      errors.password = "Password is required";
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regFirstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!regLastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!regEmail.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(regEmail.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!regCountry.trim()) {
      errors.country = "Country of residence is required";
    }

    if (!regPassword) {
      errors.password = "Password is required";
    } else if (regPassword.length < 6) {
      errors.password = "Password must be at least 6 characters in length";
    }

    if (!regConfirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!agreeTerms) {
      errors.agreeTerms = "You must agree to the Terms of Stay to proceed";
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    dispatch(performLogin({ email: loginEmail, password: loginPassword }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!validateRegister()) return;

    dispatch(
      registerUser({
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        phone: regPhone,
        country: regCountry,
        password: regPassword,
      }),
    );
  };


  const handleResetPassword = async (e) => {
  e.preventDefault();
  setResetError("");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!resetEmail.trim()) {
    setResetError("Email address is required");
    return;
  }
  if (!emailRegex.test(resetEmail.trim())) {
    setResetError("Please enter a valid email address");
    return;
  }

  try {
    await requestPasswordReset(resetEmail);
    setResetSent(true);
    showSuccess(`Password reset instructions sent to ${resetEmail}`, { title: "Password Reset" });
    setTimeout(() => {
      setIsForgotPasswordOpen(false);
      setResetSent(false);
      setResetEmail("");
      setResetError("");
    }, 2500);
  } catch (err) {
    setResetError(err.message);
    showError(err.message || "Failed to send reset email.", { title: "Reset Error" });
  }
};

  return (
    <div className="min-h-screen w-full bg-[#fdfcfb] text-deep-wood flex flex-col lg:flex-row overflow-x-hidden pt-16 lg:pt-0">
      {/* ── LEFT PANE: Full-Bleed Cinematic Photography & Heritage (50% Width) ── */}
      <div className="relative w-full lg:w-1/2 min-h-[520px] lg:min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 text-white overflow-hidden">
        {/* Background Image */}
        <img
          src="/assets/images/hero-night.jpg"
          alt="Aviora Resort Estate"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Multi-Stop Dark Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-wood via-deep-wood/80 to-deep-wood/65 z-1" />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-wood/90 via-transparent to-deep-wood/70 z-1" />

        {/* Ambient Warm Golden Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none z-2"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl pointer-events-none z-2"
        />

        {/* Centered Main Content Wrapper */}
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col justify-center py-8">
          {/* Brand Header */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-3.5 group">
              <img
                src="/assets/logo/Aviora Resort Logo - Without Background.png"
                alt="Aviora Resort Logo"
                className="h-12 w-auto object-contain brightness-110 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />

              <div>
                <span
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-white block"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontStyle: "italic",
                  }}
                >
                  Aviora Resort
                </span>

                <span className="text-[10px] tracking-[0.25em] uppercase text-amber-300/90 font-bold block font-mono">
                  Sanctuary of Grandeur
                </span>
              </div>
            </Link>
          </div>

          {/* Main Heading */}
          <h2
            className="text-2.5xl sm:text-3.5xl xl:text-4xl font-bold leading-tight mb-4 text-white"
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
            }}
          >
            Where Untouched Wilderness Meets Timeless Luxury
          </h2>

          {/* Description */}
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed font-normal mb-6">
            Welcome to the dedicated Aviora Resort management and guest portal.
            Access personalized reservations, exclusive member privileges, and
            our 24/7 private concierge desk.
          </p>

          {/* Hospitality Feature Badges */}
          <div className="space-y-3.5 pt-4 border-t border-white/15 text-xs text-white/90">
            {/* Guest Privileges */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={12} />
              </div>

              <div>
                <strong className="text-white block font-semibold text-sm">
                  Bespoke Guest Privileges:
                </strong>
                <span className="text-white/85 text-[12px]">
                  Preferential rates, complimentary spa credits, and digital
                  check-in vouchers.
                </span>
              </div>
            </div>

            {/* Concierge */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Crown size={12} />
              </div>

              <div>
                <strong className="text-white block font-semibold text-sm">
                  24/7 Dedicated Concierge:
                </strong>
                <span className="text-white/85 text-[11px]">
                  Helicopter charters, private chef omakase, and curated
                  rainforest experiences.
                </span>
              </div>
            </div>

            {/* Administration */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck size={12} />
              </div>

              <div>
                <strong className="text-white block font-semibold text-sm">
                  Resort Administration Operations:
                </strong>
                <span className="text-white/85 text-[11px]">
                  Secure access for administration staff to manage reservations,
                  occupancy, and guest desks.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANE: Clean, Spacious Full-Bleed Authentication Canvas (50% Width) ── */}
      <div className="w-full lg:w-1/2 min-h-screen bg-[#fdfcfb] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 relative">
        {/* Centered Form Wrapper */}
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center my-auto py-8">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center mb-6">
            <div className="w-full grid grid-cols-2 p-1.5 bg-surface-container-high rounded-2xl border border-outline-variant/30">
              <button
                type="button"
                id="tab-sign-in"
                onClick={() => {
                  setActiveTab("login");
                  navigate(
                    "/login" +
                      (redirectParam
                        ? `?redirect=${encodeURIComponent(redirectParam)}`
                        : ""),
                    { replace: true },
                  );
                }}
                className={[
                  "py-2.5 sm:py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                  activeTab === "login"
                    ? "bg-primary text-white shadow-md"
                    : "text-deep-wood/70 hover:text-deep-wood",
                ].join(" ")}
              >
                <Lock size={14} />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                id="tab-sign-up"
                onClick={() => {
                  setActiveTab("register");
                  navigate(
                    "/signup" +
                      (redirectParam
                        ? `?redirect=${encodeURIComponent(redirectParam)}`
                        : ""),
                    { replace: true },
                  );
                }}
                className={[
                  "py-2.5 sm:py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                  activeTab === "register"
                    ? "bg-primary text-white shadow-md"
                    : "text-deep-wood/70 hover:text-deep-wood",
                ].join(" ")}
              >
                <User size={14} />
                <span>Create Guest Account</span>
              </button>
            </div>
          </div>

          {/* Reservation in Progress Banner */}
          {redirectParam?.includes("booking") && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-deep-wood text-xs flex items-start gap-3 shadow-xs"
            >
              <Sparkles
                size={16}
                className="text-secondary flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="font-bold text-deep-wood text-xs sm:text-sm">
                  Reservation in Progress
                </p>
                <p className="text-deep-wood/80 text-[11px] mt-0.5">
                  Please{" "}
                  {activeTab === "login"
                    ? "sign in to your account"
                    : "create your guest profile"}{" "}
                  to complete your villa reservation. Your selected dates and
                  suite preferences are preserved.
                </p>
              </div>
            </motion.div>
          )}

          {/* Global Backend Error Alert */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3 shadow-sm"
            >
              <AlertCircle
                size={18}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <span className="font-medium text-xs">{authError}</span>
            </motion.div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 shadow-sm"
            >
              <CheckCircle2
                size={18}
                className="text-emerald-600 flex-shrink-0"
              />
              <span className="font-semibold text-xs">
                {successMessage} Redirecting...
              </span>
            </motion.div>
          )}

          {/* ── FORM 1: SIGN IN (Unified for Guests & Administration Staff) ── */}
          {activeTab === "login" && (
            <motion.div
              key="login-form-view"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <div className="mb-6">
                <h1
                  className="text-2.5xl sm:text-3xl font-bold text-deep-wood mb-1.5"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Welcome to the Portal
                </h1>
                <p className="text-xs sm:text-sm text-deep-wood/70">
                  Enter your credentials to manage your guest reservations or
                  access the administration console.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-deep-wood/40">
                      <Mail size={16} />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginErrors.email) {
                          setLoginErrors((prev) => ({ ...prev, email: null }));
                        }
                      }}
                      placeholder="Enter your email address"
                      className={[
                        "w-full pl-10 pr-4 py-3 rounded-2xl bg-white border text-deep-wood text-xs sm:text-sm font-medium focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs",
                        loginErrors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                          : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                      ].join(" ")}
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{loginErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider">
                      Password <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-deep-wood/40">
                      <Lock size={16} />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginErrors.password) {
                          setLoginErrors((prev) => ({ ...prev, password: null }));
                        }
                      }}
                      placeholder="••••••••••••"
                      className={[
                        "w-full pl-10 pr-11 py-3 rounded-2xl bg-white border text-deep-wood text-xs sm:text-sm font-medium focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs",
                        loginErrors.password
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                          : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                      ].join(" ")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-deep-wood/50 hover:text-deep-wood cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{loginErrors.password}</span>
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-xs text-deep-wood/80 font-medium">
                      Remember this browser
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  id="login-submit-button"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Aviora</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── FORM 2: CREATE GUEST ACCOUNT (Guests Only) ── */}
          {activeTab === "register" && (
            <motion.div
              key="register-form-view"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <div className="mb-6">
                <h1
                  className="text-2.5xl sm:text-3xl font-bold text-deep-wood mb-1.5"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Create Your Guest Profile
                </h1>
                <p className="text-xs sm:text-sm text-deep-wood/70">
                  Register your guest account for instant villa confirmations,
                  voucher downloads, and elite benefits.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3.5">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1">
                      First Name <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      id="register-firstname"
                      type="text"
                      value={regFirstName}
                      onChange={(e) => {
                        setRegFirstName(e.target.value);
                        if (regErrors.firstName) {
                          setRegErrors((prev) => ({ ...prev, firstName: null }));
                        }
                      }}
                      placeholder="e.g. Elena"
                      className={[
                        "w-full px-3.5 py-2.5 rounded-2xl bg-white border text-deep-wood text-xs sm:text-sm font-medium focus:outline-none transition-all shadow-xs",
                        regErrors.firstName
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                          : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                      ].join(" ")}
                    />
                    {regErrors.firstName && (
                      <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{regErrors.firstName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1">
                      Last Name <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      id="register-lastname"
                      type="text"
                      value={regLastName}
                      onChange={(e) => {
                        setRegLastName(e.target.value);
                        if (regErrors.lastName) {
                          setRegErrors((prev) => ({ ...prev, lastName: null }));
                        }
                      }}
                      placeholder="e.g. Rostova"
                      className={[
                        "w-full px-3.5 py-2.5 rounded-2xl bg-white border text-deep-wood text-xs sm:text-sm font-medium focus:outline-none transition-all shadow-xs",
                        regErrors.lastName
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                          : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                      ].join(" ")}
                    />
                    {regErrors.lastName && (
                      <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{regErrors.lastName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1">
                      Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (regErrors.email) {
                          setRegErrors((prev) => ({ ...prev, email: null }));
                        }
                      }}
                      placeholder="elena@example.com"
                      className={[
                        "w-full px-3.5 py-2.5 rounded-2xl bg-white border text-deep-wood text-xs sm:text-sm font-medium focus:outline-none transition-all shadow-xs",
                        regErrors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                          : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                      ].join(" ")}
                    />
                    {regErrors.email && (
                      <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{regErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      id="register-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-outline-variant/60 text-deep-wood text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1">
                    Country of Residence <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={regCountry}
                    onChange={(e) => {
                      setRegCountry(e.target.value);
                      if (regErrors.country) {
                        setRegErrors((prev) => ({ ...prev, country: null }));
                      }
                    }}
                    placeholder="United States"
                    className={[
                      "w-full px-3.5 py-2.5 rounded-2xl bg-white border text-deep-wood text-xs sm:text-sm font-medium focus:outline-none transition-all shadow-xs",
                      regErrors.country
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                        : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                    ].join(" ")}
                  />
                  {regErrors.country && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{regErrors.country}</span>
                    </p>
                  )}
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1">
                      Password <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      id="register-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (regErrors.password) {
                          setRegErrors((prev) => ({ ...prev, password: null }));
                        }
                      }}
                      placeholder="Min 6 characters"
                      className={[
                        "w-full px-3.5 py-2.5 rounded-2xl bg-white border text-deep-wood text-xs sm:text-sm font-medium focus:outline-none transition-all shadow-xs",
                        regErrors.password
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                          : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                      ].join(" ")}
                    />
                    {regErrors.password && (
                      <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{regErrors.password}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1">
                      Confirm Password <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      id="register-confirmpassword"
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        if (regErrors.confirmPassword) {
                          setRegErrors((prev) => ({ ...prev, confirmPassword: null }));
                        }
                      }}
                      placeholder="Repeat password"
                      className={[
                        "w-full px-3.5 py-2.5 rounded-2xl bg-white border text-deep-wood text-xs sm:text-sm font-medium focus:outline-none transition-all shadow-xs",
                        regErrors.confirmPassword
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                          : "border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
                      ].join(" ")}
                    />
                    {regErrors.confirmPassword && (
                      <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{regErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        if (regErrors.agreeTerms) {
                          setRegErrors((prev) => ({ ...prev, agreeTerms: null }));
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-[11px] text-deep-wood/75 leading-normal">
                      I agree to the Aviora Sanctuary Terms of Stay and Privacy
                      Policy to receive reservation receipts and digital
                      concierge itineraries. <span className="text-red-500 font-bold ml-0.5">*</span>
                    </span>
                  </label>
                  {regErrors.agreeTerms && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1 pl-6">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{regErrors.agreeTerms}</span>
                    </p>
                  )}
                </div>

                {/* Action Submit */}
                <button
                  type="submit"
                  id="register-submit-button"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 mt-2"
                >
                  <User size={16} />
                  <span>Complete Guest Registration</span>
                </button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Bottom Footer Area */}
        <div className="w-full max-w-lg mx-auto pt-6 border-t border-outline-variant/20 flex flex-wrap items-center justify-between text-xs text-deep-wood/60 gap-3">
          <div className="flex items-center gap-2">
            <Compass size={14} className="text-primary" />
            <span>Aviora Resort Sanctuary Concierge</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:+94112345678"
              className="hover:text-primary font-bold transition-colors"
            >
              +94 11 234 5678
            </a>
            <span>•</span>
            <Link
              to="/contact"
              className="hover:text-primary transition-colors"
            >
              Inquiries & Assistance
            </Link>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Recovery Dialog ── */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-wood/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-outline-variant/40 relative"
            >
              <button
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setResetError("");
                }}
                className="absolute top-5 right-5 p-1.5 rounded-full text-deep-wood/50 hover:text-deep-wood hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3.5">
                <KeyRound size={22} />
              </div>

              <h3
                className="text-xl font-bold text-deep-wood mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Reset Your Password
              </h3>
              <p className="text-xs text-deep-wood/70 mb-5">
                Enter your registered email address and our concierge system
                will dispatch secure password recovery instructions.
              </p>

              {resetSent ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                  <CheckCircle2
                    size={18}
                    className="text-emerald-600 flex-shrink-0"
                  />
                  <span className="font-medium">
                    Password recovery instructions dispatched to {resetEmail}.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} noValidate className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (resetError) setResetError("");
                      }}
                      placeholder="Enter your registered email"
                      className={[
                        "w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm text-deep-wood font-medium focus:outline-none transition-all",
                        resetError
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                          : "border-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      ].join(" ")}
                    />
                    {resetError && (
                      <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{resetError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary-container transition-colors cursor-pointer shadow-md"
                  >
                    Send Recovery Link
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
