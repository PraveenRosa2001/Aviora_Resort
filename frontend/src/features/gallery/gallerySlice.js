import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeIndex:    0,      // active horizontal-scroll index (per gallery instance)
  lightboxOpen:   false,
  lightboxImageId: null,  // id of the image/video currently in lightbox
  lightboxItems:  [],     // array of items loaded into lightbox context
};

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {
    setActiveIndex:     (state, action) => { state.activeIndex = action.payload; },
    openLightbox:       (state, action) => {
      state.lightboxOpen = true;
      state.lightboxImageId = action.payload.id;
      state.lightboxItems = action.payload.items ?? [];
    },
    closeLightbox:      (state) => {
      state.lightboxOpen = false;
      state.lightboxImageId = null;
      state.lightboxItems = [];
    },
    nextLightboxImage:  (state) => {
      const idx = state.lightboxItems.findIndex(i => i.id === state.lightboxImageId);
      if (idx < state.lightboxItems.length - 1) {
        state.lightboxImageId = state.lightboxItems[idx + 1].id;
      }
    },
    prevLightboxImage:  (state) => {
      const idx = state.lightboxItems.findIndex(i => i.id === state.lightboxImageId);
      if (idx > 0) {
        state.lightboxImageId = state.lightboxItems[idx - 1].id;
      }
    },
  },
});

export const {
  setActiveIndex,
  openLightbox,
  closeLightbox,
  nextLightboxImage,
  prevLightboxImage,
} = gallerySlice.actions;

export const selectActiveIndex     = (state) => state.gallery.activeIndex;
export const selectLightboxOpen    = (state) => state.gallery.lightboxOpen;
export const selectLightboxImageId = (state) => state.gallery.lightboxImageId;
export const selectLightboxItems   = (state) => state.gallery.lightboxItems;

export default gallerySlice.reducer;
