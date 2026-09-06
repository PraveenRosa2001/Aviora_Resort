// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useSearchParams, useNavigate, Link } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Check,
//   Calendar,
//   Users,
//   ShieldCheck,
//   Sparkles,
//   AlertCircle,
//   CreditCard,
//   ArrowRight,
//   ArrowLeft,
//   CheckCircle2,
//   Lock,
//   FileText,
//   Trash2,
//   CalendarCheck,
// } from "lucide-react";
// import {
//   selectCheckIn,
//   selectCheckOut,
//   selectAdults,
//   selectChildren,
//   selectTotalGuests,
//   selectSelectedVillaId,
//   selectSelectedRatePlan,
//   selectSelectedAddons,
//   selectPromoCode,
//   selectBookingStep,
//   selectGuestInfo,
//   selectPaymentInfo,
//   selectActiveBooking,
//   setCheckIn,
//   setCheckOut,
//   setAdults,
//   setChildren,
//   setSelectedVillaId,
//   setSelectedRatePlan,
//   toggleAddon,
//   applyPromoCode,
//   setGuestInfoField,
//   setPaymentInfoField,
//   setStep,
//   nextStep,
//   prevStep,
//   completeBooking,
//   resetBooking,
// } from "../features/booking/bookingSlice";
// import {
//   useGetVillasQuery,
//   useGetAddonsQuery,
//   useGetBookingQuoteMutation,
//   useCreateBookingMutation,
//   useGetMyBookingsQuery,
//   useCancelBookingMutation,
// } from "../features/rooms/roomsApi";

// const money = (value) => `Rs.${Number(value ?? 0).toLocaleString()}`;
// import {
//   selectCurrentUser,
//   selectIsAuthenticated,
// } from "../features/auth/authSlice";
// import { useToast } from "../components/common/Toast";

// export default function BookingPage() {
//   const { showSuccess, showError } = useToast();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();

//   const step = useSelector(selectBookingStep);
//   const checkIn = useSelector(selectCheckIn);
//   const checkOut = useSelector(selectCheckOut);
//   const adults = useSelector(selectAdults);
//   const children = useSelector(selectChildren);
//   const totalGuests = useSelector(selectTotalGuests);
//   const selectedVillaId = useSelector(selectSelectedVillaId);
//   const selectedRatePlan = useSelector(selectSelectedRatePlan);
//   const selectedAddons = useSelector(selectSelectedAddons);
//   const promoCodeInput = useSelector(selectPromoCode);
//   const guestInfo = useSelector(selectGuestInfo);
//   const paymentInfo = useSelector(selectPaymentInfo);
//   const activeBooking = useSelector(selectActiveBooking);
//   const currentUser = useSelector(selectCurrentUser);
//   const isAuthenticated = useSelector(selectIsAuthenticated);

//   /* Reservations come from GET /api/bookings/my. They used to be a
//      localStorage array, so clearing storage lost them and the same account on
//      another device showed none. */
//   const { data: myBookings = [] } = useGetMyBookingsQuery(true, {
//     skip: !isAuthenticated,
//   });

//   const [cancelReservation, { isLoading: cancelling }] =
//     useCancelBookingMutation();

//   /* ------------------------------------------------------------------
//      Villas, add-ons and the price come from the API.

//      This page had its own copy of the checkout, and it was the one actually
//      being used: it minted a reference with
//      "AVR-" + Math.floor(100000 + Math.random() * 900000), priced the stay in
//      the browser at a flat 7% tax, and dispatched completeBooking without ever
//      calling the server. That is why a confirmation appeared while the admin
//      desk stayed empty - nothing was written to dbo.Bookings.
//      ------------------------------------------------------------------ */

//   const { data: apiVillas = [] } = useGetVillasQuery({ checkIn, checkOut });
//   const { data: apiAddons = [] } = useGetAddonsQuery();

//   const [getQuote, { isLoading: pricing }] = useGetBookingQuoteMutation();
//   const [createReservation, { isLoading: creating }] = useCreateBookingMutation();

//   const [quote, setQuote] = useState(null);
//   const [quoteError, setQuoteError] = useState("");
//   const [submitError, setSubmitError] = useState("");

//   /* Card number, expiry and CVC stay here and are never dispatched to Redux.
//      Only the last four digits are sent with the reservation. */
//   const [cardNumber, setCardNumber] = useState("");
//   const [cardExpiry, setCardExpiry] = useState("");
//   const [cardCvc, setCardCvc] = useState("");

//   const [activeTab, setActiveTab] = useState("new"); // 'new' | 'my-bookings'
//   const [promoText, setPromoText] = useState(promoCodeInput);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [formErrors, setFormErrors] = useState({});

//   // Sync tab, step, & villa from URL query
//   useEffect(() => {
//     const villaParam = searchParams.get("villa");
//     const tabParam = searchParams.get("tab");
//     const stepParam = searchParams.get("step");

//     if (tabParam === "my-bookings") {
//       setActiveTab("my-bookings");
//     } else {
//       setActiveTab("new");
//     }

//     // If navigated with a villa (e.g. from Villas page), start clean for that villa
//     if (villaParam) {
//       if (step === 4 || activeBooking) {
//         dispatch(resetBooking());
//       }
//       dispatch(setSelectedVillaId(villaParam));
//     } else if (!stepParam && tabParam !== "my-bookings" && (step === 4 || activeBooking)) {
//       // Direct navigation to /booking without step=4 starts fresh
//       dispatch(resetBooking());
//     }

//     if (stepParam && isAuthenticated) {
//       const parsedStep = parseInt(stepParam, 10);
//       if (parsedStep >= 1 && parsedStep <= 4) {
//         dispatch(setStep(parsedStep));
//       }
//     }
//   }, [searchParams, isAuthenticated, dispatch]);

//   // Clean up completed reservation on unmount so returning later starts fresh
//   useEffect(() => {
//     return () => {
//       if (step === 4) {
//         dispatch(resetBooking());
//       }
//     };
//   }, [step, dispatch]);

//   // Auto pre-fill guest info if user is authenticated
//   useEffect(() => {
//     if (isAuthenticated && currentUser) {
//       if (!guestInfo.firstName && currentUser.firstName) {
//         dispatch(setGuestInfoField({ field: "firstName", value: currentUser.firstName }));
//       }
//       if (!guestInfo.lastName && currentUser.lastName) {
//         dispatch(setGuestInfoField({ field: "lastName", value: currentUser.lastName }));
//       }
//       if (!guestInfo.email && currentUser.email) {
//         dispatch(setGuestInfoField({ field: "email", value: currentUser.email }));
//       }
//       if (!guestInfo.phone && currentUser.phone) {
//         dispatch(setGuestInfoField({ field: "phone", value: currentUser.phone }));
//       }
//       if (currentUser.country && (!guestInfo.country || guestInfo.country === "United States")) {
//         dispatch(setGuestInfoField({ field: "country", value: currentUser.country }));
//       }
//     }
//   }, [isAuthenticated, currentUser, dispatch, guestInfo.firstName, guestInfo.lastName, guestInfo.email, guestInfo.phone, guestInfo.country]);

//   const villa =
//     apiVillas.find((v) => v.id === selectedVillaId) || apiVillas[0] || null;

//   // Rate plans arrive already priced for this villa, including any per-villa
//   // modifier override, so the three-branch Math.round block is gone.
//   const ratePlans = villa?.ratePlans ?? [];

//   const validDates = Boolean(checkIn && checkOut && checkOut > checkIn);

//   /* Re-price whenever anything in the request body changes. */
//   useEffect(() => {
//     if (!selectedVillaId || !validDates) return;

//     let cancelled = false;
//     setSubmitError("");

