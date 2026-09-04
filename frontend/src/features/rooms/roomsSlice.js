import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  filters: {
    villaType:  'all',    // 'all' | 'canopy' | 'lagoon' | 'treetop' | 'beachfront'
    view:       'all',    // 'all' | 'forest' | 'ocean' | 'pool' | 'garden'
    occupancy:  0,        // 0 = any, otherwise minimum guests
    priceRange: [0, 5000],
  },
  selectedRoomId: null,   // currently viewed villa id (for detail panel)
  sortBy: 'featured',     // 'featured' | 'price-asc' | 'price-desc' | 'size'
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setVillaTypeFilter: (state, action) => { state.filters.villaType = action.payload; },
    setViewFilter:      (state, action) => { state.filters.view = action.payload; },
    setOccupancyFilter: (state, action) => { state.filters.occupancy = action.payload; },
    setPriceRange:      (state, action) => { state.filters.priceRange = action.payload; },
    resetFilters:       (state) => { state.filters = initialState.filters; },
    setSelectedRoom:    (state, action) => { state.selectedRoomId = action.payload; },
    clearSelectedRoom:  (state) => { state.selectedRoomId = null; },
    setSortBy:          (state, action) => { state.sortBy = action.payload; },
  },
});

export const {
  setVillaTypeFilter,
  setViewFilter,
  setOccupancyFilter,
  setPriceRange,
  resetFilters,
  setSelectedRoom,
  clearSelectedRoom,
  setSortBy,
} = roomsSlice.actions;

// Selectors
export const selectFilters       = (state) => state.rooms.filters;
export const selectSelectedRoomId = (state) => state.rooms.selectedRoomId;
export const selectSortBy        = (state) => state.rooms.sortBy;

export default roomsSlice.reducer;
