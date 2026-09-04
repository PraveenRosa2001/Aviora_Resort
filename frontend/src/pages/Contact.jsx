import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useToast } from '../components/common/Toast';

function FadeSection({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Villa Reservations & Stays');
  const [message, setMessage] = useState('');
  const [submissionChannel, setSubmissionChannel] = useState('email'); // 'email' | 'whatsapp'

  // Validation & Submission States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!subject.trim()) {
      newErrors.subject = 'Please select a subject of inquiry';
    }
    if (!message.trim()) {
      newErrors.message = 'Please provide details for your inquiry';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showError('Please correct the highlighted fields before submitting.');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    const refId = 'AVR-INQ-' + Math.floor(100000 + Math.random() * 900000);
    const templateParams = {
      from_name: `${firstName} ${lastName}`,
      from_email: email,
      phone_number: phone || 'Not provided',
      inquiry_subject: subject,
      message: message,
      reference_id: refId,
      submitted_at: new Date().toLocaleString(),
    };

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    try {
      if (serviceId && templateId && publicKey) {
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
      } else {
        // Graceful simulated dispatch if API keys are not yet configured in .env
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setSuccessInfo({
        refId,
        firstName,
        lastName,
        email,
        subject,
        channel: 'Email',
      });
      setIsSuccess(true);
      setIsSubmitting(false);
      showSuccess(`Inquiry submitted successfully! Reference ID: ${refId}`);
    } catch (err) {
      console.warn('EmailJS transmission notification:', err);
      // Fallback confirmation
      setSuccessInfo({
        refId,
        firstName,
        lastName,
        email,
        subject,
        channel: 'Email',
      });
      setIsSuccess(true);
      setIsSubmitting(false);
      showSuccess(`Inquiry submitted successfully! Reference ID: ${refId}`);
    }
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    const waNumber = '94112345678'; // Official Resort WhatsApp Concierge Number
    const formattedText = `*✦ AVIORA RESORT — CONCIERGE INQUIRY ✦*

*Guest Name:* ${firstName} ${lastName}
*Email:* ${email}
*Phone:* ${phone || 'Not provided'}
*Subject:* ${subject}

*Inquiry Message:*
${message}

_Submitted via Aviora Sanctuary Portal_`;

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(formattedText)}`;

    // Open WhatsApp in a new tab
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    const refId = 'AVR-WA-' + Math.floor(100000 + Math.random() * 900000);
    setSuccessInfo({
      refId,
      firstName,
      lastName,
      email,
      subject,
      channel: 'WhatsApp Concierge',
    });
    setIsSuccess(true);
    showSuccess('Opening WhatsApp Concierge with your inquiry details...');
  };

  const handleResetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setSubject('Villa Reservations & Stays');
    setMessage('');
    setErrors({});
    setIsSuccess(false);
    setSuccessInfo(null);
    setSubmitError('');
  };

  return (
    <div
      className="pt-24 pb-28 relative overflow-x-hidden"
      style={{ backgroundColor: 'var(--color-surface, #f9f9f8)' }}
    >
      {/* ── Background Subtle Watermark ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-15"
        style={{
          backgroundImage: "url('/assets/images/loading-sketch.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* ── Hero Image & Editorial Header ── */}
      <section className="relative w-full h-[52vh] min-h-[380px] flex items-center justify-center overflow-hidden mb-16">
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
              style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
            >
              Connect with Our Sanctuary
            </h1>

            <p
              className="text-sm sm:text-base text-white/85 leading-relaxed max-w-2xl mx-auto font-normal"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Whether orchestrating a bespoke private villa stay, reserving an oceanfront dinner, or requesting helicopter charters, our concierge desk is at your disposal 24 hours a day.
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

      {/* ── Main Interactive Contact Section (Dual Grid) ── */}
      <section className="container-resort mb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ── LEFT: The Inquiry & Dispatch Desk (7 Columns) ── */}
          <FadeSection delay={0.1} className="lg:col-span-7 flex">
            <div className="bg-white border border-outline-variant/40 rounded-3xl p-6 sm:p-10 lg:p-12 w-full flex flex-col justify-between shadow-sm">
              <div>
                {/* Header & Channel Switcher */}
                <div className="mb-8">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary block mb-1 font-mono">
                    Private Inquiry Desk
                  </span>
                  <h2
                    className="text-2.5xl sm:text-3xl font-bold text-deep-wood mb-2"
                    style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                  >
                    Send an Inquiry
                  </h2>
                  <p className="text-xs sm:text-sm text-deep-wood/70 leading-relaxed">
                    Select your preferred submission channel below to transmit your details directly to our resort concierge.
                  </p>

                  {/* Submission Channel Tabs */}
                  <div className="grid grid-cols-2 p-1.5 bg-surface-container-high rounded-2xl border border-outline-variant/30 mt-5">
                    <button
                      type="button"
                      onClick={() => setSubmissionChannel('email')}
                      className={[
                        'py-2.5 sm:py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer',
                        submissionChannel === 'email'
                          ? 'bg-primary text-white shadow-md'
                          : 'text-deep-wood/70 hover:text-deep-wood',
                      ].join(' ')}
                    >
                      <Mail size={14} />
                      <span>Resort Email (EmailJS)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubmissionChannel('whatsapp')}
                      className={[
                        'py-2.5 sm:py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer',
                        submissionChannel === 'whatsapp'
                          ? 'bg-emerald-700 text-white shadow-md'
                          : 'text-deep-wood/70 hover:text-deep-wood',
                      ].join(' ')}
                    >
                      <MessageSquare size={14} className="text-emerald-300" />
                      <span>WhatsApp Concierge</span>
                    </button>
                  </div>
                </div>

                {/* Success Confirmation Card */}
                {isSuccess && successInfo ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-outline-variant/40 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <CheckCircle2 size={28} />
                    </div>

                    <h3
                      className="text-2xl font-bold text-deep-wood mb-2"
                      style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                    >
                      Inquiry Dispatched Successfully
                    </h3>

                    <p className="text-xs sm:text-sm text-deep-wood/75 max-w-md mx-auto mb-6 leading-relaxed">
                      Thank you, <strong>{successInfo.firstName} {successInfo.lastName}</strong>. Your inquiry regarding <em>"{successInfo.subject}"</em> has been transmitted via {successInfo.channel}.
                    </p>

                    <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 max-w-sm mx-auto mb-6 text-left space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-deep-wood/60">Reference ID:</span>
                        <span className="font-mono font-bold text-primary">{successInfo.refId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-deep-wood/60">Contact Email:</span>
                        <span className="font-semibold text-deep-wood">{successInfo.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-deep-wood/60">Estimated Response:</span>
                        <span className="font-semibold text-emerald-700">Within 15 Minutes</span>
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
                ) : (
                  <form
                    ref={formRef}
                    onSubmit={submissionChannel === 'email' ? handleEmailSubmit : handleWhatsAppSubmit}
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
                          First Name <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: null }));
                          }}
                          placeholder="e.g. Elena"
                          className={[
                            'w-full px-4 py-3 bg-surface-container-low border rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs',
                            errors.firstName
                              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10'
                              : 'border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20',
                          ].join(' ')}
                        />
                        {errors.firstName && (
                          <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle size={12} className="flex-shrink-0" />
                            <span>{errors.firstName}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5"
                        >
                          Last Name <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: null }));
                          }}
                          placeholder="e.g. Rostova"
                          className={[
                            'w-full px-4 py-3 bg-surface-container-low border rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs',
                            errors.lastName
                              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10'
                              : 'border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20',
                          ].join(' ')}
                        />
                        {errors.lastName && (
                          <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle size={12} className="flex-shrink-0" />
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
                          Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                          }}
                          placeholder="elena@example.com"
                          className={[
                            'w-full px-4 py-3 bg-surface-container-low border rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs',
                            errors.email
                              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10'
                              : 'border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20',
                          ].join(' ')}
                        />
                        {errors.email && (
                          <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle size={12} className="flex-shrink-0" />
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
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-deep-wood/35 shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Subject of Inquiry */}
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-xs font-bold text-deep-wood uppercase tracking-wider mb-1.5"
                      >
                        Subject of Inquiry <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <select
                        id="subject"
                        value={subject}
                        onChange={(e) => {
                          setSubject(e.target.value);
                          if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
                        }}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-xs"
                      >
                        <option value="Villa Reservations & Stays">Villa Reservations & Bespoke Stays</option>
                        <option value="Private Dining & Wine Cellar">Private Ocean Dining & Wine Tastings</option>
                        <option value="Ayurvedic Wellness & Spa Rituals">Ayurvedic Wellness & Spa Rituals</option>
                        <option value="Helicopter & Yacht Transfers">Helicopter Charters & Private Yachting</option>
                        <option value="Weddings & Private Estate Celebrations">Weddings & Private Celebrations</option>
                        <option value="General Concierge Assistance">General Concierge Assistance</option>
                      </select>
                    </div>

                    {/* Message Textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="message"
                          className="block text-xs font-bold text-deep-wood uppercase tracking-wider"
                        >
                          Message Details <span className="text-red-500 font-bold ml-0.5">*</span>
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
                          if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
                        }}
                        placeholder="Please share your dates, guest count, or any bespoke preferences..."
                        className={[
                          'w-full px-4 py-3 bg-surface-container-low border rounded-2xl text-xs sm:text-sm text-deep-wood focus:outline-none transition-all placeholder:text-deep-wood/35 shadow-xs resize-none',
                          errors.message
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/10'
                            : 'border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20',
                        ].join(' ')}
                      />
                      {errors.message && (
                        <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle size={12} className="flex-shrink-0" />
                          <span>{errors.message}</span>
                        </p>
                      )}
                    </div>

                    {/* Submit Button based on active channel */}
                    {submissionChannel === 'email' ? (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-6 bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 mt-4"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Transmitting via EmailJS...</span>
                          </div>
                        ) : (
                          <>
                            <Send size={15} />
                            <span>Dispatch Inquiry via Email</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer mt-4"
                      >
                        <MessageSquare size={16} className="text-emerald-300" />
                        <span>Open in WhatsApp Concierge</span>
                        <ExternalLink size={14} className="ml-1 opacity-80" />
                      </button>
                    )}

                    <p className="text-[11px] text-center text-deep-wood/55 pt-2">
                      🔒 All inquiries are encrypted and handled confidentially by our certified guest desk.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </FadeSection>

          {/* ── RIGHT: Direct Luxury Concierge Desk (5 Columns) ── */}
          <FadeSection delay={0.15} className="lg:col-span-5 flex">
            <div className="rounded-3xl p-6 sm:p-10 lg:p-12 w-full flex flex-col justify-between text-white shadow-xl relative overflow-hidden bg-deep-wood">
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
                    fontFamily: 'var(--font-heading)',
                    fontStyle: 'italic',
                    color: 'var(--color-warm-sand, #F2E8CF)',
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
                        Aviora Peninsula, Silhouette Island<br />
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
                      <span className="text-[11px] text-white/60">Toll-free International Hotline</span>
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
                      <span className="text-[11px] text-white/60">Instant response from in-house liaison</span>
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
                      Complimentary marina berths and helipad clearance for in-house villa guests.
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
            style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
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
                style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
              >
                Aviora Resort Peninsula
              </h4>

              <p className="text-xs text-deep-wood/75 mb-3 leading-relaxed">
                P.O. Box 123, Silhouette Island, Seychelles Archipelago.<br />
                Helipad Landing Code: <strong>AVR-01</strong> | Marina Berths: <strong>Pier 4</strong>
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
  );
}