//     getQuote({
//       villaId: selectedVillaId,
//       ratePlan: selectedRatePlan,
//       checkIn,
//       checkOut,
//       adults,
//       children,
//       promoCode: promoCodeInput || undefined,
//       addons: selectedAddons,
//     })
//       .unwrap()
//       .then((result) => {
//         if (cancelled) return;
//         setQuote(result);
//         setQuoteError(result.priced ? "" : result.message);
//       })
//       .catch((err) => {
//         if (cancelled) return;
//         setQuote(null);
//         setQuoteError(err?.data?.message || "Pricing is unavailable right now.");
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [
//     selectedVillaId,
//     selectedRatePlan,
//     checkIn,
//     checkOut,
//     adults,
//     children,
//     promoCodeInput,
//     selectedAddons,
//   ]);

//   /* Names kept so the existing markup reads unchanged - the figures are
//      simply no longer computed here. */
//   const nights = quote?.nights ?? 0;
//   const effectiveNightPrice = quote?.averageNightlyRate ?? 0;
//   const roomSubtotal = quote?.roomSubtotal ?? 0;
//   const addonsTotal = quote?.addonsTotal ?? 0;
//   const discountAmount = quote?.discountAmount ?? 0;
//   const taxesAndFees = quote?.taxTotal ?? 0;
//   const finalTotal = quote?.finalTotal ?? 0;
//   const promoDiscount = quote?.promoApplied ? quote.promoDiscountPct : 0;
//   const taxLines = quote?.taxes ?? [];
//   const canProceed = Boolean(quote?.priced);

//   const validateStep2 = () => {
//     const errors = {};
//     if (!guestInfo.firstName.trim())
//       errors.firstName = "First name is required";
//     if (!guestInfo.lastName.trim()) errors.lastName = "Last name is required";
//     if (!guestInfo.email.trim() || !guestInfo.email.includes("@"))
//       errors.email = "Valid email is required";
//     if (!guestInfo.phone.trim()) errors.phone = "Phone number is required";
//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleContinueToStep2 = () => {
//     if (!isAuthenticated) {
//       navigate('/login?redirect=' + encodeURIComponent('/booking?step=2'));
//       return;
//     }
//     dispatch(nextStep());
//   };

//   const handleNextFromStep2 = () => {
//     if (validateStep2()) {
//       dispatch(nextStep());
//     }
//   };

//   /* No total is sent. CreateBookingRequestDto has no money fields -
//      usp_Booking_Create re-prices from the dates, villa, plan, add-ons and
//      promo code, and mints the reference from a SQL sequence. The random
//      "AVR-" + Math.floor(...) that used to run here produced a confirmation
//      number that existed nowhere. */
//   const handleFinalSubmit = async () => {
//     if (!isAuthenticated) {
//       navigate("/login?redirect=" + encodeURIComponent("/booking?step=3"));
//       return;
//     }

//     setSubmitError("");
//     setIsProcessing(true);

//     try {
//       const result = await createReservation({
//         villaId: selectedVillaId,
//         ratePlan: selectedRatePlan,
//         checkIn,
//         checkOut,
//         adults,
//         children,
//         promoCode: promoCodeInput || undefined,
//         addons: selectedAddons,

//         firstName: guestInfo.firstName,
//         lastName: guestInfo.lastName,
//         email: guestInfo.email,
//         phone: guestInfo.phone,
//         country: guestInfo.country,
//         bedPreference: guestInfo.bedPreference,
//         specialRequests: guestInfo.specialRequests,
//         arrivalTime: guestInfo.flightTime,

//         paymentMethod: paymentInfo.paymentMethod,
//         cardHolderName:
//           paymentInfo.paymentMethod === "card"
//             ? paymentInfo.cardHolder || undefined
//             : undefined,
//         cardLast4:
//           paymentInfo.paymentMethod === "card"
//             ? cardNumber.replace(/\D/g, "").slice(-4)
//             : undefined,
//       }).unwrap();

//       dispatch(completeBooking(result.booking));
//       showSuccess(
//         `Sanctuary reserved successfully. Confirmation ID: ${result.referenceId}`,
//         { title: "Reservation Confirmed" },
//       );
//     } catch (err) {
//       // 409 means the villa was taken during checkout, or the promo code hit
//       // its limit in between.
//       const message =
//         err?.data?.message || "Your reservation could not be completed.";
//       setSubmitError(message);
//       showError(message, { title: "Reservation Failed" });
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   /* The browser cannot know whether a code has expired, hit its usage limit
//      or requires a longer stay. The old list included HONEYMOON15 and
//      EARLYBIRD, neither of which exists in dbo.PromoCodes - both reported
//      "applied successfully" and discounted nothing. */
//   const handleApplyPromo = (e) => {
//     e.preventDefault();
//     if (!promoText.trim()) {
//       showError("Please enter a promotional code.");
//       return;
//     }
//     dispatch(applyPromoCode(promoText));
//   };

//   const inputClass =
//     "w-full px-3.5 py-2.5 bg-white text-deep-wood font-semibold border-2 border-primary/40 text-xs rounded-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-deep-wood/40 transition-colors";
//   const labelClass = "text-xs font-bold text-deep-wood block mb-1.5";

//   return (
//     <div
//       className="pt-36 pb-24 min-h-screen relative"
//       style={{ backgroundColor: "var(--color-surface, #f9f9f8)" }}
//     >
//       {/* ── Decorative Background Sketch ── */}
//       <div
//         aria-hidden="true"
//         className="pointer-events-none"
//         style={{
//           position: "absolute",
//           inset: 0,
//           zIndex: 0,
//           backgroundImage: "url('/assets/images/loading-sketch.png')",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat",
//           opacity: 0.2,
//         }}
//       />
//       <div
//         className="container-resort max-w-6xl mx-auto relative"
//         style={{ zIndex: 1 }}
//       >
//         {/* ── Page Title & Navigation Tabs ── */}
//         <div className="text-center mb-8">
//           <span className="eyebrow-label text-secondary block mb-2">
//             Instant Reservation Engine
//           </span>
//           <h1
//             className="text-on-surface mb-4"
//             style={{
//               fontFamily: "var(--font-heading)",
//               fontStyle: "italic",
//               fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
//               fontWeight: 700,
//             }}
//           >
//             Book Your Tropical Sanctuary
//           </h1>
//           <p className="text-on-surface/70 text-sm max-w-xl mx-auto mb-6">
//             Guaranteed best rates, zero hidden fees, and instant voucher
//             confirmation.
//           </p>

//           {/* Main Tab Switcher */}
//           <div className="inline-flex items-center p-1 bg-surface-container-high rounded-lg border-2 border-primary/30">
//             <button
//               onClick={() => {
//                 setActiveTab("new");
//                 if (step === 4 || activeBooking) {
//                   dispatch(resetBooking());
//                 }
//               }}
//               className={[
//                 "px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer",
//                 activeTab === "new"
//                   ? "bg-primary text-white shadow-xs"
//                   : "text-deep-wood/70 hover:text-deep-wood",
//               ].join(" ")}
//             >
//               🏨 New Reservation
//             </button>
//             <button
//               onClick={() => setActiveTab("my-bookings")}
//               className={[
//                 "px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
//                 activeTab === "my-bookings"
//                   ? "bg-primary text-white shadow-xs"
//                   : "text-deep-wood/70 hover:text-deep-wood",
//               ].join(" ")}
//             >
//               <CalendarCheck size={15} /> My Bookings ({myBookings.length})
//             </button>
//           </div>
//         </div>

//         {/* ========================================================================= */}
//         {/* TAB 1: NEW RESERVATION PROCESS PAGE */}
//         {/* ========================================================================= */}
//         {activeTab === "new" && (
//           <div className="bg-surface-container-lowest rounded-2xl shadow-xl border-2 border-primary overflow-hidden">
//             {/* Stepper Bar Header */}
//             <div className="px-6 py-4 bg-deep-wood text-resort-white border-b-2 border-primary/40">
//               <div className="flex items-center justify-between max-w-3xl mx-auto">
//                 {[
//                   { num: 1, title: "1. Villa & Rate" },
//                   { num: 2, title: "2. Guest Details & Extras" },
//                   { num: 3, title: "3. Payment & Confirm" },
//                   { num: 4, title: "4. Digital Voucher" },
//                 ].map((s, idx) => (
//                   <div key={s.num} className="flex items-center gap-2">
//                     <div
//                       className={[
//                         "w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors",
//                         step > s.num
//                           ? "bg-primary text-white"
//                           : step === s.num
//                             ? "bg-secondary text-white ring-2 ring-secondary/40"
//                             : "bg-surface-container-high text-deep-wood/50",
//                       ].join(" ")}
//                     >
//                       {step > s.num ? <Check size={16} /> : s.num}
//                     </div>
//                     <span
//                       className={[
//                         "text-xs font-bold hidden sm:inline",
//                         step === s.num ? "text-sand" : "text-resort-white/50",
//                       ].join(" ")}
//                     >
//                       {s.title}
//                     </span>
//                     {idx < 3 && (
//                       <div className="w-6 sm:w-12 h-px bg-primary/40 mx-1" />
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="p-6 md:p-8">
//               {/* STEP 1: Villa & Rate Selection */}
//               {step === 1 && (
//                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//                   {/* Left Column: Villa Selector & Parameters */}
//                   <div className="lg:col-span-7 flex flex-col gap-6">
//                     {/* Villa Showcase Card */}
//                     <div className="p-5 bg-surface-container-low border-2 border-primary/30 rounded-xl">
//                       <div className="flex flex-col sm:flex-row gap-5 items-start">
//                         <img
//                           src={villa?.image}
//                           alt={villa?.name}
//                           className="w-full sm:w-36 h-32 object-cover rounded-lg flex-shrink-0"
//                         />
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2 mb-1">
//                             <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary rounded-xs">
//                               {villa?.category}
//                             </span>
//                             <span className="text-xs text-secondary font-bold flex items-center gap-1">
//                               ★ {villa?.rating} ({villa?.reviewCount} reviews)
//                             </span>
//                           </div>
//                           <h3
//                             className="text-2xl font-bold text-deep-wood italic"
//                             style={{ fontFamily: "var(--font-heading)" }}
//                           >
//                             {villa?.name}
//                           </h3>
//                           <p className="text-xs text-deep-wood/80 mt-1">
//                             {villa?.tagline}
//                           </p>
//                           <div className="mt-2 text-xs font-bold text-error">
//                             {villa?.popularBadge}
//                           </div>
//                         </div>
//                       </div>

//                       {/* Select Villa dropdown */}
//                       <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between flex-wrap gap-2">
//                         <span className="text-xs text-deep-wood font-bold">
//                           Selected Villa:
//                         </span>
//                         <select
//                           value={selectedVillaId}
//                           onChange={(e) =>
//                             dispatch(setSelectedVillaId(e.target.value))
//                           }
//                           className="px-3 py-2 bg-white border-2 border-primary/40 text-xs font-bold text-deep-wood rounded-xs focus:outline-none focus:border-primary"
//                         >
//                           {apiVillas.map((v) => (
//                             <option
//                               key={v.id}
//                               value={v.id}
//                               disabled={v.isDateFiltered && !v.isAvailable}
//                             >
//                               {v.name} — {money(v.fromPricePerNight)}/night
//                               {v.isDateFiltered
//                                 ? v.isAvailable
//                                   ? ` (${v.availableSlots} left)`
//                                   : " (sold out)"
//                                 : ""}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     </div>

//                     {/* Stay Parameters Search Bar */}
//                     <div className="p-5 bg-surface-container-low border-2 border-primary/30 rounded-xl">
//                       <h4 className="text-sm font-bold text-deep-wood uppercase tracking-wider mb-3 flex items-center gap-2">
//                         <Calendar size={16} className="text-primary" /> Stay
//                         Parameters
//                       </h4>
//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <div>
//                           <label className={labelClass}>Check-in Date</label>
//                           <input
//                             type="date"
//                             value={checkIn}
//                             min={new Date().toISOString().split("T")[0]}
//                             onChange={(e) =>
//                               dispatch(setCheckIn(e.target.value))
//                             }
//                             className={inputClass}
//                           />
//                         </div>
//                         <div>
//                           <label className={labelClass}>Check-out Date</label>
//                           <input
//                             type="date"
//                             value={checkOut}
//                             min={checkIn}
//                             onChange={(e) =>
//                               dispatch(setCheckOut(e.target.value))
//                             }
//                             className={inputClass}
//                           />
//                         </div>
//                       </div>

//                       <div className="mt-4 flex items-center justify-between bg-white p-3 border-2 border-primary/30 rounded-xs">
//                         <div className="flex items-center gap-2">
//                           <Users size={16} className="text-primary" />
//                           <span className="text-xs font-bold text-deep-wood">
//                             Guests:
//                           </span>
//                           <span className="text-xs text-deep-wood font-semibold">
//                             {adults} Adult{adults > 1 ? "s" : ""}, {children}{" "}
//                             Child{children !== 1 ? "ren" : ""}
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() =>
//                               dispatch(setAdults(Math.max(1, adults - 1)))
//                             }
//                             className="w-7 h-7 border-2 border-primary/40 rounded-xs flex items-center justify-center text-sm font-bold text-deep-wood hover:bg-primary/10"
//                           >
//                             -
//                           </button>
//                           <span className="text-xs font-bold text-deep-wood px-1">
//                             {adults}
//                           </span>
//                           <button
//                             onClick={() => dispatch(setAdults(adults + 1))}
//                             className="w-7 h-7 border-2 border-primary/40 rounded-xs flex items-center justify-center text-sm font-bold text-deep-wood hover:bg-primary/10"
//                           >
//                             +
//                           </button>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Rate Plan Options */}
//                     <div>
//                       <h4 className="text-sm font-bold text-deep-wood uppercase tracking-wider mb-3">
//                         Choose Your Rate Package
//                       </h4>
//                       <div className="flex flex-col gap-3">
//                         {ratePlans.map((rate) => {
//                           const isSelected = selectedRatePlan === rate.id;
//                           // Priced by the API for this villa?.
//                           const calcPrice = Number(rate.pricePerNight ?? 0);

//                           return (
//                             <div
//                               key={rate.id}
//                               onClick={() =>
//                                 dispatch(setSelectedRatePlan(rate.id))
//                               }
//                               className={[
//                                 "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 relative",
//                                 isSelected
//                                   ? "bg-white border-primary shadow-md ring-2 ring-primary/40"
//                                   : "bg-surface-container-low border-primary/30 hover:border-primary",
//                               ].join(" ")}
//                             >
//                               <div className="flex items-start justify-between">
//                                 <div className="flex items-center gap-3">
//                                   <div
//                                     className={[
//                                       "w-5 h-5 rounded-full border-2 flex items-center justify-center",
//                                       isSelected
//                                         ? "border-primary bg-primary"
//                                         : "border-primary/50",
//                                     ].join(" ")}
//                                   >
//                                     {isSelected && (
//                                       <div className="w-2 h-2 rounded-full bg-white" />
//                                     )}
//                                   </div>
//                                   <div>
//                                     <div className="flex items-center gap-2">
//                                       <h5 className="font-bold text-deep-wood text-sm">
//                                         {rate.name}
//                                       </h5>
//                                       <span className="px-2 py-0.5 text-[10px] font-bold bg-secondary/20 text-secondary rounded-xs">
//                                         {rate.badge}
//                                       </span>
//                                     </div>
//                                   </div>
//                                 </div>

//                                 <div className="text-right">
//                                   <span className="text-base font-bold text-primary">
//                                     {money(calcPrice)}
//                                   </span>
//                                   <span className="text-[10px] text-deep-wood/60 block font-semibold">
//                                     / night
//                                   </span>
//                                 </div>
//                               </div>

//                               <ul className="mt-3 pl-8 grid grid-cols-1 sm:grid-cols-2 gap-1">
//                                 {rate.features.map((feat, fIdx) => (
//                                   <li
//                                     key={fIdx}
//                                     className="text-[11px] text-deep-wood/80 font-medium flex items-center gap-1.5"
//                                   >
//                                     <CheckCircle2
//                                       size={12}
//                                       className="text-lush-canopy shrink-0"
//                                     />
//                                     {feat}
//                                   </li>
//                                 ))}
//                               </ul>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Right Column: Order Summary Card */}
//                   <div className="lg:col-span-5 flex flex-col justify-between">
//                     <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-sm sticky top-30">
//                       <h4
//                         className="text-base font-bold text-deep-wood italic mb-4 border-b-2 border-primary/20 pb-3"
//                         style={{ fontFamily: "var(--font-heading)" }}
//                       >
//                         Booking Summary
//                       </h4>

//                       <div className="space-y-3 text-xs text-deep-wood font-medium">
//                         <div className="flex justify-between">
//                           <span>Duration of Stay:</span>
//                           <span className="font-bold text-deep-wood">
//                             {nights} Night{nights > 1 ? "s" : ""}
//                           </span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span>Dates:</span>
//                           <span className="font-bold text-deep-wood">
//                             {checkIn} &rarr; {checkOut}
//                           </span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span>Guests:</span>
//                           <span className="font-bold text-deep-wood">
//                             {totalGuests} Guest{totalGuests > 1 ? "s" : ""}
//                           </span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span>Rate Package:</span>
//                           <span className="font-bold text-secondary">
//                             {ratePlans.find((r) => r.id === selectedRatePlan)?.name ?? selectedRatePlan}
//                           </span>
//                         </div>

//                         <div className="pt-3 border-t border-primary/20 flex justify-between">
//                           <span>
//                             {nights} nights x {money(effectiveNightPrice)}
//                           </span>
//                           <span className="font-bold">{money(roomSubtotal)}</span>
//                         </div>

//                         {/* The Sri Lankan folio: service charge 10%, TDL 1%,
//                             SSCL 2.5%, VAT 18%, each applied to the running
//                             total. The flat 7% this used to print was never a
//                             real figure. */}
//                         {taxLines.map((line) => (
//                           <div
//                             key={line.code}
//                             className="flex justify-between text-deep-wood/70"
//                           >
//                             <span>
//                               {line.displayName} ({line.percentage}%)
//                             </span>
//                             <span>{money(line.taxAmount)}</span>
//                           </div>
//                         ))}

//                         <div className="pt-3 border-t-2 border-primary/30 flex justify-between items-baseline">
//                           <span className="text-sm font-bold text-deep-wood">
//                             Total Price:
//                           </span>
//                           <span
//                             className="text-2xl font-bold text-primary"
//                             style={{ fontFamily: "var(--font-heading)" }}
//                           >
//                             {money(finalTotal)}
//                           </span>
//                         </div>
//                         <p className="text-[10px] text-deep-wood/60 text-right font-medium">
//                           Includes all taxes and fees
//                         </p>
//                       </div>

//                       <div className="mt-6 space-y-3">
//                         <button
//                           onClick={handleContinueToStep2}
//                           className="w-full py-3.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
//                         >
//                           Continue to Guest Details <ArrowRight size={16} />
//                         </button>

//                         <div className="p-3 bg-white rounded-xs border-2 border-primary/30 flex items-center gap-2 text-[11px] text-deep-wood font-medium">
//                           <ShieldCheck
//                             size={16}
//                             className="text-secondary shrink-0"
//                           />
//                           <span>Instant confirmation. Zero booking fees.</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* STEP 2: Guest Details & Extras */}
//               {step === 2 && (
//                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//                   <div className="lg:col-span-7 flex flex-col gap-6">
//                     {/* Guest Form Card */}
//                     <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-xs">
//                       {isAuthenticated && currentUser && (
//                         <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
//                           <div className="flex items-center gap-2.5">
//                             <Sparkles size={16} className="text-secondary flex-shrink-0" />
//                             <div>
//                               <span className="font-bold text-deep-wood">
//                                 Booking as {currentUser.name}
//                               </span>
//                               <span className="text-deep-wood/70 block text-[11px]">
//                                 {currentUser.role === 'admin'
//                                   ? '🛡️ Administration Staff Account'
//                                   : `✨ ${currentUser.membershipTier || 'Aviora Privilege Member'}`} • Details pre-filled
//                               </span>
//                             </div>
//                           </div>
//                           <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary text-white uppercase tracking-wider">
//                             Verified
//                           </span>
//                         </div>
//                       )}

//                       <h3
//                         className="text-lg font-bold text-deep-wood italic mb-4"
//                         style={{ fontFamily: "var(--font-heading)" }}
//                       >
//                         Main Guest Details
//                       </h3>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <div>
//                           <label className={labelClass}>First Name *</label>
//                           <input
//                             type="text"
//                             value={guestInfo.firstName}
//                             onChange={(e) =>
//                               dispatch(
//                                 setGuestInfoField({
//                                   field: "firstName",
//                                   value: e.target.value,
//                                 }),
//                               )
//                             }
//                             placeholder="e.g. Eleanor"
//                             className={inputClass}
//                           />
//                           {formErrors.firstName && (
//                             <p className="text-[10px] text-red-600 font-bold mt-1">
//                               {formErrors.firstName}
//                             </p>
//                           )}
//                         </div>

//                         <div>
//                           <label className={labelClass}>Last Name *</label>
//                           <input
//                             type="text"
//                             value={guestInfo.lastName}
//                             onChange={(e) =>
//                               dispatch(
//                                 setGuestInfoField({
//                                   field: "lastName",
//                                   value: e.target.value,
//                                 }),
//                               )
//                             }
//                             placeholder="e.g. Vance"
//                             className={inputClass}
//                           />
//                           {formErrors.lastName && (
//                             <p className="text-[10px] text-red-600 font-bold mt-1">
//                               {formErrors.lastName}
//                             </p>
//                           )}
//                         </div>

//                         <div>
//                           <label className={labelClass}>Email Address *</label>
//                           <input
//                             type="email"
//                             value={guestInfo.email}
//                             onChange={(e) =>
//                               dispatch(
//                                 setGuestInfoField({
//                                   field: "email",
//                                   value: e.target.value,
//                                 }),
//                               )
//                             }
//                             placeholder="eleanor@example.com"
//                             className={inputClass}
//                           />
//                           {formErrors.email && (
//                             <p className="text-[10px] text-red-600 font-bold mt-1">
//                               {formErrors.email}
//                             </p>
//                           )}
//                         </div>

//                         <div>
//                           <label className={labelClass}>Phone Number *</label>
//                           <input
//                             type="tel"
//                             value={guestInfo.phone}
//                             onChange={(e) =>
//                               dispatch(
//                                 setGuestInfoField({
//                                   field: "phone",
//                                   value: e.target.value,
//                                 }),
//                               )
//                             }
//                             placeholder="+1 (555) 234-5678"
//                             className={inputClass}
//                           />
//                           {formErrors.phone && (
//                             <p className="text-[10px] text-red-600 font-bold mt-1">
//                               {formErrors.phone}
//                             </p>
//                           )}
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
//                         <div>
//                           <label className={labelClass}>Bed Preference</label>
//                           <select
//                             value={guestInfo.bedPreference}
//                             onChange={(e) =>
//                               dispatch(
//                                 setGuestInfoField({
//                                   field: "bedPreference",
//                                   value: e.target.value,
//                                 }),
//                               )
//                             }
//                             className={inputClass}
//                           >
//                             <option value="1 King Bed">1 King Bed</option>
//                             <option value="2 Twin Beds">2 Twin Beds</option>
//                           </select>
//                         </div>

//                         <div>
//                           <label className={labelClass}>
//                             Estimated Arrival Time
//                           </label>
//                           <select
//                             value={guestInfo.flightTime}
//                             onChange={(e) =>
//                               dispatch(
//                                 setGuestInfoField({
//                                   field: "flightTime",
//                                   value: e.target.value,
//                                 }),
//                               )
//                             }
//                             className={inputClass}
//                           >
//                             <option value="">I don't know yet</option>
//                             <option value="12:00 - 14:00">
//                               12:00 - 14:00 (Early Arrival)
//                             </option>
//                             <option value="14:00 - 18:00">
//                               14:00 - 18:00 (Standard Check-in)
//                             </option>
//                             <option value="18:00 - 22:00">
//                               18:00 - 22:00 (Evening)
//                             </option>
//                           </select>
//                         </div>
//                       </div>

//                       <div className="mt-4">
//                         <label className={labelClass}>
//                           Special Requests (Optional)
//                         </label>
//                         <textarea
//                           rows={2}
//                           value={guestInfo.specialRequests}
//                           onChange={(e) =>
//                             dispatch(
//                               setGuestInfoField({
//                                 field: "specialRequests",
//                                 value: e.target.value,
//                               }),
//                             )
//                           }
//                           placeholder="Dietary requirements, anniversary celebration notes..."
//                           className={inputClass}
//                         />
//                       </div>
//                     </div>

//                     {/* Extras & Addons Card */}
//                     <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-xs">
//                       <h3
//                         className="text-lg font-bold text-deep-wood italic mb-1"
//                         style={{ fontFamily: "var(--font-heading)" }}
//                       >
//                         Enhance Your Experience
//                       </h3>
//                       <p className="text-xs text-deep-wood/70 font-medium mb-4">
//                         Select bespoke luxury add-ons to customize your stay.
//                       </p>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                         {apiAddons.map((addon) => {
//                           const isChecked = selectedAddons.includes(addon.id);
//                           return (
//                             <div
//                               key={addon.id}
//                               onClick={() => dispatch(toggleAddon(addon.id))}
//                               className={[
//                                 "p-3.5 border-2 rounded-md cursor-pointer transition-all duration-300 flex items-start gap-3",
//                                 isChecked
//                                   ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
//                                   : "bg-white border-primary/30 hover:border-primary",
//                               ].join(" ")}
//                             >
//                               <div
//                                 className={[
//                                   "w-4 h-4 rounded-xs border-2 mt-0.5 flex items-center justify-center shrink-0",
//                                   isChecked
//                                     ? "bg-primary border-primary text-white"
//                                     : "border-primary/50",
//                                 ].join(" ")}
//                               >
//                                 {isChecked && <Check size={12} />}
//                               </div>
//                               <div className="flex-1">
//                                 <div className="flex items-center justify-between">
//                                   <span className="text-xs font-bold text-deep-wood">
//                                     {addon.icon} {addon.name}
//                                   </span>
//                                   <span className="text-xs font-bold text-primary">
//                                     +{money(addon.price)}
//                                   </span>
//                                 </div>
//                                 <p className="text-[10px] text-deep-wood/70 font-medium mt-1 leading-snug">
//                                   {addon.description}
//                                 </p>
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Summary & Next Step */}
//                   <div className="lg:col-span-5 flex flex-col justify-between">
//                     <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-sm sticky top-36">
//                       <h4
//                         className="text-base font-bold text-deep-wood italic mb-4 border-b-2 border-primary/20 pb-3"
//                         style={{ fontFamily: "var(--font-heading)" }}
//                       >
//                         Reservation Summary
//                       </h4>

