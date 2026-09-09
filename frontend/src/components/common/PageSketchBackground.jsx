import { useSelector } from 'react-redux';
import { selectIsDayMode } from '../../features/ui/uiSlice';

/**
 * PageSketchBackground
 * 
 * High-end, responsive architectural sketch background canvas.
 * - Full-width edge-to-edge across all screens (mobile, tablet, desktop, 4K)
 * - Zero dragging / squishing (uses aspect-preserved plates with cross-fading feathered masks)
 * - Moves naturally with scrolling
 * - Atmospheric ambient tropical lighting (champagne-gold & rainforest-canopy glows)
 * - Architectural folio drafting annotations (coordinates & edition metadata)
 * - Seamless Day / Night mode adaptation (multiply linework vs luminous blueprint)
 */
export default function PageSketchBackground({
  subtitle = 'Master Architectural Folio',
  coordinates = '6°02′N 80°13′E · Tropical Sanctuary Series',
  showAccents = true,
  opacityDay = 0.22,
  opacityNight = 0.12,
  variant = 'dual-plate', // 'dual-plate' | 'single-plate'
}) {
  const isDayMode = useSelector(selectIsDayMode);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        backgroundColor: isDayMode ? '#F4F1EA' : '#141210',
      }}
    >
      {/* 1. Atmospheric Ambient Lighting & Paper Texture */}
      <div
        className="absolute inset-0"
        style={{
          background: isDayMode
            ? 'radial-gradient(ellipse 85% 45% at 85% 15%, rgba(212, 175, 55, 0.08) 0%, transparent 70%), radial-gradient(ellipse 75% 45% at 15% 50%, rgba(102, 141, 135, 0.08) 0%, transparent 70%), radial-gradient(ellipse 85% 45% at 85% 85%, rgba(212, 175, 55, 0.06) 0%, transparent 70%), linear-gradient(180deg, rgba(244, 241, 234, 0.95) 0%, rgba(244, 241, 234, 0.85) 25%, rgba(246, 244, 239, 0.85) 75%, rgba(244, 241, 234, 0.95) 100%)'
            : 'radial-gradient(ellipse 85% 45% at 85% 15%, rgba(212, 175, 55, 0.04) 0%, transparent 70%), radial-gradient(ellipse 75% 45% at 15% 50%, rgba(102, 141, 135, 0.05) 0%, transparent 70%), linear-gradient(180deg, #141210 0%, #1a1714 50%, #141210 100%)',
        }}
      />

      {/* 2. Upper Architectural Folio Plate */}
      <div
        className={`absolute top-0 left-0 w-full ${variant === 'dual-plate' ? 'h-[55%]' : 'h-full'} pointer-events-none`}
        style={{
          backgroundImage: "url('/assets/images/loading-sketch.png')",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top center',
          backgroundSize: 'cover',
          filter: isDayMode
            ? 'contrast(1.06) brightness(0.97)'
            : 'invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(1.2)',
          opacity: isDayMode ? opacityDay : opacityNight,
          mixBlendMode: isDayMode ? 'multiply' : 'screen',
          maskImage: variant === 'dual-plate'
            ? 'linear-gradient(to bottom, black 55%, rgba(0,0,0,0.6) 75%, transparent 100%)'
            : 'linear-gradient(to bottom, black 70%, transparent 100%)',
          WebkitMaskImage: variant === 'dual-plate'
            ? 'linear-gradient(to bottom, black 55%, rgba(0,0,0,0.6) 75%, transparent 100%)'
            : 'linear-gradient(to bottom, black 70%, transparent 100%)',
        }}
      />

      {/* 3. Lower Architectural Folio Plate (for tall multi-section pages) */}
      {variant === 'dual-plate' && (
        <div
          className="absolute bottom-0 left-0 w-full h-[55%] pointer-events-none"
          style={{
            backgroundImage: "url('/assets/images/loading-sketch.png')",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom center',
            backgroundSize: 'cover',
            filter: isDayMode
              ? 'contrast(1.06) brightness(0.97)'
              : 'invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(1.2)',
            opacity: isDayMode ? opacityDay * 0.9 : opacityNight * 0.9,
            mixBlendMode: isDayMode ? 'multiply' : 'screen',
            maskImage:
              'linear-gradient(to top, black 55%, rgba(0,0,0,0.6) 75%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to top, black 55%, rgba(0,0,0,0.6) 75%, transparent 100%)',
          }}
        />
      )}

      {/* 4. Luxury Architectural Elevation & Folio Coordinates Accents
      {showAccents && (
        <>
          <div className="absolute top-8 left-8 hidden xl:flex flex-col gap-1 text-[9px] uppercase tracking-[0.25em] text-primary/30 font-semibold font-mono pointer-events-none">
            <span>Aviora Estate · {subtitle}</span>
            <span>Elevation 42m · Primary Rainforest Sanctuary</span>
          </div>

          <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden xl:flex items-center gap-3 text-[9px] uppercase tracking-[0.25em] text-secondary/35 font-semibold font-mono pointer-events-none">
            <span className="w-8 h-px bg-secondary/30" />
            <span>{coordinates}</span>
          </div>

          <div className="absolute bottom-8 left-8 hidden xl:flex items-center gap-3 text-[9px] uppercase tracking-[0.25em] text-primary/30 font-semibold font-mono pointer-events-none">
            <span className="w-8 h-px bg-primary/30" />
            <span>Hand-Drawn Architectural Masterplan · Edition 01</span>
          </div>
        </>
      )} */}
    </div>
  );
}
