import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
  Save,
  Info,
  Ban,
  RefreshCw,
  TrendingUp,
  Layers,
} from "lucide-react";
import {
  useGetInventoryGridQuery,
  useSetInventoryRangeMutation,
  useExtendInventoryHorizonMutation,
} from "../features/rooms/roomsApi";
import ToastAlert from "../components/common/Toast";

/* --------------------------------------------------------------------------
   Per-night inventory.

   Total Physical Units lives in the villa editor - it is a property of the
   building and rarely changes. Everything that varies by DATE lives here,
   because dbo.VillaInventory holds one row per villa per night:

       units sold that night, whether the night is closed to sale,
       a seasonal rate override, and the minimum stay for an arrival

   None of that can be expressed by a single number on dbo.Villas, which is why
   the old AvailableSlots column was dropped in module 4.
   -------------------------------------------------------------------------- */

const WINDOW_DAYS = 21;
const DAY_MS = 86400000;

const toIso = (d) => d.toISOString().split("T")[0];
const addDays = (iso, n) =>
  toIso(new Date(new Date(iso).getTime() + n * DAY_MS));

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const errorText = (err, fallback) =>
  err?.data?.message || err?.error || fallback;

const inputClass =
  "w-full px-3.5 py-2.5 text-xs bg-white border border-outline-variant/40 rounded-xl " +
  "text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all";

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[10px] text-deep-wood/60 font-medium">{hint}</p>
      )}
    </div>
  );
}

/**
 * Colour of a single night cell.
 *
 * Deliberately reads availability, not occupancy: the number that matters to
 * the desk is how many units are left to sell tonight.
 */
function cellStyle(night) {
  if (night.isBlocked) return "bg-red-100 text-red-800 border-red-200";
  if (night.unitsAvailable <= 0)
    return "bg-amber-100 text-amber-900 border-amber-200";
  if (night.unitsAvailable <= 1)
    return "bg-amber-50 text-amber-800 border-amber-200/70";
  return "bg-emerald-50 text-emerald-900 border-emerald-200/70";
}