//                       <div className="space-y-2 text-xs text-deep-wood font-medium">
//                         <div className="flex justify-between">
//                           <span className="font-bold text-deep-wood">
//                             {villa?.name}
//                           </span>
//                           <span>{money(roomSubtotal)}</span>
//                         </div>
//                         <div className="text-[11px] text-deep-wood/70">
//                           {nights} Nights ({checkIn} – {checkOut})
//                         </div>

//                         {selectedAddons.length > 0 && (
//                           <div className="pt-2 border-t border-primary/20 space-y-1">
//                             <span className="font-bold text-deep-wood block">
//                               Add-ons:
//                             </span>
//                             {/* Priced by the quote, which applies each add-on's
//                                 charge basis - per stay, per night or per guest. */}
//                             {(quote?.addons ?? []).map((line) => (
//                               <div
//                                 key={line.id}
//                                 className="flex justify-between text-[11px] text-deep-wood/80 font-medium pl-2"
//                               >
//                                 <span>{line.name}</span>
//                                 <span>+{money(line.lineTotal)}</span>
//                               </div>
//                             ))}
//                           </div>
//                         )}

//                         <div className="pt-3 border-t border-primary/20 flex justify-between">
//                           <span>Taxes &amp; service charge</span>
//                           <span>{money(taxesAndFees)}</span>
//                         </div>

