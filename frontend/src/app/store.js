import { configureStore } from '@reduxjs/toolkit';
import uiReducer from '../features/ui/uiSlice';
import bookingReducer from '../features/booking/bookingSlice';
import roomsReducer from '../features/rooms/roomsSlice';
import galleryReducer from '../features/gallery/gallerySlice';
import authReducer from '../features/auth/authSlice';
import { roomsApi } from '../features/rooms/roomsApi';

export const store = configureStore({
  reducer: {
    ui:      uiReducer,
    booking: bookingReducer,
    rooms:   roomsReducer,
    gallery: galleryReducer,
    auth:    authReducer,
    [roomsApi.reducerPath]: roomsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(roomsApi.middleware),
});

export default store;

