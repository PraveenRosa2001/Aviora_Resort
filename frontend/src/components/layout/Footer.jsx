import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Calendar,
  Lock,
  User,
} from 'lucide-react';

const mainNavigation = [
  { label: 'The Estate', to: '/' },
  { label: 'Villas & Suites', to: '/rooms-villas' },
  { label: 'Wellness & Spa', to: '/wellness' },
  { label: 'Dining & Wine', to: '/dining' },
  // { label: 'Experiences', to: '/sustainability' },
  { label: 'Contact & Concierge', to: '/contact' },
];

const guestServices = [
  { label: 'Reserve a Stay', to: '/booking' },
  { label: 'Guest & Staff Portal', to: '/login' },
  { label: 'Create Guest Profile', to: '/signup' },
  { label: 'My Reservations', to: '/booking?tab=my-bookings' },
  { label: 'Sustainability Charter', to: '/sustainability' },
];

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    hoverClass: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    hoverClass: 'hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: 'X (Twitter)',
    href: 'https://twitter.com',
    hoverClass: 'hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    hoverClass: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/94112345678',
    hoverClass: 'hover:bg-[#25D366] hover:text-white hover:border-[#25D366]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>
    ),
  },
];

import { useToast } from '../common/Toast';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
    setNewsletterSubscribed(true);
    showSuccess('Thank you! You are enrolled in the Aviora Gazette.', { title: 'Newsletter Subscribed' });
    setTimeout(() => {
      setNewsletterEmail('');
    }, 3000);
  };

  return (
    <footer
      id="site-footer"
      role="contentinfo"
      className="relative overflow-hidden text-white bg-deep-wood"
    >
      {/* ── Background Subtle Watermark & Glowing Accents ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: "url('/assets/images/loading-sketch.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-primary/15 blur-3xl pointer-events-none"
      />

      {/* ── Top Newsletter & Privilege Bar ── */}
      {/* <div className="relative z-10 border-b border-white/10 py-10 bg-black/20 backdrop-blur-sm">
        <div className="container-resort flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-amber-300 uppercase tracking-widest mb-2 backdrop-blur-md">
              <Sparkles size={13} className="text-amber-300" />
              <span>Aviora Privilege Gazette</span>
            </div>
            <h3
              className="text-2xl sm:text-3xl font-bold text-warm-sand mb-1"
              style={{
                fontFamily: 'var(--font-heading)',
                fontStyle: 'italic',
                color: 'var(--color-warm-sand, #F2E8CF)',
              }}
            >
              Receive Private Invitations & Gazette
            </h3>
            <p className="text-xs sm:text-sm text-white/70">
              Subscribe for confidential member privileges, private chef debuts, and seasonal villa previews.
            </p>
          </div>

          <div className="w-full lg:w-auto flex-1 max-w-md">
            {newsletterSubscribed ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Thank you. You are enrolled in the Aviora Gazette.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white text-xs sm:text-sm placeholder:text-white/40 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 transition-all backdrop-blur-md"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                >
                  <span>Join</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div> */}

      {/* ── Main Footer Navigation Grid (4 Columns) ── */}
      <div className="relative z-10 container-resort py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* 1. Brand & Heritage (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src="/assets/logo/Aviora Resort Logo - Without Background.png"
                alt="Aviora Resort Logo"
                className="h-10 w-auto object-contain brightness-110 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />
              <div>
                <span
                  className="text-2xl font-bold tracking-tight text-white block"
                  style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                >
                  Aviora Resort
                </span>
                <span className="text-[10px] tracking-[0.25em] uppercase text-amber-300/90 font-bold block font-mono">
                  Sanctuary of Grandeur
                </span>
              </div>
            </Link>

            <p className="text-xs text-white/70 leading-relaxed max-w-sm pt-2">
              An untouched peninsula sanctuary in the Seychelles Archipelago, where untamed rainforest wilderness merges with the pinnacle of ultra-luxury tropical living.
            </p>

            {/* Social Media Icons */}
            <div className="pt-3">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-300/80 mb-2.5 font-mono">
                Connect With Us
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow Aviora Resort on ${social.name}`}
                    className={[
                      "w-9 h-9 rounded-full bg-white/10 text-white/80 border border-white/15 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xs",
                      social.hoverClass,
                    ].join(" ")}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Navigation Elements (Matched with Navbar) (3 Cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300 mb-4 font-mono">
              The Estate & Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-white/75">
              {mainNavigation.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="hover:text-amber-300 transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-amber-400/60 group-hover:w-2 group-hover:bg-amber-400 transition-all" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Guest & Sanctuary Services (2 Cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300 mb-4 font-mono">
              Guest Services
            </h4>
            <ul className="space-y-2.5 text-xs text-white/75">
              {guestServices.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="hover:text-amber-300 transition-colors duration-200 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-amber-400/60 group-hover:w-2 group-hover:bg-amber-400 transition-all" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Direct Sanctuary Desk & Reservation (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300 mb-4 font-mono">
              Direct Sanctuary Desk
            </h4>

            <div className="space-y-3 text-xs text-white/80">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-amber-300 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Aviora Peninsula, Silhouette Island, Seychelles Archipelago
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-amber-300 flex-shrink-0" />
                <a href="tel:+94112345678" className="hover:text-amber-300 font-bold transition-colors">
                  +94 11 234 5678 (24/7 Desk)
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageSquare size={15} className="text-emerald-400 flex-shrink-0" />
                <a
                  href="https://wa.me/94112345678"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 hover:underline font-bold transition-colors"
                >
                  WhatsApp Concierge Line
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-amber-300 flex-shrink-0" />
                <a href="mailto:concierge@aviora.com" className="hover:text-amber-300 transition-colors">
                  concierge@aviora.com
                </a>
              </div>
            </div>

            {/* Direct Book Now CTA Button */}
            <div className="pt-2">
              <Link
                to="/booking"
                className="w-full py-2.5 px-4 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Calendar size={14} />
                <span>Reserve Your Villa</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Legal, Security & Copyright Bar ── */}
      <div className="relative z-10 border-t border-white/10 py-6 bg-black/40 text-xs text-white/55">
        <div className="container-resort flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass size={14} className="text-amber-400" />
            <span>
              © {currentYear} Aviora Resort Sanctuary. All Rights Reserved. Designed for Tropical Grandeur.
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={14} />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              Terms of Stay
            </Link>
            <span>•</span>
            <Link to="/sustainability" className="hover:text-white transition-colors">
              Sustainability Charter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