//                         <div className="pt-3 border-t-2 border-primary/30 flex justify-between items-baseline">
//                           <span className="text-sm font-bold text-deep-wood">
//                             Total:
//                           </span>
//                           <span
//                             className="text-2xl font-bold text-primary"
//                             style={{ fontFamily: "var(--font-heading)" }}
//                           >
//                             {money(finalTotal)}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="mt-6 space-y-3">
//                         <button
//                           onClick={handleNextFromStep2}
//                           className="w-full py-3.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2"
//                         >
//                           Proceed to Payment <ArrowRight size={16} />
//                         </button>

//                         <button
//                           onClick={() => dispatch(prevStep())}
//                           className="w-full py-2 bg-transparent text-deep-wood/80 hover:text-deep-wood text-xs font-bold flex items-center justify-center gap-1 transition-colors"
//                         >
//                           <ArrowLeft size={14} /> Back to Villa Selection
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* STEP 3: Payment & Guarantee */}
//               {step === 3 && (
//                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//                   <div className="lg:col-span-7 flex flex-col gap-6">
//                     <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-xs">
//                       <h3
//                         className="text-lg font-bold text-deep-wood italic mb-4"
//                         style={{ fontFamily: "var(--font-heading)" }}
//                       >
//                         Payment Method
//                       </h3>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
//                         <div
//                           onClick={() =>
//                             dispatch(
//                               setPaymentInfoField({
//                                 field: "paymentMethod",
//                                 value: "card",
//                               }),
//                             )
//                           }
//                           className={[
//                             "p-4 border-2 rounded-md cursor-pointer flex items-center gap-3 transition-all",
//                             paymentInfo.paymentMethod === "card"
//                               ? "border-primary bg-primary/5 ring-1 ring-primary/40"
//                               : "bg-white border-primary/30 hover:border-primary",
//                           ].join(" ")}
//                         >
//                           <CreditCard
//                             className="text-primary shrink-0"
//                             size={20}
//                           />
//                           <div>
//                             <span className="text-xs font-bold text-deep-wood block">
//                               Credit / Debit Card
//                             </span>
//                             <span className="text-[10px] text-deep-wood/70 font-medium">
//                               Instant Secure Pay
//                             </span>
//                           </div>
//                         </div>

//                         <div
//                           onClick={() =>
//                             dispatch(
//                               setPaymentInfoField({
//                                 field: "paymentMethod",
//                                 value: "resort",
//                               }),
//                             )
//                           }
//                           className={[
//                             "p-4 border-2 rounded-md cursor-pointer flex items-center gap-3 transition-all",
//                             paymentInfo.paymentMethod === "resort"
//                               ? "border-primary bg-primary/5 ring-1 ring-primary/40"
//                               : "bg-white border-primary/30 hover:border-primary",
//                           ].join(" ")}
//                         >
//                           <ShieldCheck
//                             className="text-secondary shrink-0"
//                             size={20}
//                           />
//                           <div>
//                             <span className="text-xs font-bold text-deep-wood block">
//                               Pay at Resort
//                             </span>
//                             <span className="text-[10px] text-deep-wood/70 font-medium">
//                               Guarantee with Card
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Card Inputs */}
//                       <div className="space-y-4 pt-2 border-t border-primary/20">
//                         <div>
//                           <label className={labelClass}>Cardholder Name</label>
//                           <input
//                             type="text"
//                             value={paymentInfo.cardHolder}
//                             onChange={(e) =>
//                               dispatch(
//                                 setPaymentInfoField({
//                                   field: "cardHolder",
//                                   value: e.target.value,
//                                 }),
//                               )
//                             }
//                             placeholder={`${guestInfo.firstName} ${guestInfo.lastName}`}
//                             className={inputClass}
//                           />
//                         </div>

//                         <div>
//                           <label className={labelClass}>Card Number</label>
//                           <input
//                             type="text"
//                             maxLength={19}
//                             value={cardNumber}
//                             onChange={(e) => setCardNumber(e.target.value)}
//                             placeholder="4532 •••• •••• 8921"
//                             className={inputClass}
//                           />
//                         </div>

//                         <div className="grid grid-cols-2 gap-4">
//                           <div>
//                             <label className={labelClass}>Expiry Date</label>
//                             <input
//                               type="text"
//                               placeholder="MM/YY"
//                               value={cardExpiry}
//                               onChange={(e) => setCardExpiry(e.target.value)}
//                               className={inputClass}
//                             />
//                           </div>
//                           <div>
//                             <label className={labelClass}>CVC Code</label>
//                             <input
//                               type="password"
//                               maxLength={4}
//                               placeholder="123"
//                               value={cardCvc}
//                               onChange={(e) => setCardCvc(e.target.value)}
//                               className={inputClass}
//                             />
//                           </div>
//                         </div>
//                       </div>

//                       <div className="mt-6 flex items-center justify-between text-xs text-deep-wood/80 font-medium bg-white p-3 rounded-xs border-2 border-primary/30">
//                         <div className="flex items-center gap-2">
//                           <Lock size={14} className="text-lush-canopy" />
//                           <span>Encrypted 256-bit SSL Transaction</span>
//                         </div>
//                         <div className="flex gap-1 font-bold text-deep-wood">
//                           <span>VISA</span> • <span>MC</span> •{" "}
//                           <span>AMEX</span>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Promo Code Box */}
//                     <div className="p-5 bg-surface-container-low border-2 border-primary/30 rounded-xl">
//                       <h4 className="text-xs font-bold text-deep-wood uppercase tracking-wider mb-2">
//                         Have a Promo Code?
//                       </h4>
//                       <form onSubmit={handleApplyPromo} className="flex gap-2">
//                         <input
//                           type="text"
//                           value={promoText}
//                           onChange={(e) => setPromoText(e.target.value)}
//                           placeholder="Try 'AVIORA2026' or 'VIP20'"
//                           className="flex-1 px-3 py-2 bg-white border-2 border-primary/40 text-xs uppercase font-bold text-deep-wood rounded-xs focus:outline-none focus:border-primary"
//                         />
//                         <button
//                           type="submit"
//                           className="px-4 py-2 bg-secondary text-white text-xs font-bold uppercase rounded-xs hover:bg-secondary/90 transition-colors"
//                         >
//                           Apply
//                         </button>
//                       </form>
//                       {promoDiscount > 0 && (
//                         <p className="text-xs text-primary font-bold mt-2">
//                           ✓ Promo Code Applied! You save {promoDiscount}% off
//                           gross subtotal.
//                         </p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Right Column: Checkout Breakdown */}
//                   <div className="lg:col-span-5 flex flex-col justify-between">
//                     <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-sm sticky top-36">
//                       <h4
//                         className="text-base font-bold text-deep-wood italic mb-4 border-b-2 border-primary/20 pb-3"
//                         style={{ fontFamily: "var(--font-heading)" }}
//                       >
//                         Final Price Breakdown
//                       </h4>

