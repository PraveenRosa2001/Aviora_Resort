import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * HorizontalScrollGallery — Swiper-powered horizontal scroll section
 * @param {Array} items - array of data objects to render
 * @param {Function} renderCard - render prop: (item, index) => JSX
 * @param {string} id - unique id (required for multiple galleries per page)
 * @param {boolean} freeMode - enable free-scroll mode (default false)
 * @param {number} slidesPerView - number of visible slides (default 'auto')
 */
export default function HorizontalScrollGallery({
  items = [],
  renderCard,
  id = 'gallery',
  freeMode = false,
  slidesPerView = 'auto',
  spaceBetween = 24,
  className = '',
}) {
  const swiperRef = useRef(null);

  return (
    <div className={`relative w-full ${className}`} id={id}>
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, A11y, FreeMode]}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        freeMode={freeMode}
        navigation={{
          nextEl: `#${id}-next`,
          prevEl: `#${id}-prev`,
        }}
        pagination={{
          el: `#${id}-pagination`,
          clickable: true,
        }}
        a11y={{
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
        }}
        breakpoints={
          slidesPerView === 'auto'
            ? undefined
            : {
                320:  { slidesPerView: 1.15 },
                640:  { slidesPerView: 2.1  },
                1024: { slidesPerView: 3.1  },
                1280: { slidesPerView: slidesPerView },
              }
        }
        className="!overflow-visible px-[var(--section-padding-x)]"
        style={{ paddingLeft: 'var(--section-padding-x)', paddingRight: 'var(--section-padding-x)' }}
      >
        {items.map((item, index) => (
          <SwiperSlide
            key={item.id ?? index}
            style={slidesPerView === 'auto' ? { width: 'auto' } : undefined}
          >
            {renderCard(item, index)}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom navigation */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          id={`${id}-prev`}
          aria-label="Previous"
          className={[
            'w-10 h-10 rounded-full border border-accent-gold/40 flex items-center justify-center',
            'text-accent-gold hover:bg-accent-gold hover:text-bg-dark',
            'transition-all duration-300 disabled:opacity-30',
          ].join(' ')}
        >
          ←
        </button>
        <div id={`${id}-pagination`} className="flex gap-2 items-center" />
        <button
          id={`${id}-next`}
          aria-label="Next"
          className={[
            'w-10 h-10 rounded-full border border-accent-gold/40 flex items-center justify-center',
            'text-accent-gold hover:bg-accent-gold hover:text-bg-dark',
            'transition-all duration-300 disabled:opacity-30',
          ].join(' ')}
        >
          →
        </button>
      </div>
    </div>
  );
}
