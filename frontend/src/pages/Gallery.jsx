import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { openLightbox, closeLightbox, nextLightboxImage, prevLightboxImage,
         selectLightboxOpen, selectLightboxImageId, selectLightboxItems } from '../features/gallery/gallerySlice';
import PageSketchBackground from '../components/common/PageSketchBackground';

// Gallery items — Phase 2: fetched from /api/gallery
const galleryItems = [
  { id: 'g01', type: 'image', src: '/assets/images/gallery/gallery-01.jpg', alt: 'Canopy villa at golden hour with infinity pool reflecting sunset light', category: 'villas', aspect: 'landscape' },
  { id: 'g02', type: 'image', src: '/assets/images/gallery/gallery-02.jpg', alt: 'Aerial view of Aviora Resort nestled in the tropical forest canopy', category: 'resort', aspect: 'portrait' },
  { id: 'g03', type: 'image', src: '/assets/images/gallery/gallery-03.jpg', alt: 'Elephant family at dawn in the wildlife corridor', category: 'wildlife', aspect: 'landscape' },
  { id: 'g04', type: 'image', src: '/assets/images/gallery/gallery-04.jpg', alt: 'The Canopy Table restaurant at dusk with warm candlelight', category: 'dining', aspect: 'portrait' },
  { id: 'g05', type: 'image', src: '/assets/images/gallery/gallery-05.jpg', alt: 'Ayurvedic treatment in the forest pavilion spa', category: 'wellness', aspect: 'landscape' },
  { id: 'g06', type: 'image', src: '/assets/images/gallery/gallery-06.jpg', alt: 'Lagoon Water Suite over-water deck at twilight', category: 'villas', aspect: 'landscape' },
  { id: 'g07', type: 'image', src: '/assets/images/gallery/gallery-07.jpg', alt: 'Private jungle waterfall trek with Aviora naturalist guide', category: 'experiences', aspect: 'portrait' },
  { id: 'g08', type: 'image', src: '/assets/images/gallery/gallery-08.jpg', alt: 'Sunset catamaran on the Indian Ocean from Aviora private beach', category: 'experiences', aspect: 'landscape' },
  { id: 'g09', type: 'image', src: '/assets/images/gallery/gallery-09.jpg', alt: 'Morning mist over the Aviora resort infinity pool and forest', category: 'resort', aspect: 'portrait' },
  { id: 'g10', type: 'image', src: '/assets/images/gallery/gallery-10.jpg', alt: 'Sky Villa Penthouse rooftop plunge pool at night', category: 'villas', aspect: 'landscape' },
];

const CATEGORY_FILTERS = ['all', 'villas', 'dining', 'wellness', 'wildlife', 'experiences', 'resort'];

function LightboxModal() {
  const dispatch    = useDispatch();
  const isOpen      = useSelector(selectLightboxOpen);
  const currentId   = useSelector(selectLightboxImageId);
  const items       = useSelector(selectLightboxItems);
  const currentItem = items.find(i => i.id === currentId);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape')      dispatch(closeLightbox());
      if (e.key === 'ArrowRight')  dispatch(nextLightboxImage());
      if (e.key === 'ArrowLeft')   dispatch(prevLightboxImage());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, dispatch]);

  return (
    <AnimatePresence>
      {isOpen && currentItem && (
        <motion.div
          className="fixed inset-0 z-[300] bg-text-primary/95 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(closeLightbox())}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close */}
          <button
            id="lightbox-close"
            aria-label="Close lightbox"
            onClick={() => dispatch(closeLightbox())}
            className="absolute top-6 right-6 text-sand/60 hover:text-sand transition-colors duration-300 p-2"
          >
            <X size={28} strokeWidth={1} />
          </button>

          {/* Prev */}
          <button
            id="lightbox-prev"
            aria-label="Previous image"
            onClick={(e) => { e.stopPropagation(); dispatch(prevLightboxImage()); }}
            className="absolute left-6 text-sand/60 hover:text-accent-gold transition-colors duration-300 p-2"
          >
            <ChevronLeft size={36} strokeWidth={1} />
          </button>

          {/* Image */}
          <motion.img
            key={currentItem.id}
            src={currentItem.src}
            alt={currentItem.alt}
            className="max-h-[85vh] max-w-[85vw] object-contain"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          <button
            id="lightbox-next"
            aria-label="Next image"
            onClick={(e) => { e.stopPropagation(); dispatch(nextLightboxImage()); }}
            className="absolute right-6 text-sand/60 hover:text-accent-gold transition-colors duration-300 p-2"
          >
            <ChevronRight size={36} strokeWidth={1} />
          </button>

          {/* Caption */}
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 eyebrow-label text-sand/40 text-center max-w-md px-4">
            {currentItem.alt}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Gallery() {
  const dispatch   = useDispatch();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? galleryItems
    : galleryItems.filter(i => i.category === filter);

  const handleOpen = (item) => {
    dispatch(openLightbox({ id: item.id, items: filtered }));
  };

  return (
    <>
      {/* Header */}
      <section
        id="gallery-header"
        className="pt-40 pb-20 text-center"
        style={{ backgroundColor: 'var(--color-bg-dark)' }}
        aria-label="Gallery page header"
      >
        <motion.p className="eyebrow-label text-accent-gold mb-4"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          Gallery
        </motion.p>
        <motion.h1 className="text-sand"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
          The Aviora World
        </motion.h1>
      </section>

      {/* Filters */}
      <div
        className="sticky top-[72px] z-30 border-b border-primary/20 bg-[#F4F1EA]/95 backdrop-blur-md"
      >
        <div className="container-resort py-4 flex flex-wrap gap-3" role="tablist" aria-label="Filter gallery by category">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              id={`gallery-filter-${cat}`}
              role="tab"
              aria-selected={filter === cat}
              onClick={() => setFilter(cat)}
              className={[
                'eyebrow-label px-4 py-2 border capitalize transition-all duration-300',
                filter === cat
                  ? 'bg-accent-gold text-bg-dark border-accent-gold'
                  : 'border-border-subtle text-text-primary/60 hover:border-accent-gold hover:text-accent-gold',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      <section
        id="gallery-grid"
        className="section-padding relative overflow-hidden bg-transparent"
        aria-label="Photo gallery grid"
      >
        {/* ── Decorative Background Sketch ── */}
        <PageSketchBackground subtitle="The Estate in Frames · Photo Collection" />
        <div className="container-resort relative" style={{ zIndex: 1 }}>
          <motion.div
            layout
            className="columns-1 sm:columns-2 lg:columns-3 gap-4"
          >
            <AnimatePresence>
              {filtered.map((item, i) => (
                <motion.figure
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  className="relative group break-inside-avoid mb-4 cursor-pointer overflow-hidden"
                  onClick={() => handleOpen(item)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View: ${item.alt}`}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleOpen(item); }}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-resort-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play size={20} className="text-resort-white" fill="currentColor" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-text-primary/0 group-hover:bg-text-primary/30 transition-colors duration-400" />
                  <span className="absolute bottom-4 left-4 eyebrow-label text-resort-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.category}
                  </span>
                  <figcaption className="sr-only">{item.alt}</figcaption>
                </motion.figure>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <LightboxModal />
    </>
  );
}
