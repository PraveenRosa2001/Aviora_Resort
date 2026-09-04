import { useState, useEffect, useMemo } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Users,
  Star,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Maximize2,
  BedDouble,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Leaf,
  HeartHandshake,
  Shield,
  ThumbsUp,
  MessageSquare,
  PenTool,
  Send,
  UserCheck,
  Award,
  AlertCircle,
  Waves,
  X,
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
  setSelectedRatePlan,
} from "../features/booking/bookingSlice";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSlice";
import {
  useGetVillasQuery,
  useCheckAvailabilityQuery,
  useGetTaxBreakdownQuery,
  useGetVillaReviewsQuery,
  useCreateVillaReviewMutation,
  useMarkReviewHelpfulMutation,
} from "../features/rooms/roomsApi";
import { VILLAS_DATA } from "../features/booking/villasData";
import SEO from "../components/common/SEO";
import { useToast } from "../components/common/Toast";

const TAX_PERCENT_LABEL = "34.38%";

function FadeSection({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function VillaDetailPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();

  const checkIn = useSelector(selectCheckIn);
  const checkOut = useSelector(selectCheckOut);
  const adults = useSelector(selectAdults);
  const children = useSelector(selectChildren);
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Active Tab from URL query
  const tabParam = searchParams.get("tab");
  const activeTab = ["overview", "rates", "reviews"].includes(tabParam)
    ? tabParam
    : "overview";

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Reviews form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewHeadline, setReviewHeadline] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

  // Fetch villas from API. The stay dates go through so availableSlots and
  // isAvailable describe THIS stay rather than the next 90 days.
  const { data: apiVillas = [], isLoading: villasLoading } = useGetVillasQuery({
    checkIn,
    checkOut,
  });

  /**
   * The Sri Lankan tax cascade, from dbo.TaxComponents.
   * 10% service + 1% TDL + 2.5% SSCL + 18% VAT, applied in sequence:
   *   1.10 x 1.01 x 1.025 x 1.18 = 1.3437545
   * Read from the API rather than hard-coded, so a VAT change is one UPDATE
   * and this page cannot disagree with the invoice.
   */
  const { data: taxes } = useGetTaxBreakdownQuery();
  const taxMultiplier = Number(taxes?.multiplier ?? 1.3437545);
  const taxPercent = Number(taxes?.totalPercent ?? 34.38);

  // Find the selected villa by slug or by ID
  const villa = useMemo(() => {
    if (!slug) return null;
    const targetSlug = slug.toLowerCase();

    // Search in API data
    const foundInApi = apiVillas.find(
      (v) =>
        (v.slug && v.slug.toLowerCase() === targetSlug) ||
        (v.id && v.id.toLowerCase() === targetSlug),
    );
    if (foundInApi) return foundInApi;

    // Search in static backup data
    const foundInStatic = VILLAS_DATA.find(
      (v) =>
        (v.slug && v.slug.toLowerCase() === targetSlug) ||
        (v.id && v.id.toLowerCase() === targetSlug),
    );
    return foundInStatic || null;
  }, [slug, apiVillas]);

  const villaCode = villa?.id ?? null;

  /**
   * GET /api/villas/{code}/availability
   *
   * Always 200 when the villa exists - `available: false` with a reason of
   * SoldOut, Blocked, MinNights or OutsideHorizon is a normal answer. Skipped
   * until both dates are set and the range makes sense.
   */
  const { data: availability, isFetching: checkingAvailability } =
    useCheckAvailabilityQuery(
      { villaCode, checkIn, checkOut },
      { skip: !villaCode || !checkIn || !checkOut || checkOut <= checkIn },
    );

  const stayUnavailable = Boolean(availability && !availability.available);

  // Fetch guest reviews for this villa
  const {
    data: villaReviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useGetVillaReviewsQuery(villaCode, { skip: !villaCode });

  const [createReview, { isLoading: isPostingReview }] =
    useCreateVillaReviewMutation();
  const [markHelpful] = useMarkReviewHelpfulMutation();

  // Carousel slides (Main hero image + 6 secondary gallery images)
  const gallerySlides = useMemo(() => {
    if (!villa) return [];
    return [villa.image, ...(villa.images ?? [])].filter(Boolean);
  }, [villa]);

  const slideCount = gallerySlides.length;

  const goToSlide = (index) => {
    if (slideCount === 0) return;
    setActiveImageIndex(((index % slideCount) + slideCount) % slideCount);
  };

  // Keyboard navigation for gallery
  useEffect(() => {
    if (slideCount < 2) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev + 1) % slideCount);
      }
      if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev - 1 + slideCount) % slideCount);
      }
      if (e.key === "Escape" && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slideCount, isLightboxOpen]);

  // Handle Tab Switch & URL sync
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
    if (tabId === "reviews" && searchParams.get("write") === "true") {
      setShowReviewForm(true);
    }
  };

  // Calculate nights
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const diffTime = Math.max(0, dOut - dIn);
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const standardPrice = Number(villa?.pricePerNight || 0);
  const fromPrice = Number(
    villa?.fromPricePerNight ?? villa?.pricePerNight ?? 0,
  );
  const hasSaving = fromPrice < standardPrice;
  const numericRating = Number(villa?.rating || 4.95).toFixed(2);

  // Booking action
  const handleBookNow = (ratePlanId = null) => {
    if (villa?.id) {
      dispatch(setSelectedVillaId(villa.id));
      if (ratePlanId) {
        dispatch(setSelectedRatePlan(ratePlanId));
      }
      navigate(
        `/booking?villa=${villa.id}${ratePlanId ? `&ratePlan=${ratePlanId}` : ""}`,
      );
    }
  };

  // Helpful vote
  const handleHelpfulClick = async (reviewCode) => {
    if (!isAuthenticated || !villaCode) return;
    try {
      await markHelpful({ villaCode, reviewCode }).unwrap();
    } catch {
      // Ignored
    }
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewErrors({});

    if (!isAuthenticated) {
      setReviewErrors({ auth: "Please sign in to share your experience." });
      showError("Please sign in to share your stay experience.");
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      setReviewErrors({
        comment:
          "Please share at least 10 characters about your stay experience.",
      });
      showError("Please share at least 10 characters about your stay experience.");
      return;
    }

    try {
      await createReview({
        villaCode,
        rating: reviewRating,
        headline: reviewHeadline.trim(),
        comment: reviewComment.trim(),
        guestOrigin: currentUser?.country || undefined,
      }).unwrap();

      setReviewSuccessMsg(true);
      setReviewComment("");
      setReviewHeadline("");
      showSuccess("Thank you! Your stay review has been submitted.", { title: "Review Shared" });
      setTimeout(() => {
        setShowReviewForm(false);
        setReviewSuccessMsg(false);
      }, 2500);
    } catch (err) {
      const errMsg = err?.data?.message || "Your review could not be saved. Please try again.";
      setReviewErrors({ comment: errMsg });
      showError(errMsg, { title: "Submission Error" });
    }
  };

  if (villasLoading && !villa) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-surface flex flex-col items-center justify-center">
        <RotateCw size={36} className="animate-spin text-primary mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest text-deep-wood/60">
          Loading Sanctuary Details…
        </p>
      </div>
    );
  }

  if (!villa) {
    return (
      <div className="pt-36 pb-24 min-h-screen bg-surface">
        <div className="container-resort max-w-4xl mx-auto px-6 text-center">
          <div className="p-12 bg-white/90 backdrop-blur-md rounded-3xl border border-primary/20 shadow-xl space-y-5">
            <AlertCircle size={48} className="mx-auto text-primary/60" />
            <h2
              className="text-3xl font-bold text-deep-wood"
              style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
            >
              Sanctuary Not Found
            </h2>
            <p className="text-sm text-deep-wood/70 max-w-md mx-auto leading-relaxed">
              The sanctuary you are looking for may have been updated or moved.
              Please explore our complete villa collection.
            </p>
            <Link
              to="/rooms-villas"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              <ArrowLeft size={16} />
              <span>Return to Villa Collection</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pb-28 relative bg-surface text-deep-wood"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <SEO
        title={`${villa.name} — Luxury Villa Sanctuary | Aviora Resort`}
        description={villa.description}
      />

      {/* ── Background Subtle Sketch (Moves with content like other pages) ── */}
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
        {/* ── FULL-WIDTH SIGNATURE HERO HEADER BANNER (Consistent with Dining & Wellness) ── */}
        <section className="relative w-full h-[60vh] min-h-[580px] md:min-h-[640px] flex items-center justify-center overflow-hidden mb-12 pt-20">
          <img
            src={villa.image}
            alt={villa.name}
            className="img-cover absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/95 via-deep-wood/55 to-deep-wood/35" />

          {/* Top Breadcrumb & Badges Bar inside Hero */}
          <div className="absolute top-28 inset-x-0 z-20 container-resort max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/rooms-villas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>All Sanctuaries</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-deep-wood/80 backdrop-blur-md text-sand text-xs font-bold uppercase tracking-wider rounded-lg border border-primary/40 shadow-sm flex items-center gap-1.5">
                <Leaf size={12} className="text-secondary" />
                {villa.category} Sanctuary
              </span>
              <span className="px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                {villa.view} Vista
              </span>
              {villa.featured && (
                <span className="px-3 py-1 bg-secondary text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1">
                  <Star size={11} fill="currentColor" /> Signature
                </span>
              )}
            </div>
          </div>

          {/* Centered Hero Content */}
          <div className="relative z-10 container-resort text-center text-white max-w-4xl mx-auto px-6">
            <FadeSection>
              <span className="eyebrow-label text-amber-300 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-4 tracking-widest text-xs font-bold uppercase shadow-sm">
                <Sparkles size={14} className="text-amber-300" /> LUXURY
                SANCTUARY RESIDENCE
              </span>

              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 text-white drop-shadow-lg italic tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {villa.name}
              </h1>

              {villa.tagline && (
                <p
                  className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto mb-6 font-medium italic drop-shadow"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  "{villa.tagline}"
                </p>
              )}

              {/* Bottom stats pill bar */}
              <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 bg-black/45 backdrop-blur-md border border-white/25 px-6 py-3.5 rounded-2xl text-xs font-semibold text-white/95 shadow-xl">
                <button
                  type="button"
                  onClick={() => handleTabChange("reviews")}
                  className="flex items-center gap-1.5 text-amber-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Star size={14} fill="currentColor" /> {numericRating}
                  <span className="text-white/75 font-normal">
                    ({villaReviews.length || villa.reviewCount || 48} Reviews)
                  </span>
                </button>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="flex items-center gap-1.5">
                  <Maximize2 size={14} className="text-amber-300" />{" "}
                  {villa.size} {villa.sizeUnit || "sqm"}
                </span>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-amber-300" /> Max{" "}
                  {villa.maxOccupancy} Guests
                </span>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Waves size={14} /> Private Plunge Pool
                </span>
              </div>
            </FadeSection>
          </div>
        </section>

        {/* ── UNIFIED TRANSLUCENT WHITE CANVAS COMBINING ALL BLOCKS ── */}
        <section className="container-resort max-w-6xl mx-auto px-4 sm:px-6 ">
          <div className="bg-white/50  p-6 sm:p-8 lg:p-10  space-y-10 mt-[-55px]">
            {/* 1. VISUAL TOUR & GALLERY SHOWCASE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary block font-mono">
                    Visual Showcase
                  </span>
                  <h3
                    className="text-xl sm:text-2xl font-bold text-deep-wood italic"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Sanctuary Architecture &amp; Surroundings
                  </h3>
                </div>

                {/* <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-surface-container-high/80 text-deep-wood text-xs font-bold font-mono">
                    {activeImageIndex + 1} of {slideCount}
                  </span>
                </div> */}
              </div>

              {/* Master Photo Frame */}
              <div className="relative h-[380px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden shadow-inner bg-deep-wood group border border-primary/20">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIndex}
                    src={gallerySlides[activeImageIndex] ?? villa.image}
                    alt={`${villa.name} — photograph ${activeImageIndex + 1}`}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                    onError={(e) => {
                      if (e.currentTarget.src !== villa.image) {
                        e.currentTarget.src = villa.image;
                      }
                    }}
                  />
                </AnimatePresence>

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Navigation Arrows */}
                {slideCount > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => goToSlide(activeImageIndex - 1)}
                      aria-label="Previous photograph"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-deep-wood flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                    >
                      <ChevronLeft size={22} />
                    </button>

                    <button
                      type="button"
                      onClick={() => goToSlide(activeImageIndex + 1)}
                      aria-label="Next photograph"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-deep-wood flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}

                {/* Bottom Caption Pill */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 text-white flex items-center gap-3">
                  <span className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-sand">
                    {indexCaption(activeImageIndex, villa)}
                  </span>
                </div>
              </div>

              {/* Thumbnail Strip */}
              {slideCount > 1 && (
                <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-thin">
                  {gallerySlides.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Show photograph ${index + 1}`}
                      className={[
                        "relative shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                        index === activeImageIndex
                          ? "border-primary ring-2 ring-primary/40 shadow-md scale-105"
                          : "border-outline-variant/30 opacity-60 hover:opacity-100 hover:scale-102",
                      ].join(" ")}
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = villa.image;
                        }}
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-mono rounded font-bold">
                        {index === 0 ? "Hero" : `#${index + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. REFINED CLEAN UNDERLINE TAB NAVIGATION (No nested double borders) */}
            <div className="border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleTabChange("overview")}
                  className={[
                    "pb-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer relative whitespace-nowrap",
                    activeTab === "overview"
                      ? "text-primary border-b-2 border-primary"
                      : "text-deep-wood/60 hover:text-deep-wood border-b-2 border-transparent",
                  ].join(" ")}
                >
                  <Sparkles size={16} />
                  <span>Overview &amp; Architecture</span>
                </button>

                <span
                  aria-hidden="true"
                  className="text-primary font-bold text-sm pb-3.5 select-none pointer-events-none"
                >
                  |
                </span>

                <button
                  type="button"
                  onClick={() => handleTabChange("rates")}
                  className={[
                    "pb-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer relative whitespace-nowrap",
                    activeTab === "rates"
                      ? "text-primary border-b-2 border-primary"
                      : "text-deep-wood/60 hover:text-deep-wood border-b-2 border-transparent",
                  ].join(" ")}
                >
                  <Award size={16} />
                  <span>Rate Plans ({villa.ratePlans?.length ?? 0})</span>
                </button>

                <span
                  aria-hidden="true"
                  className="text-primary font-bold text-sm pb-3.5 select-none pointer-events-none"
                >
                  |
                </span>

                <button
                  type="button"
                  onClick={() => handleTabChange("reviews")}
                  className={[
                    "pb-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer relative whitespace-nowrap",
                    activeTab === "reviews"
                      ? "text-primary border-b-2 border-primary"
                      : "text-deep-wood/60 hover:text-deep-wood border-b-2 border-transparent",
                  ].join(" ")}
                >
                  <Star
                    size={16}
                    className={
                      activeTab === "reviews"
                        ? "fill-primary text-primary"
                        : "text-secondary fill-secondary"
                    }
                  />
                  <span>Guest Reviews ({villaReviews.length})</span>
                </button>
              </div>

              {/* Rating score badge on right */}
              <button
                type="button"
                onClick={() => handleTabChange("reviews")}
                className="mb-2 flex items-center gap-1.5 px-3.5 py-1.5 bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold rounded-xl hover:bg-secondary/20 transition-colors cursor-pointer"
              >
                <Star size={13} fill="currentColor" /> {numericRating}
                <span className="text-deep-wood/70 font-semibold ml-1">
                  ({villaReviews.length || villa.reviewCount || 48} verified
                  stays)
                </span>
              </button>
            </div>

            {/* 3. MAIN 2-COLUMN CONTENT & BOOKING SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left Column (8 Cols) */}
              <div className="lg:col-span-8 space-y-8">
                {activeTab === "overview" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Key Specs Card Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-5 bg-white/90 border border-outline-variant/40 rounded-2xl shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3 text-primary mb-3">
                          <Maximize2 size={20} />

                          <span className="text-[11px] uppercase font-bold tracking-widest text-deep-wood/70">
                            Floor Area
                          </span>
                        </div>
                        <div>
                          <span className="text-xl sm:text-2xl font-bold text-deep-wood font-heading block">
                            {villa.size} {villa.sizeUnit || "sqm"}
                          </span>
                          <span className="text-[11px] text-deep-wood/55 font-medium">
                            Spacious Living Layout
                          </span>
                        </div>
                      </div>

                      <div className="p-5 bg-white/90 border border-outline-variant/40 rounded-2xl shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3 text-primary mb-3">
                          <Users size={20} />
                          <span className="text-[11px] uppercase font-bold tracking-widest text-deep-wood/70">
                            Occupancy
                          </span>
                        </div>
                        <div>
                          <span className="text-xl sm:text-2xl font-bold text-deep-wood font-heading block">
                            Max {villa.maxOccupancy}
                          </span>
                          <span className="text-[11px] text-deep-wood/55 font-medium">
                            Adults &amp; Children
                          </span>
                        </div>
                      </div>

                      <div className="p-5 bg-white/90 border border-outline-variant/40 rounded-2xl shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3 text-primary mb-3">
                          <BedDouble size={20} />
                          <span className="text-[11px] uppercase font-bold tracking-widest text-deep-wood/70">
                            Bed Setup
                          </span>
                        </div>
                        <div>
                          <span className="text-base sm:text-lg font-bold text-deep-wood truncate font-heading block">
                            {villa.bedConfiguration || "1 King Bed"}
                          </span>
                          <span className="text-[11px] text-deep-wood/55 font-medium">
                            Custom Cotton Linens
                          </span>
                        </div>
                      </div>

                      <div className="p-5 bg-white/90 border border-outline-variant/40 rounded-2xl shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3 text-primary mb-3">
                          <Eye size={20} />
                          <span className="text-[11px] uppercase font-bold tracking-widest text-deep-wood/70">
                            Panorama
                          </span>
                        </div>
                        <div>
                          <span className="text-base sm:text-lg font-bold text-deep-wood capitalize font-heading block">
                            {villa.view} View
                          </span>
                          <span className="text-[11px] text-deep-wood/55 font-medium">
                            Direct Forest Vista
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Architectural Concept & Atmosphere */}
                    <div className="p-7 sm:p-9 bg-white/90 border border-outline-variant/40 rounded-3xl shadow-xs space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Sparkles size={20} />
                        </div>
                        <h3
                          className="text-2xl sm:text-3xl font-bold text-deep-wood"
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontStyle: "italic",
                          }}
                        >
                          Architectural Concept &amp; Atmosphere
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-deep-wood/85 leading-relaxed font-medium text-justify">
                        {villa.description}
                      </p>
                    </div>

                    {/* Exclusive Villa Inclusions & Amenities */}
                    <div className="p-7 sm:p-9 bg-white/90 border border-outline-variant/40 rounded-3xl shadow-xs space-y-5">
                      <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <CheckCircle2 size={20} />
                        </div>
                        <h3
                          className="text-2xl sm:text-3xl font-bold text-deep-wood"
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontStyle: "italic",
                          }}
                        >
                          Exclusive Inclusions &amp; Bespoke Amenities
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {(
                          villa.amenities || [
                            "Private freshwater infinity plunge pool",
                            "Dedicated 24/7 butler service",
                            "Outdoor rain shower & forest soaking tub",
                            "Espresso bar with organic Ceylon tea selection",
                            "In-villa gourmet breakfast served daily",
                            "High-speed fiber optic Wi-Fi & Bose sound system",
                            "Organic botanical bath amenities & plush robes",
                            "Complimentary laundry & unpacking service",
                          ]
                        ).map((amenity, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-4 bg-surface-container-low/70 border border-outline-variant/30 rounded-2xl text-xs sm:text-sm font-semibold text-deep-wood shadow-xs"
                          >
                            <CheckCircle2
                              size={17}
                              className="text-primary shrink-0"
                            />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sustainability Commitment */}
                    {villa.sustainability && (
                      <div className="p-6 sm:p-7 bg-emerald-50/90 border border-emerald-200 rounded-3xl flex items-start gap-4 text-xs sm:text-sm text-emerald-950 shadow-sm">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Leaf size={22} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-base text-emerald-900">
                            Biophilic Sustainability Commitment
                          </h4>
                          <p className="text-emerald-900/90 leading-relaxed font-medium">
                            {villa.sustainability}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "rates" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="p-5 rounded-2xl bg-surface-container-low border border-primary/20 text-xs sm:text-sm text-deep-wood/80 leading-relaxed font-medium">
                      All rate plans below apply directly to{" "}
                      <strong className="text-deep-wood">{villa.name}</strong>.
                      Prices are per night for the whole villa and exclude{" "}
                      {TAX_PERCENT_LABEL} government taxes and service charges.
                    </div>

                    {(villa.ratePlans ?? []).length === 0 ? (
                      <div className="p-12 bg-white/90 border border-primary/20 rounded-3xl text-center shadow-sm">
                        <Award
                          size={36}
                          className="mx-auto text-primary/30 mb-3"
                        />
                        <p className="text-sm font-semibold text-deep-wood/70">
                          Standard Flexible rate plan is currently active for
                          this villa.
                        </p>
                      </div>
                    ) : (
                      (villa.ratePlans ?? []).map((plan) => {
                        const planPrice = Number(plan.pricePerNight);
                        const isCheapest =
                          planPrice ===
                          Number(
                            villa.fromPricePerNight ?? villa.pricePerNight,
                          );

                        return (
                          <div
                            key={plan.id}
                            className={[
                              "p-6 sm:p-7 bg-white/90 rounded-3xl shadow-sm transition-all border-2",
                              isCheapest
                                ? "border-primary shadow-md"
                                : "border-primary/20",
                            ].join(" ")}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-outline-variant/20">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {plan.badge && (
                                    <span className="px-2.5 py-0.5 bg-secondary/15 border border-secondary/30 text-secondary text-[10px] font-bold uppercase tracking-wider rounded-md">
                                      {plan.badge}
                                    </span>
                                  )}
                                  {isCheapest && (
                                    <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                      Lowest Rate
                                    </span>
                                  )}
                                  {plan.requiresPrepayment && (
                                    <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                      Prepayment Required
                                    </span>
                                  )}
                                  {plan.isRefundable ? (
                                    <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                      Free cancellation
                                      {plan.cancellationHours
                                        ? ` · ${plan.cancellationHours}h prior`
                                        : ""}
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                      Non-refundable
                                    </span>
                                  )}
                                </div>

                                <h4
                                  className="text-xl sm:text-2xl font-bold text-deep-wood mb-1"
                                  style={{
                                    fontFamily: "var(--font-heading)",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {plan.name}
                                </h4>

                                {plan.tagline && (
                                  <p className="text-xs sm:text-sm text-deep-wood/70 font-medium">
                                    {plan.tagline}
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                {planPrice !== standardPrice && (
                                  <span className="text-xs font-semibold text-deep-wood/40 line-through block">
                                    Rs.{standardPrice.toLocaleString()}
                                  </span>
                                )}
                                <span
                                  className="text-2xl sm:text-3xl font-bold text-primary"
                                  style={{ fontFamily: "var(--font-heading)" }}
                                >
                                  Rs.{planPrice.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-deep-wood/60 font-semibold block">
                                  per night
                                </span>
                              </div>
                            </div>

                            {/* Features list */}
                            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(plan.features ?? []).map((feature, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2.5 text-xs sm:text-sm text-deep-wood/80 font-medium leading-relaxed"
                                >
                                  <CheckCircle2
                                    size={16}
                                    className="text-primary shrink-0 mt-0.5"
                                  />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-4">
                              <span className="text-xs text-deep-wood/60 font-medium">
                                Plus {TAX_PERCENT_LABEL} government taxes and
                                service charge
                              </span>

                              <button
                                type="button"
                                onClick={() => handleBookNow(plan.id)}
                                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer"
                              >
                                <span>Reserve on this Plan</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                )}

                {activeTab === "reviews" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Verified Rating Overview */}
                    <div className="p-6 sm:p-8 bg-white/90 border border-primary/20 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-outline-variant/30 pb-4 md:pb-0 md:pr-6">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-primary block mb-1">
                          Verified Guest Score
                        </span>
                        <div className="flex items-baseline justify-center md:justify-start gap-2 mb-2">
                          <span
                            className="text-4xl sm:text-5xl font-bold text-deep-wood"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {numericRating}
                          </span>
                          <span className="text-sm font-semibold text-deep-wood/60">
                            / 5.0
                          </span>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={16} fill="currentColor" />
                          ))}
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 flex items-center justify-center md:justify-start gap-1">
                          <ShieldCheck size={14} /> 100% of guests recommend
                        </p>
                      </div>

                      {/* Sub-Ratings Progress Bars */}
                      <div className="md:col-span-5 space-y-2.5 text-xs font-semibold text-deep-wood">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-deep-wood/75">
                              Serenity &amp; Ambience
                            </span>
                            <span className="font-bold text-primary">4.99</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full"
                              style={{ width: "99%" }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-deep-wood/75">
                              Butler &amp; Concierge
                            </span>
                            <span className="font-bold text-primary">5.00</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full"
                              style={{ width: "100%" }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-deep-wood/75">
                              Plunge Pool &amp; Cleanliness
                            </span>
                            <span className="font-bold text-primary">4.97</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full"
                              style={{ width: "97%" }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-deep-wood/75">
                              Bedding &amp; Linens Comfort
                            </span>
                            <span className="font-bold text-primary">4.95</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full"
                              style={{ width: "95%" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Write a Review Button */}
                      <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center">
                        {isAuthenticated ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setShowReviewForm(!showReviewForm);
                                setReviewSuccessMsg(false);
                              }}
                              className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer w-full text-center justify-center active:scale-98"
                            >
                              <PenTool size={14} />
                              <span>
                                {showReviewForm ? "Close Form" : "Write Review"}
                              </span>
                            </button>
                            <span className="text-[10px] text-deep-wood/60 font-medium mt-2 text-center md:text-right block">
                              One review per villa
                            </span>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/login"
                              className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 w-full text-center justify-center"
                            >
                              <UserCheck size={14} />
                              <span>Sign In to Review</span>
                            </Link>
                            <span className="text-[10px] text-deep-wood/60 font-medium mt-2 text-center md:text-right block">
                              Verified guest account required
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Review Form */}
                    <AnimatePresence>
                      {showReviewForm && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleSubmitReview}
                          className="p-6 sm:p-8 bg-surface-container-low/90 border border-primary/30 rounded-3xl space-y-5 overflow-hidden"
                        >
                          <div>
                            <h4
                              className="text-lg sm:text-xl font-bold text-deep-wood"
                              style={{
                                fontFamily: "var(--font-heading)",
                                fontStyle: "italic",
                              }}
                            >
                              Share Your Sanctuary Experience
                            </h4>
                            <p className="text-xs text-deep-wood/70 mt-0.5">
                              Your verified impressions guide future travelers.
                            </p>
                          </div>

                          {/* Rating Stars */}
                          <div>
                            <label className="text-xs font-bold text-deep-wood block mb-1.5 uppercase tracking-wider">
                              Overall Rating{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const isFilled =
                                    reviewHoverRating > 0
                                      ? star <= reviewHoverRating
                                      : star <= reviewRating;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setReviewRating(star)}
                                      onMouseEnter={() =>
                                        setReviewHoverRating(star)
                                      }
                                      onMouseLeave={() =>
                                        setReviewHoverRating(0)
                                      }
                                      className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                                    >
                                      <Star
                                        size={24}
                                        fill={
                                          isFilled ? "currentColor" : "none"
                                        }
                                        strokeWidth={1.5}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                              <span className="text-xs font-bold text-primary ml-2">
                                {reviewRating === 5 &&
                                  "★★★★★ (Exceptional Sanctuary)"}
                                {reviewRating === 4 && "★★★★☆ (Splendid Stay)"}
                                {reviewRating === 3 && "★★★☆☆ (Good Stay)"}
                                {reviewRating === 2 && "★★☆☆☆ (Fair Stay)"}
                                {reviewRating === 1 &&
                                  "★☆☆☆☆ (Needs Improvement)"}
                              </span>
                            </div>
                          </div>

                          {/* Verified User identity preview */}
                          <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white border border-outline-variant/40 rounded-xl">
                            <UserCheck
                              size={15}
                              className="text-primary shrink-0"
                            />
                            <span className="text-xs text-deep-wood/70 font-medium">
                              Publishing as
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-deep-wood">
                              {`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() ||
                                currentUser?.email}
                            </span>
                            {currentUser?.country && (
                              <span className="text-[11px] text-deep-wood/55 font-medium">
                                · {currentUser.country}
                              </span>
                            )}
                          </div>

                          {/* Headline */}
                          <div>
                            <label className="text-xs font-bold text-deep-wood block mb-1 uppercase tracking-wider">
                              Headline / Summary
                            </label>
                            <input
                              type="text"
                              value={reviewHeadline}
                              onChange={(e) =>
                                setReviewHeadline(e.target.value)
                              }
                              placeholder="e.g. Suspended above the rainforest — absolute tranquility"
                              className="w-full px-4 py-3 bg-white border border-outline-variant/40 rounded-xl text-xs sm:text-sm text-deep-wood font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
                            />
                          </div>

                          {/* Comment */}
                          <div>
                            <label className="text-xs font-bold text-deep-wood block mb-1 uppercase tracking-wider">
                              Detailed Stay Experience{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={4}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Share your thoughts on the plunge pool, butler service, panoramic views, and peaceful moments..."
                              className={[
                                "w-full px-4 py-3 bg-white border rounded-2xl text-xs sm:text-sm text-deep-wood font-medium leading-relaxed focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs resize-none",
                                reviewErrors.comment
                                  ? "border-red-500"
                                  : "border-outline-variant/40",
                              ].join(" ")}
                            />
                            {reviewErrors.comment && (
                              <p className="text-[11px] text-red-600 mt-1 font-semibold">
                                {reviewErrors.comment}
                              </p>
                            )}
                          </div>

                          {/* Success Alert */}
                          {reviewSuccessMsg && (
                            <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                              <CheckCircle2
                                size={16}
                                className="text-emerald-700 shrink-0"
                              />
                              <span>
                                Thank you! Your verified review has been
                                published.
                              </span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowReviewForm(false)}
                              className="px-5 py-2.5 rounded-xl border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              disabled={isPostingReview}
                              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                            >
                              {isPostingReview ? (
                                <RotateCw size={13} className="animate-spin" />
                              ) : (
                                <Send size={13} />
                              )}
                              <span>
                                {isPostingReview
                                  ? "Publishing…"
                                  : "Publish Review"}
                              </span>
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* Verified Review Cards Feed */}
                    <div className="space-y-4">
                      {reviewsLoading ? (
                        <div className="p-12 bg-white/90 border border-primary/20 rounded-3xl text-center shadow-xs">
                          <RotateCw
                            size={28}
                            className="mx-auto animate-spin text-primary/40 mb-3"
                          />
                          <p className="text-xs font-bold uppercase tracking-wider text-deep-wood/60">
                            Loading guest reviews…
                          </p>
                        </div>
                      ) : reviewsError ? (
                        <div className="p-12 bg-white/90 border border-primary/20 rounded-3xl text-center shadow-xs">
                          <AlertCircle
                            size={32}
                            className="mx-auto text-primary/40 mb-3"
                          />
                          <p className="text-xs font-semibold text-deep-wood/70">
                            Guest reviews are unavailable right now.
                          </p>
                        </div>
                      ) : villaReviews.length === 0 ? (
                        <div className="p-12 bg-white/90 border border-primary/20 rounded-3xl text-center shadow-xs space-y-3">
                          <MessageSquare
                            size={36}
                            className="mx-auto text-primary/30"
                          />
                          <h4
                            className="text-xl font-bold text-deep-wood"
                            style={{
                              fontFamily: "var(--font-heading)",
                              fontStyle: "italic",
                            }}
                          >
                            No Reviews Yet for this Sanctuary
                          </h4>
                          <p className="text-xs sm:text-sm text-deep-wood/70 max-w-sm mx-auto">
                            Be the first guest to share your experience staying
                            at {villa.name}.
                          </p>
                          {isAuthenticated ? (
                            <button
                              type="button"
                              onClick={() => setShowReviewForm(true)}
                              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-all cursor-pointer shadow-sm"
                            >
                              Write First Review
                            </button>
                          ) : (
                            <Link
                              to="/login"
                              className="inline-block px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-all shadow-sm"
                            >
                              Sign In to Review
                            </Link>
                          )}
                        </div>
                      ) : (
                        villaReviews.map((review) => (
                          <div
                            key={review.id}
                            className="p-6 sm:p-7 bg-white/90 border border-outline-variant/30 rounded-3xl shadow-xs space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-surface-container-high border border-primary/30 flex items-center justify-center font-bold text-xs text-primary shadow-xs">
                                  {review.guestName
                                    ? review.guestName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()
                                    : "AV"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-deep-wood">
                                      {review.guestName || "Verified Guest"}
                                    </span>
                                    {review.isVerified && (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Verified
                                        Guest
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-deep-wood/55 font-medium block">
                                    {review.guestOrigin ||
                                      "International Guest"}{" "}
                                    • Stayed {review.stayDate}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-amber-500">
                                {[...Array(Number(review.rating) || 5)].map(
                                  (_, idx) => (
                                    <Star
                                      key={idx}
                                      size={15}
                                      fill="currentColor"
                                    />
                                  ),
                                )}
                              </div>
                            </div>

                            {review.headline && (
                              <h5
                                className="text-base sm:text-lg font-bold text-deep-wood"
                                style={{
                                  fontFamily: "var(--font-heading)",
                                  fontStyle: "italic",
                                }}
                              >
                                "{review.headline}"
                              </h5>
                            )}

                            <p className="text-xs sm:text-sm text-deep-wood/85 leading-relaxed font-medium">
                              {review.comment}
                            </p>

                            <div className="pt-2 flex items-center justify-between text-xs text-deep-wood/60">
                              <span className="text-[11px]">
                                Aviora Sanctuary Verified Stay
                              </span>
                              <button
                                type="button"
                                onClick={() => handleHelpfulClick(review.id)}
                                className={[
                                  "flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all text-xs font-semibold",
                                  review.hasVoted
                                    ? "bg-primary/10 border-primary/30 text-primary cursor-default"
                                    : isAuthenticated
                                      ? "border-outline-variant/40 hover:bg-surface-container-high text-deep-wood/70 cursor-pointer"
                                      : "border-outline-variant/30 text-deep-wood/40 cursor-not-allowed",
                                ].join(" ")}
                              >
                                <ThumbsUp size={12} />
                                <span>
                                  Helpful ({review.helpfulCount || 0})
                                </span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column: Sticky Instant Reservation Console */}
              <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
                <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-md border border-primary/25 rounded-3xl shadow-xl space-y-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block mb-1 font-mono">
                      Reservation Quote
                    </span>
                    <div className="flex items-baseline gap-2">
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
                    <span className="text-[11px] text-deep-wood/55 block font-medium mt-0.5">
                      Plus {TAX_PERCENT_LABEL} government taxes &amp; service
                      charge
                    </span>
                  </div>

                  {/* Stay Dates Picker */}
                  <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                    <div>
                      <label className="text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-primary" />{" "}
                        Check-in Date
                      </label>

                      <input
                        type="date"
                        value={checkIn}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => dispatch(setCheckIn(e.target.value))}
                        className="w-full px-4 py-2.5 bg-surface-container-low/80 border border-outline-variant/50 rounded-xl text-xs sm:text-sm font-semibold text-deep-wood focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-100"
                      />
                    </div>

                    <div>
  <label className="text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
    <CalendarDays size={14} className="text-primary" />{" "}
    Check-out Date
  </label>

  <input
    type="date"
    value={checkOut}
    min={checkIn}
    onChange={(e) => dispatch(setCheckOut(e.target.value))}
    className="w-full px-4 py-2.5 bg-surface-container-low/80 border border-outline-variant/50 rounded-xl text-xs sm:text-sm font-semibold text-deep-wood focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-100"
  />
</div>

                    {/* Live availability against dbo.VillaInventory */}
                    {checkingAvailability && (
                      <p className="text-[11px] text-deep-wood/55 font-semibold flex items-center gap-1.5">
                        <RotateCw size={12} className="animate-spin" />
                        Checking availability for these dates…
                      </p>
                    )}

                    {availability && !checkingAvailability && (
                      <div
                        className={[
                          "p-3 rounded-xl text-[11px] font-semibold flex items-start gap-2 border",
                          availability.available
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-amber-50 border-amber-200 text-amber-900",
                        ].join(" ")}
                      >
                        {availability.available ? (
                          <CheckCircle2
                            size={14}
                            className="shrink-0 mt-0.5 text-emerald-700"
                          />
                        ) : (
                          <AlertCircle
                            size={14}
                            className="shrink-0 mt-0.5 text-amber-700"
                          />
                        )}
                        <span className="leading-relaxed">
                          {availability.available
                            ? `Available — ${availability.unitsAvailable} unit${
                                availability.unitsAvailable === 1 ? "" : "s"
                              } left for these ${availability.nights} night${
                                availability.nights === 1 ? "" : "s"
                              }.`
                            : availability.message}
                          {!availability.available &&
                            availability.firstProblemDate && (
                              <span className="block mt-0.5 opacity-80">
                                First unavailable night:{" "}
                                {availability.firstProblemDate}
                              </span>
                            )}
                        </span>
                      </div>
                    )}

                    {/* Occupancy Stepper */}
                    <div>
                      <label className="text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Users size={14} className="text-primary" /> Guests
                        &amp; Occupancy
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low/80 border border-outline-variant/40 rounded-xl text-xs font-bold shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(setAdults(Math.max(1, adults - 1)))
                            }
                            className="w-6 h-6 rounded-lg bg-white border border-outline-variant/60 flex items-center justify-center text-xs font-bold text-deep-wood hover:bg-primary hover:text-white transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span>{adults} Adults</span>
                          <button
                            type="button"
                            onClick={() => dispatch(setAdults(adults + 1))}
                            className="w-6 h-6 rounded-lg bg-white border border-outline-variant/60 flex items-center justify-center text-xs font-bold text-deep-wood hover:bg-primary hover:text-white transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low/80 border border-outline-variant/40 rounded-xl text-xs font-bold shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(setChildren(Math.max(0, children - 1)))
                            }
                            className="w-6 h-6 rounded-lg bg-white border border-outline-variant/60 flex items-center justify-center text-xs font-bold text-deep-wood hover:bg-primary hover:text-white transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span>{children} Kids</span>
                          <button
                            type="button"
                            onClick={() => dispatch(setChildren(children + 1))}
                            className="w-6 h-6 rounded-lg bg-white border border-outline-variant/60 flex items-center justify-center text-xs font-bold text-deep-wood hover:bg-primary hover:text-white transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Calculation Summary */}
                  <div className="p-4 bg-surface-container-low/70 border border-primary/20 rounded-2xl space-y-2 text-xs font-semibold text-deep-wood">
                    <div className="flex justify-between text-deep-wood/75">
                      <span>
                        Rs.{fromPrice.toLocaleString()} × {nights} Night
                        {nights > 1 ? "s" : ""}
                      </span>
                      <span>Rs.{(fromPrice * nights).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-deep-wood/75">
                      <span>Taxes &amp; Fees ({taxPercent}%)</span>
                      <span>
                        Rs.
                        {Math.round(
                          fromPrice * nights * (taxMultiplier - 1),
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-outline-variant/30 flex justify-between font-bold text-sm text-primary">
                      <span>Est. Total Stay</span>
                      <span>
                        Rs.
                        {Math.round(
                          fromPrice * nights * taxMultiplier,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Reserve Button */}
                  <button
                    type="button"
                    onClick={() => handleBookNow()}
                    disabled={stayUnavailable}
                    className="w-full py-4 bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-bold uppercase tracking-widest transition-all rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary"
                  >
                    <Sparkles size={16} />
                    <span>
                      {stayUnavailable ? "Not Available" : "Reserve Sanctuary"}
                    </span>
                    <ArrowRight size={16} />
                  </button>

                  {/* Trust Badges */}
                  <div className="space-y-2.5 pt-2 border-t border-outline-variant/20">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
                      <ShieldCheck
                        size={16}
                        className="text-emerald-600 shrink-0"
                      />
                      <span>Best Rate Direct Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-deep-wood/75">
                      <HeartHandshake
                        size={16}
                        className="text-primary shrink-0"
                      />
                      <span>Dedicated 24/7 Butler &amp; Concierge</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-deep-wood/75">
                      <Shield size={16} className="text-secondary shrink-0" />
                      <span>Free Cancellation up to 48h prior</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors z-20"
              aria-label="Close Lightbox"
            >
              <X size={24} />
            </button>

            <div className="relative max-w-6xl max-h-[85vh] w-full h-full flex items-center justify-center">
              <img
                src={gallerySlides[activeImageIndex] ?? villa.image}
                alt={`${villa.name} — fullscreen`}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />

              {slideCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToSlide(activeImageIndex - 1)}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button
                    type="button"
                    onClick={() => goToSlide(activeImageIndex + 1)}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile Sticky Bottom Booking Bar ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-primary/20 p-4 z-40 flex items-center justify-between gap-4 shadow-2xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-deep-wood/50 block">
            From
          </span>
          <span
            className="text-xl font-bold text-primary"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Rs.{fromPrice.toLocaleString()}
          </span>
          <span className="text-[10px] text-deep-wood/60 block">/ night</span>
        </div>

        <button
          type="button"
          onClick={() => handleBookNow()}
          className="px-6 py-3 bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 active:scale-98 cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Reserve</span>
        </button>
      </div>
    </div>
  );
}

function indexCaption(index, villa) {
  if (index === 0) return `${villa.name} — Master Living & Plunge Pool Vista`;
  if (index === 1)
    return `${villa.name} — Master Suite Bedroom & Custom Teak Bedding`;
  if (index === 2)
    return `${villa.name} — En-Suite Forest Spa Bathroom & Soaking Tub`;
  if (index === 3)
    return `${villa.name} — Private Timber Decking & Sun Loungers`;
  if (index === 4)
    return `${villa.name} — Rainforest Canopy Panorama at Sunset`;
  return `${villa.name} — Sanctuary Details & Bespoke Craftsmanship`;
}