//                       <div className="space-y-2 text-xs text-deep-wood font-medium">
//                         <div className="flex justify-between">
//                           <span>Room Rate ({nights} nights)</span>
//                           <span>{money(roomSubtotal)}</span>
//                         </div>

//                         {addonsTotal > 0 && (
//                           <div className="flex justify-between">
//                             <span>Luxury Extras ({selectedAddons.length})</span>
//                             <span>+{money(addonsTotal)}</span>
//                           </div>
//                         )}

//                         {discountAmount > 0 && (
//                           <div className="flex justify-between text-primary font-bold">
//                             <span>Promo Discount ({promoDiscount}%)</span>
//                             <span>−{money(discountAmount)}</span>
//                           </div>
//                         )}

//                         <div className="flex justify-between text-deep-wood/70">
//                           <span>Taxes &amp; service charge</span>
//                           <span>{money(taxesAndFees)}</span>
//                         </div>

//                         <div className="pt-3 border-t-2 border-primary/30 flex justify-between items-baseline">
//                           <span className="text-base font-bold text-deep-wood">
//                             Total Due:
//                           </span>
//                           <span
//                             className="text-3xl font-bold text-primary"
//                             style={{ fontFamily: "var(--font-heading)" }}
//                           >
//                             {money(finalTotal)}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="mt-6 space-y-3">
//                         {submitError && (
//                           <div className="p-3 rounded-xs bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-start gap-2">
//                             <AlertCircle size={14} className="shrink-0 mt-0.5" />
//                             <span>{submitError}</span>
//                           </div>
//                         )}

//                         {/* Blocked when the stay cannot be priced, so a guest
//                             cannot walk three steps into a sold-out villa. */}
//                         <button
//                           disabled={isProcessing || creating || pricing || !canProceed}
//                           onClick={handleFinalSubmit}
//                           className="w-full py-3.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                           {isProcessing || creating ? (
//                             <span>Processing Reservation…</span>
//                           ) : !canProceed ? (
//                             <span>Unavailable for These Dates</span>
//                           ) : (
//                             <>
//                               <Sparkles size={16} /> Complete &amp; Lock
//                               Reservation
//                             </>
//                           )}
//                         </button>

//                         <button
//                           onClick={() => dispatch(prevStep())}
//                           className="w-full py-2 bg-transparent text-deep-wood/80 hover:text-deep-wood text-xs font-bold flex items-center justify-center gap-1 transition-colors"
//                         >
//                           <ArrowLeft size={14} /> Back to Guest Details
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* STEP 4: Digital Voucher Confirmation */}
//               {step === 4 && activeBooking && (
//                 <div className="max-w-3xl mx-auto py-6">
//                   <div className="text-center mb-8">
//                     <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
//                       <CheckCircle2 size={40} />
//                     </div>
//                     <h3
//                       className="text-3xl font-bold text-deep-wood italic mb-1"
//                       style={{ fontFamily: "var(--font-heading)" }}
//                     >
//                       Reservation Confirmed!
//                     </h3>
//                     <p className="text-xs text-deep-wood/80 font-medium">
//                       Thank you, {activeBooking.guest?.firstName || activeBooking.guestInfo?.firstName || "Guest"}. Your
//                       luxury stay is officially confirmed.
//                     </p>
//                   </div>

//                   {/* Digital Voucher Card */}
//                   <div className="p-8 bg-white border-2 border-primary rounded-2xl shadow-xl relative overflow-hidden">
//                     <div className="flex items-center justify-between border-b-2 border-primary/20 pb-4 mb-6">
//                       <div>
//                         <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
//                           Booking Reference
//                         </span>
//                         <span className="text-2xl font-bold text-deep-wood font-mono">
//                           {activeBooking.referenceId}
//                         </span>
//                       </div>
//                       <span className="px-4 py-1.5 bg-lush-canopy/15 text-lush-canopy text-xs font-bold rounded-xs">
//                         ✓ Guaranteed
//                       </span>
//                     </div>

//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-6">
//                       <div>
//                         <span className="text-deep-wood/60 block font-semibold mb-0.5">
//                           Villa Reserved:
//                         </span>
//                         <span className="font-bold text-deep-wood text-base">
//                           {activeBooking.villaName}
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-deep-wood/60 block font-semibold mb-0.5">
//                           Guests:
//                         </span>
//                         <span className="font-bold text-deep-wood">
//                           {activeBooking.adults} Adults,{" "}
//                           {activeBooking.children} Children
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-deep-wood/60 block font-semibold mb-0.5">
//                           Check-in:
//                         </span>
//                         <span className="font-bold text-deep-wood">
//                           {activeBooking.checkIn} (From 14:00)
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-deep-wood/60 block font-semibold mb-0.5">
//                           Check-out:
//                         </span>
//                         <span className="font-bold text-deep-wood">
//                           {activeBooking.checkOut} (Until 12:00)
//                         </span>
//                       </div>
//                     </div>

//                     {((activeBooking.addons?.length > 0) || (activeBooking.selectedAddons?.length > 0)) && (
//                       <div className="pt-4 border-t-2 border-primary/20 mb-6">
//                         <span className="text-xs font-bold text-deep-wood block mb-2">
//                           Included Luxury Enhancements:
//                         </span>
//                         <div className="flex flex-wrap gap-2">
//                           {(activeBooking.addons || activeBooking.selectedAddons || []).map((addon, idx) => (
//                             <span
//                               key={addon.id || addon.code || idx}
//                               className="px-3 py-1 bg-surface-container text-xs font-bold text-deep-wood rounded-xs"
//                             >
//                               {addon.icon ? `${addon.icon} ` : ""}{addon.name || addon.addonName || (typeof addon === "string" ? addon : "Add-on")}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     <div className="pt-5 border-t-2 border-primary/20 flex flex-wrap items-center justify-between bg-surface-container-low p-5 rounded-xl gap-4">
//                       <div>
//                         <span className="text-[10px] text-deep-wood/70 block font-semibold">
//                           Total Amount Charged / Guaranteed:
//                         </span>
//                         <span
//                           className="text-3xl font-bold text-primary"
//                           style={{ fontFamily: "var(--font-heading)" }}
//                         >
//                           {money(activeBooking?.finalTotal)}
//                         </span>
//                       </div>
//                       <span className="text-xs text-deep-wood font-medium">
//                         Confirmation email sent to{" "}
//                         <strong>{activeBooking.guest?.email || activeBooking.guestInfo?.email}</strong>
//                       </span>
//                     </div>
//                   </div>

//                   <div className="mt-8 flex flex-wrap gap-4 justify-center">
//                     <button
//                       onClick={() => {
//                         dispatch(resetBooking());
//                         setActiveTab("new");
//                       }}
//                       className="px-6 py-3 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
//                     >
//                       <Sparkles size={16} /> Book Another Sanctuary
//                     </button>

//                     <button
//                       onClick={() => window.print()}
//                       className="px-6 py-3 bg-surface-container-high text-deep-wood text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-surface-container-highest transition-colors flex items-center gap-2 border-2 border-primary/40 cursor-pointer"
//                     >
//                       <FileText size={16} /> Print Voucher / Receipt
//                     </button>

//                     <button
//                       onClick={() => {
//                         dispatch(resetBooking());
//                         setActiveTab("my-bookings");
//                       }}
//                       className="px-6 py-3 bg-surface-container-low text-deep-wood text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-surface-container transition-colors border-2 border-primary/30 flex items-center gap-2 cursor-pointer"
//                     >
//                       <CalendarCheck size={16} /> View All My Bookings
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* ========================================================================= */}
//         {/* TAB 2: MY BOOKINGS SCREEN */}
//         {/* ========================================================================= */}
//         {activeTab === "my-bookings" && (
//           <div className="bg-surface-container-lowest rounded-2xl shadow-xl border-2 border-primary p-6 md:p-8">
//             <h3
//               className="text-2xl font-bold text-deep-wood italic mb-6 border-b-2 border-primary/20 pb-4"
//               style={{ fontFamily: "var(--font-heading)" }}
//             >
//               My Active Reservations ({myBookings.length})
//             </h3>

//             {myBookings.length === 0 ? (
//               <div className="text-center py-16">
//                 <Calendar size={56} className="mx-auto text-primary/40 mb-4" />
//                 <h4 className="text-lg font-bold text-deep-wood">
//                   No Reservations Found
//                 </h4>
//                 <p className="text-xs text-deep-wood/70 font-medium mt-1 mb-6 max-w-sm mx-auto">
//                   You haven't reserved any villas yet. Browse our sanctuaries to
//                   reserve your luxury stay!
//                 </p>
//                 <button
//                   onClick={() => {
//                     dispatch(resetBooking());
//                     setActiveTab("new");
//                   }}
//                   className="px-6 py-3 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
//                 >
//                   Book A Villa Now
//                 </button>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {myBookings.map((b) => (
//                   <div
//                     key={b.referenceId}
//                     className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-xs flex flex-col md:flex-row gap-6 justify-between items-start"
//                   >
//                     <div className="flex flex-col sm:flex-row gap-5 items-start">
//                       <img
//                         src={b.villaImage}
//                         alt={b.villaName}
//                         className="w-full sm:w-32 h-28 object-cover rounded-lg flex-shrink-0"
//                       />
//                       <div>
//                         <div className="flex items-center gap-2 mb-1.5">
//                           <span className="text-xs font-mono font-bold text-primary">
//                             Ref: {b.referenceId}
//                           </span>
//                           <span className="px-2.5 py-0.5 text-[10px] font-bold bg-lush-canopy/15 text-lush-canopy rounded-xs">
//                             {b.status}
//                           </span>
//                         </div>
//                         <h4
//                           className="text-xl font-bold text-deep-wood italic"
//                           style={{ fontFamily: "var(--font-heading)" }}
//                         >
//                           {b.villaName}
//                         </h4>
//                         <p className="text-xs text-deep-wood/80 font-medium mt-1">
//                           📅 {b.checkIn} &rarr; {b.checkOut} ({b.nights} Nights)
//                         </p>
//                         <p className="text-[11px] text-deep-wood/70 font-semibold mt-1">
//                           Guest: {b.guest?.firstName || b.guestInfo?.firstName}{" "}
//                           {b.guest?.lastName || b.guestInfo?.lastName} • {b.adults} Adults,{" "}
//                           {b.children} Children
//                         </p>
//                       </div>
//                     </div>

