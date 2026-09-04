/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── New Design System ── */
        'primary':           '#883700',
        'on-primary':        '#ffffff',
        'primary-container': '#aa4c12',
        'secondary':         '#735c00',
        'secondary-container': '#fed65b',
        'tertiary':          '#335656',
        'tertiary-container':'#4b6e6e',
        'surface':           '#f9f9f8',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#f3f4f3',
        'surface-container':        '#eeeeed',
        'surface-container-high':   '#e8e8e7',
        'surface-container-highest':'#e2e2e2',
        'on-surface':        '#1a1c1c',
        'deep-wood':         '#1B1815',
        'lush-canopy':       '#668D87',
        'warm-sand':         '#F2E8CF',
        'outline':           '#897268',
        'outline-variant':   '#ddc1b5',

        /* ── Legacy / backward-compat ── */
        'bg-primary':        '#f9f9f8',
        'text-primary':      '#1B1815',
        'accent-gold':       '#D4AF37',
        'bg-dark':           '#1B1815',
        'highlight-green':   '#668D87',
        'resort-white':      '#FFFFFF',
        'sand':              '#F2E8CF',
        'gold-light':        '#E8C84A',
        'gold-dark':         '#A88A1C',
        'canopy':            '#1A3A2A',
        'ivory':             '#F9F5EE',
      },
      fontFamily: {
        display:  ['Playfair Display', 'serif'],
        heading:  ['Playfair Display', 'serif'],
        body:     ['Hanken Grotesk', 'Montserrat', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 6vw + 1rem, 7rem)', { lineHeight: '1.1' }],
        'display-lg': ['clamp(2.5rem, 5vw + 1rem, 6rem)', { lineHeight: '1.15' }],
        'section':    ['clamp(1.8rem, 3vw + 1rem, 3.2rem)', { lineHeight: '1.25' }],
        'eyebrow':    ['0.8rem', { lineHeight: '1.5', letterSpacing: '0.2em' }],
      },
      spacing: {
        'section-y': 'clamp(4rem, 8vw, 10rem)',
        'section-x': 'clamp(1.5rem, 5vw, 4rem)',
        'section-gap': '120px',
        'gutter': '24px',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #E8C84A 50%, #A88A1C 100%)',
        'dark-gradient': 'linear-gradient(180deg, #1B1815 0%, #0f0d0a 100%)',
        'hero-overlay':  'linear-gradient(to bottom, rgba(27,24,21,0.35) 0%, rgba(27,24,21,0.1) 40%, rgba(27,24,21,0.65) 100%)',
        'terracotta-gradient': 'linear-gradient(135deg, #883700 0%, #aa4c12 100%)',
      },
      animation: {
        'fade-in':       'fadeIn 0.6s ease-out forwards',
        'slide-up':      'slideUp 0.6s ease-out forwards',
        'slide-right':   'slideRight 0.5s ease-out forwards',
        'ken-burns':     'kenBurns 20s ease-in-out infinite alternate',
        'shimmer':       'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        kenBurns: {
          '0%':   { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.08) translate(-1%, -1%)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      boxShadow: {
        'gold': '0 0 0 1px rgba(212, 175, 55, 0.3), 0 4px 24px rgba(212, 175, 55, 0.15)',
        'dark': '0 8px 40px rgba(0, 0, 0, 0.35)',
        'card': '0 2px 16px rgba(27, 24, 21, 0.08)',
        'card-hover': '0 8px 40px rgba(27, 24, 21, 0.15)',
      },
      aspectRatio: {
        'villa':    '4/3',
        'portrait': '3/4',
        'cinema':   '21/9',
      },
    },
  },
  plugins: [],
}
