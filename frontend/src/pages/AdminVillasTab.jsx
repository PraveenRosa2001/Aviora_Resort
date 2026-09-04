import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Save,
  AlertTriangle,
  ImagePlus,
  Loader2,
  EyeOff,
  Star,
  Sparkles,
  CheckCircle2,
  Check,
  Layers,
  Image as ImageIcon,
  DollarSign,
  ArrowLeft,
  Maximize2,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  useGetAdminVillasQuery,
  useCreateVillaMutation,
  useUpdateVillaMutation,
  useDeleteVillaMutation,
  useRestoreVillaMutation,
  useSaveVillaRatePlansMutation,
} from "../features/rooms/roomsApi";
import ToastAlert from "../components/common/Toast";

/* --------------------------------------------------------------------------
   Module-level constants.
   -------------------------------------------------------------------------- */

const CATEGORIES = ["canopy", "lagoon", "treetop", "beachfront"];
const VIEWS = ["forest", "ocean", "garden", "pool"];

/** Matches CK_VillaImages_Order and UX_VillaImages_Villa_Order in the database. */
const GALLERY_SLOTS = 6;

const EMPTY_VILLA = {
  id: "",
  slug: "",
  name: "",
  category: "canopy",
  view: "forest",
  tagline: "",
  description: "",
  pricePerNight: 150000,
  currency: "LKR",
  size: 200,
  sizeUnit: "sqm",
  maxOccupancy: 2,
  bedConfiguration: "1 King Bedroom",
  totalUnits: 1,
  popularBadge: "",
  image: "",
  sustainability: "",
  featured: false,
  displayOrder: 0,
  images: [],
  amenities: [],
};

/** "Canopy Forest Villa" -> "canopy-forest-villa" */
const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/** Pulls the API's { message } out of an RTK Query error of any shape. */
const errorText = (err, fallback) =>
  err?.data?.message || err?.error || fallback;

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

const inputClass =
  "w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-outline-variant/40 rounded-xl " +
  "text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all placeholder:text-deep-wood/35";

