import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  Calendar,
  Bed,
  CalendarDays,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  FileText,
  DollarSign,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Plane,
  Utensils,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  X,
  Phone,
  Mail,
  Home,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  selectCurrentUser,
  logout,
} from '../features/auth/authSlice';
import {
  useGetAdminBookingsQuery,
  useSetBookingStatusMutation,
  useGetDashboardKpisQuery,
} from '../features/rooms/roomsApi';
import AdminVillasTab from '../pages/AdminVillasTab';
import AdminInventoryTab from '../pages/AdminInventoryTab';
import ToastAlert from '../components/common/Toast';

// Initial baseline mock reservations for administration view
/* INITIAL_STAFF_RESERVATIONS removed - the reservations table is real now. */

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  /* Reservations come from GET /api/admin/bookings - every guest's, not just
     the signed-in one, which is what selectMyBookings gave. Searching and
     filtering happen in SQL, so the whole table is never pulled down. */
  const {
    data: bookingPage,
    isLoading: bookingsLoading,
    isFetching: bookingsFetching,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useGetAdminBookingsQuery({
    search: searchQuery.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: 1,
    pageSize: 100,
  });

  /* Revenue and occupancy are computed in SQL from dbo.Bookings and
     dbo.VillaInventory. Summing a page of rows in the browser would only
     ever total the page. */
  const { data: kpis } = useGetDashboardKpisQuery();

  const [setBookingStatus, { isLoading: statusSaving }] =
    useSetBookingStatusMutation();

  const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' | 'villas' | 'inventory' | 'concierge'
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast(typeof message === 'string' ? { message, type } : message);
  };

  /* INITIAL_STAFF_RESERVATIONS was a hard-coded array merged with whatever
     the signed-in guest had booked in this browser. Both are gone - these are
     real rows, and BookingDto nests the guest under `guest` rather than
     `guestInfo`, so the shape is normalised once here. */
  const allReservations = (bookingPage?.items ?? []).map((b) => ({
    ...b,
    guestInfo: b.guest ?? {
      firstName: 'Guest',
      lastName: 'Reservation',
      email: '',
      phone: '',
      country: '',
    },
  }));

  /* usp_Admin_Booking_Search already filtered on the reference, guest name,
     email and villa name, so there is nothing left to do here. */
  const filteredReservations = allReservations;

  /* From GET /api/admin/bookings/dashboard/kpis. Revenue excludes cancelled
     stays; occupancy is tonight's, straight from dbo.VillaInventory rather
     than the guess this used to make from the row count. */
  const totalRevenue = kpis?.totalRevenue ?? 0;
  const confirmedCount = kpis?.confirmedCount ?? 0;
  const inHouseCount = kpis?.inHouseCount ?? 0;
  const occupancyPercentage = Math.round(kpis?.occupancyToday ?? 0);
  const totalReservationCount = bookingPage?.totalCount ?? 0;

  /* Setting Cancelled here runs the same procedure a guest cancellation does,
     so the villa's nights are released either way - a desk cancellation
     cannot leave inventory locked. */
  const handleUpdateStatus = async (refId, newStatus) => {
    try {
      const res = await setBookingStatus({
        referenceId: refId,
        status: newStatus,
      }).unwrap();
      showToast(res?.message || `Reservation ${refId} moved to ${newStatus}.`, 'success');
    } catch (err) {
      showToast(
        err?.data?.message || `Reservation ${refId} could not be updated.`,
        'error',
      );
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="pt-28 pb-24 min-h-screen bg-surface text-on-surface">
      {/* ── Background Subtle Sketch ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-10"
        style={{
          backgroundImage: "url('/assets/images/loading-sketch.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="container-resort max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* ── Top Header Banner: Staff Portal Identity ── */}
        <div className="bg-gradient-to-r from-deep-wood via-[#272019] to-deep-wood rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl border border-white/10 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div
            className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-primary/30 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-md backdrop-blur-md">
                <ShieldCheck size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Staff Portal
                  </span>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-white/70 text-xs font-mono">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
                  style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                >
                  Resort Administration & Concierge Desk
                </h1>
                <p className="text-xs text-white/70 mt-1">
                  Logged in as <strong className="text-white">{currentUser?.name || 'Alexander Vance'}</strong> ({currentUser?.title || 'General Manager'})
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/booking"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <Bed size={15} />
                <span>Guest Booking View</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Occupancy */}
          <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-deep-wood/60">Estate Occupancy</span>
              <div className="w-8 h-8 rounded-lg bg-secondary-container/30 text-secondary flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-deep-wood font-heading">{occupancyPercentage}%</span>
              <span className="text-xs font-semibold text-emerald-700">tonight</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: `${occupancyPercentage}%` }} />
            </div>
          </div>

          {/* Active In-House */}
          <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-deep-wood/60">In-House Guests</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-deep-wood font-heading">{inHouseCount}</span>
              <span className="text-xs font-semibold text-deep-wood/60">Guests On-Site</span>
            </div>
            <p className="text-[12px] text-deep-wood/60 mt-3 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Full butler service deployed</span>
            </p>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-deep-wood/60">Active Reservations</span>
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                <Calendar size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-deep-wood font-heading">{totalReservationCount}</span>
              <span className="text-xs font-semibold text-primary">{confirmedCount} Confirmed</span>
            </div>
            <p className="text-[12px] text-deep-wood/60 mt-3">
              {kpis?.arrivalsToday ?? 0} arriving today · {kpis?.departuresToday ?? 0} departing
            </p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-deep-wood/60">Gross Value</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-deep-wood font-heading">
                Rs.{totalRevenue.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-700">LKR</span>
            </div>
            <p className="text-[12px] text-deep-wood/60 mt-3 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              <span>Rs.{(kpis?.revenue30Days ?? 0).toLocaleString()} in the last 30 days</span>
            </p>
          </div>
        </div>

        {/* ── Main Operations Section ── */}
        <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-xl overflow-hidden mb-12">
          {/* Navigation Bar inside card */}
          <div className="p-4 sm:p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-container-low/40">
            {/* View Tabs */}
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1 bg-surface-container-high rounded-2xl border border-outline-variant/30 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('reservations')}
                className={[
                  'flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'reservations'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-deep-wood/70 hover:text-deep-wood',
                ].join(' ')}
              >
                <FileText size={14} />
                <span>Reservations ({totalReservationCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('villas')}
                className={[
                  'flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'villas'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-deep-wood/70 hover:text-deep-wood',
                ].join(' ')}
              >
                <Bed size={14} />
                <span>Villas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={[
                  'flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'inventory'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-deep-wood/70 hover:text-deep-wood',
                ].join(' ')}
              >
                <CalendarDays size={14} />
                <span>Inventory</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('concierge')}
                className={[
                  'flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'concierge'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-deep-wood/70 hover:text-deep-wood',
                ].join(' ')}
              >
                <Plane size={14} />
                <span>Concierge</span>
              </button>
            </div>

            {/* Search & Filter (if on reservations tab) */}
            {activeTab === 'reservations' && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-wood/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, ref ID, villa..."
                    className="pl-9 pr-4 py-1.5 rounded-xl bg-white border border-outline-variant/60 text-deep-wood text-xs focus:ring-1 focus:ring-primary focus:border-primary w-56 sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-outline-variant/60 text-deep-wood text-xs font-bold focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked-in">Checked-In</option>
                  <option value="checked-out">Checked-Out</option>
                </select>
              </div>
            )}
          </div>

          {/* ── TAB 1: RESERVATIONS MANAGER ── */}
          {activeTab === 'reservations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low text-deep-wood/70 font-bold uppercase tracking-wider text-[12px]">
                    <th className="py-3.5 px-5">Ref Code</th>
                    <th className="py-3.5 px-5">Guest Name & Details</th>
                    <th className="py-3.5 px-5">Villa Reserved</th>
                    <th className="py-3.5 px-5">Stay Dates</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Staff Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-deep-wood">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-deep-wood/50">
                        No reservations match the specified search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => (
                      <tr key={res.referenceId} className="hover:bg-surface-container-low/50 transition-colors">
                        {/* Ref Code */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-md text-[12px]">
                            {res.referenceId}
                          </span>
                          {res.isLiveGuestBooking && (
                            <span className="block mt-1 text-[9px] font-bold uppercase text-emerald-700 tracking-wider">
                              ● Live Booking
                            </span>
                          )}
                        </td>

                        {/* Guest Name & Details */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-deep-wood text-sm">
                            {res.guestInfo?.firstName} {res.guestInfo?.lastName}
                          </div>
                          <div className="text-[12px] text-deep-wood/60 flex items-center gap-2 mt-0.5">
                            <span>{res.guestInfo?.email}</span>
                            <span>•</span>
                            <span>{res.guestInfo?.phone}</span>
                          </div>
                        </td>

                        {/* Villa */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-deep-wood">{res.villaName}</div>
                          <div className="text-[10px] text-deep-wood/60">
                            {res.adults} Adults {res.children > 0 ? `, ${res.children} Children` : ''}
                          </div>
                        </td>

                        {/* Stay Dates */}
                        <td className="py-4 px-5 font-mono text-[12px]">
                          <div>
                            {res.checkIn} → {res.checkOut}
                          </div>
                          <div className="text-[10px] text-deep-wood/60 font-sans font-medium">
                            {res.nights} Nights
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-deep-wood text-sm font-heading">
                            Rs.{(res.finalTotal || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-deep-wood/60">{res.paymentMethod || 'Credit Card'}</div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          <span
                            className={[
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                              res.status === 'Checked-In'
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.status === 'Checked-Out'
                                ? 'bg-gray-100 text-gray-700'
                                : res.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'w-1.5 h-1.5 rounded-full',
                                res.status === 'Checked-In'
                                  ? 'bg-emerald-600'
                                  : res.status === 'Checked-Out'
                                  ? 'bg-gray-500'
                                  : res.status === 'Cancelled'
                                  ? 'bg-red-600'
                                  : 'bg-amber-600',
                              ].join(' ')}
                            />
                            <span>{res.status}</span>
                          </span>
                        </td>

                        {/* Staff Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* View Voucher */}
                            <button
                              type="button"
                              onClick={() => setSelectedVoucher(res)}
                              className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-deep-wood/80 hover:text-deep-wood transition-colors"
                              title="View Full Guest Voucher"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Check-In / Check-Out Toggle */}
                            {res.status === 'Confirmed' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(res.referenceId, 'Checked-In')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                              >
                                Check In
                              </button>
                            )}

                            {res.status === 'Checked-In' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(res.referenceId, 'Checked-Out')}
                                className="px-2.5 py-1 rounded-lg bg-deep-wood hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                              >
                                Check Out
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TAB 2: VILLA INVENTORY MATRIX ── */}
          {activeTab === 'villas' && <AdminVillasTab />}

          {activeTab === 'inventory' && <AdminInventoryTab />}

          {/* ── TAB 3: CONCIERGE & SPECIAL REQUESTS ── */}
          {activeTab === 'concierge' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Special Dietary & Preferences */}
                <div className="rounded-2xl border border-outline-variant/30 p-5 bg-surface">
                  <h3 className="font-bold text-deep-wood text-sm flex items-center gap-2 mb-4">
                    <Utensils size={17} className="text-primary" />
                    <span>Special Guest Dietary & Culinary Requests</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-xs">
                      <div className="flex items-center justify-between font-bold text-deep-wood mb-1">
                        <span>Sophia Laurent (AVR-651902)</span>
                        <span className="text-[10px] text-secondary font-mono">Lagoon Suite</span>
                      </div>
                      <p className="text-deep-wood/75">
                        Strict gluten-free breakfast preparation and organic fruit assortment daily.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-xs">
                      <div className="flex items-center justify-between font-bold text-deep-wood mb-1">
                        <span>Kenji Takahashi (AVR-419823)</span>
                        <span className="text-[10px] text-secondary font-mono">Ocean Residence</span>
                      </div>
                      <p className="text-deep-wood/75">
                        Private Chef in-villa omakase dinner for 4 guests on Friday evening.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Airport Transfers & Logistics */}
                <div className="rounded-2xl border border-outline-variant/30 p-5 bg-surface">
                  <h3 className="font-bold text-deep-wood text-sm flex items-center gap-2 mb-4">
                    <Plane size={17} className="text-secondary" />
                    <span>Scheduled Airport VIP Transfers</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-xs">
                      <div className="flex items-center justify-between font-bold text-deep-wood mb-1">
                        <span>Flight BA215 — Sir Richard Holloway</span>
                        <span className="text-[10px] text-emerald-700 font-bold">Driver Assigned</span>
                      </div>
                      <p className="text-deep-wood/75">
                        Arrival at 14:30. Chilled Range Rover transfer with welcome cold towels.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-xs">
                      <div className="flex items-center justify-between font-bold text-deep-wood mb-1">
                        <span>Private Charter — Kenji Takahashi</span>
                        <span className="text-[10px] text-amber-700 font-bold">Helipad Ready</span>
                      </div>
                      <p className="text-deep-wood/75">
                        Landing at Estate Helipad Alpha at 16:00. General Manager greeting on tarmac.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Full Voucher Details Modal ── */}
      <AnimatePresence>
        {selectedVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-wood/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/40 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedVoucher(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-deep-wood/50 hover:text-deep-wood hover:bg-surface-container-high"
              >
                <X size={18} />
              </button>

              <div className="text-center pb-4 border-b border-outline-variant/20 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  Official Guest Reservation Voucher
                </span>
                <h3
                  className="text-xl font-bold text-deep-wood mt-1"
                  style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}
                >
                  {selectedVoucher.referenceId}
                </h3>
              </div>

              <div className="space-y-3.5 text-xs text-deep-wood">
                <div className="flex justify-between py-1.5 border-b border-outline-variant/10">
                  <span className="font-semibold text-deep-wood/60">Primary Guest:</span>
                  <span className="font-bold">
                    {selectedVoucher.guestInfo?.firstName} {selectedVoucher.guestInfo?.lastName}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-outline-variant/10">
                  <span className="font-semibold text-deep-wood/60">Contact:</span>
                  <span>{selectedVoucher.guestInfo?.email} • {selectedVoucher.guestInfo?.phone}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-outline-variant/10">
                  <span className="font-semibold text-deep-wood/60">Reserved Villa:</span>
                  <span className="font-bold">{selectedVoucher.villaName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-outline-variant/10">
                  <span className="font-semibold text-deep-wood/60">Stay Dates:</span>
                  <span>{selectedVoucher.checkIn} to {selectedVoucher.checkOut} ({selectedVoucher.nights} Nights)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-outline-variant/10">
                  <span className="font-semibold text-deep-wood/60">Occupancy:</span>
                  <span>{selectedVoucher.adults} Adults, {selectedVoucher.children || 0} Children</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-outline-variant/10">
                  <span className="font-semibold text-deep-wood/60">Total Valuation:</span>
                  <span className="font-bold text-primary text-sm font-heading">
                    Rs.{(selectedVoucher.finalTotal || 0).toLocaleString()} LKR
                  </span>
                </div>
                {selectedVoucher.guestInfo?.specialRequests && (
                  <div className="p-3 rounded-xl bg-surface-container-high/70 border border-outline-variant/20 mt-2">
                    <span className="font-bold block mb-1">Special Guest Notes:</span>
                    <p className="text-deep-wood/80">{selectedVoucher.guestInfo.specialRequests}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedVoucher(null)}
                  className="px-5 py-2 rounded-xl bg-deep-wood text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                >
                  Close Voucher
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top-Right Animated Toast Notification with Reducing Progress Bar */}
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