//                     <div className="flex md:flex-col items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-primary/20">
//                       <div className="text-right">
//                         <span className="text-xs text-deep-wood/60 font-semibold block">
//                           Total Amount:
//                         </span>
//                         <span
//                           className="text-2xl font-bold text-primary"
//                           style={{ fontFamily: "var(--font-heading)" }}
//                         >
//                           {money(b.finalTotal)}
//                         </span>
//                       </div>

//                       <button
//                         onClick={async () => {
//                           if (
//                             !confirm(
//                               `Are you sure you want to cancel reservation ${b.referenceId}?`,
//                             )
//                           )
//                             return;

//                           try {
//                             const res = await cancelReservation({
//                               referenceId: b.referenceId,
//                             }).unwrap();
//                             showSuccess(
//                               res?.message ||
//                                 `Reservation ${b.referenceId} has been cancelled.`,
//                             );
//                           } catch (err) {
//                             // 409 covers a non-refundable rate and a passed
//                             // deadline; the message says which.
//                             showError(
//                               err?.data?.message ||
//                                 "The reservation could not be cancelled.",
//                             );
//                           }
//                         }}
//                         disabled={!b.canCancel || cancelling}
//                         className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 mt-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//                       >
//                         <Trash2 size={14} />
//                         {b.canCancel
//                           ? "Cancel Reservation"
//                           : b.isRefundable
//                             ? "Cancellation window passed"
//                             : "Non-refundable"}
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Calendar,
  Users,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  FileText,
  Trash2,
  CalendarCheck,
  UtensilsCrossed,
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
  completeBooking,
  resetBooking,
} from "../features/booking/bookingSlice";
import {
  useGetVillasQuery,
  useGetAddonsQuery,
  useGetBookingQuoteMutation,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useCancelBookingMutation,
  useGetMyDiningReservationsQuery,
  useCancelDiningReservationMutation,
} from "../features/rooms/roomsApi";
import {
  StayDocuments,
  TableDocuments,
} from "../components/documents/ReservationDocuments";

const money = (value) => `Rs.${Number(value ?? 0).toLocaleString()}`;
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSlice";
import { useToast } from "../components/common/Toast";

