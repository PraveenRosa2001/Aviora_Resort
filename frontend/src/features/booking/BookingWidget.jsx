import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCheckIn, setCheckOut,
  setAdults, setChildren,
  setPromoCode, setSelectedVilla,
  selectCheckIn, selectCheckOut,
  selectAdults, selectChildren,
  selectPromoCode,
} from './bookingSlice';
import { openModal } from '../ui/uiSlice';
import Button from '../../components/common/Button';

export default function BookingWidget({ villas = [], onSubmit: onExternalSubmit }) {
  const dispatch  = useDispatch();
  const checkIn   = useSelector(selectCheckIn);
  const checkOut  = useSelector(selectCheckOut);
  const adults    = useSelector(selectAdults);
  const children  = useSelector(selectChildren);
  const promo     = useSelector(selectPromoCode);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { checkIn, checkOut, adults, children, promoCode: promo, villaId: '' },
  });

  const onSubmit = (data) => {
    dispatch(setCheckIn(data.checkIn));
    dispatch(setCheckOut(data.checkOut));
    dispatch(setAdults(Number(data.adults)));
    dispatch(setChildren(Number(data.children)));
    dispatch(setPromoCode(data.promoCode));
    if (data.villaId) dispatch(setSelectedVilla(data.villaId));

    // Phase 2: replace with useCreateBookingMutation hook
    if (onExternalSubmit) {
      onExternalSubmit(data);
    } else {
      console.info('[BookingWidget] Mock booking enquiry submitted:', data);
      dispatch(openModal('booking-confirmation'));
    }
  };

  const fieldClass = [
    'w-full px-4 py-3 border border-border-subtle bg-bg-primary',
    'text-text-primary text-sm focus:border-accent-gold focus:outline-none',
    'transition-colors duration-300 placeholder-text-primary/30',
  ].join(' ');

  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id="booking-widget-form"
      noValidate
      className="flex flex-col gap-5"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Check-in */}
        <div>
          <label htmlFor="widget-checkin" className="eyebrow-label text-text-primary/60 block mb-2">
            Check-in
          </label>
          <input
            id="widget-checkin"
            type="date"
            {...register('checkIn', { required: 'Please select a check-in date' })}
            min={new Date().toISOString().split('T')[0]}
            className={fieldClass}
          />
          {errors.checkIn && <p className={errorClass}>{errors.checkIn.message}</p>}
        </div>

        {/* Check-out */}
        <div>
          <label htmlFor="widget-checkout" className="eyebrow-label text-text-primary/60 block mb-2">
            Check-out
          </label>
          <input
            id="widget-checkout"
            type="date"
            {...register('checkOut', { required: 'Please select a check-out date' })}
            className={fieldClass}
          />
          {errors.checkOut && <p className={errorClass}>{errors.checkOut.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Adults */}
        <div>
          <label htmlFor="widget-adults" className="eyebrow-label text-text-primary/60 block mb-2">
            Adults
          </label>
          <input
            id="widget-adults"
            type="number"
            min={1}
            max={10}
            {...register('adults', { required: true, min: 1 })}
            className={fieldClass}
          />
        </div>
        {/* Children */}
        <div>
          <label htmlFor="widget-children" className="eyebrow-label text-text-primary/60 block mb-2">
            Children
          </label>
          <input
            id="widget-children"
            type="number"
            min={0}
            max={6}
            {...register('children')}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Villa selector */}
      {villas.length > 0 && (
        <div>
          <label htmlFor="widget-villa" className="eyebrow-label text-text-primary/60 block mb-2">
            Preferred Villa
          </label>
          <select
            id="widget-villa"
            {...register('villaId')}
            className={`${fieldClass} cursor-pointer`}
          >
            <option value="">Any availability</option>
            {villas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — from ${v.pricePerNight}/night
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Promo code */}
      <div>
        <label htmlFor="widget-promo" className="eyebrow-label text-text-primary/60 block mb-2">
          Promo Code <span className="text-text-primary/30">(optional)</span>
        </label>
        <input
          id="widget-promo"
          type="text"
          placeholder="AVIORA2026"
          {...register('promoCode')}
          className={fieldClass}
        />
      </div>

      <Button type="submit" variant="solid" size="lg" className="w-full mt-2">
        Check Availability
      </Button>
    </form>
  );
}
