import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  Star,
  ChevronLeft,
  ChevronRight,
  Waves,
  Trees,
  Building,
  CheckCircle2,
  Sparkles,
  Quote,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { selectIsDayMode } from "../features/ui/uiSlice";
import {
  selectCheckIn,
  selectCheckOut,
  selectAdults,
  selectChildren,
  setCheckIn,
  setCheckOut,
  incrementAdults,
  decrementAdults,
  incrementChildren,
  decrementChildren,
  openCheckout,
} from "../features/booking/bookingSlice";
import { useGetVillasQuery } from "../features/rooms/roomsApi";
import apiClient from "../services/apiClient";
import { VILLAS_DATA } from "../features/booking/villasData";
import Button from "../components/common/Button";
import testimonials from "../services/mockData/testimonials.json";

/* ─── Animated section wrapper ─── */
function FadeSection({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Amenity feature data ─── */
const amenities = [
  {
    icon: Waves,
    title: "Infinity Pool",
    description:
      "A breathtaking infinity pool that seamlessly blends with the horizon, offering unmatched views of the surrounding tropical paradise.",
  },
  {
    icon: Trees,
    title: "Private Gardens",
    description:
      "Secluded tropical gardens carefully curated with native flora, providing a peaceful escape within the resort grounds.",
  },
  {
    icon: Building,
    title: "Limestone Villas",
    description:
      "Handcrafted limestone villas featuring modern design while honoring traditional Sri Lankan architectural heritage.",
  },
];

/* ─── Curated experience cards ─── */
const curatedExperiences = [
  {
    id: "exp-dining",
    title: "Private Dining",
    description:
      "Intimate culinary experiences set against the backdrop of lush tropical scenery.",
    image: "/assets/images/dining/canopy-table.jpg",
  },
  {
    id: "exp-wellness",
    title: "Wellness Retreats",
    description:
      "Ancient Ayurvedic wisdom combined with modern wellness practices for complete renewal.",
    image: "/assets/images/experiences/ayurvedic-ritual.jpg",
  },
  {
    id: "exp-trails",
    title: "Forest Trails",
    description:
      "Guided jungle treks through ancient canopy trails teeming with endemic wildlife.",
    image: "/assets/images/experiences/jungle-trek.jpg",
  },
];

/* ─── Villa grid data ─── */
const villaShowcase = {
  large: {
    image: "/assets/images/villas/canopy-villa-01.jpg",
    alt: "Canopy Forest Villa — A-frame architecture with floor-to-ceiling glass amid tropical canopy",
  },
  topRight: {
    image: "/assets/images/villas/garden-pool-villa-01.jpg",
    alt: "Garden Pool Villa — Private pool surrounded by lush tropical gardens",
  },
  bottomRight: {
    image: "/assets/images/villas/treetop-suite-01.jpg",
    alt: "Aviora Forest Villa — Elevated timber villa nestled in the treetops",
    label: "Aviora Forest Villa",
  },
};

/* ══════════════════════════════════════════════════════
   HOME PAGE COMPONENT
   ══════════════════════════════════════════════════════ */
export default function Home() {
  const isDayMode = useSelector(selectIsDayMode);
  const dispatch = useDispatch();
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  /* Real Reviews from Villas API */
  const { data: apiVillas = [], isLoading: isVillasLoading } =
    useGetVillasQuery();
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [testimonialStart, setTestimonialStart] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadAllVillaReviews() {
      setIsLoadingReviews(true);
      try {
        const villasList = apiVillas.length > 0 ? apiVillas : VILLAS_DATA;

        // Query real reviews for all villas via GET /api/villas/{code}/reviews
        const reviewRequests = villasList.map(async (v) => {
          const villaCode = v.id || v.code || v.slug;
          try {
            const data = await apiClient.get(`/villas/${villaCode}/reviews`);
            if (Array.isArray(data) && data.length > 0) {
              return data.map((item) => ({
                id:
                  item.id || item.reviewCode || `${villaCode}-${Math.random()}`,
                guestName: item.guestName || "Verified Guest",
                guestOrigin: item.guestOrigin || "International Guest",
                stayDate:
                  item.stayDate ||
                  (item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "Recent Stay"),
                villaName: v.name || item.villaName || "Aviora Sanctuary",
                villaSlug: v.slug || v.id || villaCode,
                villaCategory: v.category || "canopy",
                rating: item.rating || 5,
                headline: item.headline || "Extraordinary Sanctuary Stay",
                quote:
                  item.comment ||
                  item.quote ||
                  "An unforgettable stay in complete harmony with nature.",
                isVerified: item.isVerified !== false,
                helpfulCount: item.helpfulCount || 0,
              }));
            }
          } catch {
            // Ignore failure for individual villa
          }
          return [];
        });

        const fetched = await Promise.all(reviewRequests);
        const aggregated = fetched.flat();

        if (isMounted) {
          if (aggregated.length > 0) {
            aggregated.sort(
              (a, b) =>
                (b.rating || 5) - (a.rating || 5) ||
                (b.helpfulCount || 0) - (a.helpfulCount || 0),
            );
            setReviews(aggregated);
          } else {
            // Format fallback testimonials with villa associations
            const fallback = testimonials.map((t) => {
              const matchingVilla =
                villasList.find(
                  (v) => v.name?.toLowerCase() === t.villaStayed?.toLowerCase(),
                ) || villasList[0];
              return {
                id: t.id,
                guestName: t.guestName,
                guestOrigin: t.guestOrigin,
                stayDate: t.stayDate,
                villaName:
                  t.villaStayed || matchingVilla?.name || "Canopy Forest Villa",
                villaSlug:
                  matchingVilla?.slug ||
                  matchingVilla?.id ||
                  "canopy-forest-villa",
                villaCategory:
                  matchingVilla?.category ||
                  (t.villaStayed?.toLowerCase().includes("lagoon")
                    ? "lagoon"
                    : t.villaStayed?.toLowerCase().includes("beachfront")
                      ? "beachfront"
                      : t.villaStayed?.toLowerCase().includes("treetop")
                        ? "treetop"
                        : "canopy"),
                rating: t.rating || 5,
                headline: t.shortQuote || "The silence is its own luxury.",
                quote: t.quote,
                isVerified: true,
                helpfulCount: 28,
              };
            });
            setReviews(fallback);
          }
        }
      } catch {
        if (isMounted) {
          const fallback = testimonials.map((t) => ({
            id: t.id,
            guestName: t.guestName,
            guestOrigin: t.guestOrigin,
            stayDate: t.stayDate,
            villaName: t.villaStayed || "Canopy Forest Villa",
            villaSlug: t.villaStayed
              ? t.villaStayed.toLowerCase().replace(/ /g, "-")
              : "canopy-forest-villa",
            villaCategory: t.villaStayed?.toLowerCase().includes("lagoon")
              ? "lagoon"
              : t.villaStayed?.toLowerCase().includes("beachfront")
                ? "beachfront"
                : t.villaStayed?.toLowerCase().includes("treetop")
                  ? "treetop"
                  : "canopy",
            rating: t.rating || 5,
            headline: t.shortQuote || "The silence is its own luxury.",
            quote: t.quote,
            isVerified: true,
            helpfulCount: 28,
          }));
          setReviews(fallback);
        }
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    }

    loadAllVillaReviews();

    return () => {
      isMounted = false;
    };
  }, [apiVillas]);

  const filteredReviews = reviews.filter((r) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "5star") return r.rating === 5;
    return (
      r.villaCategory === activeCategory ||
      (r.villaName && r.villaName.toLowerCase().includes(activeCategory))
    );
  });

  const displayReviews = filteredReviews.length > 0 ? filteredReviews : reviews;

  /* Booking state */
  const checkIn = useSelector(selectCheckIn);
  const checkOut = useSelector(selectCheckOut);
  const adults = useSelector(selectAdults);
  const children = useSelector(selectChildren);

  const heroDay = "/assets/images/hero-day.jpg";
  const heroNight = "/assets/images/hero-night.jpg";

  return (
    <>
      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════ */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        aria-label="Hero — Aviora Resort"
      >
        {/* Parallax background */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ y: parallaxY }}
        >
          <motion.img
            key={isDayMode ? "day" : "night"}
            src={isDayMode ? heroDay : heroNight}
            alt={
              isDayMode
                ? "Aviora Resort A-frame villa at golden hour surrounded by tropical forest"
                : "Aviora Resort A-frame villa at night with warm interior light and moonlit pool"
            }
            className="img-cover animate-ken-burns"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          />
          {/* Hero overlay */}
          <div
            className="absolute inset-0 bg-hero-overlay"
            aria-hidden="true"
          />
        </motion.div>

        {/* Hero content */}
        <motion.div
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
          style={{ opacity: heroOpacity }}
        >
          <motion.h1
            className="text-resort-white mb-4 leading-none"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 700,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            Escape to Tropical Elegance
          </motion.h1>

          <motion.p
            className="text-resort-white/70 mb-10 max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              lineHeight: "1.6",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            Discover our exclusive collection of luxury villas nestled between
            ancient rainforest and pristine coastline.
          </motion.p>

          {/* ── Inline Booking Bar ── */}
          <motion.div
            className="glass-dark rounded-sm p-4 md:p-5 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              {/* Check-in */}
              <div className="flex flex-col gap-1.5 text-left">
                <label
                  htmlFor="hero-checkin"
                  className="text-resort-white/100 text-xs font-medium uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Check In
                </label>
                <input
                  id="hero-checkin"
                  type="date"
                  value={checkIn}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => dispatch(setCheckIn(e.target.value))}
                  className="px-3 py-2.5 bg-resort-white/10 border border-resort-white/20 text-resort-white text-sm focus:border-resort-white/100 focus:outline-none transition-colors duration-300"
                  style={{
                    fontFamily: "var(--font-body)",
                    colorScheme: "dark",
                  }}
                />
              </div>

              {/* Check-out */}
              <div className="flex flex-col gap-1.5 text-left">
                <label
                  htmlFor="hero-checkout"
                  className="text-resort-white/100 text-xs font-medium uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Check Out
                </label>
                <input
                  id="hero-checkout"
                  type="date"
                  value={checkOut}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  onChange={(e) => dispatch(setCheckOut(e.target.value))}
                  className="px-3 py-2.5 bg-resort-white/10 border border-resort-white/20 text-resort-white text-sm focus:border-resort-white/100 focus:outline-none transition-colors duration-300"
                  style={{
                    fontFamily: "var(--font-body)",
                    colorScheme: "dark",
                  }}
                />
              </div>

              {/* Guests */}
              <div className="flex flex-col gap-1.5 text-left">
                <span
                  className="text-resort-white/100 text-xs font-medium uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Guests
                </span>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-resort-white/10 border border-resort-white/20">
                  <button
                    id="hero-guests-decrement"
                    aria-label="Decrease guests"
                    onClick={() => dispatch(decrementAdults())}
                    className="text-resort-white/100 hover:text-resort-white w-6 h-6 flex items-center justify-center transition-colors text-sm"
                  >
                    −
                  </button>
                  <span
                    className="flex-1 text-center text-sm text-resort-white"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {adults + children}{" "}
                    <span className="text-resort-white/50 text-xs">
                      guest{adults + children !== 1 ? "s" : ""}
                    </span>
                  </span>
                  <button
                    id="hero-guests-increment"
                    aria-label="Increase guests"
                    onClick={() => dispatch(incrementAdults())}
                    className="text-resort-white/100 hover:text-resort-white w-5 h-5 flex items-center justify-center transition-colors text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA */}
              <Link
                to="/booking"
                id="hero-booking-cta"
                className="flex items-center justify-center px-14 py-4 mx--8 bg-primary text-white text-xs font-semibold uppercase tracking-widest whitespace-nowrap hover:bg-primary-container transition-colors duration-300 cursor-pointer shadow-xs"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Check Availability
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ArrowDown
              size={16}
              className="text-resort-white/40"
              strokeWidth={1}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — YOUR PRIVATE SANCTUARY
          ═══════════════════════════════════════════ */}
      <section
        id="sanctuary"
        aria-label="Your Private Sanctuary in Paradise"
        className="py-20 md:py-2 relative"
        style={{ backgroundColor: "var(--color-surface)" }}
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
        {/* Section heading */}
        <FadeSection className="container-resort text-center mb-14">
          <h2
            className="mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              maxWidth: "32ch",
              margin: "0 auto",
            }}
          >
            Your Private Sanctuary in Paradise
          </h2>
          {/* Decorative underline */}
          <div
            className="w-16 h-px bg-outline-variant mx-auto mb-6"
            aria-hidden="true"
          />
          <p
            className="mx-auto text-center"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              lineHeight: "1.75",
              maxWidth: "60ch",
              color: "var(--color-text-secondary)",
            }}
          >
            Immerse yourself in our exquisitely designed living spaces that
            bridge the gap between quiet luxury and the untouched beauty of the
            tropical landscape.
          </p>
        </FadeSection>

        {/* Villa image grid */}
        <FadeSection className="container-resort mb-16" delay={0.15}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Large left image */}
            <div className="relative overflow-hidden aspect-[4/3] lg:aspect-auto lg:min-h-[500px]">
              <img
                src={villaShowcase.large.image}
                alt={villaShowcase.large.alt}
                loading="lazy"
                className="img-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            </div>

            {/* Right column — 2 stacked images */}
            <div className="grid grid-rows-2 gap-4">
              <div className="relative overflow-hidden">
                <img
                  src={villaShowcase.topRight.image}
                  alt={villaShowcase.topRight.alt}
                  loading="lazy"
                  className="img-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>

              <div className="relative overflow-hidden group">
                <img
                  src={villaShowcase.bottomRight.image}
                  alt={villaShowcase.bottomRight.alt}
                  loading="lazy"
                  className="img-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                {/* Glassmorphic label overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div
                    className="glass-dark px-4 py-3 inline-block"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <p
                      className="text-resort-white text-sm font-medium"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {villaShowcase.bottomRight.label}
                    </p>
                    <p
                      className="text-resort-white/100 text-xs mt-0.5"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      From Rs.420,000 / night
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeSection>

        {/* Amenity feature cards */}
        <FadeSection className="container-resort" delay={0.25}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {amenities.map((amenity, i) => {
              const Icon = amenity.icon;
              return (
                <FadeSection
                  key={amenity.title}
                  delay={i * 0.1}
                  className="text-center"
                >
                  <div
                    className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-full"
                    style={{ backgroundColor: "var(--color-warm-sand)" }}
                  >
                    <Icon
                      size={24}
                      strokeWidth={1.5}
                      style={{ color: "var(--color-primary)" }}
                    />
                  </div>
                  <h3
                    className="mb-3"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {amenity.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9rem",
                      lineHeight: "1.7",
                      color: "var(--color-text-secondary)",
                      maxWidth: "36ch",
                      margin: "0 auto",
                    }}
                  >
                    {amenity.description}
                  </p>
                </FadeSection>
              );
            })}
          </div>
        </FadeSection>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — CURATED EXPERIENCES
          ═══════════════════════════════════════════ */}
      <section
        id="curated-experiences"
        aria-label="Curated Experiences"
        className="py-20 md:py-28"
        style={{
          backgroundColor: "var(--color-surface-container-low, #f3f4f3)",
        }}
      >
        <FadeSection className="container-resort text-center mb-14">
          <h2
            className="mb-4"
            style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
          >
            Curated Experiences
          </h2>
          <p
            className="mx-auto text-center"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              lineHeight: "1.75",
              maxWidth: "55ch",
              color: "var(--color-text-secondary)",
            }}
          >
            Step beyond the villa. Discover a world of unforgettable luxury and
            curated moments.
          </p>
        </FadeSection>

        <div className="container-resort">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {curatedExperiences.map((exp, i) => (
              <FadeSection key={exp.id} delay={i * 0.12}>
                <Link
                  to="/destination"
                  id={`experience-card-${exp.id}`}
                  className="group relative block overflow-hidden aspect-[3/4]"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  <img
                    src={exp.image}
                    alt={exp.title}
                    loading="lazy"
                    className="img-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(27,24,21,0.75) 0%, rgba(27,24,21,0.05) 55%)",
                    }}
                  />
                  {/* Text overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3
                      className="text-resort-white mb-2"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.35rem",
                        fontWeight: 600,
                      }}
                    >
                      {exp.title}
                    </h3>
                    <p
                      className="text-resort-white/70 text-sm leading-relaxed"
                      style={{
                        fontFamily: "var(--font-body)",
                        maxWidth: "32ch",
                      }}
                    >
                      {exp.description}
                    </p>
                  </div>
                </Link>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — GUEST EXPERIENCES (REAL VILLA REVIEWS)
          ═══════════════════════════════════════════ */}
      <section
        id="guest-experiences"
        aria-label="Guest Experiences"
        className="py-16 md:py-20 relative overflow-hidden"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {/* ── Decorative Background Sketch & Gradient ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/assets/images/loading-sketch.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.15,
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container-resort relative z-10">
          {/* Section Header */}
          <FadeSection className="text-center mb-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container/40 border border-secondary/30 text-deep-wood text-xs font-bold uppercase tracking-widest mb-4 shadow-xs">
              <Sparkles size={14} className="text-secondary" />
              <span>Verified Guest Memoirs &amp; Reviews</span>
            </div>

            <h2
              className="mb-4 text-3xl sm:text-4xl md:text-5xl font-bold text-deep-wood"
              style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
            >
              Guest Experiences in the Sanctuary
            </h2>

            <p
              className="mx-auto text-center text-deep-wood/75 text-sm sm:text-base leading-relaxed mb-6"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Unfiltered reflections from guests who stayed in our canopy,
              lagoon, and beachfront sanctuaries.
            </p>

            {/* Overall Rating Pill */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-primary/20 shadow-sm">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} fill="#D4AF37" stroke="#D4AF37" />
                ))}
              </div>
              <span className="text-xs font-bold text-deep-wood">
                5.0 / 5.0 · Top Rated Sanctuary Experience
              </span>
            </div>
          </FadeSection>

          {/* Category Filter Pills */}
    <FadeSection
  delay={0.1}
  className="flex flex-wrap items-center justify-center gap-2 mb-10"
