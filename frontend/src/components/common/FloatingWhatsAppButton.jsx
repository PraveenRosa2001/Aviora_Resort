import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingWhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false);
  const phoneNumber = '94112345678';
  const defaultMessage = encodeURIComponent(
    'Hello Aviora Resort Reception, I would like to inquire about reservation details and concierge services.'
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center justify-end group">
      {/* ── Expandable Reception Tooltip Card (Opens to Left) ── */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="hidden sm:block absolute right-16 sm:right-18 pr-2 z-20 pointer-events-none"
          >
            <div className="bg-deep-wood text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 whitespace-nowrap backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                <p className="text-xs font-bold text-warm-sand">
                  Aviora Resort Reception Desk
                </p>
              </div>
              <p className="text-[11px] text-white/70 mt-0.5">
                Instant WhatsApp Liaison • +94 11 234 5678
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Continuous Radiating Rays / Pulse Rings ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="w-14 h-14 rounded-full bg-[#25D366] opacity-40 animate-ping" />
        <span className="absolute w-18 h-18 rounded-full bg-[#25D366] opacity-20 animate-pulse" />
      </div>

      {/* ── Main WhatsApp Floating Button ── */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="floating-whatsapp-reception"
        aria-label="Chat directly with Aviora Resort Reception on WhatsApp"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        className="relative z-10 w-12 h-12 sm:w-12 sm:h-12 rounded-full bg-[#25D366] text-white shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-300 border-2 border-white/40"
      >
        {/* Official WhatsApp SVG Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="drop-shadow-sm"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>

        {/* Online Indicator Badge */}
        {/* <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-300 border-2 border-white" /> */}
      </motion.a>
    </div>
  );
}
