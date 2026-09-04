import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isDayMode:        true,           // Day (true) / Night (false) hero toggle
  isMobileMenuOpen: false,          // Mobile full-screen overlay
  activeModal:      null,           // e.g. 'booking' | 'gallery' | 'room-detail'
  isNavSolid:       false,          // Navbar scroll-state (transparent → solid)
  isBookingBarOpen: true,           // StickyBookingBar collapsed state
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDayMode:       (state) => { state.isDayMode = !state.isDayMode; },
    setDayMode:          (state, action) => { state.isDayMode = action.payload; },
    setMobileMenuOpen:   (state, action) => { state.isMobileMenuOpen = action.payload; },
    toggleMobileMenu:    (state) => { state.isMobileMenuOpen = !state.isMobileMenuOpen; },
    openModal:           (state, action) => { state.activeModal = action.payload; },
    closeModal:          (state) => { state.activeModal = null; },
    setNavSolid:         (state, action) => { state.isNavSolid = action.payload; },
    setBookingBarOpen:   (state, action) => { state.isBookingBarOpen = action.payload; },
    toggleBookingBar:    (state) => { state.isBookingBarOpen = !state.isBookingBarOpen; },
  },
});

export const {
  toggleDayMode,
  setDayMode,
  setMobileMenuOpen,
  toggleMobileMenu,
  openModal,
  closeModal,
  setNavSolid,
  setBookingBarOpen,
  toggleBookingBar,
} = uiSlice.actions;

// Selectors
export const selectIsDayMode       = (state) => state.ui.isDayMode;
export const selectIsMobileMenuOpen = (state) => state.ui.isMobileMenuOpen;
export const selectActiveModal      = (state) => state.ui.activeModal;
export const selectIsNavSolid       = (state) => state.ui.isNavSolid;
export const selectIsBookingBarOpen = (state) => state.ui.isBookingBarOpen;

export default uiSlice.reducer;
