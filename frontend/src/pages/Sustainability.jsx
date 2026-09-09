import { motion } from "framer-motion";
import { Droplet, Trees } from "lucide-react";
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

export default function Sustainability() {
  return (
    <div className="relative min-h-screen">
      {/* ── Hero Image Band ── */}
      <section className="relative z-10 w-full h-[60vh] min-h-[420px] flex items-center justify-center overflow-hidden mb-0 pt-20">
        <img
          src="/assets/images/villas/canopy-villa-01.jpg"
          alt="The Ethos of Aviora"
          className="img-cover absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/85 via-deep-wood/40 to-deep-wood/20" />

        <div className="relative z-10 container-resort text-center text-white max-w-3xl mx-auto px-6">
          <FadeSection>
            <h1
              className="text-4xl md:text-6xl font-bold mb-6 text-white"
              style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
            >
              The Ethos of Aviora
            </h1>
            <p
              className="text-sm md:text-base text-white/80 leading-relaxed max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Where architectural precision yields to the rhythm of the jungle.
              A sanctuary designed not to conquer nature, but to commune with it
              in absolute stillness.
            </p>
          </FadeSection>
        </div>
      </section>

      {/* ── BELOW-HERO SECTIONS WITH RESPONSIVE SKETCH BACKGROUND ── */}
      <div className="relative w-full overflow-hidden bg-[#F4F1EA] pb-24">
        <PageSketchBackground subtitle="Ethos &amp; Ecological Reserve Folio" />
        <div className="relative z-10 pt-16">
          {/* ── Our Heritage Section ── */}
          <section className="container-resort mb-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <FadeSection className="lg:col-span-6">
                <span
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 block"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Our Heritage
                </span>

                <h2
                  className="text-3xl lg:text-5xl font-bold mb-6 text-on-surface"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontStyle: "italic",
                  }}
                >
                  Rooted in Earth, Refined by Time
                </h2>

                <div
                  className="space-y-4 text-sm text-on-surface/75 leading-relaxed"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <p>
                    The vision for Aviora began not with a blueprint, but with a
                    topography map. Our founders sought to create a retreat that
                    felt entirely inevitable—as if the clean, geometric lines of
                    our pavilions had been unearthed rather than built.
                  </p>
                  <p>
                    By honoring the raw, unyielding beauty of the tropical
                    landscape, we established a design philosophy of restraint.
                    Every column, every plane of glass exists merely to frame
                    the grandeur outside, blurring the boundary between the
                    cultivated and the wild.
                  </p>
                </div>
              </FadeSection>

              {/* Right image with warm sand offset background accent */}
              <FadeSection
                delay={0.15}
                className="lg:col-span-6 flex justify-center"
              >
                <div className="relative p-3">
                  {/* Warm sand offset accent box */}
                  <div
                    className="absolute inset-0 translate-x-4 translate-y-4 rounded-md"
                    style={{
                      backgroundColor: "var(--color-warm-sand, #F2E8CF)",
                    }}
                  />
                  <div className="relative z-10 overflow-hidden rounded-md aspect-[4/5] max-w-md shadow-xs">
                    <img
                      src="/assets/images/experiences/cultural-heritage.jpg"
                      alt="Rooted in Earth"
                      className="img-cover"
                    />
                  </div>
                </div>
              </FadeSection>
            </div>
          </section>

          {/* ── Stewardship Section ── */}
          <section className="container-resort">
            <FadeSection className="text-center max-w-3xl mx-auto mb-16">
              <span
                className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 block"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Sustainability
              </span>

              <h2
                className="text-3xl lg:text-5xl font-bold mb-4 text-on-surface"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontStyle: "italic",
                }}
              >
                A Stewardship of Silence
              </h2>

              <p
                className="text-sm md:text-base text-on-surface/70 leading-relaxed max-w-xl mx-auto"
                style={{ fontFamily: "var(--font-body)" }}
              >
                True luxury leaves no trace. Our commitment to the environment
                is woven into the very fabric of our operations, ensuring the
                beauty that surrounds us remains undisturbed.
              </p>
            </FadeSection>

            {/* Feature Cards Grid (3 cards layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Card 1: Energy Harvesting (Wide Image card, 8 cols) */}
              <FadeSection delay={0.1} className="lg:col-span-8 flex">
                <div className="relative overflow-hidden rounded-md w-full min-h-[340px] flex flex-col justify-end p-6 md:p-8 group shadow-xs">
                  <img
                    src="/assets/images/experiences/jungle-trek.jpg"
                    alt="Energy Harvesting"
                    className="img-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/80 via-deep-wood/20 to-transparent" />

                  <div className="relative z-10 bg-white/75 backdrop-blur-md border border-white/50 p-6 rounded-sm max-w-md">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <Trees size={18} strokeWidth={1.5} />
                      <h3
                        className="text-xl font-bold text-on-surface"
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontStyle: "italic",
                        }}
                      >
                        Energy Harvesting
                      </h3>
                    </div>
                    <p
                      className="text-xs text-on-surface/80 leading-relaxed"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Harnessing the abundant tropical sun to power our estate,
                      reducing our reliance on external grids while maintaining
                      absolute comfort.
                    </p>
                  </div>
                </div>
              </FadeSection>

              {/* Card 2: Water Conservation (White card, 4 cols) */}
              <FadeSection delay={0.15} className="lg:col-span-4 flex">
                <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-md p-8 flex flex-col justify-center w-full shadow-xs">
                  <div className="w-10 h-10 rounded-full border border-tertiary/40 flex items-center justify-center text-tertiary mb-6">
                    <Droplet size={20} strokeWidth={1.5} />
                  </div>

                  <h3
                    className="text-2xl font-bold mb-3 text-on-surface"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                    }}
                  >
                    Water Conservation
                  </h3>

                  <p
                    className="text-sm text-on-surface/70 leading-relaxed"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Closed-loop purification systems ensure every drop is
                    respected.
                  </p>
                </div>
              </FadeSection>

              {/* Card 3: Hyper-Local Sourcing (Full bottom card, 12 cols) */}
              <FadeSection delay={0.2} className="lg:col-span-12 flex">
                <div className="relative overflow-hidden rounded-md w-full min-h-[260px] flex flex-col justify-end p-6 md:p-8 group shadow-xs">
                  <img
                    src="/assets/images/dining/canopy-table-02.jpg"
                    alt="Hyper-Local Sourcing"
                    className="img-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-wood/85 via-deep-wood/30 to-transparent" />

                  <div className="relative z-10 bg-white/75 backdrop-blur-md border border-white/50 p-6 rounded-sm max-w-md">
                    <h3
                      className="text-xl font-bold text-on-surface mb-2"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                      }}
                    >
                      Hyper-Local Sourcing
                    </h3>
                    <p
                      className="text-xs text-on-surface/80 leading-relaxed"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Our culinary team cultivates ingredients steps from The
                      Kitchen.
                    </p>
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