export default function AdminInventoryTab() {
  const [from, setFrom] = useState(() => toIso(new Date()));
  const to = useMemo(() => addDays(from, WINDOW_DAYS - 1), [from]);

  const [selection, setSelection] = useState(null); // { villaId, name, from, to }
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);

  const {
    data: grid,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetInventoryGridQuery(
    { from, to },
    { refetchOnMountOrArgChange: true },
  );

  const [setRange, { isLoading: isSaving }] = useSetInventoryRangeMutation();
  const [extendHorizon, { isLoading: isExtending }] =
    useExtendInventoryHorizonMutation();

  const showToast = (message, type = "success") => {
    setToast(typeof message === "string" ? { message, type } : message);
  };

  const dates = useMemo(
    () => Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(from, i)),
    [from],
  );

  const openEditor = (villa, date) => {
    setSelection({ villaId: villa.id, name: villa.name });
    setForm({
      from: date,
      to: date,
      totalUnits: "",
      isBlocked: "",
      blockReason: "",
      priceOverride: "",
      clearPriceOverride: false,
      minNights: "",
      weekendsOnly: false,
    });
    setFormError("");
  };

  const handleSave = async () => {
    setFormError("");

    if (form.to < form.from)
      return setFormError("The end date cannot fall before the start date.");
    if (form.isBlocked === "true" && !form.blockReason.trim())
      return setFormError("A reason is required when closing dates.");
    if (form.priceOverride && form.clearPriceOverride)
      return setFormError(
        "Choose either a seasonal rate or clearing the existing one, not both.",
      );

    // Every field is optional on the API side. Omitting one means "leave it
    // alone", which is what lets a week be closed without disturbing its
    // pricing. Only send what was actually filled in.
    const payload = { from: form.from, to: form.to };

    if (form.totalUnits !== "") payload.totalUnits = Number(form.totalUnits);
    if (form.isBlocked !== "") payload.isBlocked = form.isBlocked === "true";
    if (form.blockReason.trim()) payload.blockReason = form.blockReason.trim();
    if (form.priceOverride !== "")
      payload.priceOverride = Number(form.priceOverride);
    if (form.clearPriceOverride) payload.clearPriceOverride = true;
    if (form.minNights !== "") payload.minNights = Number(form.minNights);
    if (form.weekendsOnly) payload.daysOfWeek = "1,7"; // SQL Server: 1 = Sunday

    try {
      const res = await setRange({
        villaCode: selection.villaId,
        ...payload,
      }).unwrap();
      showToast(res?.message || "Inventory updated.");
      setSelection(null);
      refetch();
    } catch (err) {
      setFormError(errorText(err, "The inventory could not be updated."));
    }
  };

  const handleExtend = async () => {
    try {
      const res = await extendHorizon(540).unwrap();
      showToast(res?.message || "Booking calendar extended.");
      refetch();
    } catch (err) {
      showToast(errorText(err, "The calendar could not be extended."), "error");
    }
  };

  /* ------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <Loader2 size={28} className="mx-auto animate-spin text-primary/60" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-deep-wood/50">
          Loading inventory calendar
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-16 text-center">
        <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
        <p className="text-sm font-bold text-deep-wood">
          The inventory calendar could not be loaded.
        </p>
        <p className="mt-1 text-xs text-deep-wood/60">
          {errorText(error, "The reservation system did not respond.")}
        </p>
        <button
          onClick={refetch}
          className="mt-5 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const villas = grid?.villas ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-deep-wood flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            Inventory Calendar
            {isFetching && (
              <RefreshCw size={12} className="animate-spin text-primary/60" />
            )}
          </h2>
          <p className="text-[11px] text-deep-wood/55">
            {grid?.from} to {grid?.to} · units left to sell each night
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFrom(addDays(from, -WINDOW_DAYS))}
            className="p-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood hover:bg-surface-container-high cursor-pointer"
            aria-label="Previous three weeks"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => setFrom(toIso(new Date()))}
            className="px-4 py-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood text-[11px] font-bold uppercase tracking-wider hover:bg-surface-container-high cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setFrom(addDays(from, WINDOW_DAYS))}
            className="p-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood hover:bg-surface-container-high cursor-pointer"
            aria-label="Next three weeks"
          >
            <ChevronRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Inventory Calendar"
            className="px-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood hover:bg-surface-container-high cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
            aria-label="Refresh Inventory Calendar"
          >
            <RefreshCw
              size={13}
              className={isFetching ? "animate-spin text-primary" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExtend}
            disabled={isExtending}
            title="Open more dates for sale. Without this the calendar runs out and bookings silently stop."
            className="px-4 py-2.5 rounded-xl bg-secondary text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {isExtending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Layers size={13} />
            )}
            Extend Horizon
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-deep-wood/70">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-200/70" />
          Open
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-200/70" />
          One unit left
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-200" />
          Sold out
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-200" />
          Closed
        </span>
        <span className="ml-auto text-deep-wood/50">
          Click any night to edit a range from it
        </span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-surface-container-high">
              <th className="sticky left-0 z-10 bg-surface-container-high px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 min-w-[190px]">
                Villa
              </th>
              {dates.map((d) => {
                const day = new Date(d);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <th
                    key={d}
                    className={[
                      "px-1 py-2 text-center text-[10px] font-bold min-w-[46px]",
                      isWeekend ? "text-primary" : "text-deep-wood/60",
                    ].join(" ")}
                  >
                    <span className="block">{WEEKDAYS[day.getDay()]}</span>
                    <span className="block text-[11px] text-deep-wood">
                      {day.getDate()}
                    </span>
                  </th>
                );
              })}
              <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 min-w-[80px]">
                Occupancy
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/20">
            {villas.map((villa) => {
              const byDate = new Map(villa.nights.map((n) => [n.date, n]));

              return (
                <tr key={villa.id}>
                  <td className="sticky left-0 z-10 bg-surface px-4 py-3">
                    <span className="font-bold text-deep-wood block">
                      {villa.name}
                    </span>
                    <span className="text-[10px] text-deep-wood/55">
                      {villa.totalUnits} unit{villa.totalUnits === 1 ? "" : "s"}{" "}
                      · Rs.
                      {Number(villa.pricePerNight).toLocaleString()}
                    </span>
                  </td>

                  {dates.map((d) => {
                    const night = byDate.get(d);

                    // A night with no row is outside the loaded horizon. Every
                    // availability check for it returns OutsideHorizon, so it
                    // has to look different from a sold-out night.
                    if (!night) {
                      return (
                        <td key={d} className="p-0.5">
                          <div
                            className="h-11 rounded-lg border border-dashed border-outline-variant/40 bg-surface-container-high/30 flex items-center justify-center text-[10px] text-deep-wood/30"
                            title="No calendar row - use Extend Horizon"
                          >
                            –
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={d} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => openEditor(villa, d)}
                          title={
                            night.isBlocked
                              ? `Closed: ${night.blockReason ?? "no reason given"}`
                              : `${night.unitsAvailable} of ${night.totalUnits} left` +
                                (night.minNights > 1
                                  ? ` · min ${night.minNights} nights`
                                  : "") +
                                (night.hasPriceOverride
                                  ? ` · Rs.${Number(night.pricePerNight).toLocaleString()}`
                                  : "")
                          }
                          className={[
                            "w-full h-11 rounded-lg border flex flex-col items-center justify-center font-bold transition-transform hover:scale-105 cursor-pointer relative",
                            cellStyle(night),
                          ].join(" ")}
                        >
                          {night.isBlocked ? (
                            <Ban size={13} />
                          ) : (
                            <span className="text-[12px] leading-none">
                              {night.unitsAvailable}
                            </span>
                          )}

                          {/* A seasonal rate is invisible otherwise, and a
                              wrong one is expensive. */}
                          {night.hasPriceOverride && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                          {night.minNights > 1 && (
                            <span className="text-[8px] leading-none opacity-70 mt-0.5">
                              {night.minNights}N
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}

                  <td className="px-3 py-3 text-center">
                    <span className="font-bold text-deep-wood flex items-center justify-center gap-1">
                      <TrendingUp size={11} className="text-primary" />
                      {Number(villa.occupancyPercent ?? 0).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-deep-wood/50">
                      {villa.unitNightsSold}/{villa.unitNights}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-deep-wood/55 flex items-start gap-2">
        <Info size={13} className="text-primary shrink-0 mt-0.5" />
        <span>
          A dot marks a seasonal rate, <strong>2N</strong> a minimum stay. Total
          Physical Units is set in the Villas tab — it is a property of the
          building. Everything that varies by date is edited here.
        </span>
      </p>

      {/* ── Range editor ── */}
      <AnimatePresence>
        {selection && form && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 md:pt-10 overflow-y-auto bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-primary my-auto text-deep-wood"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <div className="px-6 sm:px-8 py-6 bg-deep-wood text-resort-white flex items-center justify-between border-b border-primary/30">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
                    <CalendarDays size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300 block font-mono mb-1">
                      Inventory Range Editor
                    </span>
                    <h3
                      className="text-xl sm:text-2xl font-bold text-sand italic leading-tight"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {selection.name}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8 bg-surface space-y-5">
                <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-primary/20 text-[11px] text-deep-wood/70 flex items-start gap-2.5">
                  <Info size={14} className="text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Leave a field blank to leave it unchanged. That is what lets
                    you close a week for maintenance without disturbing its
                    pricing.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="From">
                    <input
                      type="date"
                      className={inputClass}
                      value={form.from}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, from: e.target.value }))
                      }
                    />
                  </Field>

                  <Field label="To">
                    <input
                      type="date"
                      className={inputClass}
                      min={form.from}
                      value={form.to}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, to: e.target.value }))
                      }
                    />
                  </Field>

                  <Field
                    label="Units Sellable"
                    hint="Lower it when a unit is out for maintenance. Refused if it falls below what is already sold."
                  >
                    <input
                      type="number"
                      min={0}
                      max={500}
                      placeholder="Unchanged"
                      className={inputClass}
                      value={form.totalUnits}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, totalUnits: e.target.value }))
                      }
                    />
                  </Field>

                  <Field
                    label="Minimum Stay (nights)"
                    hint="Applies to arrivals on these dates."
                  >
                    <input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="Unchanged"
                      className={inputClass}
                      value={form.minNights}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, minNights: e.target.value }))
                      }
                    />
                  </Field>

                  <Field label="Open or Closed">
                    <select
                      className={`${inputClass} cursor-pointer`}
                      value={form.isBlocked}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, isBlocked: e.target.value }))
                      }
                    >
                      <option value="">Unchanged</option>
                      <option value="false">Open for sale</option>
                      <option value="true">Closed</option>
                    </select>
                  </Field>

                  <Field
                    label="Reason for Closing"
                    hint="Shown to the reception desk, not to guests."
                  >
                    <input
                      className={inputClass}
                      placeholder="Pool resurfacing"
                      disabled={form.isBlocked !== "true"}
                      value={form.blockReason}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, blockReason: e.target.value }))
                      }
                    />
                  </Field>

                  <Field
                    label="Seasonal Rate (LKR)"
                    hint="Replaces the base rate for these nights. Rate plan modifiers still apply on top."
                  >
                    <input
                      type="number"
                      min={1}
                      step={5000}
                      placeholder="Unchanged"
                      className={inputClass}
                      disabled={form.clearPriceOverride}
                      value={form.priceOverride}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          priceOverride: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <div className="flex flex-col justify-end gap-2">
                    {/* Remove seasonal rate */}
                    <label className="flex items-center gap-2.5 p-3 bg-surface-container-low/50 border border-primary/20 rounded-xl text-[11px] font-bold cursor-pointer hover:bg-primary/5 transition-colors">
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                          form.clearPriceOverride
                            ? "bg-primary border-primary"
                            : "bg-white border-primary/30"
                        }`}
                      >
                        {form.clearPriceOverride && (
                          <span className="text-white text-[11px] font-bold leading-none">
                            ✓
                          </span>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        checked={form.clearPriceOverride}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            clearPriceOverride: e.target.checked,
                            priceOverride: e.target.checked
                              ? ""
                              : f.priceOverride,
                          }))
                        }
                        className="sr-only"
                      />
                      Remove the seasonal rate
                    </label>

                    {/* Weekends only */}
                    <label className="flex items-center gap-2.5 p-3 bg-surface-container-low/50 border border-primary/20 rounded-xl text-[11px] font-bold cursor-pointer hover:bg-primary/5 transition-colors">
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                          form.weekendsOnly
                            ? "bg-primary border-primary"
                            : "bg-white border-primary/30"
                        }`}
                      >
                        {form.weekendsOnly && (
                          <span className="text-white text-[11px] font-bold leading-none">
                            ✓
                          </span>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        checked={form.weekendsOnly}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            weekendsOnly: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      Weekends only (Sat & Sun)
                    </label>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="mx-6 sm:mx-8 mb-2 p-3.5 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="px-6 sm:px-8 py-5 bg-surface-container-low/50 border-t-2 border-primary/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  className="px-6 py-3 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  Apply to Range
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
