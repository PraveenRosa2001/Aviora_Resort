import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Compass,
  ArrowRight,
  ShieldCheck,
  Headphones,
  ExternalLink,
  Crown,
  Anchor,
} from "lucide-react";
import { useCreateInquiryMutation } from "../features/rooms/roomsApi";
import MyInquiries from "../components/contact/MyInquiries";
import { useToast } from "../components/common/Toast";
import PageSketchBackground from "../components/common/PageSketchBackground";

function FadeSection({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Contact() {
  const formRef = useRef(null);
  const { showSuccess, showError } = useToast();

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Villa Reservations & Stays");
  const [message, setMessage] = useState("");
  /* The WhatsApp channel is gone.

     It opened wa.me with the inquiry pasted into a chat draft - so the guest
     had to press send in a second app for it to reach anyone, and the resort
     had no thread to reply into. Every message now takes one path: recorded
     to the database, answered by email from the desk, and visible under
     "My Inquiries" below. WhatsApp remains in the contact panel beside this
     form as a direct chat link, which is what it was actually good for. */
  const [panel, setPanel] = useState("write"); // 'write' | 'history'

  // Validation & Submission States
  const [errors, setErrors] = useState({});


  const [createInquiry, { isLoading: isSubmitting }] = useCreateInquiryMutation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!subject.trim()) {
      newErrors.subject = "Please select a subject of inquiry";
    }
    if (!message.trim()) {
      newErrors.message = "Please provide details for your inquiry";
    } else if (message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showError("Please correct the highlighted fields before submitting.");
    }
    return Object.keys(newErrors).length === 0;
  };

  /* Both channels now post to POST /api/contact first.

     The old version generated a reference in the browser - "AVR-INQ-" plus a
     random number - and showed it to the guest whether or not the send
     succeeded. Its catch block did the same thing as its try block. So a
     failed EmailJS call produced a confident confirmation, a reference that
     existed nowhere, and no record anyone could find.

     Now the inquiry is committed to SQL before the response returns. The
     reference comes back from the database, so quoting it actually finds
     something. */

  const buildPayload = (channel) => ({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phone: phone.trim() || undefined,
    subject: subject.trim(),
    message: message.trim(),
    preferredChannel: channel,
    sourcePage: "/contact",
  });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    try {
      const result = await createInquiry(buildPayload("email")).unwrap();

      setSuccessInfo({
        refId: result.referenceId,
        firstName,
        lastName,
        email,
        subject,
        channel: "Email",
      });
      setIsSuccess(true);
      showSuccess(`Your message is with our concierge team — ${result.referenceId}`);
    } catch (err) {
      // A failure is now shown as a failure. The guest can try again or
      // telephone, instead of waiting on a reply that will never come.
      const detail =
        err?.data?.message ||
        "Your message could not be recorded. Please try again, or telephone the resort directly.";
      setSubmitError(detail);
      showError(detail);
    }
  };

  const handleResetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSubject("Villa Reservations & Stays");
    setMessage("");
    setErrors({});
    setIsSuccess(false);
    setSuccessInfo(null);
    setSubmitError("");
  };

  return (
    <div className="relative min-h-screen">
      {/* ── Hero Image & Editorial Header ── */}
      <section className="relative z-10 w-full h-[52vh] min-h-[380px] flex items-center justify-center overflow-hidden mb-0 pt-20">
        <img
          src="/assets/images/villas/garden-pool-villa-01.jpg"
          alt="Aviora Resort Estate Contact"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-wood via-deep-wood/75 to-deep-wood/40" />

        {/* Ambient Warm Golden Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 container-resort text-center text-white max-w-4xl mx-auto px-6">
          <FadeSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-amber-300 uppercase tracking-widest mb-4 backdrop-blur-md">
              <Sparkles size={13} className="text-amber-400" />
              <span>Dedicated Concierge Liaison</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-white"
              style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
            >
              Connect with Our Sanctuary
            </h1>

            <p
              className="text-sm sm:text-base text-white/85 leading-relaxed max-w-2xl mx-auto font-normal"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Whether orchestrating a bespoke private villa stay, reserving an
              oceanfront dinner, or requesting helicopter charters, our
              concierge desk is at your disposal 24 hours a day.
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-4 border-t border-white/15 text-xs text-white/90">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-400" />
                <span>24/7 On-Call Concierge</span>
              </div>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-400" />
                <span>Direct Guaranteed Response</span>
              </div>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-emerald-400" />
                <span>Instant WhatsApp Liaison</span>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── BELOW-HERO SECTIONS WITH RESPONSIVE SKETCH BACKGROUND ── */}
      <div className="relative w-full overflow-hidden bg-[#F4F1EA] pb-24">
        <PageSketchBackground subtitle="Estate Concierge &amp; Inquiries Folio" />
        <div className="relative z-10 pt-16">
          {/* ── Main Interactive Contact Section (Dual Grid) ── */}
          <section className="container-resort mb-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* ── LEFT: The Inquiry & Dispatch Desk (7 Columns) ── */}
              <FadeSection delay={0.1} className="lg:col-span-7 flex">
                <div className="bg-white border border-outline-variant/40 rounded-3xl p-6 sm:p-10 lg:p-12 w-full flex-1 flex flex-col justify-between shadow-sm">
                  <div>
                    {/* Header & Channel Switcher */}
                    <div className="mb-8">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary block mb-1 font-mono">
                        Private Inquiry Desk
                      </span>
                      <h2
                        className="text-2.5xl sm:text-3xl font-bold text-deep-wood mb-2"
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontStyle: "italic",
                        }}
                      >
                        {panel === "history"
                          ? "My Inquiries & Replies"
                          : "Send an Inquiry"}
                      </h2>
                      <p className="text-xs sm:text-sm text-deep-wood/70 leading-relaxed">
                        {panel === "history"
                          ? "Review your conversation history with our concierge team and follow up on active requests."
                          : "Write to our concierge and we will reply by email. Every message is recorded against a reference, so you can follow it here at any time."}
                      </p>

                      {/* Write / History */}
                      <div className="grid grid-cols-2 p-1.5 bg-surface-container-high rounded-2xl border border-outline-variant/30 mt-5">
                        <button
                          type="button"
                          onClick={() => setPanel("write")}
                          className={[
                            "py-2.5 sm:py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                            panel === "write"
                              ? "bg-primary text-white shadow-md"
                              : "text-deep-wood/70 hover:text-deep-wood",
                          ].join(" ")}
                        >
                          <Mail size={14} />
                          <span>New Inquiry</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPanel("history")}
                          className={[
                            "py-2.5 sm:py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                            panel === "history"
                              ? "bg-primary text-white shadow-md"
                              : "text-deep-wood/70 hover:text-deep-wood",
                          ].join(" ")}
                        >
                          <MessageSquare size={14} />
                          <span>My Inquiries</span>
                        </button>
                      </div>
                    </div>

                    {/* History panel. Signed in, it lists everything they have
                        sent; signed out, it looks one up by reference and
                        email - the pair the API requires. */}
                    {panel === "history" && (
                      <div className="pt-1">
                        <MyInquiries />
                      </div>
                    )}

                    {/* Success Confirmation Card */}
                    {panel === "write" && isSuccess && successInfo ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 sm:p-8 rounded-3xl bg-surface-container-low/50 border border-outline-variant/40 text-center"
                      >
                        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <CheckCircle2 size={28} />
                        </div>

                        <h3
                          className="text-2xl font-bold text-deep-wood mb-2"
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontStyle: "italic",
                          }}
                        >
                          Inquiry Dispatched Successfully
                        </h3>

                        <p className="text-xs sm:text-sm text-deep-wood/75 max-w-md mx-auto mb-6 leading-relaxed">
                          Thank you,{" "}
                          <strong>
                            {successInfo.firstName} {successInfo.lastName}
                          </strong>
                          . Your inquiry regarding{" "}
                          <em>"{successInfo.subject}"</em> has been transmitted
                          via {successInfo.channel}.
                        </p>

                        <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 max-w-sm mx-auto mb-6 text-left space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-deep-wood/60">
                              Reference ID:
                            </span>
                            <span className="font-mono font-bold text-primary">
                              {successInfo.refId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-deep-wood/60">
                              Contact Email:
                            </span>
                            <span className="font-semibold text-deep-wood">
                              {successInfo.email}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-deep-wood/60">
                              Estimated Response:
                            </span>
                            <span className="font-semibold text-emerald-700">
                              Within 15 Minutes
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleResetForm}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                        >
                          <span>Send Another Inquiry</span>
                          <ArrowRight size={14} />
                        </button>
                      </motion.div>
                    ) : panel === "write" ? (
                      <form
                        ref={formRef}
                        onSubmit={handleEmailSubmit}
                        noValidate
                        className="space-y-4"
                      >
                        {/* Error Alert */}
                        {submitError && (
                          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {/* First & Last Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="firstName"
                              className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5"
                            >
                              First Name{" "}
                              <span className="text-red-500 font-bold ml-0.5">
                                *
                              </span>
                            </label>
                            <input
                              id="firstName"
                              type="text"
                              value={firstName}
                              onChange={(e) => {
                                setFirstName(e.target.value);
                                if (errors.firstName)
                                  setErrors((prev) => ({
                                    ...prev,
                                    firstName: null,
                                  }));
                              }}
                              placeholder="e.g. Elena"
                              className={[
                                "w-full px-4 py-3 bg-surface-container-low/50 border rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs",
                                errors.firstName
                                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                                  : "border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20",
                              ].join(" ")}
                            />
                            {errors.firstName && (
                              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                                <AlertCircle
                                  size={12}
                                  className="flex-shrink-0"
                                />
                                <span>{errors.firstName}</span>
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="lastName"
                              className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5"
                            >
                              Last Name{" "}
                              <span className="text-red-500 font-bold ml-0.5">
                                *
                              </span>
                            </label>
                            <input
                              id="lastName"
                              type="text"
                              value={lastName}
                              onChange={(e) => {
                                setLastName(e.target.value);
                                if (errors.lastName)
                                  setErrors((prev) => ({
                                    ...prev,
                                    lastName: null,
                                  }));
                              }}
                              placeholder="e.g. Rostova"
                              className={[
                                "w-full px-4 py-3 bg-surface-container-low/50 border rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs",
                                errors.lastName
                                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                                  : "border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20",
                              ].join(" ")}
                            />
                            {errors.lastName && (
                              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                                <AlertCircle
                                  size={12}
                                  className="flex-shrink-0"
                                />
                                <span>{errors.lastName}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5"
                            >
                              Email Address{" "}
                              <span className="text-red-500 font-bold ml-0.5">
                                *
                              </span>
                            </label>
                            <input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email)
                                  setErrors((prev) => ({
                                    ...prev,
                                    email: null,
                                  }));
                              }}
                              placeholder="elena@example.com"
                              className={[
                                "w-full px-4 py-3 bg-surface-container-low/50 border rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs",
                                errors.email
                                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                                  : "border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20",
                              ].join(" ")}
                            />
                            {errors.email && (
                              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                                <AlertCircle
                                  size={12}
                                  className="flex-shrink-0"
                                />
                                <span>{errors.email}</span>
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5"
                            >
                              Phone / WhatsApp Number
                            </label>
                            <input
                              id="phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 (555) 234-5678"
                              className="w-full px-4 py-3 bg-surface-container-low/50 border border-outline-variant/40 rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-deep-wood/35 shadow-xs"
                            />
                          </div>
                        </div>

                        {/* Subject of Inquiry */}
                        <div>
                          <label
                            htmlFor="subject"
                            className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5"
                          >
                            Subject of Inquiry{" "}
                            <span className="text-red-500 font-bold ml-0.5">
                              *
                            </span>
                          </label>
                          <select
                            id="subject"
                            value={subject}
                            onChange={(e) => {
                              setSubject(e.target.value);
                              if (errors.subject)
                                setErrors((prev) => ({
                                  ...prev,
                                  subject: null,
                                }));
                            }}
                            className="w-full px-4 py-3 bg-surface-container-low/50 border border-outline-variant/40 rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-xs"
                          >
                            <option value="Villa Reservations & Stays">
                              Villa Reservations & Bespoke Stays
                            </option>
                            <option value="Private Dining & Wine Cellar">
                              Private Ocean Dining & Wine Tastings
                            </option>
                            <option value="Ayurvedic Wellness & Spa Rituals">
                              Ayurvedic Wellness & Spa Rituals
                            </option>
                            <option value="Helicopter & Yacht Transfers">
                              Helicopter Charters & Private Yachting
                            </option>
                            <option value="Weddings & Private Estate Celebrations">
                              Weddings & Private Celebrations
                            </option>
                            <option value="General Concierge Assistance">
                              General Concierge Assistance
                            </option>
                          </select>
                        </div>

                        {/* Message Textarea */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label
                              htmlFor="message"
                              className="block text-xs font-bold text-deep-wood uppercase tracking-wider"
                            >
                              Message Details{" "}
                              <span className="text-red-500 font-bold ml-0.5">
                                *
                              </span>
                            </label>
                            <span className="text-[10px] text-deep-wood/50">
                              {message.length} characters
                            </span>
                          </div>
                          <textarea
                            id="message"
                            rows={4}
                            value={message}
                            onChange={(e) => {
                              setMessage(e.target.value);
                              if (errors.message)
                                setErrors((prev) => ({
                                  ...prev,
                                  message: null,
                                }));
                            }}
                            placeholder="Please share your dates, guest count, or any bespoke preferences..."
                            className={[
                              "w-full px-4 py-3 bg-surface-container-low/50 border rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs resize-none",
                              errors.message
                                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10"
                                : "border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20",
                            ].join(" ")}
                          />
                          {errors.message && (
                            <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle
                                size={12}
                                className="flex-shrink-0"
                              />
                              <span>{errors.message}</span>
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-4 px-6 bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 mt-4"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Recording your inquiry...</span>
                            </div>
                          ) : (
                            <>
                              <Send size={15} />
                              <span>Send to the Concierge</span>
                            </>
                          )}
                        </button>

                        <p className="text-[11px] text-center text-deep-wood/55 pt-2">
                          🔒 All inquiries are encrypted and handled
                          confidentially by our certified guest desk.
                        </p>
                      </form>
                    ) : null}
                  </div>
                </div>
              </FadeSection>

              {/* ── RIGHT: Direct Luxury Concierge Desk (5 Columns) ── */}
              <FadeSection delay={0.15} className="lg:col-span-5 flex">
                <div className="rounded-3xl p-6 sm:p-10 lg:p-12 w-full flex-1 flex flex-col justify-between text-white shadow-xl relative overflow-hidden bg-deep-wood">
                  {/* Background ambient lighting */}
                  <div
                    aria-hidden="true"
                    className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-secondary-container/15 blur-3xl pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none"
                  />

                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-amber-300 uppercase tracking-widest mb-4 backdrop-blur-md">
                      <Headphones size={13} className="text-amber-300" />
                      <span>Direct Communication</span>
                    </div>

                    <h2
                      className="text-2.5xl sm:text-3xl font-bold mb-6 text-warm-sand"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                        color: "var(--color-warm-sand, #F2E8CF)",
                      }}
                    >
                      Direct Concierge
                    </h2>

                    <div className="space-y-6 text-white/90">
                      {/* Address */}
                      <div className="flex gap-4 items-start pb-5 border-b border-white/10">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-amber-300">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-300/80 mb-1 font-mono">
                            Estate Sanctuary
                          </span>
                          <p className="text-xs sm:text-sm text-warm-sand/90 leading-relaxed">
                            Aviora Peninsula, Silhouette Island
                            <br />
                            Seychelles Archipelago, Indian Ocean
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex gap-4 items-start pb-5 border-b border-white/10">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-amber-300">
                          <Phone size={18} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-300/80 mb-1 font-mono">
                            Telephone Desk
                          </span>
                          <a
                            href="tel:+94112345678"
                            className="text-xs sm:text-sm text-white font-bold hover:text-amber-300 transition-colors block"
                          >
                            +94 11 234 5678
                          </a>
                          <span className="text-[11px] text-white/60">
                            Toll-free International Hotline
                          </span>
                        </div>
                      </div>

                      {/* WhatsApp Direct */}
                      <div className="flex gap-4 items-start pb-5 border-b border-white/10">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
                          <MessageSquare size={18} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1 font-mono">
                            WhatsApp Concierge
                          </span>
                          <a
                            href="https://wa.me/94112345678"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs sm:text-sm text-emerald-300 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>+94 11 234 5678 (Chat Now)</span>
                            <ExternalLink size={12} />
                          </a>
                          <span className="text-[11px] text-white/60">
                            Instant response from in-house liaison
                          </span>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-amber-300">
                          <Mail size={18} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-300/80 mb-1 font-mono">
                            Electronic Mail
                          </span>
                          <a
                            href="mailto:concierge@aviora.com"
                            className="text-xs sm:text-sm text-white font-bold hover:text-amber-300 transition-colors block"
                          >
                            concierge@aviora.com
                          </a>
                          <a
                            href="mailto:reservations@aviora.com"
                            className="text-[11px] text-white/70 hover:text-amber-300 transition-colors block mt-0.5"
                          >
                            reservations@aviora.com
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Live Concierge Desk Status */}
                    <div className="mt-6 p-3.5 rounded-2xl bg-white/[0.07] border border-white/10 flex items-center justify-between backdrop-blur-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        <span className="text-[11px] font-bold text-warm-sand tracking-wide uppercase font-mono">
                          Desk Active 24/7
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/20">
                        &lt; 15m typical reply
                      </span>
                    </div>
                  </div>

                  {/* VIP Concierge Guarantee Strip */}
                  <div className="mt-8 pt-5 border-t border-white/15 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0">
                        <Crown size={16} />
                      </div>
                      <div>
                        <strong className="text-white text-xs block font-semibold">
                          Private Jet & Yacht Coordination
                        </strong>
                        <span className="text-white/70 text-[11px]">
                          Complimentary marina berths and helipad clearance for
                          in-house villa guests.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeSection>
            </div>
          </section>

          {/* ── Location Map & Coordinates Section ── */}
          <section className="container-resort">
            <FadeSection className="text-center mb-8">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary block mb-1 font-mono">
                Arrival & Geographic Coordinates
              </span>
              <h2
                className="text-3xl lg:text-4xl font-bold text-deep-wood"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontStyle: "italic",
                }}
              >
                The Peninsula Estate
              </h2>
            </FadeSection>

            <FadeSection delay={0.15}>
              <div className="relative overflow-hidden rounded-3xl border border-outline-variant/30 aspect-[21/9] min-h-[360px] shadow-md">
                <img
                  src="/assets/images/experiences/private-island.jpg"
                  alt="Aviora Resort Peninsula Location"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/80 via-transparent to-deep-wood/30 pointer-events-none" />

                {/* Map Pin Popup Box */}
                <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 bg-white/95 backdrop-blur-md p-6 rounded-2xl max-w-sm shadow-xl border border-white/80">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Compass size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                      Coordinates: 4°29'12.4"S 55°14'08.2"E
                    </span>
                  </div>

                  <h4
                    className="font-bold text-deep-wood text-lg mb-1"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                    }}
                  >
                    Aviora Resort Peninsula
                  </h4>

                  <p className="text-xs text-deep-wood/75 mb-3 leading-relaxed">
                    P.O. Box 123, Silhouette Island, Seychelles Archipelago.
                    <br />
                    Helipad Landing Code: <strong>AVR-01</strong> | Marina
                    Berths: <strong>Pier 4</strong>
                  </p>

                  <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/30">
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </FadeSection>
          </section>
        </div>
      </div>
    </div>
  );
}
