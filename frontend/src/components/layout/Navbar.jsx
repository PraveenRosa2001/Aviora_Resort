import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Menu, Moon, Sun, CalendarCheck, User } from "lucide-react";
import {
  toggleMobileMenu,
  toggleDayMode,
  setNavSolid,
  selectIsNavSolid,
  selectIsDayMode,
} from "../../features/ui/uiSlice";
import { useGetMyBookingsQuery } from "../../features/rooms/roomsApi";
import {
  selectIsAuthenticated,
} from "../../features/auth/authSlice";
import UserDropdownMenu from "../auth/UserDropdownMenu";

const navLinks = [
  { label: "The Estate", to: "/" },
  { label: "Villas", to: "/rooms-villas" },
  { label: "Wellness", to: "/wellness" },
  { label: "Dining", to: "/dining" },
  { label: "Experiences", to: "/sustainability" },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const isNavSolid = useSelector(selectIsNavSolid);
  const isDayMode = useSelector(selectIsDayMode);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  /* Active reservations for badge count. includeCancelled = false so a
     cancelled stay does not inflate active count. */
  const { data: myBookings = [] } = useGetMyBookingsQuery(false, {
    skip: !isAuthenticated,
  });
  const location = useLocation();
  const prevScrollY = useRef(0);

  const isHome = location.pathname === "/";

  useEffect(() => {
    if (!isHome) {
      dispatch(setNavSolid(true));
      return;
    }
    const handleScroll = () => {
      const y = window.scrollY;
      dispatch(setNavSolid(y > 80));
      prevScrollY.current = y;
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dispatch, isHome]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isHome) {
      dispatch(setNavSolid(true));
    } else {
      dispatch(setNavSolid(false));
    }
  }, [location.pathname, dispatch, isHome]);

  return (
    <motion.header
      id="navbar"
      role="banner"
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isNavSolid
          ? "bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 py-3 shadow-xs"
          : "bg-transparent py-5",
      ].join(" ")}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container-resort flex items-center justify-between">
        {/* ── Left: Logo + Text ── */}
        <Link
          to="/"
          id="nav-logo"
          aria-label="Aviora Resort — Home"
          className="flex-shrink-0 flex items-center gap-2.5"
        >
          <img
            src="/assets/logo/Aviora Resort Logo - Without Background.png"
            alt="Aviora Resort Logo"
            className="transition-all duration-300"
            style={{
              height: isNavSolid ? "36px" : "42px",
              width: "auto",
              objectFit: "contain",
              borderRadius: "4px",
            }}
          />
          <span
            className={[
              "transition-colors duration-300",
              isNavSolid ? "text-deep-wood" : "text-resort-white",
            ].join(" ")}
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Aviora Resort
          </span>
        </Link>

        {/* ── Center: Floating Pill Capsule Menu ── */}
        <nav
          id="desktop-nav"
          aria-label="Main navigation"
          className="hidden lg:flex items-center"
        >
          <div className="px-4 xl:px-7 py-2.5 rounded-full flex items-center gap-6 xl:gap-8 2xl:gap-10">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  [
                    "relative transition-colors duration-300 hover:text-primary whitespace-nowrap",
                    "text-xs font-extrabold uppercase tracking-[0.12em]",
                    isActive
                      ? "text-primary font-bold"
                      : isNavSolid
                        ? "text-deep-wood/100"
                        : "text-resort-white",
                  ].join(" ")
                }
                style={{ fontFamily: "var(--font-body)" }}
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="pill-active-underline"
                        className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ── Right: Social Icons & Controls ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Facebook */}
          <a
            id="nav-facebook"
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Facebook"
            className={[
              "p-2 rounded-full transition-all duration-300",
              isAuthenticated ? "hidden 2xl:inline-flex" : "inline-flex",
              "hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:scale-110",
              isNavSolid ? "text-deep-wood/70" : "text-resort-white/80",
            ].join(" ")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            id="nav-instagram"
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Instagram"
            className={[
              "p-2 rounded-full transition-all duration-300",
              isAuthenticated ? "hidden 2xl:inline-flex" : "inline-flex",
              "hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:scale-110",
              isNavSolid ? "text-deep-wood/70" : "text-resort-white/80",
            ].join(" ")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>

          {/* X (Twitter) */}
          <a
            id="nav-x-twitter"
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on X"
            className={[
              "p-2 rounded-full transition-all duration-300",
              isAuthenticated ? "hidden 2xl:inline-flex" : "inline-flex",
              "hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 hover:scale-110",
              isNavSolid ? "text-deep-wood/70" : "text-resort-white/80",
            ].join(" ")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* Divider */}
          <div
            className={[
              "w-px h-4 mx-1 transition-colors duration-300",
              isAuthenticated ? "hidden 2xl:block" : "block",
              isNavSolid ? "bg-deep-wood/15" : "bg-resort-white/25",
            ].join(" ")}
          />

          {/* Day / Night toggle */}
          <button
            id="day-night-toggle-nav"
            aria-label={
              isDayMode ? "Switch to night view" : "Switch to day view"
            }
            onClick={() => dispatch(toggleDayMode())}
            className={[
              "p-2 rounded-full transition-all duration-300 shrink-0 cursor-pointer",
              "hover:bg-deep-wood/5",
              isNavSolid ? "text-deep-wood/70" : "text-resort-white/80",
            ].join(" ")}
          >
            {isDayMode ? (
              <Moon size={16} strokeWidth={1.5} />
            ) : (
              <Sun size={16} strokeWidth={1.5} />
            )}
          </button>

          {/* Authentication Dropdown or Sign In CTA */}
          {isAuthenticated ? (
            <UserDropdownMenu isNavSolid={isNavSolid} />
          ) : (
            <Link
              to="/login"
              id="nav-signin-cta"
              className={[
                "hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border whitespace-nowrap shrink-0",
                isNavSolid
                  ? "text-deep-wood border-outline-variant/50 hover:bg-deep-wood/5 hover:text-primary"
                  : "text-resort-white border-white/30 hover:bg-white/10 hover:border-white/60",
              ].join(" ")}
            >
              <User size={13} />
              <span>Sign In</span>
            </Link>
          )}

          {/* My Bookings Button */}
          {isAuthenticated && myBookings.length > 0 && (
            <Link
              to="/booking?tab=my-bookings"
              id="nav-my-bookings"
              aria-label={`My Bookings (${myBookings.length})`}
              className={[
                "hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 border whitespace-nowrap shrink-0 group",
                isNavSolid
                  ? "bg-surface-container-high/60 hover:bg-surface-container-highest border-outline-variant/30 text-deep-wood hover:text-primary hover:border-primary/40 shadow-2xs"
                  : "bg-white/10 hover:bg-white/20 border-white/25 text-resort-white hover:border-white/50 backdrop-blur-md shadow-xs",
              ].join(" ")}
            >
              <CalendarCheck size={14} className="text-primary group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden lg:inline">My Bookings</span>
              <span className="px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-xs leading-none">
                {myBookings.length}
              </span>
            </Link>
          )}

          {/* Book Now Button */}
          <Link
            to="/booking"
            id="nav-reserve-cta"
            className={[
              "items-center px-4.5 xl:px-6 py-2 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md whitespace-nowrap shrink-0",
              isAuthenticated ? "hidden md:inline-flex" : "hidden lg:inline-flex",
            ].join(" ")}
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            Book Now
          </Link>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={false}
            onClick={() => dispatch(toggleMobileMenu())}
            className={[
              "lg:hidden p-2 transition-colors duration-300 cursor-pointer shrink-0",
              isNavSolid ? "text-deep-wood" : "text-resort-white",
            ].join(" ")}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
