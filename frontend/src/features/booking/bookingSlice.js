import { createSlice } from '@reduxjs/toolkit';

/* --------------------------------------------------------------------------
   Booking selection state.

   This slice holds what the guest is CHOOSING - dates, villa, rate plan,
   add-ons, the guest form, which step they are on. It no longer holds any
   result.

   Two things moved to the server in module 5:

     Prices.  roomSubtotal, discountAmount, taxesAndFees and finalTotal were
              computed here and in BookingCheckoutModal, which meant anyone
              could edit them in DevTools before submitting. They now come
              from POST /api/bookings/quote, and POST /api/bookings re-prices
              from scratch rather than trusting what the client sends.

     Reservations.  myBookings lived in localStorage, so a guest who cleared
              storage lost their reservations and the same account on a phone
              saw none. They are rows in dbo.Bookings now, read through
              useGetMyBookingsQuery.
   -------------------------------------------------------------------------- */

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const next3Days = new Date(today);
next3Days.setDate(next3Days.getDate() + 4);

const formatDate = (date) => date.toISOString().split('T')[0];

const initialState = {
  checkIn: formatDate(tomorrow),
  checkOut: formatDate(next3Days),
  adults: 2,
  children: 0,

  selectedVillaId: 'canopy-villa-01',
  selectedRatePlan: 'standard', // 'standard' | 'saver' | 'allinclusive'
  selectedAddons: [],           // add-on codes, e.g. ['transfer', 'spa']

  /**
   * The code the guest typed, nothing more.
   *
   * promoDiscount used to live here and was set from a hard-coded list of
   * codes. The server decides the percentage now - usp_PromoCode_Validate
   * also checks the date range, the usage limit and the minimum stay, none of
   * which the browser could know. The quote reports the outcome.
   */
  promoCode: '',

  step: 1, // 1: Select & Rate, 2: Guest Info & Extras, 3: Payment, 4: Confirmation
  isCheckoutOpen: false,
  isMyBookingsOpen: false,

  guestInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Sri Lanka',
    bedPreference: '1 King Bed',
    specialRequests: '',
    flightTime: '',
  },

  /**
   * Card number, expiry and CVC are deliberately absent.
   *
   * They stay in component state on the payment form and never reach Redux.
   * A PAN sitting in a store that Redux DevTools can read would put this
   * project in PCI-DSS scope. CreateBookingRequestDto accepts only the
   * cardholder name and the last four digits.
   */
  paymentInfo: {
    paymentMethod: 'card', // 'card' | 'resort'
    cardHolder: '',
  },

  /** The BookingDto the API returned, not an object assembled in the browser. */
  activeBooking: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCheckIn: (state, action) => { state.checkIn = action.payload; },
    setCheckOut: (state, action) => { state.checkOut = action.payload; },
    setAdults: (state, action) => { state.adults = Math.max(1, action.payload); },
    setChildren: (state, action) => { state.children = Math.max(0, action.payload); },
    incrementAdults: (state) => { state.adults = Math.min(10, state.adults + 1); },
    decrementAdults: (state) => { state.adults = Math.max(1, state.adults - 1); },
    incrementChildren: (state) => { state.children = Math.min(6, state.children + 1); },
    decrementChildren: (state) => { state.children = Math.max(0, state.children - 1); },

    setSelectedVillaId: (state, action) => { state.selectedVillaId = action.payload; },
    setSelectedRatePlan: (state, action) => { state.selectedRatePlan = action.payload; },

    toggleAddon: (state, action) => {
      const addonId = action.payload;
      if (state.selectedAddons.includes(addonId)) {
        state.selectedAddons = state.selectedAddons.filter((id) => id !== addonId);
      } else {
        state.selectedAddons.push(addonId);
      }
    },

    /**
     * Records the typed code. Whether it is valid, and for how much, is
     * decided by the quote - the browser has no way to know whether a code
     * has expired or hit its usage limit.
     */
    applyPromoCode: (state, action) => {
      state.promoCode = (action.payload || '').trim().toUpperCase();
    },

    clearPromoCode: (state) => { state.promoCode = ''; },

    setGuestInfoField: (state, action) => {
      const { field, value } = action.payload;
      state.guestInfo[field] = value;
    },

    setPaymentInfoField: (state, action) => {
      const { field, value } = action.payload;
      state.paymentInfo[field] = value;
    },

    setStep: (state, action) => { state.step = action.payload; },
    nextStep: (state) => { state.step = Math.min(4, state.step + 1); },
    prevStep: (state) => { state.step = Math.max(1, state.step - 1); },

    openCheckout: (state, action) => {
      if (action.payload) state.selectedVillaId = action.payload;
      state.isCheckoutOpen = true;
      state.step = 1;
    },
    closeCheckout: (state) => { state.isCheckoutOpen = false; },

    openMyBookings: (state) => { state.isMyBookingsOpen = true; },
    closeMyBookings: (state) => { state.isMyBookingsOpen = false; },

    /**
     * Stores the reservation the API created and moves to the confirmation
     * step. It no longer pushes onto a local list - useGetMyBookingsQuery is
     * invalidated by the mutation and refetches from the database.
     */
    completeBooking: (state, action) => {
      const booking = action.payload;
      if (booking) {
        const guest = booking.guest || booking.guestInfo || {};
        state.activeBooking = {
          ...booking,
          guest,
          guestInfo: guest,
          addons: booking.addons || booking.selectedAddons || [],
          selectedAddons: booking.selectedAddons || booking.addons || [],
        };
      } else {
        state.activeBooking = null;
      }
      state.step = 4;
    },

    resetBooking: (state) => {
      state.step = 1;
      state.selectedAddons = [];
      state.promoCode = '';
      state.activeBooking = null;
      state.paymentInfo = {
        paymentMethod: 'card',
        cardHolder: '',
      };
      if (state.guestInfo) {
        state.guestInfo.specialRequests = '';
        state.guestInfo.flightTime = '';
      }
    },
  },
});

export const {
  setCheckIn, setCheckOut,
  setAdults, setChildren,
  incrementAdults, decrementAdults,
  incrementChildren, decrementChildren,
  setSelectedVillaId, setSelectedRatePlan,
  toggleAddon, applyPromoCode, clearPromoCode,
  setGuestInfoField, setPaymentInfoField,
  setStep, nextStep, prevStep,
  openCheckout, closeCheckout,
  openMyBookings, closeMyBookings,
  completeBooking, resetBooking,
} = bookingSlice.actions;

/* -------------------------------- selectors ------------------------------- */

export const selectCheckIn = (state) => state.booking.checkIn;
export const selectCheckOut = (state) => state.booking.checkOut;
export const selectAdults = (state) => state.booking.adults;
export const selectChildren = (state) => state.booking.children;
export const selectTotalGuests = (state) => state.booking.adults + state.booking.children;
export const selectSelectedVillaId = (state) => state.booking.selectedVillaId;
export const selectSelectedRatePlan = (state) => state.booking.selectedRatePlan;
export const selectSelectedAddons = (state) => state.booking.selectedAddons;
export const selectPromoCode = (state) => state.booking.promoCode;
export const selectBookingStep = (state) => state.booking.step;
export const selectIsCheckoutOpen = (state) => state.booking.isCheckoutOpen;
export const selectIsMyBookingsOpen = (state) => state.booking.isMyBookingsOpen;
export const selectGuestInfo = (state) => state.booking.guestInfo;
export const selectPaymentInfo = (state) => state.booking.paymentInfo;
export const selectActiveBooking = (state) => state.booking.activeBooking;

export default bookingSlice.reducer;