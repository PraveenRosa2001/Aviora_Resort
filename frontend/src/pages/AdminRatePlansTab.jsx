import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
  Loader2,
  Info,
  Percent,
  Tag,
  Ticket,
  Sparkles,
  CheckCircle2,
  Check,
  ShieldCheck,
  Clock,
  CreditCard,
  Calendar,
} from "lucide-react";
import {
  useGetAdminRatePlansQuery,
  useSaveRatePlanMutation,
  useDeleteRatePlanMutation,
  useGetAdminAddonsQuery,
  useSaveAddonMutation,
  useGetPromoCodesQuery,
  useSavePromoCodeMutation,
  useDeletePromoCodeMutation,
} from "../../features/rooms/roomsApi";
import ToastAlert from "../components/common/Toast";

/* --------------------------------------------------------------------------
   Rate plans, add-ons and promotional codes.

   These are resort policy, not villa attributes. Defined once here and shared
   by every villa; a villa only decides whether it sells a plan and whether it
   uses a different modifier, which is set in the Villas tab.

   Nothing on this page is what stops a guest editing these. That is
   [Authorize(Roles = "admin")] on AdminPricingController.
   -------------------------------------------------------------------------- */

const CHARGE_BASES = [
  { value: "PerStay", label: "Once per stay" },
  { value: "PerNight", label: "Per night" },
  { value: "PerGuest", label: "Per guest" },
];

const EMPTY_PLAN = {
  id: "",
  name: "",
  badge: "",
  tagline: "",
  discountPercent: 0,
  isRefundable: true,
  cancellationHours: 48,
  requiresPrepayment: false,
  displayOrder: 0,
  isActive: true,
  features: [],
};

const EMPTY_ADDON = {
  id: "",
  name: "",
  description: "",
  price: 50000,
  icon: "",
  chargeBasis: "PerStay",
  displayOrder: 0,
  isActive: true,
};

const EMPTY_PROMO = {
  code: "",
  description: "",
  discountPercent: 10,
  validFrom: "",
  validTo: "",
  maxUses: "",
  minNights: 1,
  isActive: true,
};

const toCode = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const errorText = (err, fallback) =>
  err?.data?.message || err?.error || fallback;

const inputClass =
  "w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-outline-variant/40 rounded-xl " +
  "text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all placeholder:text-deep-wood/35";