export default function BookingPage() {
  const { showSuccess, showError } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  /* Reservations come from GET /api/bookings/my. They used to be a
     localStorage array, so clearing storage lost them and the same account on
     another device showed none. */
  const { data: myBookings = [] } = useGetMyBookingsQuery(true, {
    skip: !isAuthenticated,
  });

  const [cancelReservation, { isLoading: cancelling }] =
    useCancelBookingMutation();

  /* Table reservations, from GET /api/dining/reservations/my. Same shape of
     screen as the villa stays, with the dining details in place of the
     villa ones. */
  const { data: myTables = [] } = useGetMyDiningReservationsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [cancelTable, { isLoading: cancellingTable }] =
    useCancelDiningReservationMutation();

  const handleCancelTable = async (table) => {
    if (!confirm(`Cancel table ${table.referenceId}?`)) return;

    try {
      const res = await cancelTable(table.referenceId).unwrap();
      showSuccess(res?.message || "Table cancelled.");
    } catch (err) {
      // 409 covers the notice period having passed and a table already
      // seated. The message says which.
      showError(err?.data?.message || "The table could not be cancelled.");
    }
  };

  /* ------------------------------------------------------------------
     Villas, add-ons and the price come from the API.

     This page had its own copy of the checkout, and it was the one actually
     being used: it minted a reference with
     "AVR-" + Math.floor(100000 + Math.random() * 900000), priced the stay in
     the browser at a flat 7% tax, and dispatched completeBooking without ever
     calling the server. That is why a confirmation appeared while the admin
     desk stayed empty - nothing was written to dbo.Bookings.
     ------------------------------------------------------------------ */

  const { data: apiVillas = [] } = useGetVillasQuery({ checkIn, checkOut });
  const { data: apiAddons = [] } = useGetAddonsQuery();

  const [getQuote, { isLoading: pricing }] = useGetBookingQuoteMutation();
  const [createReservation, { isLoading: creating }] = useCreateBookingMutation();

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [submitError, setSubmitError] = useState("");

  /* Card number, expiry and CVC stay here and are never dispatched to Redux.
     Only the last four digits are sent with the reservation. */
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [activeTab, setActiveTab] = useState("new"); // 'new' | 'my-bookings' | 'my-dining'
  const [promoText, setPromoText] = useState(promoCodeInput);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Sync tab, step, & villa from URL query
  useEffect(() => {
    const villaParam = searchParams.get("villa");
    const tabParam = searchParams.get("tab");
    const stepParam = searchParams.get("step");

    if (tabParam === "my-bookings") {
      setActiveTab("my-bookings");
    } else {
      setActiveTab("new");
    }

    // If navigated with a villa (e.g. from Villas page), start clean for that villa
    if (villaParam) {
      if (step === 4 || activeBooking) {
        dispatch(resetBooking());
      }
      dispatch(setSelectedVillaId(villaParam));
    } else if (!stepParam && tabParam !== "my-bookings" && (step === 4 || activeBooking)) {
      // Direct navigation to /booking without step=4 starts fresh
      dispatch(resetBooking());
    }

    if (stepParam && isAuthenticated) {
      const parsedStep = parseInt(stepParam, 10);
      if (parsedStep >= 1 && parsedStep <= 4) {
        dispatch(setStep(parsedStep));
      }
    }
  }, [searchParams, isAuthenticated, dispatch]);

  // Clean up completed reservation on unmount so returning later starts fresh
  useEffect(() => {
    return () => {
      if (step === 4) {
        dispatch(resetBooking());
      }
    };
  }, [step, dispatch]);

  // Auto pre-fill guest info if user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (!guestInfo.firstName && currentUser.firstName) {
        dispatch(setGuestInfoField({ field: "firstName", value: currentUser.firstName }));
      }
      if (!guestInfo.lastName && currentUser.lastName) {
        dispatch(setGuestInfoField({ field: "lastName", value: currentUser.lastName }));
      }
      if (!guestInfo.email && currentUser.email) {
        dispatch(setGuestInfoField({ field: "email", value: currentUser.email }));
      }
      if (!guestInfo.phone && currentUser.phone) {
        dispatch(setGuestInfoField({ field: "phone", value: currentUser.phone }));
      }
      if (currentUser.country && (!guestInfo.country || guestInfo.country === "United States")) {
        dispatch(setGuestInfoField({ field: "country", value: currentUser.country }));
      }
    }
  }, [isAuthenticated, currentUser, dispatch, guestInfo.firstName, guestInfo.lastName, guestInfo.email, guestInfo.phone, guestInfo.country]);

  const villa =
    apiVillas.find((v) => v.id === selectedVillaId) || apiVillas[0] || null;

  // Rate plans arrive already priced for this villa, including any per-villa
  // modifier override, so the three-branch Math.round block is gone.
  const ratePlans = villa?.ratePlans ?? [];

  const validDates = Boolean(checkIn && checkOut && checkOut > checkIn);

  /* Re-price whenever anything in the request body changes. */
  useEffect(() => {
    if (!selectedVillaId || !validDates) return;

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
    selectedVillaId,
    selectedRatePlan,
    checkIn,
    checkOut,
    adults,
    children,
    promoCodeInput,
    selectedAddons,
  ]);

  /* Names kept so the existing markup reads unchanged - the figures are
     simply no longer computed here. */
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

  const handleContinueToStep2 = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent('/booking?step=2'));
      return;
    }
    dispatch(nextStep());
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      dispatch(nextStep());
    }
  };

  /* No total is sent. CreateBookingRequestDto has no money fields -
     usp_Booking_Create re-prices from the dates, villa, plan, add-ons and
     promo code, and mints the reference from a SQL sequence. The random
     "AVR-" + Math.floor(...) that used to run here produced a confirmation
     number that existed nowhere. */
  const handleFinalSubmit = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=" + encodeURIComponent("/booking?step=3"));
      return;
    }

    setSubmitError("");
    setIsProcessing(true);

    try {
      const result = await createReservation({
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
      // 409 means the villa was taken during checkout, or the promo code hit
      // its limit in between.
      const message =
        err?.data?.message || "Your reservation could not be completed.";
      setSubmitError(message);
      showError(message, { title: "Reservation Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  /* The browser cannot know whether a code has expired, hit its usage limit
     or requires a longer stay. The old list included HONEYMOON15 and
     EARLYBIRD, neither of which exists in dbo.PromoCodes - both reported
     "applied successfully" and discounted nothing. */
  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoText.trim()) {
      showError("Please enter a promotional code.");
      return;
    }
    dispatch(applyPromoCode(promoText));
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-white text-deep-wood font-semibold border-2 border-primary/40 text-xs rounded-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-deep-wood/40 transition-colors";
  const labelClass = "text-xs font-bold text-deep-wood block mb-1.5";

  return (
    <div
      className="pt-36 pb-24 min-h-screen relative"
      style={{ backgroundColor: "var(--color-surface, #f9f9f8)" }}
    >
      {/* ── Decorative Background Sketch ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('/assets/images/loading-sketch.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.2,
        }}
      />
      <div
        className="container-resort max-w-6xl mx-auto relative"
        style={{ zIndex: 1 }}
      >
        {/* ── Page Title & Navigation Tabs ── */}
        <div className="text-center mb-8">
          <span className="eyebrow-label text-secondary block mb-2">
            Instant Reservation Engine
          </span>
          <h1
            className="text-on-surface mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
              fontWeight: 700,
            }}
          >
            Book Your Tropical Sanctuary
          </h1>
          <p className="text-on-surface/70 text-sm max-w-xl mx-auto mb-6">
            Guaranteed best rates, zero hidden fees, and instant voucher
            confirmation.
          </p>

          {/* Main Tab Switcher */}
          <div className="inline-flex items-center p-1 bg-surface-container-high rounded-lg border-2 border-primary/30">
            <button
              onClick={() => {
                setActiveTab("new");
                if (step === 4 || activeBooking) {
                  dispatch(resetBooking());
                }
              }}
              className={[
                "px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer",
                activeTab === "new"
                  ? "bg-primary text-white shadow-xs"
                  : "text-deep-wood/70 hover:text-deep-wood",
              ].join(" ")}
            >
              🏨 New Reservation
            </button>
            <button
              onClick={() => setActiveTab("my-bookings")}
              className={[
                "px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "my-bookings"
                  ? "bg-primary text-white shadow-xs"
                  : "text-deep-wood/70 hover:text-deep-wood",
              ].join(" ")}
            >
              <CalendarCheck size={15} /> My Bookings ({myBookings.length})
            </button>

            <button
              onClick={() => setActiveTab("my-dining")}
              className={[
                "px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "my-dining"
                  ? "bg-primary text-white shadow-xs"
                  : "text-deep-wood/70 hover:text-deep-wood",
              ].join(" ")}
            >
              <UtensilsCrossed size={15} /> My Dining ({myTables.length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: NEW RESERVATION PROCESS PAGE */}
        {/* ========================================================================= */}
        {activeTab === "new" && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl border-2 border-primary overflow-hidden">
            {/* Stepper Bar Header */}
            <div className="px-6 py-4 bg-deep-wood text-resort-white border-b-2 border-primary/40">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                {[
                  { num: 1, title: "1. Villa & Rate" },
                  { num: 2, title: "2. Guest Details & Extras" },
                  { num: 3, title: "3. Payment & Confirm" },
                  { num: 4, title: "4. Digital Voucher" },
                ].map((s, idx) => (
                  <div key={s.num} className="flex items-center gap-2">
                    <div
                      className={[
                        "w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors",
                        step > s.num
                          ? "bg-primary text-white"
                          : step === s.num
                            ? "bg-secondary text-white ring-2 ring-secondary/40"
                            : "bg-surface-container-high text-deep-wood/50",
                      ].join(" ")}
                    >
                      {step > s.num ? <Check size={16} /> : s.num}
                    </div>
                    <span
                      className={[
                        "text-xs font-bold hidden sm:inline",
                        step === s.num ? "text-sand" : "text-resort-white/50",
                      ].join(" ")}
                    >
                      {s.title}
                    </span>
                    {idx < 3 && (
                      <div className="w-6 sm:w-12 h-px bg-primary/40 mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* STEP 1: Villa & Rate Selection */}
              {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Villa Selector & Parameters */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Villa Showcase Card */}
                    <div className="p-5 bg-surface-container-low border-2 border-primary/30 rounded-xl">
                      <div className="flex flex-col sm:flex-row gap-5 items-start">
                        <img
                          src={villa?.image}
                          alt={villa?.name}
                          className="w-full sm:w-36 h-32 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary rounded-xs">
                              {villa?.category}
                            </span>
                            <span className="text-xs text-secondary font-bold flex items-center gap-1">
                              ★ {villa?.rating} ({villa?.reviewCount} reviews)
                            </span>
                          </div>
                          <h3
                            className="text-2xl font-bold text-deep-wood italic"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {villa?.name}
                          </h3>
                          <p className="text-xs text-deep-wood/80 mt-1">
                            {villa?.tagline}
                          </p>
                          <div className="mt-2 text-xs font-bold text-error">
                            {villa?.popularBadge}
                          </div>
                        </div>
                      </div>

                      {/* Select Villa dropdown */}
                      <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-deep-wood font-bold">
                          Selected Villa:
                        </span>
                        <select
                          value={selectedVillaId}
                          onChange={(e) =>
                            dispatch(setSelectedVillaId(e.target.value))
                          }
                          className="px-3 py-2 bg-white border-2 border-primary/40 text-xs font-bold text-deep-wood rounded-xs focus:outline-none focus:border-primary"
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

                    {/* Stay Parameters Search Bar */}
                    <div className="p-5 bg-surface-container-low border-2 border-primary/30 rounded-xl">
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
                            onChange={(e) =>
                              dispatch(setCheckIn(e.target.value))
                            }
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
                            className="w-7 h-7 border-2 border-primary/40 rounded-xs flex items-center justify-center text-sm font-bold text-deep-wood hover:bg-primary/10"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-deep-wood px-1">
                            {adults}
                          </span>
                          <button
                            onClick={() => dispatch(setAdults(adults + 1))}
                            className="w-7 h-7 border-2 border-primary/40 rounded-xs flex items-center justify-center text-sm font-bold text-deep-wood hover:bg-primary/10"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rate Plan Options */}
                    <div>
                      <h4 className="text-sm font-bold text-deep-wood uppercase tracking-wider mb-3">
                        Choose Your Rate Package
                      </h4>
                      <div className="flex flex-col gap-3">
                        {ratePlans.map((rate) => {
                          const isSelected = selectedRatePlan === rate.id;
                          // Priced by the API for this villa?.
                          const calcPrice = Number(rate.pricePerNight ?? 0);

                          return (
                            <div
                              key={rate.id}
                              onClick={() =>
                                dispatch(setSelectedRatePlan(rate.id))
                              }
                              className={[
                                "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 relative",
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

                  {/* Right Column: Order Summary Card */}
                  <div className="lg:col-span-5 flex flex-col justify-between">
                    <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-sm sticky top-30">
                      <h4
                        className="text-base font-bold text-deep-wood italic mb-4 border-b-2 border-primary/20 pb-3"
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
                          <span>Rate Package:</span>
                          <span className="font-bold text-secondary">
                            {ratePlans.find((r) => r.id === selectedRatePlan)?.name ?? selectedRatePlan}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-primary/20 flex justify-between">
                          <span>
                            {nights} nights x {money(effectiveNightPrice)}
                          </span>
                          <span className="font-bold">{money(roomSubtotal)}</span>
                        </div>

                        {/* The Sri Lankan folio: service charge 10%, TDL 1%,
                            SSCL 2.5%, VAT 18%, each applied to the running
                            total. The flat 7% this used to print was never a
                            real figure. */}
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

                        <div className="pt-3 border-t-2 border-primary/30 flex justify-between items-baseline">
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
                          onClick={handleContinueToStep2}
                          className="w-full py-3.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          Continue to Guest Details <ArrowRight size={16} />
                        </button>

                        <div className="p-3 bg-white rounded-xs border-2 border-primary/30 flex items-center gap-2 text-[11px] text-deep-wood font-medium">
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

              {/* STEP 2: Guest Details & Extras */}
              {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Guest Form Card */}
                    <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-xs">
                      {isAuthenticated && currentUser && (
                        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <Sparkles size={16} className="text-secondary flex-shrink-0" />
                            <div>
                              <span className="font-bold text-deep-wood">
                                Booking as {currentUser.name}
                              </span>
                              <span className="text-deep-wood/70 block text-[11px]">
                                {currentUser.role === 'admin'
                                  ? '🛡️ Administration Staff Account'
                                  : `✨ ${currentUser.membershipTier || 'Aviora Privilege Member'}`} • Details pre-filled
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary text-white uppercase tracking-wider">
                            Verified
                          </span>
                        </div>
                      )}

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
                          <label className={labelClass}>Bed Preference</label>
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
                          placeholder="Dietary requirements, anniversary celebration notes..."
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Extras & Addons Card */}
                    <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-xs">
                      <h3
                        className="text-lg font-bold text-deep-wood italic mb-1"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        Enhance Your Experience
                      </h3>
                      <p className="text-xs text-deep-wood/70 font-medium mb-4">
                        Select bespoke luxury add-ons to customize your stay.
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
                                  ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
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

                  {/* Summary & Next Step */}
                  <div className="lg:col-span-5 flex flex-col justify-between">
                    <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-sm sticky top-36">
                      <h4
                        className="text-base font-bold text-deep-wood italic mb-4 border-b-2 border-primary/20 pb-3"
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

                        <div className="pt-3 border-t-2 border-primary/30 flex justify-between items-baseline">
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
                          className="w-full py-3.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2"
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

              {/* STEP 3: Payment & Guarantee */}
              {step === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-xs">
                      <h3
                        className="text-lg font-bold text-deep-wood italic mb-4"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        Payment Method
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
                              : "bg-white border-primary/30 hover:border-primary",
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
                              : "bg-white border-primary/30 hover:border-primary",
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

                      {/* Card Inputs */}
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
                          <span>VISA</span> • <span>MC</span> •{" "}
                          <span>AMEX</span>
                        </div>
                      </div>
                    </div>

                    {/* Promo Code Box */}
                    <div className="p-5 bg-surface-container-low border-2 border-primary/30 rounded-xl">
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
                      {promoDiscount > 0 && (
                        <p className="text-xs text-primary font-bold mt-2">
                          ✓ Promo Code Applied! You save {promoDiscount}% off
                          gross subtotal.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Checkout Breakdown */}
                  <div className="lg:col-span-5 flex flex-col justify-between">
                    <div className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-sm sticky top-36">
                      <h4
                        className="text-base font-bold text-deep-wood italic mb-4 border-b-2 border-primary/20 pb-3"
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

                        <div className="flex justify-between text-deep-wood/70">
                          <span>Taxes &amp; service charge</span>
                          <span>{money(taxesAndFees)}</span>
                        </div>

                        <div className="pt-3 border-t-2 border-primary/30 flex justify-between items-baseline">
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

                        {/* Blocked when the stay cannot be priced, so a guest
                            cannot walk three steps into a sold-out villa. */}
                        <button
                          disabled={isProcessing || creating || pricing || !canProceed}
                          onClick={handleFinalSubmit}
                          className="w-full py-3.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container transition-colors duration-300 rounded-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing || creating ? (
                            <span>Processing Reservation…</span>
                          ) : !canProceed ? (
                            <span>Unavailable for These Dates</span>
                          ) : (
                            <>
                              <Sparkles size={16} /> Complete &amp; Lock
                              Reservation
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

              {/* STEP 4: Digital Voucher Confirmation */}
              {step === 4 && activeBooking && (
                <div className="max-w-3xl mx-auto py-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3
                      className="text-3xl font-bold text-deep-wood italic mb-1"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Reservation Confirmed!
                    </h3>
                    <p className="text-xs text-deep-wood/80 font-medium">
                      Thank you, {activeBooking.guest?.firstName || activeBooking.guestInfo?.firstName || "Guest"}. Your
                      luxury stay is officially confirmed.
                    </p>
                  </div>

                  {/* Digital Voucher Card */}
                  <div className="p-8 bg-white border-2 border-primary rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b-2 border-primary/20 pb-4 mb-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                          Booking Reference
                        </span>
                        <span className="text-2xl font-bold text-deep-wood font-mono">
                          {activeBooking.referenceId}
                        </span>
                      </div>
                      <span className="px-4 py-1.5 bg-lush-canopy/15 text-lush-canopy text-xs font-bold rounded-xs">
                        ✓ Guaranteed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-6">
                      <div>
                        <span className="text-deep-wood/60 block font-semibold mb-0.5">
                          Villa Reserved:
                        </span>
                        <span className="font-bold text-deep-wood text-base">
                          {activeBooking.villaName}
                        </span>
                      </div>
                      <div>
                        <span className="text-deep-wood/60 block font-semibold mb-0.5">
                          Guests:
                        </span>
                        <span className="font-bold text-deep-wood">
                          {activeBooking.adults} Adults,{" "}
                          {activeBooking.children} Children
                        </span>
                      </div>
                      <div>
                        <span className="text-deep-wood/60 block font-semibold mb-0.5">
                          Check-in:
                        </span>
                        <span className="font-bold text-deep-wood">
                          {activeBooking.checkIn} (From 14:00)
                        </span>
                      </div>
                      <div>
                        <span className="text-deep-wood/60 block font-semibold mb-0.5">
                          Check-out:
                        </span>
                        <span className="font-bold text-deep-wood">
                          {activeBooking.checkOut} (Until 12:00)
                        </span>
                      </div>
                    </div>

                    {((activeBooking.addons?.length > 0) || (activeBooking.selectedAddons?.length > 0)) && (
                      <div className="pt-4 border-t-2 border-primary/20 mb-6">
                        <span className="text-xs font-bold text-deep-wood block mb-2">
                          Included Luxury Enhancements:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(activeBooking.addons || activeBooking.selectedAddons || []).map((addon, idx) => (
                            <span
                              key={addon.id || addon.code || idx}
                              className="px-3 py-1 bg-surface-container text-xs font-bold text-deep-wood rounded-xs"
                            >
                              {addon.icon ? `${addon.icon} ` : ""}{addon.name || addon.addonName || (typeof addon === "string" ? addon : "Add-on")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-5 border-t-2 border-primary/20 flex flex-wrap items-center justify-between bg-surface-container-low p-5 rounded-xl gap-4">
                      <div>
                        <span className="text-[10px] text-deep-wood/70 block font-semibold">
                          Total Amount Charged / Guaranteed:
                        </span>
                        <span
                          className="text-3xl font-bold text-primary"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {money(activeBooking?.finalTotal)}
                        </span>
                      </div>
                      <span className="text-xs text-deep-wood font-medium">
                        Confirmation email sent to{" "}
                        <strong>{activeBooking.guest?.email || activeBooking.guestInfo?.email}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={() => {
                        dispatch(resetBooking());
                        setActiveTab("new");
                      }}
                      className="px-6 py-3 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={16} /> Book Another Sanctuary
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-6 py-3 bg-surface-container-high text-deep-wood text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-surface-container-highest transition-colors flex items-center gap-2 border-2 border-primary/40 cursor-pointer"
                    >
                      <FileText size={16} /> Print Voucher / Receipt
                    </button>

                    <button
                      onClick={() => {
                        dispatch(resetBooking());
                        setActiveTab("my-bookings");
                      }}
                      className="px-6 py-3 bg-surface-container-low text-deep-wood text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-surface-container transition-colors border-2 border-primary/30 flex items-center gap-2 cursor-pointer"
                    >
                      <CalendarCheck size={16} /> View All My Bookings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY BOOKINGS SCREEN */}
        {/* ========================================================================= */}
        {activeTab === "my-bookings" && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl border-2 border-primary p-6 md:p-8">
            <h3
              className="text-2xl font-bold text-deep-wood italic mb-6 border-b-2 border-primary/20 pb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              My Active Reservations ({myBookings.length})
            </h3>

            {myBookings.length === 0 ? (
              <div className="text-center py-16">
                <Calendar size={56} className="mx-auto text-primary/40 mb-4" />
                <h4 className="text-lg font-bold text-deep-wood">
                  No Reservations Found
                </h4>
                <p className="text-xs text-deep-wood/70 font-medium mt-1 mb-6 max-w-sm mx-auto">
                  You haven't reserved any villas yet. Browse our sanctuaries to
                  reserve your luxury stay!
                </p>
                <button
                  onClick={() => {
                    dispatch(resetBooking());
                    setActiveTab("new");
                  }}
                  className="px-6 py-3 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Book A Villa Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {myBookings.map((b) => (
                  <div
                    key={b.referenceId}
                    className="p-6 bg-surface-container-low border-2 border-primary/30 rounded-xl shadow-xs flex flex-col md:flex-row gap-6 justify-between items-start"
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      <img
                        src={b.villaImage}
                        alt={b.villaName}
                        className="w-full sm:w-32 h-28 object-cover rounded-lg flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold text-primary">
                            Ref: {b.referenceId}
                          </span>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-lush-canopy/15 text-lush-canopy rounded-xs">
                            {b.status}
                          </span>
                        </div>
                        <h4
                          className="text-xl font-bold text-deep-wood italic"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {b.villaName}
                        </h4>
                        <p className="text-xs text-deep-wood/80 font-medium mt-1">
                          📅 {b.checkIn} &rarr; {b.checkOut} ({b.nights} Nights)
                        </p>
                        <p className="text-[11px] text-deep-wood/70 font-semibold mt-1">
                          Guest: {b.guest?.firstName || b.guestInfo?.firstName}{" "}
                          {b.guest?.lastName || b.guestInfo?.lastName} • {b.adults} Adults,{" "}
                          {b.children} Children
                        </p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-primary/20">
                      <div className="text-right">
                        <span className="text-xs text-deep-wood/60 font-semibold block">
                          Total Amount:
                        </span>
                        <span
                          className="text-2xl font-bold text-primary"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {money(b.finalTotal)}
                        </span>
                      </div>

                      {/* Voucher. isAdmin false, so no Invoice button - and
                          the folio data behind it never reaches a guest
                          session anyway. */}
                      <div className="mt-3">
                        <StayDocuments booking={b} isAdmin={false} compact />
                      </div>

                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              `Are you sure you want to cancel reservation ${b.referenceId}?`,
                            )
                          )
                            return;

                          try {
                            const res = await cancelReservation({
                              referenceId: b.referenceId,
                            }).unwrap();
                            showSuccess(
                              res?.message ||
                                `Reservation ${b.referenceId} has been cancelled.`,
                            );
                          } catch (err) {
                            // 409 covers a non-refundable rate and a passed
                            // deadline; the message says which.
                            showError(
                              err?.data?.message ||
                                "The reservation could not be cancelled.",
                            );
                          }
                        }}
                        disabled={!b.canCancel || cancelling}
                        className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 mt-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                        {b.canCancel
                          ? "Cancel Reservation"
                          : b.isRefundable
                            ? "Cancellation window passed"
                            : "Non-refundable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MY DINING SCREEN                                                   */}
        {/* Same shape as the stays screen - the details inside each card are the     */}
        {/* dining ones. GET /api/dining/reservations/my existed since module 6 and   */}
        {/* nothing called it, so a table could be booked and never seen again.       */}
        {/* ========================================================================= */}
        {activeTab === "my-dining" && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl border-2 border-primary p-6 md:p-8">
            <h3
              className="text-2xl font-bold text-deep-wood italic mb-6 border-b-2 border-primary/20 pb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              My Table Reservations ({myTables.length})
            </h3>

            {myTables.length === 0 ? (
              <div className="text-center py-16">
                <UtensilsCrossed size={56} className="mx-auto text-primary/40 mb-4" />
                <h4 className="text-lg font-bold text-deep-wood">No Tables Booked</h4>
                <p className="text-xs text-deep-wood/70 font-medium mt-1 mb-6 max-w-sm mx-auto">
                  Reserve a table at one of our restaurants and it will appear here.
                </p>
                <button
                  onClick={() => navigate("/dining")}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Browse Restaurants
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {myTables.map((t) => (
                  <div
                    key={t.referenceId}
                    className={[
                      "p-6 border-2 rounded-xl shadow-xs flex flex-col md:flex-row gap-6 justify-between items-start",
                      t.status === "Cancelled"
                        ? "bg-surface-container-low border-outline-variant/30 opacity-65"
                        : "bg-surface-container-low border-primary/30",
                    ].join(" ")}
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      <img
                        src={t.venueImage}
                        alt={t.venueName}
                        className="w-full sm:w-32 h-28 object-cover rounded-lg flex-shrink-0"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold text-primary">
                            Ref: {t.referenceId}
                          </span>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-lush-canopy/15 text-lush-canopy rounded-xs">
                            {t.status}
                          </span>
                        </div>

                        <h4
                          className="text-xl font-bold text-deep-wood italic"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {t.venueName}
                        </h4>

                        <p className="text-xs text-deep-wood/80 font-medium mt-1">
                          📅 {t.date} at {t.time} · {t.partySize} guest
                          {t.partySize === 1 ? "" : "s"}
                        </p>

                        <p className="text-[11px] text-deep-wood/70 font-semibold mt-1">
                          {t.guestName}
                          {t.occasion && ` • ${t.occasion}`}
                          {t.dressCode && ` • ${t.dressCode}`}
                        </p>

                        {/* Read back so the guest can check the kitchen has
                            what they told it. */}
                        {t.dietaryNotes && (
                          <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                            🌿 {t.dietaryNotes}
                          </p>
                        )}

                        {t.canCancel && t.cancellationDeadline && (
                          <p className="text-[11px] text-deep-wood/55 font-medium mt-1">
                            Free cancellation until{" "}
                            {new Date(t.cancellationDeadline).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}

                        {t.stayReference && (
                          <p className="text-[10px] text-deep-wood/45 font-mono mt-1">
                            Linked to stay {t.stayReference}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-primary/20">
                      <div className="text-right">
                        <span className="text-xs text-deep-wood/60 font-semibold block">
                          Sitting:
                        </span>
                        <span
                          className="text-2xl font-bold text-primary"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {t.time}
                        </span>
                      </div>

                      <div className="mt-3">
                        <TableDocuments table={t} isAdmin={false} compact />
                      </div>

                      {/* canCancel comes from SQL, computed from the status,
                          the sitting time and the deadline stored on the
                          reservation. */}
                      <button
                        onClick={() => handleCancelTable(t)}
                        disabled={!t.canCancel || cancellingTable}
                        className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 mt-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                        {t.canCancel
                          ? "Cancel Table"
                          : t.status === "Cancelled"
                            ? "Cancelled"
                            : t.status === "Completed"
                              ? "Dined"
                              : `${t.noticeHours}h notice has passed`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
