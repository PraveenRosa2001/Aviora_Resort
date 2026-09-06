import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  Star,
  Sparkles,
  ShieldCheck,
  SearchX,
  RotateCw,
  Maximize2,
  BedDouble,
  Eye,
  Waves,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Leaf,
  HeartHandshake,
  Coffee,
  Shield,
  Award,
} from "lucide-react";
import {
  setSelectedVillaId,
  selectCheckIn,
  selectCheckOut,
  selectAdults,
  selectChildren,
  setCheckIn,
  setCheckOut,
  setAdults,
  setChildren,
} from "../features/booking/bookingSlice";
import { useGetVillasQuery } from "../features/rooms/roomsApi";
import SEO from "../components/common/SEO";

/**
 * Price filter bounds, in LKR (Rs.).
 */
const PRICE_FLOOR = 2000;
const PRICE_CEILING = 50000;
const PRICE_STEP = 3000;

/**
 * Approximate statutory surcharge for guest informational purposes.
 */
const TAX_PERCENT_LABEL = "34.38%";

function FadeSection({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

const SANCTUARY_PILLARS = [
  {
    icon: Waves,
    title: "Private Infinity Plunge Pools",
    desc: "Each sanctuary features a private freshwater pool suspended above the rainforest canopy or lagoon surface.",
  },
  {
    icon: HeartHandshake,
    title: "Dedicated Butler Service",
    desc: "24-hour personalized concierge attending to in-villa dining, wellness journeys, and private excursions.",
  },
  {
    icon: Coffee,
    title: "Artisanal Ceylon Espresso Bar",
    desc: "Hand-selected single-estate tea harvests and locally roasted organic coffee freshly prepared in-villa.",
  },
  {
    icon: Leaf,
    title: "Zero-Carbon Biophilic Design",
    desc: "Handcrafted from reclaimed Ceylon teak and natural limestone with 100% solar energy and rainwater catchment.",
  },
];

function VillaSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-3xl border-2 border-primary/20 p-6 md:p-8 animate-pulse shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-4 h-64 bg-surface-container-high rounded-2xl" />
        <div className="lg:col-span-5 space-y-4">
          <div className="h-4 bg-surface-container-high rounded-full w-1/3" />
          <div className="h-7 bg-surface-container-high rounded-full w-3/4" />
          <div className="h-16 bg-surface-container-high rounded-2xl w-full" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 bg-surface-container-high rounded-xl" />
            <div className="h-8 bg-surface-container-high rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-3 h-48 bg-surface-container-high rounded-2xl" />
      </div>
    </div>
  );
}