function Field({ label, children, hint, span = 1, required = false }) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-bold uppercase tracking-wider text-deep-wood mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[11px] text-deep-wood/65 font-medium">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Shared shell for the three editor dialogs. */
function EditorModal({
  title,
  eyebrow,
  icon,
  onClose,
  onSave,
  isSaving,
  error,
  saveLabel,
  children,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 md:p-8 pt-20 md:pt-8 pb-8 overflow-y-auto bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border-2 border-primary my-auto text-deep-wood"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div className="px-6 sm:px-8 py-6 bg-deep-wood text-resort-white flex items-center justify-between border-b border-primary/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
              {icon}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300 block font-mono mb-1">
                {eyebrow}
              </span>
              <h3
                className="text-xl sm:text-2xl font-bold text-sand italic leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8 bg-surface overflow-y-auto flex-1 space-y-5">
          {children}
        </div>

        {error && (
          <div className="mx-6 sm:mx-8 mb-2 p-3.5 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2 shrink-0">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="px-6 sm:px-8 py-5 bg-surface-container-low/50 border-t-2 border-primary/20 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            <span>{saveLabel}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminRatePlansTab() {
  const [section, setSection] = useState("plans"); // 'plans' | 'addons' | 'promos'
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast(typeof message === "string" ? { message, type } : message);
  };

  /* ---------------- queries ---------------- */
  const {
    data: plans = [],
    isLoading: plansLoading,
    isError: plansError,
    error: plansErrObj,
    refetch: refetchPlans,
  } = useGetAdminRatePlansQuery();

  const { data: addons = [], isLoading: addonsLoading } =
    useGetAdminAddonsQuery();
  const { data: promos = [], isLoading: promosLoading } =
    useGetPromoCodesQuery();

  const [savePlan, { isLoading: savingPlan }] = useSaveRatePlanMutation();
  const [deletePlan] = useDeleteRatePlanMutation();
  const [saveAddon, { isLoading: savingAddon }] = useSaveAddonMutation();
  const [savePromo, { isLoading: savingPromo }] = useSavePromoCodeMutation();
  const [deletePromo] = useDeletePromoCodeMutation();

  /* ---------------- editors ---------------- */
  const [editingPlan, setEditingPlan] = useState(null);
  const [isNewPlan, setIsNewPlan] = useState(false);
  const [planError, setPlanError] = useState("");

  const [editingAddon, setEditingAddon] = useState(null);
  const [isNewAddon, setIsNewAddon] = useState(false);
  const [addonError, setAddonError] = useState("");

  const [editingPromo, setEditingPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  /* ---------------- rate plans ---------------- */

  const openPlan = (plan) => {
    setEditingPlan(
      plan
        ? {
            ...EMPTY_PLAN,
            ...plan,
            badge: plan.badge ?? "",
            tagline: plan.tagline ?? "",
            cancellationHours: plan.cancellationHours ?? "",
            features: plan.features ?? [],
          }
        : { ...EMPTY_PLAN },
    );
    setIsNewPlan(!plan);
    setPlanError("");
  };

  const handleSavePlan = async () => {
    setPlanError("");
    const p = editingPlan;

    if (!p.name.trim()) return setPlanError("The plan needs a name.");
    if (!p.id.trim()) return setPlanError("The plan needs a code.");
    if (!/^[a-z0-9-]+$/.test(p.id))
      return setPlanError(
        "The code may contain lowercase letters, numbers and hyphens only.",
      );

    const features = p.features.map((f) => f.trim()).filter(Boolean);
    if (features.length === 0)
      return setPlanError(
        "Add at least one feature. Guests choose between plans on these lines.",
      );

    // The API rejects both of these too; checking here saves a round trip and
    // explains the rule where the mistake was made.
    if (p.isRefundable && !Number(p.cancellationHours))
      return setPlanError(
        "A refundable plan needs a cancellation window in hours.",
      );
    if (!p.isRefundable && Number(p.cancellationHours) > 0)
      return setPlanError(
        "A non-refundable plan cannot carry a cancellation window.",
      );

    try {
      const res = await savePlan({
        ratePlanCode: isNewPlan ? undefined : p.id,
        id: p.id,
        name: p.name.trim(),
        badge: p.badge.trim() || null,
        tagline: p.tagline.trim() || null,
        discountPercent: Number(p.discountPercent),
        isRefundable: p.isRefundable,
        cancellationHours: p.isRefundable ? Number(p.cancellationHours) : null,
        requiresPrepayment: p.requiresPrepayment,
        displayOrder: Number(p.displayOrder),
        isActive: p.isActive,
        features,
      }).unwrap();

      showToast(res?.message || "Rate plan saved.");
      setEditingPlan(null);
    } catch (err) {
      setPlanError(errorText(err, "The rate plan could not be saved."));
    }
  };

  const handleDeletePlan = async (plan) => {
    try {
      const res = await deletePlan(plan.id).unwrap();
      showToast(res?.message || "Rate plan retired.");
    } catch (err) {
      showToast(errorText(err, "The rate plan could not be retired."), "error");
    }
  };

  /* ---------------- add-ons ---------------- */

  const openAddon = (addon) => {
    setEditingAddon(
      addon
        ? {
            ...EMPTY_ADDON,
            ...addon,
            description: addon.description ?? "",
            icon: addon.icon ?? "",
          }
        : { ...EMPTY_ADDON },
    );
    setIsNewAddon(!addon);
    setAddonError("");
  };

  const handleSaveAddon = async () => {
    setAddonError("");
    const a = editingAddon;

    if (!a.name.trim()) return setAddonError("The add-on needs a name.");
    if (!a.id.trim()) return setAddonError("The add-on needs a code.");
    if (!/^[a-z0-9-]+$/.test(a.id))
      return setAddonError(
        "The code may contain lowercase letters, numbers and hyphens only.",
      );
    if (Number(a.price) < 0)
      return setAddonError("The price cannot be negative.");

    try {
      const res = await saveAddon({
        addonCode: isNewAddon ? undefined : a.id,
        id: a.id,
        name: a.name.trim(),
        description: a.description.trim() || null,
        price: Number(a.price),
        icon: a.icon.trim() || null,
        chargeBasis: a.chargeBasis,
        displayOrder: Number(a.displayOrder),
        isActive: a.isActive,
      }).unwrap();

      showToast(res?.message || "Add-on saved.");
      setEditingAddon(null);
    } catch (err) {
      setAddonError(errorText(err, "The add-on could not be saved."));
    }
  };

  /* ---------------- promo codes ---------------- */

  const openPromo = (promo) => {
    setEditingPromo(
      promo
        ? {
            ...EMPTY_PROMO,
            ...promo,
            description: promo.description ?? "",
            validFrom: promo.validFrom ? promo.validFrom.split("T")[0] : "",
            validTo: promo.validTo ? promo.validTo.split("T")[0] : "",
            maxUses: promo.maxUses ?? "",
          }
        : { ...EMPTY_PROMO },
    );
    setPromoError("");
  };

  const handleSavePromo = async () => {
    setPromoError("");
    const p = editingPromo;

    if (!p.code.trim()) return setPromoError("The code is required.");
    if (Number(p.discountPercent) <= 0 || Number(p.discountPercent) > 100)
      return setPromoError(
        "The discount must be between 0.01 and 100 percent.",
      );
    if (p.validFrom && p.validTo && p.validTo < p.validFrom)
      return setPromoError("The end date cannot fall before the start date.");

    try {
      const res = await savePromo({
        code: p.code.trim().toUpperCase(),
        description: p.description.trim() || null,
        discountPercent: Number(p.discountPercent),
        validFrom: p.validFrom || null,
        validTo: p.validTo || null,
        maxUses: p.maxUses === "" ? null : Number(p.maxUses),
        minNights: Number(p.minNights),
        isActive: p.isActive,
      }).unwrap();

      showToast(res?.message || "Promotional code saved.");
      setEditingPromo(null);
    } catch (err) {
      setPromoError(errorText(err, "The promotional code could not be saved."));
    }
  };

  /* ------------------------------------------------------------------ */

  if (plansLoading || addonsLoading || promosLoading) {
    return (
      <div className="p-16 text-center">
        <Loader2 size={28} className="mx-auto animate-spin text-primary/60" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-deep-wood/50">
          Loading pricing configuration
        </p>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="p-16 text-center">
        <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
        <p className="text-sm font-bold text-deep-wood">
          Pricing configuration could not be loaded.
        </p>
        <p className="mt-1 text-xs text-deep-wood/60">
          {errorText(plansErrObj, "The reservation system did not respond.")}
        </p>
        <button
          onClick={refetchPlans}
          className="mt-5 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Section switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-high rounded-xl border border-primary/20">
          {[
            {
              id: "plans",
              label: "Rate Plans",
              icon: Percent,
              count: plans.length,
            },
            { id: "addons", label: "Add-ons", icon: Tag, count: addons.length },
            {
              id: "promos",
              label: "Promo Codes",
              icon: Ticket,
              count: promos.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id)}
                className={[
                  "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer",
                  section === tab.id
                    ? "bg-primary text-white shadow-xs"
                    : "text-deep-wood/70 hover:text-deep-wood hover:bg-primary/10",
                ].join(" ")}
              >
                <Icon size={14} />
                <span>
                  {tab.label} ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            section === "plans"
              ? openPlan(null)
              : section === "addons"
                ? openAddon(null)
                : openPromo(null)
          }
          className="px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
        >
          <Plus size={15} />
          {section === "plans"
            ? "Add Rate Plan"
            : section === "addons"
              ? "Add Add-on"
              : "Add Code"}
        </button>
      </div>

      {/* Why this page exists */}
      <div className="mb-5 p-3.5 rounded-xl bg-surface-container-low/50 border border-primary/20 text-[11px] text-deep-wood/70 flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          These are resort-wide policy, shared by every villa. A plan's modifier
          is applied to each villa's own base rate, so changing one figure here
          moves the price on every villa page. Which plans a particular villa
          sells is set in the <strong>Villas</strong> tab.
        </span>
      </div>

      {/* ---------------- rate plans ---------------- */}
      {section === "plans" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isSurcharge = plan.discountPercent < 0;
            return (
              <div
                key={plan.id}
                className={[
                  "rounded-2xl border bg-surface p-5 flex flex-col justify-between transition-all",
                  plan.isOffered
                    ? "border-outline-variant/30 hover:shadow-md"
                    : "border-dashed border-amber-500/50 opacity-70",
                ].join(" ")}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {plan.badge && (
                        <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[10px] font-bold uppercase tracking-wider rounded-md">
                          {plan.badge}
                        </span>
                      )}
                      {!plan.isOffered && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                          Retired
                        </span>
                      )}
                    </div>

                    <span
                      className={[
                        "px-2.5 py-1 rounded-lg text-xs font-extrabold shrink-0",
                        isSurcharge
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : plan.discountPercent > 0
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-surface-container-high text-deep-wood/70 border border-outline-variant/40",
                      ].join(" ")}
                    >
                      {isSurcharge
                        ? `+${Math.abs(plan.discountPercent)}%`
                        : plan.discountPercent > 0
                          ? `−${plan.discountPercent}%`
                          : "Base"}
                    </span>
                  </div>

                  <h3 className="font-bold text-deep-wood text-sm mb-1">
                    {plan.name}
                  </h3>
                  {plan.tagline && (
                    <p className="text-[11px] text-deep-wood/60 leading-relaxed mb-3">
                      {plan.tagline}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span
                      className={[
                        "px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1",
                        plan.isRefundable
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-red-50 text-red-700",
                      ].join(" ")}
                    >
                      <Clock size={10} />
                      {plan.isRefundable
                        ? `Free cancel ${plan.cancellationHours}h`
                        : "Non-refundable"}
                    </span>
                    {plan.requiresPrepayment && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                        <CreditCard size={10} /> Prepaid
                      </span>
                    )}
                  </div>

                  <ul className="space-y-1.5">
                    {(plan.features ?? []).slice(0, 4).map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-[11px] text-deep-wood/70 leading-relaxed"
                      >
                        <CheckCircle2
                          size={12}
                          className="text-primary shrink-0 mt-0.5"
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                    {(plan.features?.length ?? 0) > 4 && (
                      <li className="text-[11px] text-deep-wood/45 font-semibold pl-4">
                        +{plan.features.length - 4} more
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t border-outline-variant/20 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openPlan(plan)}
                    className="py-2.5 rounded-xl bg-white border border-primary/30 hover:bg-primary/5 text-deep-wood text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Pencil size={12} className="text-primary" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan)}
                    disabled={!plan.isOffered}
                    className="py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-700 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Retire this plan. Existing reservations keep their terms."
                  >
                    <Trash2 size={12} /> Retire
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- add-ons ---------------- */}
      {section === "addons" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className="rounded-2xl border border-outline-variant/30 bg-surface p-5 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl leading-none">
                    {addon.icon || "✨"}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary font-heading block">
                      Rs.{Number(addon.price).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-deep-wood/55">
                      {CHARGE_BASES.find((c) => c.value === addon.chargeBasis)
                        ?.label ?? addon.chargeBasis}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-deep-wood text-sm mb-1">
                  {addon.name}
                </h3>
                <p className="text-[11px] text-deep-wood/60 leading-relaxed line-clamp-3">
                  {addon.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAddon(addon)}
                className="mt-4 py-2.5 rounded-xl bg-white border border-primary/30 hover:bg-primary/5 text-deep-wood text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Pencil size={12} className="text-primary" /> Edit Add-on
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- promo codes ---------------- */}
      {section === "promos" && (
        <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-high text-deep-wood/70 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Valid</th>
                <th className="px-4 py-3">Min nights</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {promos.map((promo) => (
                <tr
                  key={promo.code}
                  className={promo.isActive ? "" : "opacity-55"}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-deep-wood">
                      {promo.code}
                    </span>
                    {promo.description && (
                      <span className="block text-[11px] text-deep-wood/55 font-medium">
                        {promo.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-primary">
                    {promo.discountPercent}%
                  </td>
                  <td className="px-4 py-3 text-deep-wood/70">
                    {promo.validFrom || promo.validTo ? (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {(promo.validFrom ?? "").split("T")[0] || "—"} →{" "}
                        {(promo.validTo ?? "").split("T")[0] || "—"}
                      </span>
                    ) : (
                      "Always"
                    )}
                  </td>
                  <td className="px-4 py-3 text-deep-wood/70">
                    {promo.minNights}
                  </td>
                  <td className="px-4 py-3 text-deep-wood/70">
                    {promo.usedCount}
                    {promo.maxUses ? ` / ${promo.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider",
                        promo.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800",
                      ].join(" ")}
                    >
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openPromo(promo)}
                        className="p-2 rounded-lg text-deep-wood/60 hover:text-primary hover:bg-primary/10 cursor-pointer"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await deletePromo(promo.code).unwrap();
                            showToast(
                              res?.message || "Code deactivated.",
                              "success",
                            );
                          } catch (err) {
                            showToast(
                              errorText(
                                err,
                                "The code could not be deactivated.",
                              ),
                              "error",
                            );
                          }
                        }}
                        disabled={!promo.isActive}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Deactivate"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------- rate plan editor ---------------- */}
      <AnimatePresence>
        {editingPlan && (
          <EditorModal
            eyebrow={isNewPlan ? "New Resort Rate Plan" : "Rate Plan Editor"}
            title={isNewPlan ? "Create Rate Plan" : editingPlan.name}
            icon={<Percent size={22} />}
            onClose={() => setEditingPlan(null)}
            onSave={handleSavePlan}
            isSaving={savingPlan}
            error={planError}
            saveLabel={isNewPlan ? "Create Plan" : "Save Plan"}
          >
            <div className="p-5 bg-white border border-primary/20 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
                <Sparkles size={16} className="text-primary" />
                <h4
                  className="text-base font-bold text-deep-wood"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontStyle: "italic",
                  }}
                >
                  Plan Identity
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Plan Name" span={2} required>
                  <input
                    className={inputClass}
                    value={editingPlan.name}
                    onChange={(e) =>
                      setEditingPlan((p) => ({
                        ...p,
                        name: e.target.value,
                        id: isNewPlan ? toCode(e.target.value) : p.id,
                      }))
                    }
                    placeholder="Flexible Standard Rate"
                  />
                </Field>

                <Field
                  label="Plan Code"
                  required
                  hint={
                    isNewPlan
                      ? "Generated from the name."
                      : "Locked after creation."
                  }
                >
                  <input
                    className={`${inputClass} font-mono ${!isNewPlan ? "opacity-70 cursor-not-allowed" : ""}`}
                    value={editingPlan.id}
                    disabled={!isNewPlan}
                    onChange={(e) =>
                      setEditingPlan((p) => ({
                        ...p,
                        id: toCode(e.target.value),
                      }))
                    }
                  />
                </Field>

                <Field label="Badge" hint="Shown as a pill on the villa page.">
                  <input
                    className={inputClass}
                    value={editingPlan.badge}
                    onChange={(e) =>
                      setEditingPlan((p) => ({ ...p, badge: e.target.value }))
                    }
                    placeholder="Most Popular"
                  />
                </Field>

                <Field label="Tagline" span={2}>
                  <input
                    className={inputClass}
                    value={editingPlan.tagline}
                    onChange={(e) =>
                      setEditingPlan((p) => ({ ...p, tagline: e.target.value }))
                    }
                    placeholder="Full flexibility with no advance payment."
                  />
                </Field>
              </div>
            </div>

            <div className="p-5 bg-white border border-primary/20 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
                <ShieldCheck size={16} className="text-primary" />
                <h4
                  className="text-base font-bold text-deep-wood"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontStyle: "italic",
                  }}
                >
                  Pricing &amp; Terms
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Rate Modifier (%)"
                  required
                  hint="Positive discounts the villa's base rate; negative adds a surcharge. All-Inclusive uses −25."
                >
                  <input
                    type="number"
                    step={0.5}
                    min={-100}
                    max={100}
                    className={`${inputClass} font-mono`}
                    value={editingPlan.discountPercent}
                    onChange={(e) =>
                      setEditingPlan((p) => ({
                        ...p,
                        discountPercent: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Display Order" hint="Lower numbers appear first.">
                  <input
                    type="number"
                    className={inputClass}
                    value={editingPlan.displayOrder}
                    onChange={(e) =>
                      setEditingPlan((p) => ({
                        ...p,
                        displayOrder: e.target.value,
                      }))
                    }
                  />
                </Field>

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-surface-container-low/50 border border-primary/20 rounded-xl text-xs font-bold text-deep-wood cursor-pointer hover:bg-primary/5 transition-colors select-none">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={editingPlan.isRefundable}
                        onChange={(e) =>
                          setEditingPlan((p) => ({
                            ...p,
                            isRefundable: e.target.checked,
                            cancellationHours: e.target.checked
                              ? p.cancellationHours || 48
                              : "",
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          editingPlan.isRefundable
                            ? "bg-primary border-primary text-white"
                            : "bg-white border-outline-variant/60 hover:border-primary/50"
                        }`}
                      >
                        {editingPlan.isRefundable && (
                          <Check
                            size={12}
                            strokeWidth={3}
                            className="text-white"
                          />
                        )}
                      </div>
                    </div>
                    <span>Refundable — free cancellation</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-surface-container-low/50 border border-primary/20 rounded-xl text-xs font-bold text-deep-wood cursor-pointer hover:bg-primary/5 transition-colors select-none">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={editingPlan.requiresPrepayment}
                        onChange={(e) =>
                          setEditingPlan((p) => ({
                            ...p,
                            requiresPrepayment: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          editingPlan.requiresPrepayment
                            ? "bg-primary border-primary text-white"
                            : "bg-white border-outline-variant/60 hover:border-primary/50"
                        }`}
                      >
                        {editingPlan.requiresPrepayment && (
                          <Check
                            size={12}
                            strokeWidth={3}
                            className="text-white"
                          />
                        )}
                      </div>
                    </div>
                    <span>Full prepayment required</span>
                  </label>
                </div>

                {editingPlan.isRefundable && (
                  <Field
                    label="Cancellation Window (hours)"
                    required
                    hint="48 = two days before arrival. 168 = seven days."
                  >
                    <input
                      type="number"
                      min={1}
                      max={8760}
                      className={inputClass}
                      value={editingPlan.cancellationHours}
                      onChange={(e) =>
                        setEditingPlan((p) => ({
                          ...p,
                          cancellationHours: e.target.value,
                        }))
                      }
                    />
                  </Field>
                )}
              </div>
            </div>

            <div className="p-5 bg-white border border-primary/20 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
                <CheckCircle2 size={16} className="text-primary" />
                <h4
                  className="text-base font-bold text-deep-wood"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontStyle: "italic",
                  }}
                >
                  What This Plan Includes
                </h4>
              </div>

              <Field
                label="Inclusions"
                required
                hint="One per line. These are the bullets a guest reads when choosing between plans."
              >
                <textarea
                  rows={9}
                  className={`${inputClass} leading-relaxed resize-none`}
                  value={editingPlan.features.join("\n")}
                  onChange={(e) =>
                    setEditingPlan((p) => ({
                      ...p,
                      features: e.target.value.split("\n"),
                    }))
                  }
                  placeholder={
                    "Daily Sri Lankan and Continental breakfast for two\nFree cancellation up to 48 hours before arrival\nWelcome thambili and chilled lemongrass towel on arrival"
                  }
                />
              </Field>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2.5">
                <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Rates are quoted before <strong>34.38%</strong> in government
                  taxes and service charge — 10% service, 1% TDL, 2.5% SSCL and
                  18% VAT, applied as a cascade. If an inclusion line says taxes
                  are included, make sure it agrees with how the folio is
                  presented.
                </span>
              </div>
            </div>
          </EditorModal>
        )}
      </AnimatePresence>

      {/* ---------------- add-on editor ---------------- */}
      <AnimatePresence>
        {editingAddon && (
          <EditorModal
            eyebrow={isNewAddon ? "New Guest Experience" : "Add-on Editor"}
            title={isNewAddon ? "Create Add-on" : editingAddon.name}
            icon={<Tag size={22} />}
            onClose={() => setEditingAddon(null)}
            onSave={handleSaveAddon}
            isSaving={savingAddon}
            error={addonError}
            saveLabel={isNewAddon ? "Create Add-on" : "Save Add-on"}
          >
            <div className="p-5 bg-white border border-primary/20 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Add-on Name" span={2} required>
                <input
                  className={inputClass}
                  value={editingAddon.name}
                  onChange={(e) =>
                    setEditingAddon((a) => ({
                      ...a,
                      name: e.target.value,
                      id: isNewAddon ? toCode(e.target.value) : a.id,
                    }))
                  }
                  placeholder="Luxury SUV Airport Transfer"
                />
              </Field>

              <Field
                label="Add-on Code"
                required
                hint={isNewAddon ? "Generated from the name." : "Locked."}
              >
                <input
                  className={`${inputClass} font-mono ${!isNewAddon ? "opacity-70 cursor-not-allowed" : ""}`}
                  value={editingAddon.id}
                  disabled={!isNewAddon}
                  onChange={(e) =>
                    setEditingAddon((a) => ({
                      ...a,
                      id: toCode(e.target.value),
                    }))
                  }
                />
              </Field>

              <Field
                label="Icon"
                hint="A single emoji, shown on the checkout card."
              >
                <input
                  className={inputClass}
                  value={editingAddon.icon}
                  onChange={(e) =>
                    setEditingAddon((a) => ({ ...a, icon: e.target.value }))
                  }
                  placeholder="🚗"
                />
              </Field>

              <Field label="Description" span={2}>
                <textarea
                  rows={3}
                  className={`${inputClass} resize-none leading-relaxed`}
                  value={editingAddon.description}
                  onChange={(e) =>
                    setEditingAddon((a) => ({
                      ...a,
                      description: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Price (LKR)" required>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  className={inputClass}
                  value={editingAddon.price}
                  onChange={(e) =>
                    setEditingAddon((a) => ({ ...a, price: e.target.value }))
                  }
                />
              </Field>

              <Field
                label="Charge Basis"
                hint="Per night multiplies by the stay length; per guest by the party size."
              >
                <select
                  className={`${inputClass} cursor-pointer`}
                  value={editingAddon.chargeBasis}
                  onChange={(e) =>
                    setEditingAddon((a) => ({
                      ...a,
                      chargeBasis: e.target.value,
                    }))
                  }
                >
                  {CHARGE_BASES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Display Order">
                <input
                  type="number"
                  className={inputClass}
                  value={editingAddon.displayOrder}
                  onChange={(e) =>
                    setEditingAddon((a) => ({
                      ...a,
                      displayOrder: e.target.value,
                    }))
                  }
                />
              </Field>

              <div className="flex items-end">
                <label className="flex items-center gap-3 p-3 bg-surface-container-low/50 border border-primary/20 rounded-xl text-xs font-bold text-deep-wood cursor-pointer w-full hover:bg-primary/5 transition-colors select-none">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={editingAddon.isActive}
                      onChange={(e) =>
                        setEditingAddon((a) => ({
                          ...a,
                          isActive: e.target.checked,
                        }))
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        editingAddon.isActive
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-outline-variant/60 hover:border-primary/50"
                      }`}
                    >
                      {editingAddon.isActive && (
                        <Check
                          size={12}
                          strokeWidth={3}
                          className="text-white"
                        />
                      )}
                    </div>
                  </div>
                  <span>Offer this add-on at checkout</span>
                </label>
              </div>
            </div>
          </EditorModal>
        )}
      </AnimatePresence>

      {/* ---------------- promo editor ---------------- */}
      <AnimatePresence>
        {editingPromo && (
          <EditorModal
            eyebrow="Promotional Code"
            title={editingPromo.code || "Create Promotional Code"}
            icon={<Ticket size={22} />}
            onClose={() => setEditingPromo(null)}
            onSave={handleSavePromo}
            isSaving={savingPromo}
            error={promoError}
            saveLabel="Save Code"
          >
            <div className="p-5 bg-white border border-primary/20 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Code"
                required
                hint="Stored and matched in upper case."
              >
                <input
                  className={`${inputClass} font-mono uppercase`}
                  value={editingPromo.code}
                  onChange={(e) =>
                    setEditingPromo((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="AVIORA10"
                />
              </Field>

              <Field label="Discount (%)" required>
                <input
                  type="number"
                  min={0.01}
                  max={100}
                  step={0.5}
                  className={inputClass}
                  value={editingPromo.discountPercent}
                  onChange={(e) =>
                    setEditingPromo((p) => ({
                      ...p,
                      discountPercent: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Description" span={2}>
                <input
                  className={inputClass}
                  value={editingPromo.description}
                  onChange={(e) =>
                    setEditingPromo((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  placeholder="2026 season opening offer"
                />
              </Field>

              <Field label="Valid From" hint="Leave blank for no start date.">
                <input
                  type="date"
                  className={inputClass}
                  value={editingPromo.validFrom}
                  onChange={(e) =>
                    setEditingPromo((p) => ({
                      ...p,
                      validFrom: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Valid To" hint="Leave blank for no end date.">
                <input
                  type="date"
                  className={inputClass}
                  value={editingPromo.validTo}
                  onChange={(e) =>
                    setEditingPromo((p) => ({ ...p, validTo: e.target.value }))
                  }
                />
              </Field>

              <Field label="Maximum Uses" hint="Leave blank for unlimited.">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={editingPromo.maxUses}
                  onChange={(e) =>
                    setEditingPromo((p) => ({ ...p, maxUses: e.target.value }))
                  }
                  placeholder="Unlimited"
                />
              </Field>

              <Field
                label="Minimum Nights"
                hint="The stay must be at least this long."
              >
                <input
                  type="number"
                  min={1}
                  max={365}
                  className={inputClass}
                  value={editingPromo.minNights}
                  onChange={(e) =>
                    setEditingPromo((p) => ({
                      ...p,
                      minNights: e.target.value,
                    }))
                  }
                />
              </Field>

              <div className="sm:col-span-2 flex items-center">
                <label className="flex items-center gap-3 p-3 bg-surface-container-low/50 border border-primary/20 rounded-xl text-xs font-bold text-deep-wood cursor-pointer w-full hover:bg-primary/5 transition-colors select-none">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={editingPromo.isActive}
                      onChange={(e) =>
                        setEditingPromo((p) => ({
                          ...p,
                          isActive: e.target.checked,
                        }))
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        editingPromo.isActive
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-outline-variant/60 hover:border-primary/50"
                      }`}
                    >
                      {editingPromo.isActive && (
                        <Check
                          size={12}
                          strokeWidth={3}
                          className="text-white"
                        />
                      )}
                    </div>
                  </div>
                  <span>Code is active and accepted at checkout</span>
                </label>
              </div>
            </div>
          </EditorModal>
        )}
      </AnimatePresence>

      {/* Top-Right Animated Toast Notification with Reducing Progress Bar */}
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
