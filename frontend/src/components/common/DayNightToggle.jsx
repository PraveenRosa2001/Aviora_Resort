import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { toggleDayMode, selectIsDayMode } from '../../features/ui/uiSlice';

export default function DayNightToggle({ size = 'md', className = '' }) {
  const dispatch  = useDispatch();
  const isDayMode = useSelector(selectIsDayMode);

  const sizes = {
    sm: { icon: 16, pill: 'px-3 py-1.5 gap-2', text: 'text-xs' },
    md: { icon: 18, pill: 'px-4 py-2 gap-3', text: 'text-xs' },
    lg: { icon: 20, pill: 'px-5 py-3 gap-3', text: 'text-sm' },
  };

  const s = sizes[size];

  return (
    <button
      id="day-night-toggle"
      aria-label={isDayMode ? 'Switch to night view' : 'Switch to day view'}
      aria-pressed={!isDayMode}
      onClick={() => dispatch(toggleDayMode())}
      className={[
        'relative inline-flex items-center border border-resort-white/40',
        'backdrop-blur-sm bg-resort-white/10 hover:border-accent-gold/70',
        'transition-all duration-400 focus-visible:ring-2 focus-visible:ring-accent-gold',
        s.pill,
        className,
      ].join(' ')}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDayMode ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sand flex-shrink-0"
          >
            <Sun size={s.icon} strokeWidth={1.5} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-accent-gold flex-shrink-0"
          >
            <Moon size={s.icon} strokeWidth={1.5} />
          </motion.span>
        )}
      </AnimatePresence>

      <span
        className={`${s.text} eyebrow-label text-resort-white/80 whitespace-nowrap tracking-widest`}
      >
        {isDayMode ? 'Day View' : 'Night View'}
      </span>
    </button>
  );
}
