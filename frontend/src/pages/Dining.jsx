import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Clock,
  Users,
  CheckCircle2,
  UtensilsCrossed,
  Sparkles,
  Leaf,
  Wine,
  Flame,
  CalendarCheck,
  ArrowRight,
  ArrowLeft,
  Award,
  Info,
  X,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  AlertCircle,
  UserCheck,
  Send,
  GlassWater
} from 'lucide-react';
import {
  useGetDiningVenuesQuery,
  useCheckDiningAvailabilityQuery,
  useCreateDiningReservationMutation,
} from '../features/rooms/roomsApi';
import { selectIsAuthenticated, selectCurrentUser } from '../features/auth/authSlice';
import Button from '../components/common/Button';

/* Venues come from GET /api/dining/venues rather than diningVenues.json.
   Three things the file could not do: an administrator could not change
   opening hours or a chef without a redeploy, "Reserve a Table" had nowhere
   to go, and nothing knew how many covers a sitting had already taken. */

const money = (value) => `Rs.${Number(value ?? 0).toLocaleString()}`;

/* Sittings offered in the booking form. A venue's real hours are prose in
   OpeningHours, so this is a sensible common set rather than derived text. */
const SITTINGS = [
  '12:00', '12:30', '13:00', '13:30',
  '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

function FadeSection({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Culinary Pillars Data
const CULINARY_PILLARS = [
  {
    icon: Leaf,
    title: "Farm-to-Forest Pantry",
    desc: "Organic botanicals and indigenous herbs harvested daily from our 12-acre rainforest grove and partner bio-farms."
  },
  {
    icon: Wine,
    title: "400+ Cellar Selections",
    desc: "Curated natural, biodynamic, and single-estate vintages from small producers across the Southern Hemisphere."
  },
  {
    icon: GlassWater,
    title: "Botanical Spirits",
    desc: "Bespoke cocktails featuring 50-year barrel-aged Ceylon arrack, hand-pressed sugarcane, and jungle infusions."
  },
  {
    icon: Flame,
    title: "Private Jungle Chef",
    desc: "Exclusive treetop platform dining, starlit beach barbecues, and custom in-villa multi-course tasting menus."
  }
];


/* --------------------------------------------------------------------------
   Full-Page Guest Table Reservation Workspace View
   -------------------------------------------------------------------------- */
function DiningReservationView({ venue, onClose, isAuthenticated, currentUser }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState(() => ({
    date: today,
    time: '19:30',
    partySize: 2,
    guestName:
      `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim(),
    email: currentUser?.email ?? '',
    phone: currentUser?.phone ?? '',
    occasion: 'Casual Dining',
    dietaryNotes: '',
    specialRequests: '',
    stayReference: '',
  }));

  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const [createReservation, { isLoading: booking }] =
    useCreateDiningReservationMutation();

  const { data: availability, isFetching: checking } =
    useCheckDiningAvailabilityQuery(
      {
        slug: venue.slug,
        date: form.date,
        time: form.time,
        partySize: Number(form.partySize),
      },
      { skip: !isAuthenticated || !form.date || !form.time },
    );

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setFormError('');

    if (!form.guestName.trim()) return setFormError('Please provide your name for the table booking.');
    if (!form.email.trim()) return setFormError('A valid email address is required.');
    if (Number(form.partySize) < 1) return setFormError('Party size must be at least 1 guest.');

    try {
      const result = await createReservation({
        venueId: venue.slug,
        date: form.date,
        time: form.time,
        partySize: Number(form.partySize),
        guestName: form.guestName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        occasion: form.occasion.trim() || undefined,
        dietaryNotes: form.dietaryNotes.trim() || undefined,
        specialRequests: form.specialRequests.trim() || undefined,
        stayReference: form.stayReference.trim() || undefined,
      }).unwrap();

      setConfirmation(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err?.data?.message || 'Your table could not be reserved. The sitting may be at full capacity.');
    }
  };

  const inputClass =
    'w-full px-4 py-3 text-xs sm:text-sm bg-white border border-outline-variant/40 rounded-xl ' +
    'text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all';

  return (
    <div
      className="pb-28 relative min-h-screen"
      style={{ backgroundColor: 'var(--color-surface, #f9f9f8)' }}
    >
      {/* ── Decorative Background Sketch ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          backgroundImage: "url('/assets/images/loading-sketch.png')",
          backgroundSize: '100% 100%',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.18,
        }}
      />

      <div className="relative z-10">
        {/* ── HERO BANNER & BREADCRUMB ── */}
        <section className="relative w-full h-[45vh] min-h-[420px] flex items-end overflow-hidden mb-10 pt-20 pb-10">
          <img
            src={venue.image || '/assets/images/dining/canopy-table-02.jpg'}
            alt={venue.name}
            className="img-cover absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-wood via-deep-wood/70 to-deep-wood/40" />

          <div className="container-resort max-w-6xl mx-auto px-4 sm:px-6 relative z-10 w-full text-white">
            {/* Breadcrumb row */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sand/80 mb-4">
              <Link to="/" className="hover:text-amber-300 transition-colors">
                Home
              </Link>
              <span>/</span>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-amber-300 transition-colors cursor-pointer"
              >
                Dining Venues
              </button>
              <span>/</span>
              <span className="text-amber-300 font-bold">
                Table Reservation
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer mr-1"
                  >
                    <ArrowLeft size={14} /> Back to Directory
                  </button>

                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-deep-wood/90 text-amber-300 backdrop-blur-md rounded-md border border-primary/40">
                    {venue.type}
                  </span>

                  {venue.cuisine && (
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white/15 text-white backdrop-blur-md rounded-md border border-white/20">
                      {venue.cuisine}
                    </span>
                  )}
                </div>

                <h1
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-md italic"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Reserve a Table at {venue.name}
                </h1>

                {venue.tagline && (
                  <p className="text-xs sm:text-sm text-white/85 max-w-2xl font-medium italic">
                    &ldquo;{venue.tagline}&rdquo;
                  </p>
                )}
              </div>

              {/* Quick Meta Pills */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/90 bg-black/40 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl self-start md:self-auto">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" /> {venue.openHours}
                </span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1.5">
                  <Award size={14} className="text-amber-400" /> {venue.dressCode || 'Resort Casual'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── MAIN RESERVATION CONTENT GRID ── */}
        <div className="container-resort max-w-6xl mx-auto px-4 sm:px-6">
          {!isAuthenticated ? (
            /* Signed-out Prompt */
            <div className="p-8 sm:p-12 bg-white border-2 border-primary/20 rounded-3xl shadow-sm text-center max-w-2xl mx-auto space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 border border-primary/20">
                <UserCheck size={32} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono block mb-1">
                  Guest Authentication Required
                </span>
                <h3
                  className="text-2xl sm:text-3xl font-bold text-deep-wood"
                  style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                >
                  Sign in to reserve your table
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-deep-wood/75 max-w-md mx-auto leading-relaxed">
                Table reservations are synchronized with your Aviora profile, allowing you to review seating details, dietary requests, and cancellations seamlessly from your itinerary desk.
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={`/login?redirect=/dining`}
                  className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <UserCheck size={16} /> Sign In to Continue
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3.5 rounded-xl bg-surface-container-high text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  Return to Dining
                </button>
              </div>
            </div>
          ) : confirmation ? (
            /* Confirmation Receipt View */
            <div className="p-8 sm:p-12 bg-white border-2 border-emerald-500/40 rounded-3xl shadow-lg max-w-3xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block font-mono mb-1">
                  Booking Confirmed
                </span>
                <h2
                  className="text-3xl sm:text-4xl font-bold text-deep-wood"
                  style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                >
                  Your table at {venue.name} is reserved
                </h2>
              </div>

              <div className="p-6 bg-surface-container-low border border-primary/20 rounded-2xl max-w-xl mx-auto text-left space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <span className="text-xs font-semibold text-deep-wood/60">
                    Reservation Reference Code
                  </span>
                  <span className="text-lg font-bold text-primary font-mono tracking-wider">
                    {confirmation.referenceId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-deep-wood/60 block text-[11px] font-semibold">Date &amp; Sitting Time</span>
                    <span className="font-bold text-deep-wood text-sm">{form.date} at {form.time}</span>
                  </div>
                  <div>
                    <span className="text-deep-wood/60 block text-[11px] font-semibold">Party Headcount</span>
                    <span className="font-bold text-deep-wood text-sm">{form.partySize} Guest{Number(form.partySize) === 1 ? '' : 's'}</span>
                  </div>
                  <div>
                    <span className="text-deep-wood/60 block text-[11px] font-semibold">Primary Guest</span>
                    <span className="font-bold text-deep-wood text-sm">{form.guestName}</span>
                  </div>
                  <div>
                    <span className="text-deep-wood/60 block text-[11px] font-semibold">Venue Dress Code</span>
                    <span className="font-bold text-deep-wood text-sm">{venue.dressCode || 'Resort Casual'}</span>
                  </div>
                </div>

                {form.dietaryNotes && (
                  <div className="pt-2 border-t border-outline-variant/20 text-xs">
                    <span className="text-deep-wood/60 block text-[11px] font-semibold">Dietary &amp; Sourcing Notes</span>
                    <span className="font-medium text-amber-900 bg-amber-50 px-2 py-1 rounded inline-block mt-0.5">{form.dietaryNotes}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-deep-wood/70 max-w-md mx-auto leading-relaxed">
                A confirmation has been linked to your guest account. For any modifications, please contact the dining desk at least {venue.cancellationNoticeHours || 4} hours before your sitting.
              </p>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-98"
                >
                  Return to Dining Directory
                </button>
              </div>
            </div>
          ) : (
            /* Active 2-Column Table Reservation Form Grid */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form (8 Cols) */}
              <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
                {/* Section 1: Sitting & Party Size */}
                <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    <CalendarCheck size={18} className="text-primary" />
                    <h3
                      className="text-lg font-bold text-deep-wood"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontStyle: 'italic',
                      }}
                    >
                      Date &amp; Sitting Selection
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Reservation Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={today}
                        className={inputClass}
                        value={form.date}
                        onChange={(e) => set('date', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Party Size (Guests) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => set('partySize', Math.max(1, Number(form.partySize) - 1))}
                          className="w-11 h-11 rounded-xl bg-surface-container-high hover:bg-primary hover:text-white text-deep-wood font-bold text-base flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-outline-variant/30"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={40}
                          className={`${inputClass} text-center font-bold text-base`}
                          value={form.partySize}
                          onChange={(e) => set('partySize', Math.max(1, Number(e.target.value)))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => set('partySize', Math.min(40, Number(form.partySize) + 1))}
                          className="w-11 h-11 rounded-xl bg-surface-container-high hover:bg-primary hover:text-white text-deep-wood font-bold text-base flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-outline-variant/30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sittings Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-2">
                      Available Sittings <span className="text-red-500">*</span>
                    </label>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/50 block mb-1.5 font-mono">
                          Lunch Sittings
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {SITTINGS.slice(0, 4).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => set('time', t)}
                              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                                form.time === t
                                  ? 'bg-primary text-white border-primary shadow-xs'
                                  : 'bg-surface-container-low border-outline-variant/40 text-deep-wood hover:border-primary/40'
                              }`}
                            >
                              <Clock size={13} /> {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/50 block mb-1.5 font-mono">
                          Dinner &amp; Evening Sittings
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                          {SITTINGS.slice(4).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => set('time', t)}
                              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                                form.time === t
                                  ? 'bg-primary text-white border-primary shadow-xs'
                                  : 'bg-surface-container-low border-outline-variant/40 text-deep-wood hover:border-primary/40'
                              }`}
                            >
                              <Clock size={13} /> {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Covers Check Banner */}
                  {checking && (
                    <p className="text-xs text-deep-wood/60 font-semibold flex items-center gap-2 p-3 bg-surface-container-low rounded-xl">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      Verifying live table availability for {form.partySize} guests at {form.time}…
                    </p>
                  )}

                  {availability && !checking && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 border shadow-2xs ${
                        availability.available
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}
                    >
                      {availability.available ? (
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-700" />
                      ) : (
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-700" />
                      )}
                      <span className="leading-relaxed">{availability.message}</span>
                    </div>
                  )}
                </div>

                {/* Section 2: Guest Details & Occasion */}
                <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    <UserCheck size={18} className="text-primary" />
                    <h3
                      className="text-lg font-bold text-deep-wood"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontStyle: 'italic',
                      }}
                    >
                      Guest &amp; Occasion Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Primary Guest Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className={inputClass}
                        value={form.guestName}
                        onChange={(e) => set('guestName', e.target.value)}
                        placeholder="e.g. Praveen Dilshan"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className={inputClass}
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="e.g. guest@aviora.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        className={inputClass}
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        placeholder="e.g. +94 77 123 4567"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Special Occasion
                      </label>
                      <select
                        className={`${inputClass} cursor-pointer`}
                        value={form.occasion}
                        onChange={(e) => set('occasion', e.target.value)}
                      >
                        <option value="Casual Dining">Casual Dining</option>
                        <option value="Romantic Dinner">Romantic Dinner</option>
                        <option value="Anniversary">Anniversary Celebration</option>
                        <option value="Birthday">Birthday Gathering</option>
                        <option value="Honeymoon">Honeymoon Special</option>
                        <option value="Business Entertaining">Business Entertaining</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Culinary Notes & Stay Linking */}
                <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    <Leaf size={18} className="text-primary" />
                    <h3
                      className="text-lg font-bold text-deep-wood"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontStyle: 'italic',
                      }}
                    >
                      Dietary Notes &amp; Villa Stay Linking
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Dietary Requirements &amp; Allergies
                      </label>
                      <input
                        className={inputClass}
                        placeholder="e.g. Shellfish allergy, vegetarian, gluten-free, low sodium…"
                        value={form.dietaryNotes}
                        onChange={(e) => set('dietaryNotes', e.target.value)}
                      />
                      <p className="mt-1 text-[11px] text-deep-wood/60 font-medium">
                        Directly briefed to Head Chef {venue.chefName || ''} and the kitchen brigade prior to your sitting.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Seating Preferences &amp; Special Notes
                      </label>
                      <textarea
                        rows={2}
                        className={`${inputClass} resize-none leading-relaxed`}
                        placeholder="e.g. Preferred corner table, quiet atmosphere, high chair required…"
                        value={form.specialRequests}
                        onChange={(e) => set('specialRequests', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                        Staying at Aviora? (Villa Stay Reference)
                      </label>
                      <input
                        className={`${inputClass} font-mono uppercase`}
                        placeholder="e.g. AVR-100001"
                        value={form.stayReference}
                        onChange={(e) => set('stayReference', e.target.value.toUpperCase())}
                      />
                      <p className="mt-1 text-[11px] text-deep-wood/60 font-medium">
                        Optional. Links your dining reservation to your sanctuary booking for consolidated billing and room charges.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Error Banner */}
                {formError && (
                  <div className="p-4 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-start gap-2.5 shadow-sm">
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Action Bar */}
                <div className="p-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <span className="text-xs text-deep-wood/65 font-medium">
                    {venue.dressCode ? `Attire: ${venue.dressCode}` : 'Attire: Resort Casual'}
                  </span>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={booking || checking || availability?.available === false}
                      className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {booking ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      <span>Confirm Table Reservation</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Right Column: Sticky Reservation Summary & Highlights (4 Cols) */}
              <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
                {/* Live Reservation Summary Card */}
                <div className="p-6 bg-white border border-primary/25 rounded-2xl shadow-sm space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary block font-mono">
                    Reservation Overview
                  </span>

                  <div className="rounded-xl overflow-hidden border border-primary/20 bg-white shadow-xs">
                    <div className="relative h-36 bg-surface-container-high overflow-hidden">
                      <img
                        src={venue.image || '/assets/images/dining/canopy-table-02.jpg'}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-deep-wood/85 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase rounded-md tracking-wider">
                        {venue.type}
                      </div>
                      {venue.cuisine && (
                        <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium rounded-md">
                          {venue.cuisine}
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <h4
                        className="text-lg font-bold text-deep-wood italic"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {venue.name}
                      </h4>

                      <div className="space-y-2 text-xs border-t border-outline-variant/20 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-deep-wood/60">Selected Date:</span>
                          <span className="font-bold text-deep-wood">{form.date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-deep-wood/60">Sitting Time:</span>
                          <span className="font-bold text-primary font-mono">{form.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-deep-wood/60">Party Size:</span>
                          <span className="font-bold text-deep-wood">{form.partySize} Guest{Number(form.partySize) === 1 ? '' : 's'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-deep-wood/60">Occasion:</span>
                          <span className="font-semibold text-deep-wood">{form.occasion}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-deep-wood/60">Dress Code:</span>
                          <span className="font-semibold text-deep-wood">{venue.dressCode || 'Resort Casual'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Policy Callout */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-primary/15 text-[11px] text-deep-wood/70 space-y-1">
                    <p className="font-bold text-deep-wood">
                      Dining Reservation Policy
                    </p>
                    <p className="leading-relaxed">
                      Complimentary cancellation up to {venue.cancellationNoticeHours || 4} hours prior to sitting. Tables are held for 15 minutes past reservation time.
                    </p>
                  </div>
                </div>

                {/* Chef Profile Card */}
                {venue.chefName && (
                  <div className="p-5 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
                      <ChefHat size={16} className="text-primary" />
                      <span className="text-xs font-bold text-deep-wood">
                        Head Chef {venue.chefName}
                      </span>
                    </div>

                    {venue.chefBio && (
                      <p className="text-xs text-deep-wood/75 leading-relaxed font-medium">
                        {venue.chefBio}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Full-Page Guest Venue Details & Sample Menu Workspace View
   -------------------------------------------------------------------------- */
function DiningDetailView({ venue, onClose, onReserve }) {
  return (
    <div
      className="pb-28 relative min-h-screen"
      style={{ backgroundColor: 'var(--color-surface, #f9f9f8)' }}
    >
      {/* ── Decorative Background Sketch ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          backgroundImage: "url('/assets/images/loading-sketch.png')",
          backgroundSize: '100% 100%',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.18,
        }}
      />

      <div className="relative z-10">
        {/* ── HERO BANNER & BREADCRUMB ── */}
        <section className="relative w-full h-[50vh] min-h-[460px] flex items-end overflow-hidden mb-12 pt-20 pb-12">
          <img
            src={venue.image || '/assets/images/dining/canopy-table-02.jpg'}
            alt={venue.name}
            className="img-cover absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-wood via-deep-wood/75 to-deep-wood/40" />

          <div className="container-resort max-w-6xl mx-auto px-4 sm:px-6 relative z-10 w-full text-white">
            {/* Breadcrumb row */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sand/80 mb-4">
              <Link to="/" className="hover:text-amber-300 transition-colors">
                Home
              </Link>
              <span>/</span>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-amber-300 transition-colors cursor-pointer"
              >
                Dining Venues
              </button>
              <span>/</span>
              <span className="text-amber-300 font-bold">
                {venue.name} Details &amp; Menu
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-white/20"
                  >
                    <ArrowLeft size={13} /> All Venues
                  </button>
                  <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-deep-wood/90 text-resort-white backdrop-blur-md rounded-xs border border-primary/40 shadow-xs flex items-center gap-1.5">
                    <UtensilsCrossed size={12} className="text-secondary" />
                    {venue.type}
                  </span>
                  <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xs">
                    {venue.cuisine}
                  </span>
                </div>

                <h1
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-sm"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontStyle: 'italic',
                  }}
                >
                  {venue.name}
                </h1>

                {venue.tagline && (
                  <p className="text-sm md:text-base text-sand font-medium italic max-w-2xl">
                    "{venue.tagline}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onReserve(venue)}
                  className="px-7 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <CalendarCheck size={16} /> Reserve a Table
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 12-COLUMN MAIN CONTENT WORKSPACE ── */}
        <div className="container-resort max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (8 Cols): Narrative, Ingredients, Sample Menu */}
            <div className="lg:col-span-8 space-y-8">
              {/* Venue Narrative & Culinary Concept */}
              <div className="p-6 sm:p-8 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                  <Sparkles size={18} className="text-primary" />
                  <h2
                    className="text-xl font-bold text-deep-wood"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontStyle: 'italic',
                    }}
                  >
                    Culinary Concept &amp; Sanctuary
                  </h2>
                </div>

                <p className="text-sm text-deep-wood/85 leading-relaxed font-medium">
                  {venue.description}
                </p>
              </div>

              {/* Key Ingredients & Culinary Highlights */}
              {venue.ingredients && venue.ingredients.length > 0 && (
                <div className="p-6 sm:p-8 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    <Leaf size={18} className="text-primary" />
                    <h3 className="text-lg font-bold text-deep-wood uppercase tracking-wider">
                      Key Ingredients &amp; Culinary Highlights
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {venue.ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-primary/15 text-xs text-deep-wood font-medium"
                      >
                        <CheckCircle2 size={16} className="text-primary shrink-0" />
                        <span>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Menu */}
              {venue.menu && venue.menu.length > 0 && (
                <div className="p-6 sm:p-8 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-primary/20">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed size={18} className="text-primary" />
                      <h3 className="text-lg font-bold text-deep-wood uppercase tracking-wider">
                        Sample Menu
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-deep-wood/50 uppercase tracking-widest font-mono">
                      Seasonal Tasting
                    </span>
                  </div>

                  <div className="space-y-8">
                    {venue.menu.map((section, sIdx) => (
                      <div key={section.title || sIdx} className="space-y-4">
                        <div className="pb-2 border-b border-primary/20">
                          <h4
                            className="text-xl font-bold text-deep-wood italic"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            {section.title}
                          </h4>
                          {section.subtitle && (
                            <p className="text-xs text-deep-wood/65 font-medium mt-0.5">
                              {section.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="space-y-4">
                          {section.items?.map((item, iIdx) => (
                            <div
                              key={item.name || iIdx}
                              className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4 mb-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="text-sm font-bold text-deep-wood">
                                    {item.name}
                                  </h5>
                                  {item.isSignature && (
                                    <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-wider">
                                      Signature
                                    </span>
                                  )}
                                  {item.isVegan ? (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                                      Vegan
                                    </span>
                                  ) : item.isVegetarian ? (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                                      Vegetarian
                                    </span>
                                  ) : null}
                                </div>

                                {item.price != null && (
                                  <span className="text-sm font-bold text-primary shrink-0">
                                    {money(item.price)}
                                  </span>
                                )}
                              </div>

                              {item.description && (
                                <p className="text-xs text-deep-wood/75 font-medium leading-relaxed mt-1">
                                  {item.description}
                                </p>
                              )}

                              {item.allergens && (
                                <p className="text-[11px] text-amber-800 font-semibold mt-1.5 flex items-center gap-1">
                                  <span className="font-bold">Contains:</span> {item.allergens}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="pt-4 border-t border-outline-variant/20 text-xs text-deep-wood/60 font-medium">
                    Prices exclude 34.38% government taxes and service charge. The menu changes with the season&apos;s harvest.
                  </p>
                </div>
              )}

              {/* Bottom Action Row */}
              <div className="p-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowLeft size={14} className="inline mr-1.5" /> Back to Dining Directory
                </button>

                <button
                  type="button"
                  onClick={() => onReserve(venue)}
                  className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <CalendarCheck size={16} /> Reserve a Table Now
                </button>
              </div>
            </div>

            {/* Right Column (4 Cols, Sticky Sidebar): Operational Specs & Chef Profile */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              {/* Operational Specs Grid Card */}
              <div className="p-6 bg-white border border-primary/25 rounded-2xl shadow-sm space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary block font-mono">
                  Venue Specifications
                </span>

                <div className="space-y-3.5 text-xs text-deep-wood">
                  <div className="p-3 bg-surface-container-low rounded-xl border border-primary/10">
                    <span className="text-deep-wood/60 block text-[11px] font-semibold mb-0.5">
                      Service Hours:
                    </span>
                    <span className="text-deep-wood font-bold text-sm flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" /> {venue.openHours}
                    </span>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl border border-primary/10">
                    <span className="text-deep-wood/60 block text-[11px] font-semibold mb-0.5">
                      Seating Capacity:
                    </span>
                    <span className="text-deep-wood font-bold text-sm flex items-center gap-1.5">
                      <Users size={14} className="text-primary" /> {venue.capacity} Guests
                    </span>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl border border-primary/10">
                    <span className="text-deep-wood/60 block text-[11px] font-semibold mb-0.5">
                      Recommended Attire:
                    </span>
                    <span className="text-deep-wood font-bold text-sm flex items-center gap-1.5">
                      <Award size={14} className="text-primary" /> {venue.dressCode}
                    </span>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl border border-primary/10">
                    <span className="text-deep-wood/60 block text-[11px] font-semibold mb-0.5">
                      Reservation Policy:
                    </span>
                    <span className="text-deep-wood font-bold text-sm flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-primary" />
                      {venue.reservationRequired ? "Required" : "Optional (Walk-ins Welcome)"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onReserve(venue)}
                  className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <CalendarCheck size={15} /> Book Table
                </button>
              </div>

              {/* Executive Chef Card */}
              {venue.chefName && (
                <div className="p-6 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-outline-variant/20">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                      <ChefHat size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/50 block font-mono">
                        Executive Culinary Lead
                      </span>
                      <span className="text-sm font-bold text-deep-wood">
                        {venue.chefName}
                      </span>
                    </div>
                  </div>

                  {venue.chefBio && (
                    <p className="text-xs text-deep-wood/75 leading-relaxed font-medium">
                      {venue.chefBio}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dining() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reserveSlug = searchParams.get('reserve');
  const menuSlug = searchParams.get('menu');

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMenuVenue, setSelectedMenuVenue] = useState(null);
  const [reserveVenue, setReserveVenue] = useState(null);

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const {
    data: venues = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDiningVenuesQuery();

  const handleStartReservation = (venue) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/dining?reserve=${venue.slug}`)}`, {
        state: {
          from: `/dining?reserve=${venue.slug}`,
          venueName: venue.name,
          venueCuisine: venue.cuisine,
          venueImage: venue.image,
          reason: 'dining_reservation',
          title: `Sign in to reserve a table at ${venue.name}`,
          message: `Table reservations are held against your account, so you can see and cancel them from anywhere.`,
        },
      });
      return;
    }
    setReserveVenue(venue);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (reserveSlug && venues.length > 0) {
      const match = venues.find(
        (v) => v.slug === reserveSlug || v.id === reserveSlug || String(v.id) === String(reserveSlug)
      );
      if (match) {
        if (!isAuthenticated) {
          navigate(`/login?redirect=${encodeURIComponent(`/dining?reserve=${match.slug}`)}`, {
            replace: true,
            state: {
              from: `/dining?reserve=${match.slug}`,
              venueName: match.name,
              venueCuisine: match.cuisine,
              venueImage: match.image,
              reason: 'dining_reservation',
              title: `Sign in to reserve a table at ${match.name}`,
              message: `Table reservations are held against your account, so you can see and cancel them from anywhere.`,
            },
          });
        } else {
          setReserveVenue(match);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  }, [reserveSlug, venues, isAuthenticated, navigate]);

  useEffect(() => {
    if (menuSlug && venues.length > 0 && !selectedMenuVenue && !reserveVenue) {
      const match = venues.find(
        (v) => v.slug === menuSlug || v.id === menuSlug || String(v.id) === String(menuSlug)
      );
      if (match) {
        setSelectedMenuVenue(match);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [menuSlug, venues, selectedMenuVenue, reserveVenue]);

  /* Filtering stays client-side: three venues is not worth a round trip, and
     the "private" pill is a cross-cut of `featured` rather than a type the
     API knows about. */
  const filteredVenues =
    activeFilter === 'all'
      ? venues
      : venues.filter(
          (v) => v.type === activeFilter || (activeFilter === 'private' && v.featured),
        );

  if (isLoading) {
    return (
      <div className="py-40 text-center">
        <Loader2 size={30} className="mx-auto animate-spin text-primary/50 mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-deep-wood/50">
          Loading the restaurants
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-40 text-center px-6">
        <AlertTriangle size={36} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-deep-wood">
          The restaurants could not be loaded.
        </h2>
        <p className="mt-1 text-xs text-deep-wood/60">
          {error?.data?.message || 'The resort system did not respond.'}
        </p>
        <button
          onClick={refetch}
          className="mt-5 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (selectedMenuVenue) {
    return (
      <DiningDetailView
        venue={selectedMenuVenue}
        onClose={() => {
          setSelectedMenuVenue(null);
          if (searchParams.get('menu')) {
            setSearchParams({}, { replace: true });
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onReserve={(venue) => {
          setSelectedMenuVenue(null);
          handleStartReservation(venue);
        }}
      />
    );
  }

  if (reserveVenue) {
    return (
      <DiningReservationView
        venue={reserveVenue}
        onClose={() => {
          setReserveVenue(null);
          if (searchParams.get('reserve')) {
            setSearchParams({}, { replace: true });
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div
      className="pb-24 relative"
      style={{ backgroundColor: 'var(--color-surface, #f9f9f8)' }}
    >
      {/* ── Decorative Background Sketch ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          backgroundImage: "url('/assets/images/loading-sketch.png')",
          backgroundSize: "100% 100%",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          opacity: 0.2,
        }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* ── FULL-WIDTH HERO HEADER BANNER ── */}
        <section className="relative w-full h-[55vh] min-h-[640px] flex items-center justify-center overflow-hidden mb-16 pt-20">
          <img
            src="/assets/images/dining/canopy-table-02.jpg"
            alt="A Cuisine of the Jungle & Ocean"
            className="img-cover absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/95 via-deep-wood/50 to-deep-wood/30" />

          <div className="relative z-10 container-resort text-center text-white max-w-4xl mx-auto px-6">
            <FadeSection>
              <span className="eyebrow-label text-amber-300 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-4 tracking-widest text-xs font-bold uppercase shadow-sm">
                <UtensilsCrossed size={14} className="text-amber-300" /> EPICUREAN EXPERIENCES AT AVIORA
              </span>
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-white drop-shadow-md"
                style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
              >
                A Cuisine of the Jungle &amp; Ocean
              </h1>
              <p
                className="text-sm md:text-base text-white/85 leading-relaxed max-w-2xl mx-auto mb-8 font-medium"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Three distinct culinary sanctuaries perched 15 metres above the forest floor. Where ancient Sri Lankan spice routes harmonize with contemporary gastronomy, organic harvests, and wild botanical mixology.
              </p>

              {/* Sleek bottom stats pill bar */}
              <div className="inline-flex flex-wrap items-center justify-center gap-4 md:gap-8 bg-black/40 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-xs font-semibold text-white/90 shadow-lg">
                <span className="flex items-center gap-2">
                  <UtensilsCrossed size={15} className="text-amber-400" /> 3 Signature Venues
                </span>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="flex items-center gap-2">
                  <Wine size={15} className="text-amber-400" /> 400+ Cellar Natural Wines
                </span>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="flex items-center gap-2">
                  <Leaf size={14} className="text-emerald-400" /> 100% Organic Farm Harvests
                </span>
              </div>
            </FadeSection>
          </div>
        </section>

        {/* ── CULINARY PILLARS HIGHLIGHT ROW ── */}
        <section className="container-resort max-w-6xl mx-auto mb-16">
          <FadeSection delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CULINARY_PILLARS.map((pillar, idx) => {
                const IconComponent = pillar.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 bg-surface-container-lowest border-2 border-primary/20 rounded-xl shadow-xs hover:border-primary/50 transition-all hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4">
                        <IconComponent size={22} strokeWidth={1.75} />
                      </div>
                      <h4
                        className="text-lg font-bold text-deep-wood mb-2"
                        style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                      >
                        {pillar.title}
                      </h4>
                      <p className="text-xs text-deep-wood/70 leading-relaxed font-medium">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeSection>
        </section>

        {/* ── VENUE CATEGORY FILTER TABS ── */}
        <section className="container-resort max-w-6xl mx-auto mb-12">
          <FadeSection delay={0.15}>
            <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-surface-container-high rounded-xl border-2 border-primary/30 max-w-2xl mx-auto">
              {[
                { id: 'all', label: 'All Venues' },
                { id: 'restaurant', label: 'Fine Dining' },
                { id: 'brasserie', label: 'Pool Brasserie' },
                { id: 'bar', label: 'Bar & Lounge' },
                { id: 'private', label: 'Featured Experiences' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={[
                    "px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5",
                    activeFilter === tab.id
                      ? "bg-primary text-white shadow-xs"
                      : "text-deep-wood/70 hover:text-deep-wood hover:bg-primary/10",
                  ].join(" ")}
                >
                  {tab.id === 'restaurant' && <UtensilsCrossed size={14} />}
                  {tab.id === 'brasserie' && <Leaf size={14} />}
                  {tab.id === 'bar' && <Wine size={14} />}
                  {tab.id === 'private' && <Sparkles size={14} />}
                  {tab.label}
                </button>
              ))}
            </div>
          </FadeSection>
        </section>

        {/* ── DINING VENUES LIST ── */}
        <section className="container-resort max-w-6xl mx-auto mb-20">
          <div className="space-y-12">
            {filteredVenues.map((venue, index) => {
              const isReverse = index % 2 !== 0;

              return (
                <FadeSection key={venue.id} delay={index * 0.1}>
                  <article
                    id={`venue-${venue.id}`}
                    className="bg-surface-container-lowest rounded-2xl shadow-xl border-2 border-primary/30 overflow-hidden hover:border-primary/60 transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 items-stretch"
                  >
                    {/* Image Column */}
                    <div
                      className={[
                        "relative overflow-hidden min-h-[380px] lg:min-h-[480px] lg:col-span-6 group",
                        isReverse ? "lg:order-2" : "lg:order-1",
                      ].join(" ")}
                    >
                      <img
                        src={venue.image}
                        alt={`${venue.name} — ${venue.cuisine}`}
                        loading="lazy"
                        className="img-cover absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/80 via-deep-wood/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-5 left-5 flex flex-wrap gap-2 z-10">
                        <span className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-deep-wood/90 text-resort-white backdrop-blur-md rounded-xs border border-primary/40 shadow-xs flex items-center gap-1.5">
                          <UtensilsCrossed size={12} className="text-secondary" />
                          {venue.type}
                        </span>
                        {venue.featured && (
                          <span className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-primary text-white rounded-xs shadow-xs flex items-center gap-1">
                            <Sparkles size={12} /> Signature Venue
                          </span>
                        )}
                      </div>

                      {/* Bottom Tagline Overlay */}
                      <div className="absolute bottom-5 left-5 right-5 p-4 bg-white/80 backdrop-blur-md rounded-lg border border-white/60 shadow-xs z-10">
                        <p
                          className="text-xs md:text-sm font-semibold text-deep-wood italic"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          "{venue.tagline}"
                        </p>
                      </div>
                    </div>

                    {/* Content Column */}
                    <div
                      className={[
                        "p-7 md:p-10 lg:col-span-6 flex flex-col justify-between bg-surface-container-lowest",
                        isReverse ? "lg:order-1" : "lg:order-2",
                      ].join(" ")}
                    >
                      <div>
                        {/* Cuisine Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full bg-secondary" />
                          <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                            {venue.cuisine}
                          </span>
                        </div>

                        {/* Title */}
                        <h2
                          className="text-2xl md:text-3xl font-bold text-deep-wood mb-4"
                          style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                        >
                          {venue.name}
                        </h2>

                        {/* Description */}
                        <p className="text-xs md:text-sm text-deep-wood/80 leading-relaxed mb-6 font-medium">
                          {venue.description}
                        </p>

                        {/* Key Info Meta Pills */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 bg-surface-container-low border border-primary/20 rounded-xl text-xs font-semibold text-deep-wood">
                          <div className="flex items-center gap-2">
                            <Clock size={15} className="text-primary shrink-0" />
                            <span>{venue.openHours}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={15} className="text-primary shrink-0" />
                            <span>{venue.capacity} Guest Covers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award size={15} className="text-primary shrink-0" />
                            <span>{venue.dressCode}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={15} className="text-primary shrink-0" />
                            <span>
                              {venue.reservationRequired ? "Reservation Recommended" : "Walk-in Welcome"}
                            </span>
                          </div>
                        </div>

                        {/* Chef Profile Card */}
                        <div className="mb-6 p-4 bg-white border-2 border-primary/30 rounded-xl flex items-start gap-3 shadow-xs">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <ChefHat size={20} strokeWidth={1.5} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-deep-wood">
                                Chef {venue.chefName}
                              </span>
                              <span className="text-[10px] bg-secondary/20 text-deep-wood px-2 py-0.5 rounded-full font-bold uppercase">
                                Culinary Lead
                              </span>
                            </div>
                            <p className="text-[11px] text-deep-wood/75 mt-1 leading-relaxed font-medium">
                              {venue.chefBio}
                            </p>
                          </div>
                        </div>

                        {/* Pantry & Signature Ingredients */}
                        {venue.ingredients && venue.ingredients.length > 0 && (
                          <div className="mb-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-deep-wood/60 block mb-2.5 flex items-center gap-1.5">
                              <Sparkles size={13} className="text-secondary" /> Signature Pantry Highlights
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {venue.ingredients.map((ing, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs text-deep-wood font-medium bg-surface-container p-2 rounded-lg border border-primary/10"
                                >
                                  <CheckCircle2 size={14} className="text-primary shrink-0" />
                                  <span className="truncate">{ing}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action CTA Buttons */}
                      <div className="pt-4 border-t-2 border-primary/20 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleStartReservation(venue)}
                            id={`dining-reserve-${venue.id}`}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          >
                            <CalendarCheck size={16} /> Reserve a Table
                          </button>

                          {!venue.reservationRequired && (
                            <span className="text-[11px] font-semibold text-deep-wood/65 flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-primary" /> Walk-ins also welcome
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedMenuVenue(venue);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-xs font-bold text-deep-wood hover:text-primary transition-colors flex items-center gap-1.5 underline decoration-primary/40 underline-offset-4 cursor-pointer"
                        >
                          <Info size={14} /> View Details &amp; Sample Menu
                        </button>
                      </div>
                    </div>
                  </article>
                </FadeSection>
              );
            })}
          </div>
        </section>

        {/* ── BESPOKE PRIVATE & IN-VILLA DINING SECTION ── */}
        <section className="container-resort max-w-6xl mx-auto mb-20">
          <FadeSection delay={0.2}>
            <div className="relative overflow-hidden rounded-2xl bg-deep-wood text-resort-white p-8 md:p-14 border-2 border-primary/40 shadow-2xl">
              {/* Decorative background image overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <img
                  src="/assets/images/dining/canopy-table-02.jpg"
                  alt="Private Dining"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8">
                  <span className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-secondary text-deep-wood rounded-xs inline-block mb-4">
                    EXCLUSIVE CURATION
                  </span>
                  <h3
                    className="text-3xl md:text-4xl font-bold mb-4 text-resort-white"
                    style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                  >
                    Bespoke Private &amp; In-Villa Dining
                  </h3>
                  <p className="text-xs md:text-sm text-resort-white/80 leading-relaxed max-w-2xl mb-6 font-medium">
                    Transform your villa terrace or a secluded jungle clearing into your personal restaurant. Our private dining team coordinates custom multi-course menus, dedicated sommelier service, live acoustic musician serenades, and candlelit decor.
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-resort-white/90">
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                      <Sparkles size={14} className="text-secondary" /> Starlit Canopy Table
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                      <UtensilsCrossed size={14} className="text-secondary" /> In-Villa Private Chef
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                      <Flame size={14} className="text-secondary" /> Beachside Flame BBQ
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-4 flex justify-start lg:justify-end">
                  <Button
                    href="/contact?subject=private-dining"
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto shadow-lg"
                  >
                    Request Private Chef <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </FadeSection>
        </section>

        {/* ── CHEF'S PHILOSOPHY QUOTE BANNER ── */}
        <section className="container-resort max-w-4xl mx-auto mb-20 text-center">
          <FadeSection delay={0.25}>
            <div className="p-8 md:p-12 bg-surface-container-low border-2 border-primary/30 rounded-2xl shadow-md relative">
              <div
                className="text-5xl font-heading text-primary select-none opacity-40 mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                “
              </div>
              <p
                className="text-lg md:text-2xl text-deep-wood leading-relaxed font-bold italic mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                "Every ingredient tells the story of the land and ocean it came from. Our cuisine does not attempt to alter nature, but to honor its wild perfection."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-px bg-primary/40" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Chef Priya Nair — Executive Culinary Director
                </span>
                <div className="w-8 h-px bg-primary/40" />
              </div>
            </div>
          </FadeSection>
        </section>

        {/* ── BOTTOM RESERVATION CTA BANNER ── */}
        <section className="container-resort max-w-5xl mx-auto">
          <FadeSection delay={0.3}>
            <div className="p-8 md:p-12 bg-surface-container-lowest border-2 border-primary rounded-2xl shadow-xl text-center">
              <h3
                className="text-2xl md:text-3xl font-bold text-deep-wood mb-3"
                style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
              >
                Ready to Experience Aviora Dining?
              </h3>
              <p className="text-xs md:text-sm text-deep-wood/70 max-w-xl mx-auto mb-6 font-medium">
                Reserve your table in advance or contact our resort concierge to arrange dietary preferences, wine pairings, or special occasion celebrations.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button href="/contact?subject=dining" variant="primary" size="lg">
                  <CalendarCheck size={18} className="mr-2" /> Book Table Online
                </Button>
                <Button href="/booking" variant="secondary" size="lg">
                  Explore Accommodations
                </Button>
              </div>
            </div>
          </FadeSection>
        </section>
      </div>
    </div>
  );
}

