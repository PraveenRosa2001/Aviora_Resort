import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Users, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import {
  selectCheckIn, selectCheckOut, selectAdults, selectChildren,
  setCheckIn, setCheckOut,
  incrementAdults, decrementAdults,
  incrementChildren, decrementChildren,
} from '../../features/booking/bookingSlice';
import {
  selectIsBookingBarOpen,
  toggleBookingBar,
} from '../../features/ui/uiSlice';

export default function StickyBookingBar() {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const isOpen        = useSelector(selectIsBookingBarOpen);
  const checkIn       = useSelector(selectCheckIn);
  const checkOut      = useSelector(selectCheckOut);
  const adults        = useSelector(selectAdults);
  const children      = useSelector(selectChildren);

  const handleSearch = () => {
    navigate('/booking');
  };

  return (
    <div
      id="sticky-booking-bar"
      className="w-full bg-bg-primary border-b border-border-subtle shadow-card"
      role="search"
      aria-label="Villa availability search"
    >
      {/* Bar toggle */}
      <div className="container-resort flex items-center justify-between py-3">
        <p className="eyebrow-label text-text-primary/60 flex items-center gap-2">
          <Sparkles size={14} className="text-secondary" /> Instant Villa Availability Search
        </p>
        <button
          id="booking-bar-toggle"
          aria-label={isOpen ? 'Collapse booking bar' : 'Expand booking bar'}
          aria-expanded={isOpen}
          onClick={() => dispatch(toggleBookingBar())}
          className="text-text-primary/60 hover:text-accent-gold transition-colors duration-300 p-1"
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="container-resort pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                {/* Check-in */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="booking-checkin"
                    className="eyebrow-label text-text-primary/60 flex items-center gap-1.5"
                  >
                    <CalendarDays size={13} /> Check-in
                  </label>
                  <input
                    id="booking-checkin"
                    type="date"
                    value={checkIn}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => dispatch(setCheckIn(e.target.value))}
                    className={[
                      'px-4 py-2.5 border border-border-subtle bg-bg-primary',
                      'text-text-primary font-body text-sm rounded-xs',
                      'focus:border-accent-gold focus:outline-none transition-colors duration-300',
                    ].join(' ')}
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                </div>

                {/* Check-out */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="booking-checkout"
                    className="eyebrow-label text-text-primary/60 flex items-center gap-1.5"
                  >
                    <CalendarDays size={13} /> Check-out
                  </label>
                  <input
                    id="booking-checkout"
                    type="date"
                    value={checkOut}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    onChange={(e) => dispatch(setCheckOut(e.target.value))}
                    className={[
                      'px-4 py-2.5 border border-border-subtle bg-bg-primary',
                      'text-text-primary text-sm rounded-xs',
                      'focus:border-accent-gold focus:outline-none transition-colors duration-300',
                    ].join(' ')}
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                </div>

                {/* Guests */}
                <div className="flex flex-col gap-1.5">
                  <span className="eyebrow-label text-text-primary/60 flex items-center gap-1.5">
                    <Users size={13} /> Guests
                  </span>
                  <div className="flex gap-3">
                    {/* Adults */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border border-border-subtle flex-1 rounded-xs">
                      <button
                        id="booking-adults-decrement"
                        aria-label="Decrease adults"
                        onClick={() => dispatch(decrementAdults())}
                        className="text-text-primary/60 hover:text-accent-gold w-5 h-5 flex items-center justify-center transition-colors"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm text-text-primary" style={{ fontFamily: 'var(--font-body)' }}>
                        {adults} <span className="text-text-primary/40 text-xs">adult{adults !== 1 ? 's' : ''}</span>
                      </span>
                      <button
                        id="booking-adults-increment"
                        aria-label="Increase adults"
                        onClick={() => dispatch(incrementAdults())}
                        className="text-text-primary/60 hover:text-accent-gold w-5 h-5 flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {/* Children */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border border-border-subtle flex-1 rounded-xs">
                      <button
                        id="booking-children-decrement"
                        aria-label="Decrease children"
                        onClick={() => dispatch(decrementChildren())}
                        className="text-text-primary/60 hover:text-accent-gold w-5 h-5 flex items-center justify-center transition-colors"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm text-text-primary" style={{ fontFamily: 'var(--font-body)' }}>
                        {children} <span className="text-text-primary/40 text-xs">child{children !== 1 ? 'ren' : ''}</span>
                      </span>
                      <button
                        id="booking-children-increment"
                        aria-label="Increase children"
                        onClick={() => dispatch(incrementChildren())}
                        className="text-text-primary/60 hover:text-accent-gold w-5 h-5 flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleSearch}
                  id="booking-bar-cta"
                  className={[
                    'flex items-center justify-center px-6 py-2.5',
                    'bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer',
                    'hover:bg-primary-container transition-colors duration-300 shadow-xs',
                  ].join(' ')}
                >
                  Check Availability & Book
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
