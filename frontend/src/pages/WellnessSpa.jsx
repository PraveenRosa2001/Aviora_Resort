import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Waves, Leaf, UtensilsCrossed, Sparkles } from "lucide-react";
import PageSketchBackground from "../components/common/PageSketchBackground";

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

export default function WellnessSpa() {
  return (
    <div className="relative min-h-screen">
      {/* ── FULL-WIDTH HERO HEADER BANNER ── */}
      <section className="relative z-10 w-full h-[55vh] min-h-[640px] flex items-center justify-center overflow-hidden mb-0 pt-20">
        <img
          src="/assets/images/experiences/ayurvedic-ritual.jpg"
          alt="A Sanctuary of Senses"
          className="img-cover absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/95 via-deep-wood/50 to-deep-wood/25" />

        <div className="relative z-10 container-resort text-center text-white max-w-4xl mx-auto px-6">
          <FadeSection>
            <span className="eyebrow-label text-emerald-300 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-4 tracking-widest text-xs font-bold uppercase shadow-sm">
              <Leaf size={14} className="text-emerald-300" /> HOLISTIC WELLNESS
              &amp; SPA
            </span>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-white drop-shadow-md"
              style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
            >
              A Sanctuary of Senses
            </h1>
            <p
              className="text-sm md:text-base text-white/85 leading-relaxed max-w-2xl mx-auto mb-8 font-medium"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Discover unparalleled renewal where ancient Ayurvedic wisdom meets
              modern architectural tranquility. Meticulously crafted rituals
              designed to restore balance to mind, body, and spirit.
            </p>

            {/* Sleek bottom stats pill bar */}
            <div className="inline-flex flex-wrap items-center justify-center gap-4 md:gap-8 bg-black/40 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-xs font-semibold text-white/90 shadow-lg">
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-300" /> Ancient
                Ayurvedic Healing
              </span>
              <span className="hidden sm:inline text-white/30">•</span>
              <span className="flex items-center gap-2">
                <Waves size={15} className="text-cyan-300" /> Hydrotherapy &amp;
                Infinity Pool
              </span>
              <span className="hidden sm:inline text-white/30">•</span>
              <span className="flex items-center gap-2">
                <Leaf size={14} className="text-emerald-300" /> Organic
                Botanical Oils
              </span>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── BELOW-HERO SECTIONS WITH RESPONSIVE SKETCH BACKGROUND ── */}
      <div className="relative w-full overflow-hidden bg-[#F4F1EA] pb-24">
        <PageSketchBackground subtitle="Holistic Wellness &amp; Ayurvedic Spa Folio" />
        <div className="relative z-10 pt-16">
          {/* ── Asymmetric Amenities Grid ── */}
          <section className="container-resort">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Row 1 — Left: Horizon Pool (Large image card, 7 cols) */}
              <FadeSection delay={0.1} className="lg:col-span-7 flex">
                <div className="relative overflow-hidden rounded-md w-full min-h-[400px] flex flex-col justify-end p-6 md:p-8 group shadow-xs">
                  <img
                    src="/assets/images/hero-day.jpg"
                    alt="The Horizon Pool"
                    className="img-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/80 via-deep-wood/20 to-transparent" />

                  {/* Glass text box overlay */}
                  <div className="relative z-10 bg-white/75 backdrop-blur-md p-6 md:p-8 rounded-sm max-w-xl border border-white/50">
                    <div className="flex items-center gap-2.5 mb-3 text-primary">
                      <Waves size={20} strokeWidth={1.5} />
                      <h3
                        className="text-2xl font-bold text-on-surface"
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontStyle: "italic",
                        }}
                      >
                        The Horizon Pool
                      </h3>
                    </div>
                    <p
                      className="text-xs md:text-sm text-on-surface/80 leading-relaxed"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Suspend reality at the edge of the world. Our signature
                      infinity pool blends seamlessly with the azure seascape,
                      offering a tranquil sanctuary for sun-drenched afternoons
                      and starlit swims.
                    </p>
                  </div>
                </div>
              </FadeSection>

              {/* Row 1 — Right: Botanical Spa (Text card, 5 cols) */}
              <FadeSection delay={0.15} className="lg:col-span-5 flex">
                <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-md p-8 md:p-10 flex flex-col justify-between w-full shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-10 h-10 rounded-full border border-tertiary/40 flex items-center justify-center text-tertiary">
                        <Leaf size={20} strokeWidth={1.5} />
                      </div>
                      <span
                        className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-surface-container-high text-on-surface/60 rounded-xs"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Holistic
                      </span>
                    </div>

                    <h3
                      className="text-2xl lg:text-3xl font-bold mb-4 text-on-surface"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                      }}
                    >
                      Botanical Spa
                    </h3>

                    <p
                      className="text-sm text-on-surface/70 leading-relaxed"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Nestled within lush foliage, our spa utilizes indigenous
                      ingredients from our organic gardens. Experience
                      restorative therapies grounded in ancient tropical healing
                      traditions.
                    </p>
                  </div>
                </div>
              </FadeSection>

              {/* Row 2 — Left: Culinary Artistry (Image card, 5 cols) */}
              <FadeSection delay={0.2} className="lg:col-span-5 flex flex-col">
                {/* Eyebrow above card */}
                <span
                  className="text-center text-[10px] font-medium text-on-surface/40 uppercase tracking-widest mb-2"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Amenities
                </span>
                <div className="relative overflow-hidden rounded-md w-full flex-1 min-h-[380px] flex flex-col justify-end p-6 md:p-8 group shadow-xs">
                  <img
                    src="/assets/images/dining/canopy-table.jpg"
                    alt="Culinary Artistry"
                    className="img-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/90 via-deep-wood/40 to-transparent" />

                  <div className="relative z-10 text-white">
                    <div className="flex items-center gap-2 mb-3 text-secondary">
                      <UtensilsCrossed size={18} strokeWidth={1.5} />
                      <h3
                        className="text-2xl font-bold text-white"
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontStyle: "italic",
                        }}
                      >
                        Culinary Artistry
                      </h3>
                    </div>
                    <p
                      className="text-xs md:text-sm text-white/80 leading-relaxed max-w-md"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Guided by Michelin-starred techniques, our oceanfront
                      pavilion offers an ever-evolving tasting menu that
                      celebrates local bounty and international flair.
                    </p>
                  </div>
                </div>
              </FadeSection>

              {/* Row 2 — Right: Zen Pavilion (Split text + image card, 7 cols) */}
              <FadeSection
                delay={0.25}
                className="lg:col-span-7 flex flex-col justify-end"
              >
                <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-md overflow-hidden grid grid-cols-1 md:grid-cols-12 w-full p-6 md:p-8 items-center gap-6 shadow-xs">
                  <div className="md:col-span-7 flex flex-col justify-center">
                    <h3
                      className="text-2xl lg:text-3xl font-bold mb-4 text-on-surface"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                      }}
                    >
                      Zen Pavilion
                    </h3>

                    <p
                      className="text-sm text-on-surface/70 leading-relaxed mb-6"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Begin your day with intention in our open-air pavilion.
                      Surrounded by the gentle rustle of palms, our guided yoga
                      and meditation sessions harmonize body and environment.
                    </p>

                    <Link
                      to="/contact"
                      className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary-container transition-colors"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      VIEW SCHEDULE &rarr;
                    </Link>
                  </div>

                  <div className="md:col-span-5 relative min-h-[260px] md:min-h-[300px] rounded-sm overflow-hidden">
                    <img
                      src="/assets/images/experiences/ayurvedic-ritual.jpg"
                      alt="Zen Pavilion"
                      className="img-cover"
                    />
                  </div>
                </div>
              </FadeSection>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
