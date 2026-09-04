import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Calendar,
  Users,
  ShieldCheck,
  Sparkles,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  selectCheckIn,
  selectCheckOut,
  selectAdults,
  selectChildren,
  selectTotalGuests,
  selectSelectedVillaId,
  selectSelectedRatePlan,
  selectSelectedAddons,
  selectPromoCode,
  selectBookingStep,
  selectIsCheckoutOpen,
  selectGuestInfo,
  selectPaymentInfo,
  selectActiveBooking,
  setCheckIn,
  setCheckOut,
  setAdults,
  setChildren,
  setSelectedVillaId,
  setSelectedRatePlan,
  toggleAddon,
  applyPromoCode,
  setGuestInfoField,
  setPaymentInfoField,
  setStep,
  nextStep,
  prevStep,
  closeCheckout,
  completeBooking,
  openMyBookings,
} from "./bookingSlice";
import {
  useGetVillasQuery,
  useGetAddonsQuery,
  useGetBookingQuoteMutation,
  useCreateBookingMutation,
} from "../rooms/roomsApi";
import { useToast } from "../../components/common/Toast";

const money = (value) => `Rs.${Number(value ?? 0).toLocaleString()}`;

export default function BookingCheckoutModal() {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const isOpen = useSelector(selectIsCheckoutOpen);
  const step = useSelector(selectBookingStep);
  const checkIn = useSelector(selectCheckIn);
  const checkOut = useSelector(selectCheckOut);
  const adults = useSelector(selectAdults);
  const children = useSelector(selectChildren);
  const totalGuests = useSelector(selectTotalGuests);
  const selectedVillaId = useSelector(selectSelectedVillaId);
  const selectedRatePlan = useSelector(selectSelectedRatePlan);
  const selectedAddons = useSelector(selectSelectedAddons);
  const promoCodeInput = useSelector(selectPromoCode);
  const guestInfo = useSelector(selectGuestInfo);
  const paymentInfo = useSelector(selectPaymentInfo);
  const activeBooking = useSelector(selectActiveBooking);

  const [promoText, setPromoText] = useState(promoCodeInput);

  /* Card number, expiry and CVC live here and nowhere else. They are never
     dispatched to Redux - a PAN in a store that Redux DevTools can read
     would put this project in PCI-DSS scope - and only the last four digits
     are sent with the reservation. */
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null;

  /* ------------------------------------------------------------------
     Villas, add-ons and the price all come from the API now.

     The block that used to sit here computed roomSubtotal, discountAmount,
     taxesAndFees and finalTotal in the browser. Three problems with that:
     anyone could edit the numbers in DevTools before submitting, the tax was
     a flat 7% rather than the Sri Lankan cascade of 34.38%, and multiplying
     one nightly figure by the number of nights ignored every seasonal rate
     held in dbo.VillaInventory.
     ------------------------------------------------------------------ */

  const { data: apiVillas = [] } = useGetVillasQuery({ checkIn, checkOut });
  const { data: apiAddons = [] } = useGetAddonsQuery();

  const [getQuote, { isLoading: pricing }] = useGetBookingQuoteMutation();
  const [createBooking, { isLoading: creating }] = useCreateBookingMutation();

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const villa =
    apiVillas.find((v) => v.id === selectedVillaId) || apiVillas[0] || null;

  // Rate plans arrive priced FOR THIS VILLA - the modifier is already applied
  // to its base rate, and to any per-villa override.
  const ratePlans = villa?.ratePlans ?? [];

  const validDates = Boolean(checkIn && checkOut && checkOut > checkIn);

  /* Re-price whenever anything that affects the bill changes. The dependency
     list is the request body: if it is in there, it changes the total. */
  useEffect(() => {
    if (!isOpen || !selectedVillaId || !validDates) return;

    let cancelled = false;
    setSubmitError("");

    getQuote({
      villaId: selectedVillaId,
      ratePlan: selectedRatePlan,
      checkIn,
      checkOut,
      adults,
      children,
      promoCode: promoCodeInput || undefined,
      addons: selectedAddons,
    })
      .unwrap()
      .then((result) => {
        if (cancelled) return;
        setQuote(result);
        // priced:false is a normal answer - sold out, party too large, plan
        // not offered. The message explains which.
        setQuoteError(result.priced ? "" : result.message);
      })
      .catch((err) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(err?.data?.message || "Pricing is unavailable right now.");
      });

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    selectedVillaId,
    selectedRatePlan,
    checkIn,
    checkOut,
    adults,
    children,
    promoCodeInput,
    selectedAddons,
  ]);

  /* Names kept from the old block so the summary markup below is unchanged -
     the figures are simply no longer computed here. */
  const nights = quote?.nights ?? 0;
  const effectiveNightPrice = quote?.averageNightlyRate ?? 0;
  const roomSubtotal = quote?.roomSubtotal ?? 0;
  const addonsTotal = quote?.addonsTotal ?? 0;
  const discountAmount = quote?.discountAmount ?? 0;
  const taxesAndFees = quote?.taxTotal ?? 0;
  const finalTotal = quote?.finalTotal ?? 0;
  const promoDiscount = quote?.promoApplied ? quote.promoDiscountPct : 0;
  const taxLines = quote?.taxes ?? [];
  const canProceed = Boolean(quote?.priced);

  // Step 2 validation
  const validateStep2 = () => {
    const errors = {};
    if (!guestInfo.firstName.trim())
      errors.firstName = "First name is required";
    if (!guestInfo.lastName.trim()) errors.lastName = "Last name is required";
    if (!guestInfo.email.trim() || !guestInfo.email.includes("@"))
      errors.email = "Valid email is required";
    if (!guestInfo.phone.trim()) errors.phone = "Phone number is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      dispatch(nextStep());
    }
  };

  /* Step 3 submission.

     No total is sent. CreateBookingRequestDto has no money fields at all -
     usp_Booking_Create re-prices the stay from the dates, villa, plan,
     add-ons and promo code, so an edited figure in the browser changes
     nothing. The card number never leaves this component: only the holder
     name and the last four digits are transmitted. */
  const handleFinalSubmit = async () => {
    setSubmitError("");
    setIsProcessing(true);

    try {
      const result = await createBooking({
        villaId: selectedVillaId,
        ratePlan: selectedRatePlan,
        checkIn,
        checkOut,
        adults,
        children,
        promoCode: promoCodeInput || undefined,
        addons: selectedAddons,

        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        email: guestInfo.email,
        phone: guestInfo.phone,
        country: guestInfo.country,
        bedPreference: guestInfo.bedPreference,
        specialRequests: guestInfo.specialRequests,
        arrivalTime: guestInfo.flightTime,

        paymentMethod: paymentInfo.paymentMethod,
        cardHolderName:
          paymentInfo.paymentMethod === "card"
            ? paymentInfo.cardHolder || undefined
            : undefined,
        cardLast4:
          paymentInfo.paymentMethod === "card"
            ? cardNumber.replace(/\D/g, "").slice(-4)
            : undefined,
      }).unwrap();

      dispatch(completeBooking(result.booking));
      showSuccess(
        `Sanctuary reserved successfully. Confirmation ID: ${result.referenceId}`,
        { title: "Reservation Confirmed" },
      );
    } catch (err) {
      // 409 means the villa was taken while the guest was checking out, or
      // the promo code hit its limit in between. Both messages are specific
      // enough to show verbatim.
      const message =
        err?.data?.message || "Your reservation could not be completed.";
      setSubmitError(message);
      showError(message, { title: "Reservation Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  /* The browser cannot know whether a code has expired, hit its usage limit
     or requires a longer stay - usp_PromoCode_Validate checks all three. So
     this only records what was typed; the next quote reports the outcome. */
  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoText.trim()) {
      showError("Please enter a promotional code.");
      return;
    }
    dispatch(applyPromoCode(promoText));
  };

  const inputClass =
    "w-full px-3 py-2 bg-white text-deep-wood font-semibold border-2 border-primary/40 text-xs rounded-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-deep-wood/40 transition-colors";
  const labelClass = "text-xs font-bold text-deep-wood block mb-1";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative w-full max-w-5xl bg-surface rounded-xl shadow-2xl overflow-hidden border-2 border-primary flex flex-col max-h-[92vh]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {/* Pricing state. A refusal is shown once, at the top, rather than
              letting the guest walk three steps into a stay that cannot be
              booked. */}
          {quoteError && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2 shrink-0">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{quoteError}</span>
            </div>
          )}

          {/* ── Modal Header ── */}
          <div className="px-6 py-4 bg-deep-wood text-resort-white flex items-center justify-between border-b border-primary/30 shrink-0">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo/Aviora Resort Logo - Without Background.png"
                alt="Aviora Resort"
                className="w-8 h-8 object-contain"
              />
              <div>
                <h2
                  className="text-lg font-bold italic tracking-wide text-sand"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Aviora Resort Reservation
                </h2>
                <p className="text-xs text-resort-white/70">
                  Instant Confirmation &amp; Best Price Guaranteed
                </p>
              </div>
            </div>

            <button
              onClick={() => dispatch(closeCheckout())}
              className="p-2 rounded-full hover:bg-white/10 text-resort-white/70 hover:text-white transition-colors"
              aria-label="Close booking modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Progress Stepper Bar ── */}
          <div className="px-6 py-3 bg-surface-container-low border-b border-primary/20 shrink-0">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {[
                { num: 1, title: "Villa & Rate" },
                { num: 2, title: "Guest Details & Extras" },
                { num: 3, title: "Payment & Confirm" },
                { num: 4, title: "Voucher" },
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={[
                      "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors",
                      step > s.num
                        ? "bg-primary text-white"
                        : step === s.num
                          ? "bg-secondary text-white ring-2 ring-secondary/30"
                          : "bg-surface-container-high text-deep-wood/60",
                    ].join(" ")}
                  >
                    {step > s.num ? <Check size={14} /> : s.num}
                  </div>
                  <span
                    className={[
                      "text-xs font-bold hidden sm:inline",
                      step === s.num ? "text-deep-wood" : "text-deep-wood/60",
                    ].join(" ")}
                  >
                    {s.title}
                  </span>
                  {idx < 3 && (
                    <div className="w-6 sm:w-12 h-px bg-primary/30 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Main Modal Body (Scrollable) ── */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* ========================================================================= */}
            {/* STEP 1: Villa & Rate Selection */}
            {/* ========================================================================= */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Col: Villa Summary & Date Search Bar */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Villa Selector Card */}
                  <div className="p-5 bg-surface-container-lowest border-2 border-primary/30 rounded-lg shadow-xs">
                    <div className="flex gap-4 items-start">
                      <img
                        src={villa?.image}
                        alt={villa?.name}
                        className="w-28 h-24 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary rounded-xs">
                            {villa?.category}
                          </span>
                          <span className="text-xs text-secondary font-bold flex items-center gap-1">
                            ★ {villa?.rating} ({villa?.reviewCount} reviews)
                          </span>
                        </div>
                        <h3
                          className="text-xl font-bold text-deep-wood italic"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {villa?.name}
                        </h3>
                        <p className="text-xs text-deep-wood/80 mt-1 line-clamp-2">
                          {villa?.tagline}
                        </p>
                        <div className="mt-2 text-xs font-bold text-error flex items-center gap-1">
                          {villa?.popularBadge}
                        </div>
                      </div>
                    </div>

                    {/* Change Villa dropdown */}
                    <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between">
                      <span className="text-xs text-deep-wood font-bold">
                        Select Villa:
                      </span>
                      <select
                        value={selectedVillaId}
                        onChange={(e) =>
                          dispatch(setSelectedVillaId(e.target.value))
                        }
                        className="px-3 py-1.5 bg-white border-2 border-primary/40 text-xs font-bold text-deep-wood rounded-xs focus:outline-none focus:border-primary"
                      >
                        {apiVillas.map((v) => (
                          <option
                            key={v.id}
                            value={v.id}
                            disabled={v.isDateFiltered && !v.isAvailable}
                          >
                            {v.name} — {money(v.fromPricePerNight)}/night
                            {v.isDateFiltered
                              ? v.isAvailable
                                ? ` (${v.availableSlots} left)`
                                : " (sold out)"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dates & Guests Search Widget */}
                  <div className="p-5 bg-surface-container-low border-2 border-primary/30 rounded-lg">
                    <h4 className="text-sm font-bold text-deep-wood uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Calendar size={16} className="text-primary" /> Stay
                      Parameters
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Check-in Date</label>
                        <input
                          type="date"
                          value={checkIn}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => dispatch(setCheckIn(e.target.value))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Check-out Date</label>
                        <input
                          type="date"
                          value={checkOut}
                          min={checkIn}
                          onChange={(e) =>
                            dispatch(setCheckOut(e.target.value))
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between bg-white p-3 border-2 border-primary/30 rounded-xs">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-xs font-bold text-deep-wood">
                          Guests:
                        </span>
                        <span className="text-xs text-deep-wood font-semibold">
                          {adults} Adult{adults > 1 ? "s" : ""}, {children}{" "}
                          Child{children !== 1 ? "ren" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            dispatch(setAdults(Math.max(1, adults - 1)))
                          }
                          className="w-6 h-6 border-2 border-primary/40 rounded-xs flex items-center justify-center text-sm font-bold text-deep-wood hover:bg-primary/10"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-deep-wood">
                          {adults}
                        </span>
                        <button
                          onClick={() => dispatch(setAdults(adults + 1))}
                          className="w-6 h-6 border-2 border-primary/40 rounded-xs flex items-center justify-center text-sm font-bold text-deep-wood hover:bg-primary/10"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rate Plan Selector */}
                  <div>
                    <h4 className="text-sm font-bold text-deep-wood uppercase tracking-wider mb-3">
                      Choose Your Rate Plan
                    </h4>
                    <div className="flex flex-col gap-3">
                      {ratePlans.map((rate) => {
                        const isSelected = selectedRatePlan === rate.id;
                        // Already priced for this villa by the API, including
                        // any per-villa modifier override.
                        const calcPrice = Number(rate.pricePerNight ?? 0);

                        return (
                          <div
                            key={rate.id}
                            onClick={() =>
                              dispatch(setSelectedRatePlan(rate.id))
                            }
                            className={[
                              "p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 relative",
                              isSelected
                                ? "bg-white border-primary shadow-md ring-2 ring-primary/40"
                                : "bg-surface-container-low border-primary/30 hover:border-primary",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={[
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    isSelected
                                      ? "border-primary bg-primary"
                                      : "border-primary/50",
                                  ].join(" ")}
                                >
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-deep-wood text-sm">
                                      {rate.name}
                                    </h5>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-secondary/20 text-secondary rounded-xs">
                                      {rate.badge}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-base font-bold text-primary">
                                  {money(calcPrice)}
                                </span>
                                <span className="text-[10px] text-deep-wood/60 block font-semibold">
                                  / night
                                </span>
                              </div>
                            </div>

                            <ul className="mt-3 pl-8 grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {rate.features.map((feat, fIdx) => (
                                <li
                                  key={fIdx}
                                  className="text-[11px] text-deep-wood/80 font-medium flex items-center gap-1.5"
                                >
                                  <CheckCircle2
                                    size={12}
                                    className="text-lush-canopy shrink-0"
                                  />
                                  {feat}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Col: Price Summary Card & Next CTA */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="p-6 bg-surface-container-lowest border-2 border-primary/30 rounded-lg shadow-sm sticky top-0">
                    <h4
                      className="text-base font-bold text-deep-wood italic mb-4 border-b border-primary/20 pb-3"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Booking Summary
                    </h4>

                    <div className="space-y-3 text-xs text-deep-wood font-medium">
                      <div className="flex justify-between">
                        <span>Duration of Stay:</span>
                        <span className="font-bold text-deep-wood">
                          {nights} Night{nights > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dates:</span>
                        <span className="font-bold text-deep-wood">
                          {checkIn} &rarr; {checkOut}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guests:</span>
                        <span className="font-bold text-deep-wood">
                          {totalGuests} Guest{totalGuests > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate Plan:</span>
                        <span className="font-bold text-secondary">
                          {quote?.priced ? ratePlans.find((r) => r.id === selectedRatePlan)?.name ?? selectedRatePlan : selectedRatePlan}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-primary/20 flex justify-between">
                        <span>
                          {nights} nights x {money(effectiveNightPrice)}
                        </span>
                        <span className="font-bold">{money(roomSubtotal)}</span>
                      </div>

                      <div className="flex justify-between text-deep-wood/70">
                        <span>Taxes &amp; service charge</span>
                        <span>{money(taxesAndFees)}</span>
                      </div>

                      <div className="pt-3 border-t border-primary/30 flex justify-between items-baseline">
                        <span className="text-sm font-bold text-deep-wood">
                          Total Price:
                        </span>
                        <span
                          className="text-2xl font-bold text-primary"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {money(finalTotal)}
                        </span>
                      </div>
                      <p className="text-[10px] text-deep-wood/60 text-right font-medium">
                        Includes all taxes and fees
                      </p>
                    </div>

                    <div className="mt-6 space-y-3">
                      <button
                        onClick={() => dispatch(nextStep())}
                        className="w-full py-3 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2 shadow-sm"
                      >
                        Continue to Guest Details <ArrowRight size={16} />
                      </button>

                      <div className="p-3 bg-surface-container-low rounded-xs border-2 border-primary/30 flex items-center gap-2 text-[11px] text-deep-wood font-medium">
                        <ShieldCheck
                          size={16}
                          className="text-secondary shrink-0"
                        />
                        <span>Instant confirmation. Zero booking fees.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: Guest Details & Add-ons */}
            {/* ========================================================================= */}
            {step === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Guest Information Form */}
                  <div className="p-6 bg-surface-container-lowest border-2 border-primary/30 rounded-lg shadow-xs">
                    <h3
                      className="text-lg font-bold text-deep-wood italic mb-4"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Main Guest Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>First Name *</label>
                        <input
                          type="text"
                          value={guestInfo.firstName}
                          onChange={(e) =>
                            dispatch(
                              setGuestInfoField({
                                field: "firstName",
                                value: e.target.value,
                              }),
                            )
                          }
                          placeholder="e.g. Eleanor"
                          className={inputClass}
                        />
                        {formErrors.firstName && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            {formErrors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>Last Name *</label>
                        <input
                          type="text"
                          value={guestInfo.lastName}
                          onChange={(e) =>
                            dispatch(
                              setGuestInfoField({
                                field: "lastName",
                                value: e.target.value,
                              }),
                            )
                          }
                          placeholder="e.g. Vance"
                          className={inputClass}
                        />
                        {formErrors.lastName && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            {formErrors.lastName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>Email Address *</label>
                        <input
                          type="email"
                          value={guestInfo.email}
                          onChange={(e) =>
                            dispatch(
                              setGuestInfoField({
                                field: "email",
                                value: e.target.value,
                              }),
                            )
                          }
                          placeholder="eleanor@example.com"
                          className={inputClass}
                        />
                        {formErrors.email && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            {formErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>Phone Number *</label>
                        <input
                          type="tel"
                          value={guestInfo.phone}
                          onChange={(e) =>
                            dispatch(
                              setGuestInfoField({
                                field: "phone",
                                value: e.target.value,
                              }),
                            )
                          }
                          placeholder="+1 (555) 234-5678"
                          className={inputClass}
                        />
                        {formErrors.phone && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            {formErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className={labelClass}>Bed Configuration</label>
                        <select
                          value={guestInfo.bedPreference}
                          onChange={(e) =>
                            dispatch(
                              setGuestInfoField({
                                field: "bedPreference",
                                value: e.target.value,
                              }),
                            )
                          }
                          className={inputClass}
                        >
                          <option value="1 King Bed">1 King Bed</option>
                          <option value="2 Twin Beds">2 Twin Beds</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>
                          Estimated Arrival Time
                        </label>
                        <select
                          value={guestInfo.flightTime}
                          onChange={(e) =>
                            dispatch(
                              setGuestInfoField({
                                field: "flightTime",
                                value: e.target.value,
                              }),
                            )
                          }
                          className={inputClass}
                        >
                          <option value="">I don't know yet</option>
                          <option value="12:00 - 14:00">
                            12:00 - 14:00 (Early Arrival)
                          </option>
                          <option value="14:00 - 18:00">
                            14:00 - 18:00 (Standard Check-in)
                          </option>
                          <option value="18:00 - 22:00">
                            18:00 - 22:00 (Evening)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={labelClass}>
                        Special Requests (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={guestInfo.specialRequests}
                        onChange={(e) =>
                          dispatch(
                            setGuestInfoField({
                              field: "specialRequests",
                              value: e.target.value,
                            }),
                          )
                        }
                        placeholder="Dietary requirements, anniversary celebration, airport pick-up notes..."
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Add-ons & Extras */}
                  <div className="p-6 bg-surface-container-lowest border-2 border-primary/30 rounded-lg shadow-xs">
                    <h3
                      className="text-lg font-bold text-deep-wood italic mb-1"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Enhance Your Stay
                    </h3>
                    <p className="text-xs text-deep-wood/70 font-medium mb-4">
                      Select bespoke luxury add-ons to customize your
                      experience.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {apiAddons.map((addon) => {
                        const isChecked = selectedAddons.includes(addon.id);
                        return (
                          <div
                            key={addon.id}
                            onClick={() => dispatch(toggleAddon(addon.id))}
                            className={[
                              "p-3.5 border-2 rounded-md cursor-pointer transition-all duration-300 flex items-start gap-3",
                              isChecked
                                ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                                : "bg-white border-primary/30 hover:border-primary",
                            ].join(" ")}
                          >
                            <div
                              className={[
                                "w-4 h-4 rounded-xs border-2 mt-0.5 flex items-center justify-center shrink-0",
                                isChecked
                                  ? "bg-primary border-primary text-white"
                                  : "border-primary/50",
                              ].join(" ")}
                            >
                              {isChecked && <Check size={12} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-deep-wood">
                                  {addon.icon} {addon.name}
                                </span>
                                <span className="text-xs font-bold text-primary">
                                  +{money(addon.price)}
                                </span>
                              </div>
                              <p className="text-[10px] text-deep-wood/70 font-medium mt-1 leading-snug">
                                {addon.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Col: Summary & Navigation */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="p-6 bg-surface-container-lowest border-2 border-primary/30 rounded-lg shadow-sm sticky top-0">
                    <h4
                      className="text-base font-bold text-deep-wood italic mb-4 border-b border-primary/20 pb-3"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Reservation Summary
                    </h4>

                    <div className="space-y-2 text-xs text-deep-wood font-medium">
                      <div className="flex justify-between">
                        <span className="font-bold text-deep-wood">
                          {villa?.name}
                        </span>
                        <span>{money(roomSubtotal)}</span>
                      </div>
                      <div className="text-[11px] text-deep-wood/70">
                        {nights} Nights ({checkIn} – {checkOut})
                      </div>

                      {selectedAddons.length > 0 && (
                        <div className="pt-2 border-t border-primary/20 space-y-1">
                          <span className="font-bold text-deep-wood block">
                            Add-ons:
                          </span>
                          {/* Priced by the quote, which applies each add-on's
                              charge basis - per stay, per night or per guest. */}
                          {(quote?.addons ?? []).map((line) => (
                            <div
                              key={line.id}
                              className="flex justify-between text-[11px] text-deep-wood/80 font-medium pl-2"
                            >
                              <span>{line.name}</span>
                              <span>+{money(line.lineTotal)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-3 border-t border-primary/20 flex justify-between">
                        <span>Taxes &amp; service charge</span>
                        <span>{money(taxesAndFees)}</span>
                      </div>

                      <div className="pt-3 border-t border-primary/30 flex justify-between items-baseline">
                        <span className="text-sm font-bold text-deep-wood">
                          Total:
                        </span>
                        <span
                          className="text-2xl font-bold text-primary"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {money(finalTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <button
                        onClick={handleNextFromStep2}
                        className="w-full py-3 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2"
                      >
                        Proceed to Payment <ArrowRight size={16} />
                      </button>

                      <button
                        onClick={() => dispatch(prevStep())}
                        className="w-full py-2 bg-transparent text-deep-wood/80 hover:text-deep-wood text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ArrowLeft size={14} /> Back to Villa Selection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: Payment & Guarantee */}
            {/* ========================================================================= */}
            {step === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Payment Method Selector */}
                  <div className="p-6 bg-surface-container-lowest border-2 border-primary/30 rounded-lg shadow-xs">
                    <h3
                      className="text-lg font-bold text-deep-wood italic mb-4"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Select Payment Method
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <div
                        onClick={() =>
                          dispatch(
                            setPaymentInfoField({
                              field: "paymentMethod",
                              value: "card",
                            }),
                          )
                        }
                        className={[
                          "p-4 border-2 rounded-md cursor-pointer flex items-center gap-3 transition-all",
                          paymentInfo.paymentMethod === "card"
                            ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                            : "border-primary/30 hover:border-primary",
                        ].join(" ")}
                      >
                        <CreditCard
                          className="text-primary shrink-0"
                          size={20}
                        />
                        <div>
                          <span className="text-xs font-bold text-deep-wood block">
                            Credit / Debit Card
                          </span>
                          <span className="text-[10px] text-deep-wood/70 font-medium">
                            Instant Secure Pay
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() =>
                          dispatch(
                            setPaymentInfoField({
                              field: "paymentMethod",
                              value: "resort",
                            }),
                          )
                        }
                        className={[
                          "p-4 border-2 rounded-md cursor-pointer flex items-center gap-3 transition-all",
                          paymentInfo.paymentMethod === "resort"
                            ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                            : "border-primary/30 hover:border-primary",
                        ].join(" ")}
                      >
                        <ShieldCheck
                          className="text-secondary shrink-0"
                          size={20}
                        />
                        <div>
                          <span className="text-xs font-bold text-deep-wood block">
                            Pay at Resort
                          </span>
                          <span className="text-[10px] text-deep-wood/70 font-medium">
                            Guarantee with Card
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Form */}
                    <div className="space-y-4 pt-2 border-t border-primary/20">
                      <div>
                        <label className={labelClass}>Cardholder Name</label>
                        <input
                          type="text"
                          value={paymentInfo.cardHolder}
                          onChange={(e) =>
                            dispatch(
                              setPaymentInfoField({
                                field: "cardHolder",
                                value: e.target.value,
                              }),
                            )
                          }
                          placeholder={`${guestInfo.firstName} ${guestInfo.lastName}`}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Card Number</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4532 •••• •••• 8921"
                          className={inputClass}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>CVC Code</label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="123"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-xs text-deep-wood/80 font-medium bg-white p-3 rounded-xs border-2 border-primary/30">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-lush-canopy" />
                        <span>Encrypted 256-bit SSL Transaction</span>
                      </div>
                      <div className="flex gap-1 font-bold text-deep-wood">
                        <span>VISA</span> • <span>MC</span> • <span>AMEX</span>
                      </div>
                    </div>
                  </div>

                  {/* Promo Code Card */}
                  <div className="p-5 bg-surface-container-lowest border-2 border-primary/30 rounded-lg">
                    <h4 className="text-xs font-bold text-deep-wood uppercase tracking-wider mb-2">
                      Have a Promo Code?
                    </h4>
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        value={promoText}
                        onChange={(e) => setPromoText(e.target.value)}
                        placeholder="Try 'AVIORA2026' or 'VIP20'"
                        className="flex-1 px-3 py-2 bg-white border-2 border-primary/40 text-xs uppercase font-bold text-deep-wood rounded-xs focus:outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-secondary text-white text-xs font-bold uppercase rounded-xs hover:bg-secondary/90 transition-colors"
                      >
                        Apply
                      </button>
                    </form>
                    {/* The server validated the code - date range, usage
                        limit and minimum stay included - so the outcome comes
                        from the quote rather than a guess in the browser. */}
                    {quote?.promoApplied && (
                      <p className="text-xs text-primary font-bold mt-2">
                        ✓ Code applied. {quote.promoDiscountPct}% off the gross
                        subtotal.
                      </p>
                    )}
                    {promoCodeInput && quote && !quote.promoApplied && quote.promoMessage && (
                      <p className="text-xs text-amber-700 font-bold mt-2 flex items-start gap-1.5">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        {quote.promoMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Col: Final Checkout Card */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="p-6 bg-surface-container-lowest border-2 border-primary/30 rounded-lg shadow-sm sticky top-0">
                    <h4
                      className="text-base font-bold text-deep-wood italic mb-4 border-b border-primary/20 pb-3"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Final Price Breakdown
                    </h4>

                    <div className="space-y-2 text-xs text-deep-wood font-medium">
                      <div className="flex justify-between">
                        <span>Room Rate ({nights} nights)</span>
                        <span>{money(roomSubtotal)}</span>
                      </div>

                      {addonsTotal > 0 && (
                        <div className="flex justify-between">
                          <span>Luxury Extras ({selectedAddons.length})</span>
                          <span>+{money(addonsTotal)}</span>
                        </div>
                      )}

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-primary font-bold">
                          <span>Promo Discount ({promoDiscount}%)</span>
                          <span>−{money(discountAmount)}</span>
                        </div>
                      )}

                      {/* The Sri Lankan folio: service charge 10%, TDL 1%,
                          SSCL 2.5%, VAT 18%, each applied to the running
                          total. Itemised from the quote rather than printed
                          as one figure - and the old 7% was never right. */}
                      {taxLines.map((line) => (
                        <div
                          key={line.code}
                          className="flex justify-between text-deep-wood/70"
                        >
                          <span>
                            {line.displayName} ({line.percentage}%)
                          </span>
                          <span>{money(line.taxAmount)}</span>
                        </div>
                      ))}

                      <div className="pt-3 border-t border-primary/30 flex justify-between items-baseline">
                        <span className="text-base font-bold text-deep-wood">
                          Total Due:
                        </span>
                        <span
                          className="text-3xl font-bold text-primary"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {money(finalTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {submitError && (
                        <div className="p-3 rounded-xs bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-start gap-2">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      {/* Blocked when the stay cannot be priced - sold out,
                          party too large, plan not offered. Without this a
                          guest reaches step 3 and only finds out at submit. */}
                      <button
                        disabled={isProcessing || creating || pricing || !canProceed}
                        onClick={handleFinalSubmit}
                        className="w-full py-3.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing || creating ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Processing Reservation…</span>
                          </>
                        ) : !canProceed ? (
                          <span>Unavailable for These Dates</span>
                        ) : (
                          <>
                            <Sparkles size={16} /> Complete &amp; Lock Reservation
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => dispatch(prevStep())}
                        className="w-full py-2 bg-transparent text-deep-wood/80 hover:text-deep-wood text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ArrowLeft size={14} /> Back to Guest Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: Instant Confirmation & Digital Voucher */}
            {/* ========================================================================= */}
            {step === 4 && activeBooking && (
              <div className="max-w-2xl mx-auto py-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3
                    className="text-2xl font-bold text-deep-wood italic"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Reservation Confirmed!
                  </h3>
                  <p className="text-xs text-deep-wood/80 font-medium mt-1">
                    Thank you, {activeBooking.guest?.firstName || activeBooking.guestInfo?.firstName || "Guest"}. Your luxury
                    stay is officially booked.
                  </p>
                </div>

                {/* Voucher Card */}
                <div className="p-6 bg-white border-2 border-primary rounded-xl shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4 mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                        Booking Reference
                      </span>
                      <span className="text-xl font-bold text-deep-wood font-mono">
                        {activeBooking.referenceId}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-lush-canopy/15 text-lush-canopy text-xs font-bold rounded-xs">
                      ✓ Guaranteed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                    <div>
                      <span className="text-deep-wood/60 block font-semibold">Villa Reserved:</span>
                      <span className="font-bold text-deep-wood text-sm">{activeBooking.villaName}</span>
                    </div>
                    <div>
                      <span className="text-deep-wood/60 block font-semibold">Guests:</span>
                      <span className="font-bold text-deep-wood">{activeBooking.adults} Adults, {activeBooking.children} Children</span>
                    </div>
                    <div>
                      <span className="text-deep-wood/60 block font-semibold">Check-in:</span>
                      <span className="font-bold text-deep-wood">{activeBooking.checkIn} (From 14:00)</span>
                    </div>
                    <div>
                      <span className="text-deep-wood/60 block font-semibold">Check-out:</span>
                      <span className="font-bold text-deep-wood">{activeBooking.checkOut} (Until 12:00)</span>
                    </div>
                  </div>

                  {((activeBooking.addons?.length > 0) || (activeBooking.selectedAddons?.length > 0)) && (
                    <div className="pt-3 border-t border-primary/20 mb-4">
                      <span className="text-[11px] font-bold text-deep-wood block mb-1">Included Luxury Enhancements:</span>
                      <div className="flex flex-wrap gap-2">
                        {(activeBooking.addons || activeBooking.selectedAddons || []).map((addon, idx) => (
                          <span key={addon.id || addon.code || idx} className="px-2 py-1 bg-surface-container text-[11px] font-bold text-deep-wood rounded-xs">
                            {addon.icon ? `${addon.icon} ` : ""}{addon.name || addon.addonName || (typeof addon === "string" ? addon : "Add-on")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-primary/20 flex items-center justify-between bg-surface-container-low p-4 rounded-lg">
                    <div>
                      <span className="text-[10px] text-deep-wood/70 block font-semibold">Total Amount Charged / Guaranteed:</span>
                      <span className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                        {money(activeBooking?.finalTotal)}
                      </span>
                    </div>
                    <span className="text-xs text-deep-wood font-medium">
                      Confirmation email sent to <strong>{activeBooking.guest?.email || activeBooking.guestInfo?.email}</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2.5 bg-surface-container-high text-deep-wood text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-surface-container-highest transition-colors flex items-center gap-2 border-2 border-primary/30"
                  >
                    <FileText size={14} /> Print Voucher / Receipt
                  </button>

                  <button
                    onClick={() => {
                      dispatch(closeCheckout());
                      dispatch(openMyBookings());
                    }}
                    className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-primary-container transition-colors"
                  >
                    View My Saved Bookings
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