>
  {[
    { id: "all", label: "All Reviews" },
    { id: "canopy", label: "Canopy Forest" },
    { id: "lagoon", label: "Lagoon Suites" },
    { id: "beachfront", label: "Beachfront" },
    { id: "treetop", label: "Treetop Heritage" },
  ].map((cat) => (
    <button
      key={cat.id}
      type="button"
      onClick={() => {
        setActiveCategory(cat.id);
        setTestimonialStart(0);
      }}
      className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
        activeCategory === cat.id
          ? "bg-primary text-white shadow-md scale-105"
          : "bg-white/80 text-primary border border-primary/30 hover:bg-primary-container hover:text-white hover:border-primary-container"
      }`}
    >
      {cat.label}
    </button>
  ))}
</FadeSection>

          {/* Testimonial Carousel Grid */}
          <div className="relative group">
            {/* Left Arrow */}
            {testimonialStart > 0 && (
              <button
                type="button"
                onClick={() =>
                  setTestimonialStart((prev) => Math.max(0, prev - 2))
                }
                aria-label="Previous reviews"
                className="absolute -left-3 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-13 md:h-13 bg-white border border-outline-variant/40 rounded-full shadow-lg flex items-center justify-center text-deep-wood hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Reviews Grid (2 items per slide) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {displayReviews
                .slice(testimonialStart, testimonialStart + 2)
                .map((r, i) => (
                  <FadeSection key={r.id || i} delay={i * 0.15}>
                    <div className="p-7 sm:p-9 h-full bg-white/85 backdrop-blur-md border border-primary/20 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group/card relative overflow-hidden">
                      {/* Top Accent Gold Glow */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

                      <div>
                        {/* Header: Guest Info & Rating */}
                        <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-outline-variant/20">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-surface-container-high border-2 border-primary/30 flex items-center justify-center font-bold text-sm text-primary shadow-xs shrink-0 font-heading">
                              {r.guestName
                                ? r.guestName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()
                                : "AV"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm sm:text-base text-deep-wood">
                                  {r.guestName}
                                </h4>
                                {r.isVerified && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-full">
                                    <CheckCircle2
                                      size={11}
                                      className="text-emerald-600"
                                    />
                                    Verified Stay
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-deep-wood/60 font-medium">
                                {r.guestOrigin}{" "}
                                {r.stayDate ? `• ${r.stayDate}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center gap-0.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 shrink-0">
                            {Array.from({ length: r.rating || 5 }).map(
                              (_, starIdx) => (
                                <Star
                                  key={starIdx}
                                  size={12}
                                  fill="#D4AF37"
                                  stroke="#D4AF37"
                                />
                              ),
                            )}
                          </div>
                        </div>

                        {/* Villa Link Badge */}
                        {r.villaName && (
                          <div className="mb-4">
                            <Link
                              to={`/rooms-villas/${r.villaSlug}?tab=reviews`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-low/80 hover:bg-primary/10 border border-primary/20 text-deep-wood hover:text-primary rounded-full text-xs font-semibold transition-colors"
                            >
                              <Trees size={12} className="text-primary" />
                              <span>{r.villaName}</span>
                              <ArrowRight size={11} className="opacity-60" />
                            </Link>
                          </div>
                        )}

                        {/* Headline */}
                        {r.headline && (
                          <h5
                            className="text-base sm:text-lg font-bold text-deep-wood mb-3 italic"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            "{r.headline}"
                          </h5>
                        )}

                        {/* Quote Body */}
                        <blockquote
                          className="text-deep-wood/80 text-xs sm:text-sm leading-relaxed mb-6 italic"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          "{r.quote}"
                        </blockquote>
                      </div>

                      {/* Footer Badge */}
                      <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between text-[11px] font-semibold text-deep-wood/55">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={13} className="text-primary" />
                          Authentic Resident Memoir
                        </span>
                        <Link
                          to={`/rooms-villas/${r.villaSlug}?tab=reviews`}
                          className="text-primary hover:underline font-bold"
                        >
                          View Villa Details →
                        </Link>
                      </div>
                    </div>
                  </FadeSection>
                ))}
            </div>

            {/* Right Arrow */}
            {testimonialStart + 2 < displayReviews.length && (
              <button
                type="button"
                onClick={() =>
                  setTestimonialStart((prev) =>
                    Math.min(displayReviews.length - 2, prev + 2),
                  )
                }
                aria-label="Next reviews"
                className="absolute -right-3 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-13 md:h-13 bg-white border border-outline-variant/40 rounded-full shadow-lg flex items-center justify-center text-deep-wood hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Dots Indicator & Navigation Footer */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-outline-variant/20">
            {/* Pagination dots */}
            <div className="flex items-center gap-2">
              {Array.from({
                length: Math.ceil(displayReviews.length / 2),
              }).map((_, pageIdx) => (
                <button
                  key={pageIdx}
                  type="button"
                  onClick={() => setTestimonialStart(pageIdx * 2)}
                  aria-label={`Go to page ${pageIdx + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    Math.floor(testimonialStart / 2) === pageIdx
                      ? "w-8 bg-primary"
                      : "w-2.5 bg-outline-variant/40 hover:bg-primary/40"
                  }`}
                />
              ))}
            </div>

            {/* View all villas & reviews CTA */}
            <Link
              to="/rooms-villas"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-deep-wood hover:bg-primary text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg active:scale-98"
            >
              <MessageSquare size={14} />
              <span>Explore All Sanctuaries &amp; Reviews</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
