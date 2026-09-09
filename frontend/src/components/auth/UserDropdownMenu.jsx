import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CalendarCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  Crown,
  LayoutDashboard,
  Compass,
} from "lucide-react";
import { selectCurrentUser, logout } from "../../features/auth/authSlice";
import { useGetMyBookingsQuery } from "../../features/rooms/roomsApi";

export default function UserDropdownMenu({ isNavSolid = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  /* Reservations are rows in dbo.Bookings now, not a localStorage array.
     Skipped when signed out, because GET /api/bookings/my needs a token. */
  const { data: myBookings = [] } = useGetMyBookingsQuery(false, {
    skip: !user,
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const handleLogout = () => {
    setIsOpen(false);
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="relative inline-block text-left shrink-0" ref={dropdownRef}>
      {/* ── Trigger Pill ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className={[
          "group flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all duration-300 border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer",
          isNavSolid
            ? "bg-surface-container-high/60 hover:bg-surface-container-highest border-outline-variant/30 text-deep-wood"
            : "bg-white/10 hover:bg-white/20 border-white/20 text-resort-white shadow-xs backdrop-blur-md",
        ].join(" ")}
      >
        {/* Avatar / Initials */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-primary/40 shrink-0"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            {user.firstName?.[0] || "U"}
          </div>
        )}

        {/* User Name */}
        <span className="hidden sm:inline-block max-w-[90px] md:max-w-[120px] xl:max-w-[150px] truncate tracking-wide text-xs">
          {user.firstName || user.name}
        </span>

        {/* Role Badge */}
        {isAdmin ? (
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-primary text-white shrink-0">
            Staff
          </span>
        ) : (
          <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded bg-secondary/15 text-secondary shrink-0">
            Guest
          </span>
        )}

        <ChevronDown
          size={14}
          className={[
            "transition-transform duration-300 shrink-0",
            isOpen ? "rotate-180 text-primary" : "opacity-70",
          ].join(" ")}
        />
      </button>

      {/* ── Dropdown Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute right-0 mt-2.5 w-72 rounded-xl bg-surface border border-outline-variant/30 shadow-2xl overflow-hidden z-50 text-on-surface backdrop-blur-xl"
            style={{
              boxShadow:
                "0 20px 45px rgba(27, 24, 21, 0.22), 0 0 0 1px rgba(137, 114, 104, 0.15)",
            }}
          >
            {/* Header / Identity Banner */}
            <div className="p-4 bg-gradient-to-br from-deep-wood to-[#2a221b] text-resort-white relative overflow-hidden">
              {/* Subtle background glow */}
              <div
                className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary/30 blur-2xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="flex items-center gap-3 relative z-10">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-accent-gold/40 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center text-base font-bold shadow-sm shrink-0">
                    {user.firstName?.[0] || "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-sm font-bold text-white truncate"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {user.name}
                    </p>
                    {isAdmin && (
                      <ShieldCheck
                        size={14}
                        className="text-amber-400 flex-shrink-0"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-white/70 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Status pill in header */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-medium text-white/80">
                <span className="flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <Crown size={12} className="text-amber-400" />
                      <span>Resort Administration</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-amber-400" />
                      <span>
                        {user.membershipTier || "Aviora Privilege Member"}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-white/50">
                  Est. {user.memberSince || "2026"}
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="p-2 space-y-1">
              {/* Admin Portal Button (for staff) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-deep-wood hover:bg-primary/10 hover:text-primary transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                      <LayoutDashboard size={15} />
                    </div>
                    <div>
                      <span className="block font-bold">
                        Staff Admin Portal
                      </span>
                      <span className="text-[10px] text-deep-wood/60 font-normal">
                        Manage bookings & occupancy
                      </span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-primary text-white">
                    PRO
                  </span>
                </Link>
              )}

              {/* My Reservations */}
              <Link
                to="/booking?tab=my-bookings"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-deep-wood hover:bg-deep-wood/5 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors shrink-0">
                    <CalendarCheck size={15} />
                  </div>
                  <div>
                    <span className="block font-bold">My Reservations</span>
                    <span className="text-[10px] text-deep-wood/60 font-normal">
                      View vouchers & status
                    </span>
                  </div>
                </div>
                {myBookings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                    {myBookings.length}
                  </span>
                )}
              </Link>

              {/* Explore Villas */}
              <Link
                to="/rooms-villas"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-deep-wood hover:bg-deep-wood/5 transition-colors group"
              >
                <div className="w-7 h-7 rounded-md bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:bg-tertiary group-hover:text-white transition-colors shrink-0">
                  <Compass size={15} />
                </div>
                <div>
                  <span className="block font-bold">Explore Villas</span>
                  <span className="text-[10px] text-deep-wood/60 font-normal">
                    Browse private suites
                  </span>
                </div>
              </Link>
            </div>

            {/* Logout Footer */}
            <div className="p-2 border-t border-outline-variant/20 bg-surface-container-low/50/50">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
