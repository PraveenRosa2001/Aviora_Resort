import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Trash2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Lock,
  Clock,
  CheckCircle2,
  Users,
  Ban,
} from 'lucide-react';
import {
  selectIsMyBookingsOpen,
  closeMyBookings,
  openCheckout,
} from './bookingSlice';
import {
  useGetMyBookingsQuery,
  useCancelBookingMutation,
} from '../rooms/roomsApi';
import { useToast } from '../../components/common/Toast';

/* --------------------------------------------------------------------------
   Reservations now come from GET /api/bookings/my rather than localStorage.

   The old version read a per-browser list, which meant a guest who cleared
   their storage lost every reservation, and the same account opened on a
   phone showed none. These are rows in dbo.Bookings.
   -------------------------------------------------------------------------- */

const STATUS_STYLES = {
  Confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Checked-In': 'bg-blue-100 text-blue-800 border-blue-200',
  'Checked-Out': 'bg-surface-container-high text-deep-wood/70 border-outline-variant/40',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
  'No-Show': 'bg-amber-100 text-amber-900 border-amber-200',
};

const formatMoney = (value) => `Rs.${Number(value ?? 0).toLocaleString()}`;

const formatDeadline = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function MyBookingsModal() {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const isOpen = useSelector(selectIsMyBookingsOpen);

  const {
    data: bookings = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMyBookingsQuery(true, { skip: !isOpen });

  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

  const [confirmTarget, setConfirmTarget] = useState(null);

  if (!isOpen) return null;

  const handleCancel = async (booking) => {
    try {
      const res = await cancelBooking({ referenceId: booking.referenceId }).unwrap();
      showSuccess(res?.message || 'Reservation cancelled.', {
        title: 'Reservation Cancelled',
      });
      setConfirmTarget(null);
    } catch (err) {
      // 409 covers a non-refundable rate and a passed deadline. The message
      // says which, so it is worth showing verbatim rather than replacing
      // with a generic failure.
      showError(
        err?.data?.message || 'The reservation could not be cancelled.',
        { title: 'Cancellation Refused' },
      );
      setConfirmTarget(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-surface rounded-xl shadow-2xl overflow-hidden border-2 border-primary flex flex-col max-h-[85vh]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-deep-wood text-sand flex items-center justify-between border-b border-primary/30 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-secondary" />
              <h2
                className="text-lg font-bold italic tracking-wide text-sand"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                My Reservations{!isLoading && ` (${bookings.length})`}
              </h2>
              {isFetching && !isLoading && (
                <Loader2 size={14} className="animate-spin text-sand/60" />
              )}
            </div>
            <button
              onClick={() => dispatch(closeMyBookings())}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {isLoading && (
              <div className="text-center py-12">
                <Loader2 size={30} className="mx-auto animate-spin text-primary/50 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider text-deep-wood/50">
                  Loading your reservations
                </p>
              </div>
            )}

            {isError && !isLoading && (
              <div className="text-center py-12">
                <AlertTriangle size={40} className="mx-auto text-amber-500 mb-3" />
                <h3 className="text-base font-bold text-deep-wood">
                  Your reservations could not be loaded.
                </h3>
                <p className="text-xs text-deep-wood/70 font-medium mt-1 mb-5">
                  {error?.data?.message ||
                    'The reservation system did not respond. Please try again.'}
                </p>
                <button
                  onClick={refetch}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !isError && bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-primary/40 mb-3" />
                <h3 className="text-base font-bold text-deep-wood">
                  No Reservations Found
                </h3>
                <p className="text-xs text-deep-wood/70 font-medium mt-1 mb-6">
                  You haven&apos;t reserved any villas yet. Explore our sanctuaries to
                  book your stay.
                </p>
                <button
                  onClick={() => {
                    dispatch(closeMyBookings());
                    dispatch(openCheckout('canopy-villa-01'));
                  }}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Book A Villa Now
                </button>
              </div>
            )}

            {!isLoading &&
              !isError &&
              bookings.map((b) => (
                <div
                  key={b.referenceId}
                  className={[
                    'p-5 bg-surface-container-lowest border-2 rounded-lg shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-start transition-all',
                    b.status === 'Cancelled'
                      ? 'border-outline-variant/30 opacity-65'
                      : 'border-primary/30',
                  ].join(' ')}
                >
                  <div className="flex gap-4 items-start">
                    <img
                      src={b.villaImage}
                      alt={b.villaName}
                      className="w-24 h-20 object-cover rounded-md flex-shrink-0"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-primary">
                          Ref: {b.referenceId}
                        </span>
                        <span
                          className={[
                            'px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider',
                            STATUS_STYLES[b.status] ??
                              'bg-surface-container-high text-deep-wood/70 border-outline-variant/40',
                          ].join(' ')}
                        >
                          {b.status}
                        </span>
                      </div>

                      <h4
                        className="text-base font-bold text-deep-wood italic"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {b.villaName}
                      </h4>

                      <p className="text-xs text-deep-wood/80 font-medium mt-1 flex items-center gap-1.5">
                        <Calendar size={12} className="text-primary" />
                        {b.checkIn} &rarr; {b.checkOut} ({b.nights} night
                        {b.nights === 1 ? '' : 's'})
                      </p>

                      <p className="text-[11px] text-deep-wood/60 font-semibold mt-0.5 flex items-center gap-1.5">
                        <Users size={11} />
                        {b.adults} adult{b.adults === 1 ? '' : 's'}
                        {b.children > 0 &&
                          `, ${b.children} child${b.children === 1 ? '' : 'ren'}`}
                        {' · '}
                        {b.ratePlanName}
                        {b.addonCount > 0 &&
                          ` · ${b.addonCount} extra${b.addonCount === 1 ? '' : 's'}`}
                      </p>

                      {/* The deadline was fixed onto the booking when it was
                          made, so editing the rate plan later does not change
                          what this guest agreed to. */}
                      {b.status === 'Confirmed' && b.isRefundable && b.cancellationDeadline && (
                        <p className="text-[11px] text-deep-wood/55 font-medium mt-1 flex items-center gap-1.5">
                          <Clock size={11} />
                          Free cancellation until {formatDeadline(b.cancellationDeadline)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-primary/20">
                    <div className="text-right">
                      <span className="text-xs text-deep-wood/60 font-semibold block">
                        Total paid
                      </span>
                      <span
                        className="text-xl font-bold text-primary"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {formatMoney(b.finalTotal)}
                      </span>
                      <span className="text-[10px] text-deep-wood/50 block">
                        incl. taxes &amp; service charge
                      </span>
                    </div>

                    {/* canCancel is computed in SQL from the status, the
                        refundability and the deadline stored on the booking.
                        Re-deriving it here from the current rate plan would
                        give the wrong answer once a plan is edited. */}
                    <div className="mt-2 text-right">
                      {b.canCancel ? (
                        <button
                          onClick={() => setConfirmTarget(b)}
                          disabled={cancelling}
                          className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 size={13} /> Cancel Reservation
                        </button>
                      ) : b.status === 'Cancelled' ? (
                        <span className="text-[11px] text-deep-wood/50 font-semibold flex items-center gap-1 justify-end">
                          <Ban size={12} /> Cancelled
                        </span>
                      ) : b.status === 'Checked-Out' ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle2 size={12} /> Stay completed
                        </span>
                      ) : (
                        <span
                          className="text-[11px] text-deep-wood/50 font-semibold flex items-center gap-1 justify-end text-right"
                          title={
                            b.isRefundable
                              ? 'The free cancellation window has passed'
                              : 'This rate was booked as non-refundable'
                          }
                        >
                          <Lock size={12} />
                          {b.isRefundable
                            ? 'Cancellation window passed'
                            : 'Non-refundable rate'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Cancellation confirmation */}
        <AnimatePresence>
          {confirmTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-primary overflow-hidden"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <div className="px-6 py-5 bg-deep-wood text-sand flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <AlertTriangle size={20} />
                  </div>
                  <h3
                    className="text-lg font-bold italic"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Cancel {confirmTarget.referenceId}?
                  </h3>
                </div>

                <div className="p-6 text-xs text-deep-wood/75 leading-relaxed space-y-2">
                  <p>
                    <strong className="text-deep-wood">{confirmTarget.villaName}</strong>,{' '}
                    {confirmTarget.checkIn} to {confirmTarget.checkOut}.
                  </p>
                  <p>
                    The villa is released back to the calendar immediately and{' '}
                    {formatMoney(confirmTarget.finalTotal)} is refunded to the original
                    payment method. This cannot be undone.
                  </p>
                </div>

                <div className="px-6 py-4 bg-surface-container-low border-t border-primary/20 flex gap-2.5">
                  <button
                    onClick={() => setConfirmTarget(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Keep Reservation
                  </button>
                  <button
                    onClick={() => handleCancel(confirmTarget)}
                    disabled={cancelling}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Cancel It
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
