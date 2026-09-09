import { motion } from 'framer-motion';
import { MapPin, Plane, Clock, Star } from 'lucide-react';
import SectionDivider from '../components/common/SectionDivider';
import Button from '../components/common/Button';
import PageSketchBackground from '../components/common/PageSketchBackground';

function FadeSection({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const facts = [
  { icon: Star,  label: 'Biodiversity', value: '439', unit: 'bird species' },
  { icon: MapPin, label: 'Elevation', value: '300–500', unit: 'metres above sea level' },
  { icon: Clock, label: 'Rainfall', value: '5,000', unit: 'mm per year' },
  { icon: Plane, label: 'Nearest Airport', value: '3h 20m', unit: 'from Bandaranaike International' },
];

const gettingHereOptions = [
  {
    method: 'By Air',
    icon: Plane,
    detail: 'Fly into Bandaranaike International Airport (CMB), Colombo. We arrange a private chauffeured transfer in a Mercedes V-Class. Journey time: approximately 3 hours 20 minutes through the hill country — itself part of the experience.',
  },
  {
    method: 'Private Helicopter',
    icon: Star,
    detail: 'Helicopter transfers from Colombo or Galle (45 minutes) can be arranged. The resort has a designated landing zone 800m from the main pavilion, with private electric buggy to the villa.',
  },
];

export default function AboutDestination() {
  return (
    <>
      {/* Header */}
      <section
        id="destination-header"
        className="relative pt-40 pb-28 text-center overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-dark)' }}
        aria-label="About the destination"
      >
        <div className="absolute inset-0 opacity-10" aria-hidden="true"
          style={{ backgroundImage: 'radial-gradient(ellipse at 50% 70%, #22C55E 0%, transparent 55%)' }} />
        <FadeSection className="relative container-resort">
          <p className="eyebrow-label text-accent-gold mb-4">The Destination</p>
          <h1 className="text-sand mb-6">The Last Great Forest of Sri Lanka</h1>
          <p className="text-sand/60 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
            Aviora sits at the edge of the Sinharaja Man and Biosphere Reserve — a UNESCO World Heritage site and one of the last remaining areas of tropical lowland rainforest in South Asia.
          </p>
        </FadeSection>
      </section>

      {/* Facts row */}
      <section
        id="destination-facts"
        className="py-16"
        style={{ backgroundColor: 'var(--color-sand)' }}
        aria-label="Destination key facts"
      >
        <div className="container-resort grid grid-cols-2 lg:grid-cols-4 gap-8">
          {facts.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeSection key={f.label} delay={i * 0.1} className="text-center">
                <Icon size={22} className="text-accent-gold mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-heading text-3xl text-text-primary">{f.value}</p>
                <p className="eyebrow-label text-text-primary/40 mt-1">{f.unit}</p>
                <p className="eyebrow-label text-accent-gold mt-2 text-[10px]">{f.label}</p>
              </FadeSection>
            );
          })}
        </div>
      </section>

      {/* ── BELOW-HEADER CONTENT WITH RESPONSIVE SKETCH BACKGROUND ── */}
      <div className="relative w-full overflow-hidden bg-[#F4F1EA] pb-24">
        <PageSketchBackground subtitle="Sinharaja UNESCO Heritage Folio" />
        <div className="relative z-10 pt-8">

        {/* Narrative blocks */}
        <section
          id="destination-story"
          className="section-padding relative bg-transparent"
          aria-label="Destination story"
        >
          <div className="container-resort grid grid-cols-1 lg:grid-cols-2 gap-20 items-start relative" style={{ zIndex: 1 }}>
          <FadeSection>
            <p className="eyebrow-label text-accent-gold mb-4">The Region</p>
            <h2 className="font-heading text-text-primary mb-6">An Ecological Cathedral</h2>
            <div className="space-y-4 text-text-secondary leading-relaxed text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              <p>Sinharaja is not a park in the conventional sense. There are no fences, no tourist roads, no visitor centres. It is a living, breathing ecosystem — home to 26 endemic bird species, six endemic mammal species, and hundreds of plant species found nowhere else on earth.</p>
              <p>The forest operates on its own rhythm: the density of the canopy changes hourly as clouds drift through. Streams appear after rain and vanish into the substrate. The sounds shift from insect chorus to bird calls to the near-silence of deep afternoon.</p>
              <p>Aviora was placed here — not to tame this wildness — but to offer a threshold from which to experience it without diminishing it.</p>
            </div>
          </FadeSection>
          <FadeSection delay={0.15}>
            <p className="eyebrow-label text-accent-gold mb-4">The Wildlife Heritage</p>
            <h2 className="font-heading text-text-primary mb-6">The Families Who Came First</h2>
            <div className="space-y-4 text-text-secondary leading-relaxed text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              <p>The Asian elephant (Elephas maximus maximus) is the defining symbol of Sri Lanka's ecological identity. Three family groups use Aviora's land as seasonal movement corridors — the same families that used this land a century before the resort existed.</p>
              <p>The purple-faced langur, the fishing cat, the Sri Lanka leopard: these are not occasional sightings at Aviora. They are neighbours, encountered on morning walks, glimpsed at dusk from the Canopy Table, present in the soundscape of every night.</p>
              <p>The resort's founding naturalist, Dr. Chaminda Rathnayake, has spent 22 years documenting this ecosystem. Every Aviora guest benefits from this knowledge — if they choose to go looking.</p>
            </div>
          </FadeSection>
        </div>
      </section>

      <SectionDivider motif="elephant" />

      {/* Map embed placeholder */}
      <section
        id="destination-map"
        className="section-padding"
        style={{ backgroundColor: 'var(--color-sand)' }}
        aria-label="Resort location map"
      >
        <FadeSection className="container-resort mb-12 text-center">
          <p className="eyebrow-label text-accent-gold mb-4">Location</p>
          <h2 className="font-heading text-text-primary">Finding Aviora</h2>
        </FadeSection>

        {/* Map placeholder — Phase 2: replace with Google Maps or Mapbox embed */}
        <div className="container-resort">
          <div
            className="w-full h-64 md:h-96 border border-border-subtle flex items-center justify-center"
            style={{ backgroundColor: 'rgba(11,61,46,0.05)' }}
            aria-label="Map showing Aviora Resort location in Southern Sri Lanka"
          >
            <div className="text-center">
              <MapPin size={32} className="text-accent-gold mx-auto mb-3" strokeWidth={1} />
              <p className="eyebrow-label text-text-primary/40">Interactive map — Phase 2</p>
              <p className="text-text-secondary text-sm mt-2" style={{ fontFamily: 'var(--font-body)' }}>
                Sinharaja Forest Reserve Road, Southern Province, Sri Lanka
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting here */}
      <section
        id="destination-getting-here"
        className="section-padding relative bg-transparent"
        aria-label="How to get to Aviora Resort"
      >
        <FadeSection className="container-resort mb-12 text-center">
          <p className="eyebrow-label text-accent-gold mb-4">Getting Here</p>
          <h2 className="font-heading text-text-primary">The Journey Is Already Part of It</h2>
        </FadeSection>
        <div className="container-resort grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {gettingHereOptions.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <FadeSection key={opt.method} delay={i * 0.1}>
                <div className="p-8 border border-border-subtle">
                  <Icon size={24} className="text-accent-gold mb-4" strokeWidth={1.5} />
                  <h3 className="font-heading text-text-primary mb-3">{opt.method}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                    {opt.detail}
                  </p>
                </div>
              </FadeSection>
            );
          })}
        </div>
        <FadeSection className="text-center mt-12">
          <Button href="/contact" variant="primary" size="lg" id="destination-transfer-cta">
            Arrange Your Transfer
          </Button>
        </FadeSection>
        </section>
        </div>
      </div>
    </>
  );
}