export default function RoomsAndVillas() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const checkIn = useSelector(selectCheckIn);
  const checkOut = useSelector(selectCheckOut);
  const adults = useSelector(selectAdults);
  const children = useSelector(selectChildren);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING);

  const debouncedMaxPrice = useDebouncedValue(maxPrice, 400);

  // RTK Query: fetch from API
  const {
    data: apiVillas = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetVillasQuery({
    category: categoryFilter,
    view: viewFilter,
    maxPrice: debouncedMaxPrice < PRICE_CEILING ? debouncedMaxPrice : undefined,
    adults,
    children,
    sortBy,
    // Availability is date-specific. Without these the API returns an
    // indicative figure - the roomiest night in the next 90 days - instead of
    // what is actually free for this stay.
    checkIn,
    checkOut,
  });

  const displayVillas = apiVillas;

  const handleBookNow = (villaId) => {
    if (villaId) dispatch(setSelectedVillaId(villaId));
    navigate("/booking" + (villaId ? `?villa=${villaId}` : ""));
  };

  const handleSearch = () => {
    const targetId = displayVillas[0]?.id || "canopy-villa-01";
    handleBookNow(targetId);
  };

  const handleViewVilla = (villa, tab = "") => {
    const target = villa.slug || villa.id;
    navigate(`/rooms-villas/${target}${tab ? `?tab=${tab}` : ""}`);
  };

  const hasResults = displayVillas.length > 0;
  const showSkeleton = isLoading && apiVillas.length === 0;
  const showEmpty = !isLoading && !hasResults;

  return (
    <div
      className="pb-28 relative"
      style={{ backgroundColor: "var(--color-surface, #f9f9f8)" }}
    >
      <SEO
        title="Luxury Sanctuaries &amp; Villas | Aviora Resort"
        description="Explore 12 secluded architectural masterworks with private plunge pools, butler service, and panoramic rainforest vistas."
      />

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
            src="/assets/images/villas/canopy-villa-01.jpg"
            alt="Sanctuaries of Serenity at Aviora Resort"
            className="img-cover absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/95 via-deep-wood/50 to-deep-wood/30" />

          <div className="relative z-10 container-resort text-center text-white max-w-4xl mx-auto px-6">
            <FadeSection>
              <span className="eyebrow-label text-amber-300 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-4 tracking-widest text-xs font-bold uppercase shadow-sm">
                <Sparkles size={14} className="text-amber-300" /> LUXURY VILLA COLLECTION
              </span>
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-white drop-shadow-md"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontStyle: "italic",
                }}
              >
                Sanctuaries of Serenity
              </h1>
              <p
                className="text-sm md:text-base text-white/85 leading-relaxed max-w-2xl mx-auto mb-8 font-medium"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Secluded architectural masterworks nestled deep within the
                rainforest canopy and shimmering lagoon waters. Experience
                private infinity pools, floor-to-ceiling glass vistas, and
                personalized butler service.
              </p>

              {/* Sleek bottom stats pill bar */}
              <div className="inline-flex flex-wrap items-center justify-center gap-4 md:gap-8 bg-black/40 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-xs font-semibold text-white/90 shadow-lg">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> 12 Private Sanctuaries
                </span>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="flex items-center gap-2">
                  <Waves size={15} className="text-amber-400" /> Private Infinity Plunge Pools
                </span>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-400" /> Instant Lock Guarantee
                </span>
              </div>
            </FadeSection>
          </div>
        </section>

        {/* ── SANCTUARY ARCHITECTURAL PILLARS ROW ── */}
        <section className="container-resort max-w-6xl mx-auto mb-16">
          <FadeSection delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SANCTUARY_PILLARS.map((pillar, idx) => {
                const IconComponent = pillar.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 bg-surface-container-lowest border-2 border-primary/20 rounded-2xl shadow-xs hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <IconComponent size={22} strokeWidth={1.75} />
                      </div>
                      <h4
                        className="text-lg font-bold text-deep-wood mb-2"
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontStyle: "italic",
                        }}
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

        {/* ── BOOKING SEARCH & FILTER CONSOLE ── */}
        <section className="container-resort max-w-6xl mx-auto mb-16">
          <FadeSection delay={0.15}>
            <div className="p-6 sm:p-8 bg-surface-container-lowest border-2 border-primary/30 rounded-3xl shadow-xl space-y-6">
              {/* Header Title inside Console */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-outline-variant/20">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary block mb-0.5 font-mono">
                    Aviora Reservation Console
                  </span>
                  <h3
                    className="text-xl sm:text-2xl font-bold text-deep-wood"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                    }}
                  >
                    Find Your Perfect Villa
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-deep-wood/70">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Best Rate Guaranteed • No Booking Fees</span>
                </div>
              </div>

              {/* Top Row: Date & Guest Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Check-in Date */}
                <div>
                  <label className="text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-primary" /> Check-in Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => dispatch(setCheckIn(e.target.value))}
                    className="w-full px-4 py-3 bg-white/10 border border-outline-variant/60 rounded-xl text-xs sm:text-sm font-semibold text-black/80 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20 shadow-xs transition-all [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-primary" /> Check-out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => dispatch(setCheckOut(e.target.value))}
                   className="w-full px-4 py-3 bg-white/10 border border-outline-variant/60 rounded-xl text-xs sm:text-sm font-semibold text-black/80 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20 shadow-xs transition-all [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>

                {/* Occupancy Steppers */}
                <div>
                  <label className="text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users size={14} className="text-primary" /> Guests &amp; Occupancy
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Adults Stepper */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-bold shadow-xs">
                      <button
                        type="button"
                        onClick={() => dispatch(setAdults(Math.max(1, adults - 1)))}
                        className="w-6 h-6 rounded-lg bg-white/80 border border-outline-variant/60 flex items-center justify-center text-xs font-bold text-deep-wood hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        aria-label="Decrease adults"
                      >
                        -
                      </button>
                      <span className="text-deep-wood">
                        {adults} Ad{adults > 1 ? "s" : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => dispatch(setAdults(adults + 1))}
                        className="w-6 h-6 rounded-lg bg-white/80 border border-outline-variant/60 flex items-center justify-center text-xs font-bold text-deep-wood hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        aria-label="Increase adults"
                      >
                        +
                      </button>
                    </div>

                    {/* Children Stepper */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-bold shadow-xs">
                      <button
                        type="button"
                        onClick={() => dispatch(setChildren(Math.max(0, children - 1)))}
                        className="w-6 h-6 rounded-lg bg-white/80 border border-outline-variant/60 flex items-center justify-center text-xs font-bold text-deep-wood hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        aria-label="Decrease children"
                      >
                        -
                      </button>
                      <span className="text-deep-wood">
                        {children} Ch{children === 1 ? "" : "n"}
                      </span>
                      <button
                        type="button"
                        onClick={() => dispatch(setChildren(children + 1))}
                        className="w-6 h-6 rounded-lg bg-white/80 border border-outline-variant/60 flex items-center justify-center text-xs font-bold text-deep-wood hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        aria-label="Increase children"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Book CTA */}
                <div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={!hasResults}
                    className="w-full py-3.5 bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={16} /> Check &amp; Reserve
                  </button>
                </div>
              </div>

              {/* Bottom Row: Category Pills, View Select, Price Slider & Sort */}
              <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-4">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-high rounded-xl border border-primary/20">
                  {[
                    { id: "all", label: "All Sanctuaries" },
                    { id: "canopy", label: "Canopy Forest" },
                    { id: "lagoon", label: "Lagoon Water" },
                    { id: "treetop", label: "Treetop Haven" },
                    { id: "beachfront", label: "Beachfront" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id)}
                      className={[
                        "px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                        categoryFilter === cat.id
                          ? "bg-primary text-white shadow-xs"
                          : "text-deep-wood/70 hover:text-deep-wood hover:bg-primary/10",
                      ].join(" ")}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filters Right Column */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-deep-wood">
                  {/* View filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-deep-wood/70 uppercase tracking-wider text-[11px] font-bold">
                      View:
                    </span>
                    <select
                      value={viewFilter}
                      onChange={(e) => setViewFilter(e.target.value)}
                      className="px-3.5 py-2 bg-white border border-outline-variant/40 rounded-xl text-deep-wood font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs cursor-pointer capitalize"
                    >
                      <option value="all">All Vistas</option>
                      <option value="forest">Forest Canopy</option>
                      <option value="ocean">Ocean &amp; Beach</option>
                      <option value="garden">Tropical Garden</option>
                      <option value="pool">Water Lagoon</option>
                    </select>
                  </div>

                  {/* Price ceiling slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-deep-wood/70 uppercase tracking-wider text-[11px] font-bold whitespace-nowrap">
                      Up to{" "}
                      <span className="text-primary font-bold">
                        Rs.{maxPrice.toLocaleString()}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={PRICE_FLOOR}
                      max={PRICE_CEILING}
                      step={PRICE_STEP}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-24 sm:w-28 accent-primary cursor-pointer"
                      aria-label="Maximum price per night"
                    />
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-deep-wood/70 uppercase tracking-wider text-[11px] font-bold">
                      Sort:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3.5 py-2 bg-white border border-outline-variant/40 rounded-xl text-deep-wood font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs cursor-pointer"
                    >
                      <option value="featured">Featured First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Top Guest Rating</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </FadeSection>
        </section>

        {/* ── VILLA LISTINGS SECTION ── */}
        <section className="container-resort max-w-6xl mx-auto mb-20">
          {/* Header count bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8 px-2">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <p className="text-xs font-bold uppercase tracking-wider text-deep-wood/80 flex items-center gap-2">
                {isLoading
                  ? "Loading villa collection…"
                  : `Showing ${displayVillas.length} Available Sanctuary Villa${displayVillas.length !== 1 ? "s" : ""}`}
                {isFetching && !isLoading && (
                  <RotateCw size={13} className="animate-spin text-primary" />
                )}
              </p>
            </div>
            <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full font-bold inline-flex items-center gap-1.5 shadow-xs">
              <ShieldCheck size={15} className="text-emerald-700" /> Free Cancellation up to 48hrs prior
            </span>
          </div>

          {/* Skeleton Loaders */}
          {showSkeleton && (
            <div className="space-y-8">
              <VillaSkeleton />
              <VillaSkeleton />
              <VillaSkeleton />
            </div>
          )}

          {/* Empty Results State */}
          {showEmpty && (
            <div className="py-20 text-center border-2 border-primary/20 rounded-3xl bg-surface-container-lowest p-8 shadow-md">
              <SearchX size={44} className="mx-auto text-primary/40 mb-4" />
              <h3
                className="text-2xl font-bold text-deep-wood mb-2"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontStyle: "italic",
                }}
              >
                No Sanctuaries Match Your Criteria
              </h3>
              <p className="text-xs sm:text-sm text-deep-wood/70 max-w-md mx-auto mb-6 leading-relaxed">
                Try widening your price ceiling, adjusting the guest count, or
                selecting "All Sanctuaries" to view our complete collection.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("all");
                  setViewFilter("all");
                  setMaxPrice(PRICE_CEILING);
                  refetch();
                }}
                className="px-6 py-3 bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCw size={14} /> Reset All Filters
              </button>
            </div>
          )}

          {/* Villa Cards Grid */}
          {!showSkeleton && hasResults && (
            <div className="space-y-8">
              {displayVillas.map((villa, idx) => {
                const standardPrice = Number(villa.pricePerNight);
                const fromPrice = Number(villa.fromPricePerNight ?? villa.pricePerNight);
                const hasSaving = fromPrice < standardPrice;
                const planCount = villa.ratePlans?.length ?? 0;
                const numericRating = Number(villa.rating || 4.95).toFixed(2);

                // isDateFiltered tells us whether availableSlots is a promise
                // for this stay or just an indicative figure. Printing a number
                // before dates are chosen means nothing, and reads as a bug the
                // moment the guest picks dates and sees a different one.
                const datesChosen = Boolean(villa.isDateFiltered);
                const soldOut = datesChosen && !villa.isAvailable;
                const slots = Number(villa.availableSlots ?? 0);

                return (
                  <FadeSection key={villa.id} delay={Math.min(idx * 0.08, 0.3)}>
                    <article
                      className={[
                        "bg-surface-container-lowest border-2 rounded-3xl overflow-hidden shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0 group",
                        soldOut
                          ? "border-outline-variant/30 opacity-60 grayscale-[35%]"
                          : "border-primary/25 hover:border-primary/60 hover:shadow-xl",
                      ].join(" ")}
                    >
                      {/* Left: Interactive Image Showcase (4 Cols) */}
                      <div
                        onClick={() => handleViewVilla(villa)}
                        className="relative lg:col-span-4 h-64 sm:h-80 lg:h-auto overflow-hidden cursor-pointer"
                      >
                        <img
                          src={villa.image}
                          alt={villa.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/80 via-transparent to-transparent pointer-events-none" />

                        {/* Top Category Badge */}
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                          <span className="px-3 py-1 bg-deep-wood/85 backdrop-blur-md text-sand text-xs font-bold uppercase tracking-wider rounded-lg border border-primary/30 shadow-sm flex items-center gap-1.5">
                            <Leaf size={12} className="text-secondary" />
                            {villa.category}
                          </span>
                          {villa.featured && (
                            <span className="px-3 py-1 bg-secondary text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1">
                              <Star size={11} /> Signature
                            </span>
                          )}
                        </div>

                        {/* Bottom Overlay: View Specs Link */}
                        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white">
                          <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 text-sand bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                            {villa.view} View
                          </span>
                          <span className="text-xs font-bold text-sand hover:text-white transition-colors flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                            <span>View Specs</span>
                            <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>

                      {/* Middle: Content, Specs, & Inclusions (5 Cols) */}
                      <div className="p-6 md:p-8 lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-outline-variant/20">
                        <div>
                          {/* Rating & Review Counter */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleViewVilla(villa, "reviews")}
                              className="px-2.5 py-0.5 bg-secondary/15 border border-secondary/30 text-secondary text-xs font-bold rounded-md flex items-center gap-1 shadow-xs hover:bg-secondary/25 transition-colors cursor-pointer"
                              title="Read guest reviews"
                            >
                              <Star size={12} fill="currentColor" /> {numericRating}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewVilla(villa, "reviews")}
                              className="text-xs text-deep-wood/60 font-semibold hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline"
                            >
                              ({villa.reviewCount || 48} verified guest reviews)
                            </button>
                          </div>

                          {/* Villa Title */}
                          <h3
                            onClick={() => handleViewVilla(villa)}
                            className="text-2xl md:text-2.5xl font-bold text-deep-wood mb-2.5 cursor-pointer hover:text-primary transition-colors"
                            style={{
                              fontFamily: "var(--font-heading)",
                              fontStyle: "italic",
                            }}
                          >
                            {villa.name}
                          </h3>

                          {/* Description */}
                          <p className="text-xs sm:text-sm text-deep-wood/75 leading-relaxed mb-5 font-medium line-clamp-5 text-justify">
                            {villa.description}
                          </p>

                          {/* Key Specs Pill Grid */}
                          <div className="grid grid-cols-2 gap-2 p-3 bg-surface-container-low border border-primary/20 rounded-2xl text-xs font-semibold text-deep-wood mb-4">
                            <div className="flex items-center gap-2">
                              <Maximize2 size={14} className="text-primary shrink-0" />
                              <span>{villa.size} {villa.sizeUnit || "sqm"} Area</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-primary shrink-0" />
                              <span>Max {villa.maxOccupancy} Guests</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BedDouble size={14} className="text-primary shrink-0" />
                              <span className="truncate">{villa.bedConfiguration || "1 King Bed"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye size={14} className="text-primary shrink-0" />
                              <span className="capitalize">{villa.view || "Forest"} Vista</span>
                            </div>
                          </div>
                        </div>

                        {/* Perks & Inclusions */}
                        <div className="pt-3 border-t border-outline-variant/20 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            <span>Complimentary Gourmet Breakfast &amp; Butler</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-800">
                            <Sparkles size={13} className="text-amber-600 shrink-0" />
                            <span>Private Infinity Plunge Pool Included</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing & Booking Action (3 Cols) */}
                      <div className="p-6 md:p-8 lg:col-span-3 bg-surface-container-low/40 flex flex-col justify-between items-end text-right">
                        <div className="w-full">
                          <span className="text-xs font-bold uppercase tracking-wider text-deep-wood/50 block mb-1">
                            Starting Rate From
                          </span>
                          <div className="flex items-baseline gap-2 justify-end my-1 flex-wrap">
                            {hasSaving && (
                              <span className="text-sm font-semibold text-deep-wood/40 line-through">
                                Rs.{standardPrice.toLocaleString()}
                              </span>
                            )}
                            <span
                              className="text-3xl sm:text-4xl font-bold text-primary"
                              style={{ fontFamily: "var(--font-heading)" }}
                            >
                              Rs.{fromPrice.toLocaleString()}
                            </span>
                            <span className="text-xs text-deep-wood/70 font-semibold">
                              / night
                            </span>
                          </div>

                          <span className="text-[11px] text-deep-wood/55 block font-medium">
                            Plus {TAX_PERCENT_LABEL} government taxes &amp; service charge
                          </span>

                          {planCount > 1 && (
                            <button
                              type="button"
                              onClick={() => handleViewVilla(villa, "rates")}
                              className="mt-1.5 text-[11px] font-bold text-primary hover:underline underline-offset-2 cursor-pointer inline-flex items-center gap-1"
                            >
                              <Award size={12} />
                              {planCount} rate plans available
                              <ChevronRight size={12} />
                            </button>
                          )}

                          {/* Availability - three states.
                              dbo.VillaInventory holds one row per villa per
                              night, so this is the tightest night across the
                              stay, not a single stored number. */}
                          <div className="mt-3">
                            {!datesChosen ? (
                              <span className="text-[11px] font-semibold text-deep-wood/55 flex items-center gap-1.5 justify-end">
                                <CalendarDays size={12} />
                                Select dates to check availability
                              </span>
                            ) : soldOut ? (
                              <span className="text-[11px] font-bold text-red-700 flex items-center gap-1.5 justify-end">
                                <AlertCircle size={13} />
                                Not available for these dates
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 justify-end">
                                <CheckCircle2 size={13} />
                                {slots} unit{slots === 1 ? "" : "s"} left for your dates
                              </span>
                            )}
                          </div>

                          {/* Guarantee Box */}
                          <div className="mt-4 p-3.5 bg-surface-container-lowest border border-primary/20 rounded-2xl text-left space-y-1 shadow-xs">
                            <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                              <Shield size={13} /> Flexible Guarantee:
                            </span>
                            <p className="text-[11px] text-deep-wood/70 leading-relaxed font-medium">
                              100% free cancellation up to 48 hours prior to check-in date.
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="w-full mt-6 space-y-2.5">
                          <button
                            type="button"
                            onClick={() => handleBookNow(villa.id)}
                            disabled={soldOut}
                            className="w-full py-3.5 bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary"
                          >
                            <span>{soldOut ? "Sold Out" : "Reserve Villa"}</span>
                            <Sparkles size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewVilla(villa, "overview")}
                            className="w-full py-2.5 bg-white border border-primary/30 hover:bg-primary/5 text-deep-wood text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span>View Full Specs</span>
                            <ArrowRight size={13} className="text-primary" />
                          </button>

                          <p className="text-[10px] text-center text-deep-wood/50 font-medium pt-1">
                            Instant Confirmation • Best Price Guarantee
                          </p>
                        </div>
                      </div>
                    </article>
                  </FadeSection>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