/** Multi-line box that turns one entry per line into an array. */
function ListEditor({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required = false,
}) {
  return (
    <Field label={label} span={2} required={required}>
      <textarea
        rows={4}
        value={value.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
        placeholder={placeholder}
        className={`${inputClass} font-mono text-xs leading-relaxed resize-none`}
      />
      <div className="flex justify-between items-center mt-1.5">
        <p className="text-[11px] text-deep-wood/60 font-medium">{hint}</p>
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
          {value.length} item(s) configured
        </span>
      </div>
    </Field>
  );
}

/** Six fixed gallery slots with thumbnails. */
function GallerySlots({ value = [], onChange, heroUrl = "" }) {
  const hero = (heroUrl || "").trim().toLowerCase();
  const slots = Array.from({ length: GALLERY_SLOTS }, (_, i) => value[i] ?? "");

  const setSlot = (index, url) => {
    const next = [...slots];
    next[index] = url;
    onChange(
      next.filter(
        (slot, i) => slot.trim() || next.slice(i + 1).some((v) => v.trim()),
      ),
    );
  };

  const filled = slots.filter((s) => s.trim()).length;
  const heroClash =
    hero && slots.some((s) => s.trim().toLowerCase() === hero);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-deep-wood">
          Gallery Photographs ({filled} of {GALLERY_SLOTS})
        </label>
        <span className="text-[11px] text-deep-wood/60 font-medium">
          6 Secondary Slots
        </span>
      </div>

      <div className="space-y-2">
        {slots.map((url, index) => {
          const clashesWithHero =
            url.trim() && url.trim().toLowerCase() === hero;

          return (
            <div key={index} className="flex items-center gap-2.5">
              <span className="shrink-0 w-6 text-[11px] font-bold text-deep-wood/50 text-center font-mono">
                {index + 1}
              </span>

              <div className="shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shadow-xs">
                {url.trim() ? (
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                    onLoad={(e) => {
                      e.currentTarget.style.visibility = "visible";
                    }}
                  />
                ) : (
                  <ImageIcon size={14} className="text-deep-wood/30" />
                )}
              </div>

              <input
                className={`${inputClass} flex-1 text-xs font-mono py-2 ${
                  clashesWithHero ? "border-amber-500 focus:border-amber-600" : ""
                }`}
                value={url}
                onChange={(e) => setSlot(index, e.target.value)}
                placeholder={`/assets/images/villas/gallery-0${index + 1}.jpg`}
              />

              {url.trim() && (
                <button
                  type="button"
                  onClick={() => setSlot(index, "")}
                  className="p-1.5 rounded-lg text-deep-wood/40 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Clear this photograph"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {heroClash && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            One of the gallery slots matches the Hero Image URL. The hero is
            shown automatically as slide one, so duplicating it in the gallery
            creates a redundant second slide.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminVillasTab() {
  const { data: villas = [], isLoading } = useGetAdminVillasQuery();
  const [createVilla, { isLoading: isCreating }] = useCreateVillaMutation();
  const [updateVilla, { isLoading: isUpdating }] = useUpdateVillaMutation();
  const [deleteVilla, { isLoading: isDeleting }] = useDeleteVillaMutation();
  const [restoreVilla] = useRestoreVillaMutation();
  const [saveVillaRatePlans, { isLoading: isSavingPlans }] =
    useSaveVillaRatePlansMutation();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast(typeof msg === "string" ? { message: msg, type } : msg);
  };

  const isSaving = isCreating || isUpdating || isSavingPlans;
  const isNew = editing && !editing.createdAt;

  // Filtered villas list
  const filtered = villas.filter((v) => {
    if (filterCategory !== "all" && v.category !== filterCategory) return false;
    if (filterStatus === "active" && !v.isActive) return false;
    if (filterStatus === "retired" && v.isActive) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        v.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = villas.filter((v) => v.isActive).length;
  const retiredCount = villas.filter((v) => !v.isActive).length;

  const openNew = () => {
    setFormError("");
    setEditing({ ...EMPTY_VILLA });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (villa) => {
    setFormError("");
    setEditing({
      ...villa,
      images: Array.isArray(villa.images) ? [...villa.images] : [],
      amenities: Array.isArray(villa.amenities) ? [...villa.amenities] : [],
      // The API returns discountPercent (the effective figure) and
      // hasOverride. It does not return overridePercent, so spreading the
      // object left it undefined - and `undefined !== null` is true, which
      // made the override checkbox tick itself on every plan with an empty
      // number box beside it.
      ratePlans: Array.isArray(villa.ratePlans)
        ? villa.ratePlans.map((rp) => ({
            ...rp,
            defaultPercent: Number(rp.discountPercent),
            overridePercent: rp.hasOverride ? Number(rp.discountPercent) : null,
          }))
        : [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setEditing(null);
    setFormError("");
  };

  const setField = (field, value) => {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleNameChange = (name) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const next = { ...prev, name };
      if (isNew) {
        const slug = toSlug(name);
        next.id = slug;
        next.slug = slug;
      }
      return next;
    });
  };

  const handleSave = async () => {
    setFormError("");
    if (!editing.name.trim()) {
      setFormError("Villa name is required.");
      return;
    }
    if (!editing.id.trim()) {
      setFormError("Villa code is required.");
      return;
    }
    if (!editing.image.trim()) {
      setFormError("Hero image URL is required.");
      return;
    }

    const payload = {
      ...editing,
      pricePerNight: Number(editing.pricePerNight),
      size: Number(editing.size),
      maxOccupancy: Number(editing.maxOccupancy),
      totalUnits: Number(editing.totalUnits),
      // availableSlots is no longer part of SaveVillaRequestDto - module 4
      // dropped dbo.Villas.AvailableSlots and made availability a property of
      // dbo.VillaInventory, one row per villa per night. Capacity is
      // totalUnits; per-night adjustments belong to the inventory grid.
      displayOrder: Number(editing.displayOrder || 0),
    };

    try {
      if (isNew) {
        await createVilla(payload).unwrap();
        showToast(`Villa "${editing.name}" created successfully.`);
      } else {
        // roomsApi destructures { villaCode, ...villa }. Sending `id` left
        // villaCode undefined, so the request went to
        //   PUT /api/admin/villas/undefined
        // which matched the route, found no villa with that code, and came
        // back as 404 "That villa no longer exists."
        await updateVilla({ villaCode: editing.id, ...payload }).unwrap();
        if (editing.ratePlans && editing.ratePlans.length > 0) {
          // VillaRatePlanSettingDto expects discountPercentOverride.
          // `overridePercent` bound to nothing, so the override silently
          // arrived as null and was never saved.
          const plansPayload = editing.ratePlans.map((plan) => ({
            ratePlanId: plan.id,
            isOffered: Boolean(plan.isOffered),
            discountPercentOverride:
              plan.overridePercent === null || plan.overridePercent === undefined
                ? null
                : Number(plan.overridePercent),
          }));
          await saveVillaRatePlans({
            villaCode: editing.id,
            plans: plansPayload,
          }).unwrap();
        }
        showToast(`Villa "${editing.name}" updated successfully.`);
      }
      closeForm();
    } catch (err) {
      setFormError(errorText(err, "Could not save villa. Please check all fields."));
    }
  };

  const handleDelete = async (villa, hard = false) => {
    try {
      // Same fix as the update call, plus the flag is named `force` on the
      // API side - `hard` was being dropped, so a permanent delete only ever
      // performed a soft retire.
      await deleteVilla({ villaCode: villa.id, force: hard }).unwrap();
      showToast(
        hard
          ? `Villa "${villa.name}" deleted permanently.`
          : `Villa "${villa.name}" retired from guest catalogue.`,
      );
      setConfirmDelete(null);
    } catch (err) {
      showToast(errorText(err, "Could not delete villa."), "error");
    }
  };

  const handleRestore = async (villa) => {
    try {
      await restoreVilla(villa.id).unwrap();
      showToast(`Villa "${villa.name}" restored to active catalogue.`, "success");
    } catch (err) {
      showToast(errorText(err, "Could not restore villa."), "error");
    }
  };

  /* ==========================================================================
     FULL-PAGE VILLA SPECIFICATION WORKSPACE VIEW (When Editing)
     ========================================================================== */

  if (editing) {
    return (
      <div
        className="p-6 md:p-8 space-y-6 text-deep-wood"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {/* ── Top Header & Breadcrumb Strip ── */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-deep-wood/60">
              <button
                type="button"
                onClick={closeForm}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Villa Inventory
              </button>
              <span>/</span>
              <span className="text-primary font-bold">
                {isNew ? "New Sanctuary" : `Edit: ${editing.name || editing.id}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="w-9 h-9 rounded-xl bg-white border border-outline-variant/40 hover:bg-primary hover:text-white text-deep-wood flex items-center justify-center transition-colors cursor-pointer mr-1 shadow-xs"
                title="Return to inventory table"
              >
                <ArrowLeft size={16} />
              </button>

              <h2
                className="text-2xl sm:text-3xl font-bold text-deep-wood italic"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {isNew ? "Create Villa Sanctuary" : editing.name || "Edit Villa"}
              </h2>

              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {editing.category} • {editing.view} View
              </span>

              {!isNew && (
                <span className="text-xs font-mono text-deep-wood/60 font-semibold">
                  Code: {editing.id}
                </span>
              )}
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={closeForm}
              className="px-5 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>{isNew ? "Create Sanctuary" : "Save Specifications"}</span>
            </button>
          </div>
        </div>

        {/* ── Form Error Banner ── */}
        {formError && (
          <div className="p-4 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2.5 shadow-sm">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* ── 2-Column Specification Form Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Sections (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Villa Identity */}
            <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <Sparkles size={18} className="text-primary" />
                <h3
                  className="text-lg font-bold text-deep-wood"
                  style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                >
                  Villa Identity &amp; Categorization
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Sanctuary Name" span={2} required>
                  <input
                    className={inputClass}
                    value={editing.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Canopy Forest Villa"
                  />
                </Field>

                <Field
                  label="Villa Code (Primary Key)"
                  required
                  hint={
                    isNew
                      ? "Auto-generated from name. Used in routes."
                      : "Locked after creation to preserve reservation history."
                  }
                >
                  <input
                    className={`${inputClass} font-mono ${
                      !isNew ? "bg-surface-container-high/60 cursor-not-allowed opacity-75" : ""
                    }`}
                    value={editing.id}
                    disabled={!isNew}
                    onChange={(e) => setField("id", toSlug(e.target.value))}
                    placeholder="canopy-villa-01"
                  />
                </Field>

                <Field
                  label="URL Slug"
                  required
                  hint="Web routing slug identifier."
                >
                  <input
                    className={`${inputClass} font-mono`}
                    value={editing.slug}
                    onChange={(e) => setField("slug", toSlug(e.target.value))}
                    placeholder="canopy-forest-villa"
                  />
                </Field>

                <Field label="Resort Category" required>
                  <select
                    className={`${inputClass} capitalize cursor-pointer`}
                    value={editing.category}
                    onChange={(e) => setField("category", e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Panoramic Vista" required>
                  <select
                    className={`${inputClass} capitalize cursor-pointer`}
                    value={editing.view}
                    onChange={(e) => setField("view", e.target.value)}
                  >
                    {VIEWS.map((v) => (
                      <option key={v} value={v}>
                        {v} View
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Editorial Tagline"
                  span={2}
                  hint="Short poetic summary shown on guest cards."
                >
                  <input
                    className={inputClass}
                    value={editing.tagline}
                    onChange={(e) => setField("tagline", e.target.value)}
                    placeholder="e.g. Suspended high above the rainforest canopy with private plunge pool"
                  />
                </Field>

                <Field
                  label="Architectural Concept & Description"
                  span={2}
                  required
                >
                  <textarea
                    rows={4}
                    className={`${inputClass} leading-relaxed resize-none`}
                    value={editing.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Detailed narrative describing the sanctuary design, views, plunge pool, and guest experience..."
                  />
                </Field>

                <Field
                  label="Biophilic Sustainability Commitment"
                  span={2}
                  hint="Zero-carbon credentials, rainwater catchment, solar energy."
                >
                  <input
                    className={inputClass}
                    value={editing.sustainability}
                    onChange={(e) => setField("sustainability", e.target.value)}
                    placeholder="e.g. 100% solar powered, rainwater harvesting, zero single-use plastics"
                  />
                </Field>
              </div>
            </div>

            {/* Section 2: Dimensions & Capacity */}
            <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <Maximize2 size={18} className="text-primary" />
                <h3
                  className="text-lg font-bold text-deep-wood"
                  style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                >
                  Dimensions, Layout &amp; Capacity
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Floor Area" required>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      max={2000}
                      className={inputClass}
                      value={editing.size}
                      onChange={(e) => setField("size", e.target.value)}
                    />
                    <select
                      className={`${inputClass} w-24`}
                      value={editing.sizeUnit}
                      onChange={(e) => setField("sizeUnit", e.target.value)}
                    >
                      <option value="sqm">sqm</option>
                      <option value="sqft">sqft</option>
                    </select>
                  </div>
                </Field>

                <Field label="Max Occupancy" required>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={inputClass}
                    value={editing.maxOccupancy}
                    onChange={(e) => setField("maxOccupancy", e.target.value)}
                  />
                </Field>

                <Field label="Total Physical Units" required>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={inputClass}
                    value={editing.totalUnits}
                    onChange={(e) => setField("totalUnits", e.target.value)}
                  />
                </Field>

                <Field label="Bed Configuration" span={2} required>
                  <input
                    className={inputClass}
                    value={editing.bedConfiguration}
                    onChange={(e) => setField("bedConfiguration", e.target.value)}
                    placeholder="e.g. 1 King Bedroom + Daybed"
                  />
                </Field>

                <Field label="Popularity Badge">
                  <input
                    className={inputClass}
                    value={editing.popularBadge}
                    onChange={(e) => setField("popularBadge", e.target.value)}
                    placeholder="e.g. Honeymoon Favorite"
                  />
                </Field>
              </div>
            </div>

            {/* Section 3: Base Rates */}
            <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <span className="text-base font-bold text-primary">LKR</span>
                <h3
                  className="text-lg font-bold text-deep-wood"
                  style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                >
                  Standard Base Nightly Tariff
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Standard Base Rate (per night)"
                  required
                  hint="Base price before published rate plan discounts or seasonal multipliers."
                >
                  <div className="relative">
                    <input
                      type="number"
                      step={50}
                      min={50}
                      className={`${inputClass} pl-10 font-mono`}
                      value={editing.pricePerNight}
                      onChange={(e) => setField("pricePerNight", e.target.value)}
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-deep-wood/50 pointer-events-none">
  LKR
</span>
                  </div>
                </Field>

                <Field label="Tariff Currency" required>
                  <select
                    className={inputClass}
                    value={editing.currency}
                    onChange={(e) => setField("currency", e.target.value)}
                  >
                    {/* The resort prices in rupees. dbo.Villas.Currency is
                        NCHAR(3), so this is the ISO code - "Rs." is the
                        display prefix used in the UI. */}
                    <option value="LKR">LKR (Rs.)</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Section 4: Rate Plans & Modifiers */}
            {!isNew && Array.isArray(editing.ratePlans) && (
              <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-primary" />
                    <h3
                      className="text-lg font-bold text-deep-wood"
                      style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                    >
                      Published Rate Plans &amp; Custom Modifiers
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-secondary bg-secondary/10 border border-secondary/20 px-3 py-1 rounded-lg">
                    Live Calculation
                  </span>
                </div>

                <div className="space-y-3">
                  {editing.ratePlans.map((plan, index) => {
                    const update = (patch) => {
                      const next = [...editing.ratePlans];
                      next[index] = { ...next[index], ...patch };
                      setEditing({ ...editing, ratePlans: next });
                    };

                    const effectivePercent =
                      plan.overridePercent !== null
                        ? plan.overridePercent
                        : plan.defaultPercent;
                    const calculatedPrice = Math.round(
                      editing.pricePerNight * (1 - effectivePercent / 100),
                    );

                    return (
                      <div
                        key={plan.id}
                        className={[
                          "p-4 rounded-xl border transition-all space-y-3",
                          plan.isOffered
                            ? "bg-surface-container-lowest border-primary/30 shadow-xs"
                            : "bg-surface-container-high/30 border-outline-variant/30 opacity-70",
                        ].join(" ")}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={plan.isOffered}
                                onChange={(e) =>
                                  update({ isOffered: e.target.checked })
                                }
                                className="sr-only"
                              />
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                  plan.isOffered
                                    ? "bg-primary border-primary text-white"
                                    : "bg-white border-outline-variant/60 hover:border-primary/50"
                                }`}
                              >
                                {plan.isOffered && (
                                  <Check size={12} strokeWidth={3} className="text-white" />
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-xs sm:text-sm text-deep-wood">
                              {plan.name}
                            </span>
                            {plan.badge && (
                              <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[10px] font-bold uppercase rounded-md">
                                {plan.badge}
                              </span>
                            )}
                          </label>

                          <div className="text-right">
                            <span className="text-sm sm:text-base font-bold text-primary font-heading">
                              Rs. {calculatedPrice.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-deep-wood/55 font-medium ml-1">
                              / night
                            </span>
                          </div>
                        </div>

                        {plan.isOffered && (
                          <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-xs font-semibold text-deep-wood/75 cursor-pointer select-none">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={plan.overridePercent !== null}
                                  onChange={(e) =>
                                    update({
                                      overridePercent: e.target.checked
                                        ? plan.defaultPercent
                                        : null,
                                    })
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                                    plan.overridePercent !== null
                                      ? "bg-primary border-primary text-white"
                                      : "bg-white border-outline-variant/60 hover:border-primary/50"
                                  }`}
                                >
                                  {plan.overridePercent !== null && (
                                    <Check size={10} strokeWidth={3} className="text-white" />
                                  )}
                                </div>
                              </div>
                              <span>Override resort modifier</span>
                            </label>

                            {plan.overridePercent !== null ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step={0.5}
                                  min={-100}
                                  max={100}
                                  value={plan.overridePercent}
                                  onChange={(e) =>
                                    update({
                                      overridePercent: Number(e.target.value),
                                    })
                                  }
                                  className="w-24 px-3 py-1.5 text-xs bg-white border border-outline-variant/40 rounded-lg font-mono focus:border-primary focus:outline-none"
                                />
                                <span className="text-[11px] text-deep-wood/60 font-medium">
                                  % {plan.overridePercent >= 0 ? "discount" : "surcharge"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-deep-wood/50 font-medium">
                                (Resort default: {plan.defaultPercent}%)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 5: Amenities & Publishing */}
            <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <CheckCircle2 size={18} className="text-primary" />
                <h3
                  className="text-lg font-bold text-deep-wood"
                  style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                >
                  Curated Amenities &amp; Publishing Options
                </h3>
              </div>

              <ListEditor
                label="Exclusive Inclusions & Amenities"
                required
                value={editing.amenities}
                onChange={(v) => setField("amenities", v)}
                placeholder={
                  "Private freshwater infinity plunge pool\nDedicated 24/7 butler service\nOutdoor rain shower & forest soaking tub"
                }
                hint="One amenity per line. Automatically synchronizes with public filters."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Field
                  label="Display Sort Order"
                  hint="Lower integers appear higher in the resort catalogue."
                >
                  <input
                    type="number"
                    className={inputClass}
                    value={editing.displayOrder}
                    onChange={(e) => setField("displayOrder", e.target.value)}
                  />
                </Field>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 p-3.5 bg-surface-container-low border border-primary/20 rounded-xl text-xs font-bold text-deep-wood cursor-pointer w-full hover:bg-primary/5 transition-colors select-none">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={editing.featured}
                        onChange={(e) => setField("featured", e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          editing.featured
                            ? "bg-primary border-primary text-white"
                            : "bg-white border-outline-variant/60 hover:border-primary/50"
                        }`}
                      >
                        {editing.featured && (
                          <Check size={12} strokeWidth={3} className="text-white" />
                        )}
                      </div>
                    </div>
                    <span>Feature this sanctuary on the Home Page</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Assets & Live Preview (4 Cols - Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            {/* Visual Assets & Gallery */}
            <div className="p-6 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                <ImagePlus size={18} className="text-primary" />
                <h3
                  className="text-base sm:text-lg font-bold text-deep-wood"
                  style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                >
                  Visual Assets &amp; Gallery
                </h3>
              </div>

              {/* Hero Image */}
              <Field
                label="Hero Main Photograph URL"
                required
                hint="Cover photograph for listing cards and header banner."
              >
                <div className="space-y-2">
                  <input
                    className={`${inputClass} font-mono text-xs`}
                    value={editing.image}
                    onChange={(e) => setField("image", e.target.value)}
                    placeholder="/assets/images/villas/canopy-villa-01.jpg"
                  />
                  {editing.image && (
                    <div className="relative h-36 rounded-xl overflow-hidden border border-primary/20 bg-surface-container-high shadow-inner">
                      <img
                        src={editing.image}
                        alt="Hero preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </Field>

              {/* 6 Gallery Slots */}
              <GallerySlots
                value={editing.images}
                onChange={(v) => setField("images", v)}
                heroUrl={editing.image}
              />
            </div>

            {/* Live Guest Card Preview */}
            <div className="p-5 bg-white border border-primary/25 rounded-2xl shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block font-mono">
                Live Guest Card Preview
              </span>

              <div className="rounded-xl overflow-hidden border border-primary/20 bg-white shadow-xs">
                <div className="relative h-36 bg-surface-container-high overflow-hidden">
                  <img
                    src={editing.image || "/assets/images/villas/canopy-villa-01.jpg"}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/images/villas/canopy-villa-01.jpg";
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-deep-wood/80 backdrop-blur-md text-sand text-[10px] font-bold uppercase rounded-md">
                    {editing.category}
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4
                      className="font-bold text-deep-wood text-sm italic truncate"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {editing.name || "Untitled Sanctuary"}
                    </h4>
                    <span className="text-xs font-bold text-primary">
                      Rs.{Number(editing.pricePerNight).toLocaleString()}/nt
                    </span>
                  </div>

                  <p className="text-[11px] text-deep-wood/70 line-clamp-2">
                    {editing.tagline || editing.description || "Villa description preview..."}
                  </p>

                  <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] font-semibold text-deep-wood/60">
                    <span>{editing.size} sqm</span>
                    <span>Max {editing.maxOccupancy} Guests</span>
                    <span className="capitalize">{editing.view} View</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            {/* <div className="p-4 bg-surface-container-low border border-primary/20 rounded-xl flex items-center gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>Save</span>
              </button>
            </div> */}
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     INVENTORY MANAGEMENT TABLE / GRID VIEW (Default)
     ========================================================================== */

  return (
    <div
      className="p-6 md:p-8 space-y-6 text-deep-wood"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── Redesigned Search, Filters & Add Villa Toolbar ── */}
      <div className="p-3 sm:p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Left & Center Controls: Search + Category + Status */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px]">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-wood/40 pointer-events-none"
            />
            <input
              type="text"
              className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm bg-white border border-outline-variant/40 rounded-xl text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all placeholder:text-deep-wood/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, villa code, or slug..."
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-deep-wood/40 hover:text-deep-wood transition-colors p-1 rounded-full hover:bg-black/5"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative shrink-0 min-w-[145px] sm:w-44">
            <select
              className="w-full h-10 pl-3.5 pr-8 text-xs sm:text-sm bg-white border border-outline-variant/40 rounded-xl text-deep-wood font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all capitalize cursor-pointer appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-deep-wood/40 pointer-events-none"
            />
          </div>

          {/* Status Segmented Filter */}
          <div className="flex items-center shrink-0 p-1 bg-surface-container-high rounded-xl border border-outline-variant/30 h-10">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={[
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                filterStatus === "all"
                  ? "bg-white text-deep-wood shadow-xs"
                  : "text-deep-wood/60 hover:text-deep-wood",
              ].join(" ")}
            >
              All ({villas.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus("active")}
              className={[
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                filterStatus === "active"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-deep-wood/60 hover:text-deep-wood",
              ].join(" ")}
            >
              Active ({activeCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus("retired")}
              className={[
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                filterStatus === "retired"
                  ? "bg-white text-red-700 shadow-xs"
                  : "text-deep-wood/60 hover:text-deep-wood",
              ].join(" ")}
            >
              Retired ({retiredCount})
            </button>
          </div>
        </div>

        {/* Right: Add Villa CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={openNew}
            className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Villa</span>
          </button>
        </div>
      </div>

      {/* ── Villa Cards Inventory Grid (Restored Exact Previous Design) ── */}
      {isLoading ? (
        <div className="p-16 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
          <Loader2 size={32} className="mx-auto animate-spin text-primary mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider text-deep-wood/60">
            Loading villa catalogue…
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl space-y-3">
          <Layers size={36} className="mx-auto text-primary/40" />
          <h3
            className="text-xl font-bold text-deep-wood"
            style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
          >
            No Villas Match Your Filter
          </h3>
          <p className="text-xs text-deep-wood/60 max-w-sm mx-auto">
            Try adjusting your search query or status filter to find sanctuaries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((villa) => (
            <div
              key={villa.id}
              className={[
                "rounded-2xl border overflow-hidden flex flex-col justify-between transition-all bg-white",
                villa.isActive
                  ? "border-outline-variant/30 hover:border-primary/50 shadow-xs hover:shadow-md"
                  : "border-dashed border-outline-variant/50 bg-surface-container-high/30 opacity-75",
              ].join(" ")}
            >
              {/* Image banner */}
              <div className="relative h-48 bg-surface-container-high overflow-hidden">
                <img
                  src={villa.image}
                  alt={villa.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/images/villas/canopy-villa-01.jpg";
                  }}
                />

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {!villa.isActive && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-red-600 text-white shadow-xs">
                      Retired
                    </span>
                  )}
                  {villa.featured && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-secondary text-white shadow-xs">
                      Featured
                    </span>
                  )}
                </div>

                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/60 backdrop-blur-md text-white font-bold">
                  {villa.images?.length ?? 0}/{GALLERY_SLOTS}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      {villa.category}
                    </span>
                    <span className="text-xs font-bold text-deep-wood font-heading">
                      Rs.{Number(villa.pricePerNight).toLocaleString()}/nt
                    </span>
                  </div>

                  <h3 className="font-bold text-deep-wood text-sm mb-1">
                    {villa.name}
                  </h3>

                  <p className="text-[11px] text-deep-wood/60 line-clamp-2">
                    {villa.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-deep-wood/70">
                  <span>Max {villa.maxOccupancy}</span>
                  <span className="flex items-center gap-1 font-semibold text-secondary">
                    <Star size={11} fill="currentColor" />
                    {Number(villa.rating ?? 0).toFixed(2)}
                    <span className="text-deep-wood/45 font-normal">
                      ({villa.reviewCount})
                    </span>
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(villa)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white border border-primary/30 hover:bg-primary/5 hover:border-primary text-deep-wood text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Pencil size={13} className="text-primary" />
                    <span>Edit</span>
                  </button>

                  {villa.isActive ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(villa)}
                      className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-700 hover:text-red-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                      title="Retire this villa"
                    >
                      <Trash2 size={13} className="text-red-600" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRestore(villa)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 hover:text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                      title="Restore to the public collection"
                    >
                      <RotateCcw size={13} className="text-emerald-600" />
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Retire / Delete Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-primary overflow-hidden text-deep-wood"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-deep-wood text-resort-white flex items-center justify-between border-b border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 font-mono block mb-0.5">
                      Inventory Confirmation
                    </span>
                    <h3
                      className="text-lg font-bold text-sand italic"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Remove {confirmDelete.name}?
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Options */}
              <div className="p-6 space-y-4 bg-surface text-xs leading-relaxed text-deep-wood">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <EyeOff size={14} className="text-amber-700" /> Option 1: Retire Villa (Recommended)
                  </p>
                  <p className="text-amber-800/90 font-medium">
                    Hides the villa from guest discovery while safely preserving all historical reservation records, revenue analytics, and reviews.
                  </p>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-1.5">
                  <p className="font-bold text-red-900 flex items-center gap-1.5">
                    <Trash2 size={14} className="text-red-700" /> Option 2: Delete Permanently
                  </p>
                  <p className="text-red-800/90 font-medium">
                    Completely deletes this villa row, its gallery rows, and reviews from the database. Refused once guest bookings exist.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-surface-container-low border-t border-primary/20 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDelete(confirmDelete, false)}
                  disabled={isDeleting}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-98 disabled:opacity-50"
                >
                  <EyeOff size={14} />
                  <span>Retire Villa from Catalogue</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(confirmDelete, true)}
                  disabled={isDeleting}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-98 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>Delete Permanently</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="w-full py-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer text-center"
                >
                  Cancel
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
