import { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Instagram, Facebook, User, LogOut, ShieldCheck, CalendarCheck, LayoutDashboard } from 'lucide-react';
import { setMobileMenuOpen, selectIsMobileMenuOpen } from '../../features/ui/uiSlice';
import { selectCurrentUser, selectIsAuthenticated, logout } from '../../features/auth/authSlice';

const menuLinks = [
  { label: 'The Estate',   to: '/' },
  { label: 'Villas',       to: '/rooms-villas' },
  { label: 'Wellness',     to: '/wellness' },
  { label: 'Dining',       to: '/dining' },
  { label: 'Experiences',  to: '/sustainability' },
  { label: 'Gallery',      to: '/gallery' },
  { label: 'Contact',      to: '/contact' },
];

const containerVariants = {
  closed: { opacity: 0 },
  open: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  closed: { opacity: 0, x: -30 },
  open: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function MobileMenuOverlay() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const isMenuOpen = useSelector(selectIsMobileMenuOpen);
  const user       = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const close      = () => dispatch(setMobileMenuOpen(false));

  // Trap body scroll while open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleLogout = () => {
    close();
    dispatch(logout());
    navigate('/');
  };

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          id="mobile-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
          style={{ backgroundColor: 'var(--color-deep-wood)' }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 pt-8">
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontStyle: 'italic',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--color-warm-sand)',
              }}
            >
              Aviora Resort
            </span>
            <button
              id="mobile-menu-close"
              aria-label="Close navigation menu"
              onClick={close}
              className="p-2 transition-colors duration-300"
              style={{ color: 'var(--color-warm-sand)' }}
            >
              <X size={28} strokeWidth={1.5} />
            </button>
          </div>

          {/* User Status Strip */}
          <div className="px-8 mt-4">
            {isAuthenticated && user ? (
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between text-warm-sand">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-amber-400/50" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {user.firstName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                    <p className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">
                      {user.role === 'admin' ? '🛡️ Administration Staff' : user.membershipTier || 'Aviora Guest'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-white/60 hover:text-red-300 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={close}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={close}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 text-warm-sand border border-white/20 text-xs font-bold uppercase tracking-wider text-center"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-8 mt-5" style={{ height: '1px', background: 'rgba(242,232,207,0.15)' }} />

          {/* Nav links */}
          <motion.nav
            variants={containerVariants}
            initial="closed"
            animate="open"
            className="flex-1 flex flex-col justify-center px-8 gap-1 py-4"
            aria-label="Mobile navigation"
          >
            {menuLinks.map((link) => (
              <motion.div key={link.to} variants={itemVariants}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  id={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={close}
                  className={({ isActive }) => [
                    'block py-3 font-semibold transition-colors duration-300',
                    'text-2xl sm:text-3xl hover:text-primary',
                    isActive ? 'text-primary' : '',
                  ].join(' ')}
                  style={({ isActive }) => ({
                    fontFamily: 'var(--font-heading)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-warm-sand)',
                    borderBottom: '1px solid rgba(242,232,207,0.08)',
                  })}
                >
                  {link.label}
                </NavLink>
              </motion.div>
            ))}

            {/* If admin, add direct link in mobile nav */}
            {isAuthenticated && user?.role === 'admin' && (
              <motion.div variants={itemVariants}>
                <Link
                  to="/admin"
                  onClick={close}
                  className="flex items-center gap-2 py-3 text-lg font-bold text-amber-300 hover:text-white"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <LayoutDashboard size={20} />
                  <span>Admin Staff Portal</span>
                </Link>
              </motion.div>
            )}
          </motion.nav>

          {/* Footer area */}
          <div className="px-8 pb-8">
            <div className="mb-4" style={{ height: '1px', background: 'rgba(242,232,207,0.15)' }} />
            {/* Mobile Book Now CTA Button */}
            <div className="mt-4 mb-4">
              <Link
                to="/booking"
                onClick={close}
                className="w-full py-3 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <CalendarCheck size={16} />
                <span>Reserve Your Villa</span>
              </Link>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="tel:+94112345678"
                className="text-xs font-semibold uppercase tracking-widest transition-colors duration-300 hover:text-amber-300"
                style={{ fontFamily: 'var(--font-body)', color: 'rgba(242,232,207,0.7)' }}
              >
                +94 11 234 5678
              </a>
              <div className="flex gap-4">
                <a
                  id="mobile-social-instagram"
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow Aviora Resort on Instagram"
                  className="transition-all duration-300 text-white/70 hover:text-[#E4405F] hover:scale-110"
                >
                  <Instagram size={20} strokeWidth={1.5} />
                </a>
                <a
                  id="mobile-social-facebook"
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow Aviora Resort on Facebook"
                  className="transition-all duration-300 text-white/70 hover:text-[#1877F2] hover:scale-110"
                >
                  <Facebook size={20} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
