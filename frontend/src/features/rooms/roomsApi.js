import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import env from "../../config/env";

/**
 * Villas, guest reviews, and administrator villa management.
 *
 * The admin mutations below are a convenience for the console UI only. They are
 * not what stops a guest editing villas - that is [Authorize(Roles = "admin")]
 * on AdminVillasController. Calling them without an admin token returns 403.
 */
export const roomsApi = createApi({
  reducerPath: "roomsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      // Do NOT set Content-Type here - the browser needs to supply the
      // multipart boundary itself.
      return headers;
    },
    // prepareHeaders: (headers) => {
    //   try {
    //     const saved = localStorage.getItem("aviora_auth_session");
    //     if (saved) {
    //       const { token } = JSON.parse(saved);
    //       if (token) headers.set("Authorization", `Bearer ${token}`);
    //     }
    //   } catch (e) {
    //     // corrupt session entry - send unauthenticated
    //   }
    //   return headers;
    // },
  }),
  tagTypes: [
    "Villa",
    "AdminVilla",
    "Review",
    "RatePlan",
    "Addon",
    "Promo",
    "Booking",
    "Inventory",
    "Kpi",
  ],
  endpoints: (builder) => ({
    /* ================= public catalogue ================= */

    // getVillas: builder.query({
    //   query: (filters = {}) => {
    //     const params = new URLSearchParams();

    //     const add = (key, value) => {
    //       if (value === undefined || value === null) return;
    //       if (value === "" || value === "all") return;
    //       params.append(key, value);
    //     };

    //     add("category", filters.category);
    //     add("view", filters.view);
    //     add("minPrice", filters.minPrice);
    //     add("maxPrice", filters.maxPrice);
    //     add("adults", filters.adults);
    //     add("children", filters.children);
    //     add("sortBy", filters.sortBy);
    //     if (filters.featured === true) params.append("featured", "true");

    //     const qs = params.toString();
    //     return `/villas${qs ? `?${qs}` : ""}`;
    //   },
    //   providesTags: ["Villa"],
    // }),
    getVillas: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();

        const add = (key, value) => {
          if (value === undefined || value === null) return;
          if (value === "" || value === "all") return;
          params.append(key, value);
        };

        add("category", filters.category);
        add("view", filters.view);
        add("minPrice", filters.minPrice);
        add("maxPrice", filters.maxPrice);
        add("adults", filters.adults);
        add("children", filters.children);
        add("sortBy", filters.sortBy);

        // Availability is now date-specific. Without these the API returns an
        // indicative figure - the roomiest night in the next 90 days - rather
        // than what is actually free for this stay.
        add("checkIn", filters.checkIn);
        add("checkOut", filters.checkOut);

        if (filters.featured === true) params.append("featured", "true");
        if (filters.onlyAvailable === true)
          params.append("onlyAvailable", "true");

        const qs = params.toString();
        return `/villas${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Villa"],
    }),

    getVillaById: builder.query({
      query: (villaCode) => `/villas/${villaCode}`,
      providesTags: (_r, _e, id) => [{ type: "Villa", id }],
    }),

    getVillaCategories: builder.query({
      query: () => "/villas/categories",
      providesTags: ["Villa"],
    }),

    getAmenities: builder.query({
      query: () => "/villas/amenities",
    }),

    /* ================= guest reviews ================= */

    /** GET /api/villas/{code}/reviews - anonymous */
    getVillaReviews: builder.query({
      query: (villaCode) => `/villas/${villaCode}/reviews`,
      providesTags: (_r, _e, villaCode) => [{ type: "Review", id: villaCode }],
    }),

    /**
     * POST /api/villas/{code}/reviews - signed-in guests only.
     * guestName is NOT sent: the server takes the display name from the JWT,
     * so one account cannot post under someone else's name.
     *
     * Invalidates Villa too, because a new review changes the villa's average
     * rating and review count on the card.
     */
    createVillaReview: builder.mutation({
      query: ({ villaCode, rating, headline, comment, guestOrigin }) => ({
        url: `/villas/${villaCode}/reviews`,
        method: "POST",
        body: { rating, headline, comment, guestOrigin },
      }),
      invalidatesTags: (_r, _e, { villaCode }) => [
        { type: "Review", id: villaCode },
        "Villa",
      ],
    }),

    /** POST /api/villas/{code}/reviews/{reviewCode}/helpful */
    markReviewHelpful: builder.mutation({
      query: ({ villaCode, reviewCode }) => ({
        url: `/villas/${villaCode}/reviews/${reviewCode}/helpful`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { villaCode }) => [
        { type: "Review", id: villaCode },
      ],
    }),

    /** DELETE - moderation, admin only */
    deleteReview: builder.mutation({
      query: ({ villaCode, reviewCode }) => ({
        url: `/villas/${villaCode}/reviews/${reviewCode}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { villaCode }) => [
        { type: "Review", id: villaCode },
        "Villa",
      ],
    }),

    /* ================= administrator ================= */

    /** GET /api/admin/villas - includes retired villas */
    getAdminVillas: builder.query({
      query: (includeInactive = true) =>
        `/admin/villas?includeInactive=${includeInactive}`,
      providesTags: ["AdminVilla"],
    }),

    createVilla: builder.mutation({
      query: (villa) => ({ url: "/admin/villas", method: "POST", body: villa }),
      invalidatesTags: ["AdminVilla", "Villa", "Inventory", "Kpi"],
    }),

    updateVilla: builder.mutation({
      query: ({ villaCode, ...villa }) => ({
        url: `/admin/villas/${villaCode}`,
        method: "PUT",
        body: villa,
      }),
      invalidatesTags: ["AdminVilla", "Villa", "Inventory", "Kpi"],
    }),

    /** Soft by default. force=true removes the row permanently. */
    deleteVilla: builder.mutation({
      query: ({ villaCode, force = false }) => ({
        url: `/admin/villas/${villaCode}?force=${force}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminVilla", "Villa", "Inventory", "Kpi"],
    }),

    restoreVilla: builder.mutation({
      query: (villaCode) => ({
        url: `/admin/villas/${villaCode}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["AdminVilla", "Villa", "Inventory", "Kpi"],
    }),

    /* ================= pricing reference data ================= */

    /**
     * GET /api/rate-plans
     * Definitions only. pricePerNight is null here - a plan has no price of
     * its own, only a modifier. The priced copies arrive inside each villa
     * from getVillas, because the figure depends on that villa's base rate.
     */
    getRatePlans: builder.query({
      query: () => "/rate-plans",
      providesTags: ["RatePlan"],
    }),

    /** GET /api/addons */
    getAddons: builder.query({
      query: () => "/addons",
      providesTags: ["Addon"],
    }),

    /**
     * GET /api/taxes
     * Service charge 10%, TDL 1%, SSCL 2.5%, VAT 18%, applied as a cascade -
     * multiplier 1.3437545. Replaces the flat 7% the checkout assumed.
     */
    getTaxBreakdown: builder.query({
      query: () => "/taxes",
    }),

    /**
     * POST /api/promocodes/validate
     * Always 200. An unknown or expired code comes back as
     * { valid: false, message } - that is a normal answer, not an error.
     */
    validatePromoCode: builder.mutation({
      query: ({ code, nights = 1 }) => ({
        url: "/promocodes/validate",
        method: "POST",
        body: { code, nights },
      }),
    }),

    /* ================= administrator: pricing ================= */

    getAdminRatePlans: builder.query({
      query: () => "/admin/rate-plans",
      providesTags: ["RatePlan"],
    }),

    saveRatePlan: builder.mutation({
      query: ({ ratePlanCode, ...plan }) =>
        ratePlanCode
          ? {
              url: `/admin/rate-plans/${ratePlanCode}`,
              method: "PUT",
              body: plan,
            }
          : { url: "/admin/rate-plans", method: "POST", body: plan },
      // Changing a modifier moves every villa's price, so the villa lists have
      // to refetch as well.
      invalidatesTags: ["RatePlan", "Villa", "AdminVilla"],
    }),

    deleteRatePlan: builder.mutation({
      query: (ratePlanCode) => ({
        url: `/admin/rate-plans/${ratePlanCode}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RatePlan", "Villa", "AdminVilla"],
    }),

    /** PUT /api/admin/villas/{code}/rate-plans - which plans this villa sells */
    saveVillaRatePlans: builder.mutation({
      query: ({ villaCode, plans }) => ({
        url: `/admin/villas/${villaCode}/rate-plans`,
        method: "PUT",
        body: { plans },
      }),
      invalidatesTags: ["Villa", "AdminVilla", "Inventory"],
    }),

    getAdminAddons: builder.query({
      query: () => "/admin/addons",
      providesTags: ["Addon"],
    }),

    saveAddon: builder.mutation({
      query: ({ addonCode, ...addon }) =>
        addonCode
          ? { url: `/admin/addons/${addonCode}`, method: "PUT", body: addon }
          : { url: "/admin/addons", method: "POST", body: addon },
      invalidatesTags: ["Addon"],
    }),

    deleteAddon: builder.mutation({
      query: (addonCode) => ({
        url: `/admin/addons/${addonCode}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Addon"],
    }),

    getPromoCodes: builder.query({
      query: () => "/admin/promocodes",
      providesTags: ["Promo"],
    }),

    savePromoCode: builder.mutation({
      query: (promo) => ({
        url: "/admin/promocodes",
        method: "POST",
        body: promo,
      }),
      invalidatesTags: ["Promo"],
    }),

    deletePromoCode: builder.mutation({
      query: (code) => ({ url: `/admin/promocodes/${code}`, method: "DELETE" }),
      invalidatesTags: ["Promo"],
    }),

    /* ================= reservations ================= */

    /**
     * POST /api/bookings/quote
     *
     * The server prices the stay. This replaces the arithmetic in
     * BookingCheckoutModal.jsx, which computed roomSubtotal, discountAmount,
     * taxesAndFees and finalTotal in the browser where anyone could edit them.
     *
     * Always 200 when the villa exists - `priced: false` with a `reason` of
     * Unavailable / OccupancyExceeded / RatePlanNotOffered is a normal answer.
     */
    getBookingQuote: builder.mutation({
      query: (payload) => ({
        url: "/bookings/quote",
        method: "POST",
        body: payload,
      }),
    }),

    /**
     * POST /api/bookings
     * Carries no money fields. The server re-prices from the inputs.
     * Invalidates Villa and Inventory because the stay consumes nights.
     */
    createBooking: builder.mutation({
      query: (payload) => ({ url: "/bookings", method: "POST", body: payload }),
      invalidatesTags: ["Booking", "Villa", "Inventory"],
    }),

    getMyBookings: builder.query({
      query: (includeCancelled = true) =>
        `/bookings/my?includeCancelled=${includeCancelled}`,
      providesTags: ["Booking"],
    }),

    getBookingByReference: builder.query({
      query: (referenceId) => `/bookings/${referenceId}`,
      providesTags: (_r, _e, id) => [{ type: "Booking", id }],
    }),

    /** Releases the nights back to the calendar, so villas refetch too. */
    cancelBooking: builder.mutation({
      query: ({ referenceId, reason }) => ({
        url: `/bookings/${referenceId}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Booking", "Villa", "Inventory"],
    }),

    /* ================= administrator: reservations ================= */

    getAdminBookings: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        const add = (k, v) => {
          if (v === undefined || v === null || v === "" || v === "all") return;
          params.append(k, v);
        };
        add("search", filters.search);
        add("status", filters.status);
        add("from", filters.from);
        add("to", filters.to);
        add("page", filters.page ?? 1);
        add("pageSize", filters.pageSize ?? 25);
        return `/admin/bookings?${params.toString()}`;
      },
      providesTags: ["Booking"],
    }),

    getAdminBooking: builder.query({
      query: (referenceId) => `/admin/bookings/${referenceId}`,
      providesTags: (_r, _e, id) => [{ type: "Booking", id }],
    }),

    setBookingStatus: builder.mutation({
      query: ({ referenceId, status, remarks }) => ({
        url: `/admin/bookings/${referenceId}/status`,
        method: "PUT",
        body: { status, remarks },
      }),
      // Cancelling from the desk releases inventory, so the grid and the guest
      // catalogue both go stale.
      invalidatesTags: ["Booking", "Kpi", "Villa", "Inventory"],
    }),

    getDashboardKpis: builder.query({
      query: () => "/admin/bookings/dashboard/kpis",
      providesTags: ["Kpi"],
    }),

    /* ================= availability ================= */

    /**
     * GET /api/villas/{code}/availability
     * Always 200 when the villa exists. `available: false` with a `reason`
     * of SoldOut / Blocked / MinNights / OutsideHorizon is a normal answer.
     */
    checkAvailability: builder.query({
      query: ({ villaCode, checkIn, checkOut, units = 1 }) =>
        `/villas/${villaCode}/availability?checkIn=${checkIn}&checkOut=${checkOut}&units=${units}`,
      providesTags: (_r, _e, { villaCode }) => [
        { type: "Inventory", id: villaCode },
      ],
    }),

    /**
     * GET /api/villas/{code}/calendar
     * Night-by-night: units left, blocks, minimum stay, and the price for
     * that night including any seasonal override.
     */
    getVillaCalendar: builder.query({
      query: ({ villaCode, from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        const qs = params.toString();
        return `/villas/${villaCode}/calendar${qs ? `?${qs}` : ""}`;
      },
      providesTags: (_r, _e, { villaCode }) => [
        { type: "Inventory", id: villaCode },
      ],
    }),

    /* ================= administrator: inventory ================= */

    getInventoryGrid: builder.query({
      query: ({ from, to }) => {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        const qs = params.toString();
        return `/admin/inventory${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Inventory"],
    }),

    setInventoryRange: builder.mutation({
      query: ({ villaCode, ...range }) => ({
        url: `/admin/inventory/${villaCode}`,
        method: "PUT",
        body: range,
      }),
      // Closing dates or changing units changes what guests see, so the villa
      // lists must refetch too.
      invalidatesTags: ["Inventory", "Villa", "AdminVilla", "Kpi"],
    }),

    extendInventoryHorizon: builder.mutation({
      query: (horizonDays = 540) => ({
        url: `/admin/inventory/extend?horizonDays=${horizonDays}`,
        method: "POST",
      }),
      invalidatesTags: ["Inventory", "Villa", "AdminVilla", "Kpi"],
    }),
    /* ================= dining ================= */

    /**
     * GET /api/dining/venues
     * Venues with their gallery, sourcing notes and menu. Replaces
     * src/services/mockData/diningVenues.json.
     */
    getDiningVenues: builder.query({
      query: (type) =>
        type && type !== "all"
          ? `/dining/venues?type=${type}`
          : "/dining/venues",
      providesTags: ["DiningVenue"],
    }),

    getDiningVenue: builder.query({
      query: (slug) => `/dining/venues/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "DiningVenue", id: slug }],
    }),

    /**
     * GET /api/dining/venues/{slug}/availability
     * Advisory only. usp_Dining_CreateReservation re-counts the covers under
     * a range lock, so this being stale cannot cause an oversell.
     */
    checkDiningAvailability: builder.query({
      query: ({ slug, date, time, partySize }) =>
        `/dining/venues/${slug}/availability?date=${date}&time=${time}&partySize=${partySize}`,
      providesTags: ["Dining"],
    }),

    createDiningReservation: builder.mutation({
      query: (payload) => ({
        url: "/dining/reservations",
        method: "POST",
        body: payload,
      }),
      // The booking consumes covers, so any availability check is now stale.
      invalidatesTags: ["Dining"],
    }),

    getMyDiningReservations: builder.query({
      query: () => "/dining/reservations/my",
      providesTags: ["Dining"],
    }),

    cancelDiningReservation: builder.mutation({
      query: (referenceId) => ({
        url: `/dining/reservations/${referenceId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Dining"],
    }),

    /* ================= administrator: dining ================= */

    getAdminDiningVenues: builder.query({
      query: () => "/admin/dining/venues",
      providesTags: ["DiningVenue"],
    }),

    saveDiningVenue: builder.mutation({
      query: ({ slug, ...venue }) =>
        slug
          ? { url: `/admin/dining/venues/${slug}`, method: "PUT", body: venue }
          : { url: "/admin/dining/venues", method: "POST", body: venue },
      // A capacity change moves what the guest page can book.
      invalidatesTags: ["DiningVenue", "Dining"],
    }),

    deleteDiningVenue: builder.mutation({
      query: (slug) => ({
        url: `/admin/dining/venues/${slug}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DiningVenue", "Dining"],
    }),

    getAdminDiningReservations: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        const add = (k, v) => {
          if (v === undefined || v === null || v === "" || v === "all") return;
          params.append(k, v);
        };
        add("venue", filters.venue);
        add("from", filters.from);
        add("to", filters.to);
        add("status", filters.status);
        add("search", filters.search);
        const qs = params.toString();
        return `/admin/dining/reservations${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Dining"],
    }),

    setDiningReservationStatus: builder.mutation({
      query: ({ referenceId, status }) => ({
        url: `/admin/dining/reservations/${referenceId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Dining"],
    }),
    saveDiningMenu: builder.mutation({
      query: ({ slug, sections }) => ({
        url: `/admin/dining/venues/${slug}/menu`,
        method: "PUT",
        body: { sections },
      }),
      invalidatesTags: ["DiningVenue"],
    }),

    /* ================= gallery ================= */

    /**
     * GET /api/gallery?homeOnly=true
     * The home page bento grid. Anonymous - every write is on
     * AdminGalleryController behind [Authorize(Roles = "admin")].
     */
    getGalleryImages: builder.query({
      query: ({ homeOnly = true, category } = {}) => {
        const params = new URLSearchParams();
        params.append("homeOnly", homeOnly);
        if (category && category !== "all") params.append("category", category);
        return `/gallery?${params.toString()}`;
      },
      providesTags: ["Gallery"],
    }),

    /* ---------- administrator ---------- */

    getAdminGallery: builder.query({
      query: () => "/admin/gallery",
      providesTags: ["Gallery"],
    }),

    /**
     * POST /api/admin/gallery/upload
     *
     * The body is a FormData, so no Content-Type is set here - the browser
     * has to add its own multipart boundary. Forcing "application/json" on
     * this call is the usual reason an upload arrives empty at the server.
     */
    uploadGalleryImage: builder.mutation({
      query: (formData) => ({
        url: "/admin/gallery/upload",
        method: "POST",
        body: formData,
      }),
    }),

    saveGalleryImage: builder.mutation({
      query: (image) => ({
        url: "/admin/gallery",
        method: "POST",
        body: image,
      }),
      invalidatesTags: ["Gallery"],
    }),

    deleteGalleryImage: builder.mutation({
      query: (id) => ({ url: `/admin/gallery/${id}`, method: "DELETE" }),
      invalidatesTags: ["Gallery"],
    }),

    reorderGallery: builder.mutation({
      query: ({ orderedIds }) => ({
        url: "/admin/gallery/order",
        method: "PUT",
        body: { orderedIds },
      }),
      invalidatesTags: ["Gallery"],
    }),
    /* ================= media uploads ================= */

    /**
     * POST /api/admin/media/upload?folder=villas
     *
     * Storage only - nothing is written to the database. The caller decides
     * what points at the returned path, so a failed save leaves an orphaned
     * file rather than a row pointing at nothing.
     *
     * The body is a FormData, so no Content-Type is set here: the browser has
     * to supply its own multipart boundary. Forcing "application/json" on this
     * call is the usual reason an upload arrives empty at the server.
     */
    uploadMedia: builder.mutation({
      query: ({ formData, folder = "villas" }) => ({
        url: `/admin/media/upload?folder=${folder}`,
        method: "POST",
        body: formData,
      }),
    }),

    /** DELETE /api/admin/media — removes an uploaded file, not an /assets path. */
    deleteMedia: builder.mutation({
      query: (url) => ({
        url: "/admin/media",
        method: "DELETE",
        body: { url },
      }),
    }),
  }),
});

export const {
  useGetVillasQuery,
  useGetVillaByIdQuery,
  useGetVillaCategoriesQuery,
  useGetAmenitiesQuery,

  useGetVillaReviewsQuery,
  useCreateVillaReviewMutation,
  useMarkReviewHelpfulMutation,
  useDeleteReviewMutation,

  useGetRatePlansQuery,
  useGetAddonsQuery,
  useGetTaxBreakdownQuery,
  useValidatePromoCodeMutation,

  useGetAdminRatePlansQuery,
  useSaveRatePlanMutation,
  useDeleteRatePlanMutation,
  useSaveVillaRatePlansMutation,

  useGetAdminAddonsQuery,
  useSaveAddonMutation,
  useDeleteAddonMutation,

  useGetPromoCodesQuery,
  useSavePromoCodeMutation,
  useDeletePromoCodeMutation,

  useGetAdminVillasQuery,
  useCreateVillaMutation,
  useUpdateVillaMutation,
  useDeleteVillaMutation,
  useRestoreVillaMutation,

  useCheckAvailabilityQuery,
  useLazyCheckAvailabilityQuery,
  useGetVillaCalendarQuery,

  useGetInventoryGridQuery,
  useSetInventoryRangeMutation,
  useExtendInventoryHorizonMutation,

  useGetBookingQuoteMutation,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useGetBookingByReferenceQuery,
  useCancelBookingMutation,

  useGetAdminBookingsQuery,
  useGetAdminBookingQuery,
  useSetBookingStatusMutation,
  useGetDashboardKpisQuery,

  useGetDiningVenuesQuery,
  useGetDiningVenueQuery,
  useCheckDiningAvailabilityQuery,
  useCreateDiningReservationMutation,
  useGetMyDiningReservationsQuery,
  useCancelDiningReservationMutation,

  useGetAdminDiningVenuesQuery,
  useSaveDiningVenueMutation,
  useDeleteDiningVenueMutation,
  useGetAdminDiningReservationsQuery,
  useSetDiningReservationStatusMutation,

  useGetGalleryImagesQuery,
  useGetAdminGalleryQuery,
  useUploadGalleryImageMutation,
  useSaveGalleryImageMutation,
  useDeleteGalleryImageMutation,
  useReorderGalleryMutation,

  useSaveDiningMenuMutation,

  useUploadMediaMutation,
  useDeleteMediaMutation,
} = roomsApi;
