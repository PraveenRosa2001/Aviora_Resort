import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Plus,
  X,
  Save,
  Trash2,
  Loader2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Info,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";
import {
  useGetGalleryImagesQuery,
  useGetAdminGalleryQuery,
  useUploadGalleryImageMutation,
  useSaveGalleryImageMutation,
  useDeleteGalleryImageMutation,
  useReorderGalleryMutation,
} from "../../features/rooms/roomsApi";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { mediaUrl } from "../../config/mediaUrl";

/* --------------------------------------------------------------------------
   The bento grid on the home page.

   Tile shape is DERIVED from position, not stored. Rows alternate: even rows
   lead with the wide tile, odd rows lead with the narrow one. Storing a span
   per image would let an administrator produce a broken grid by deleting the
   wrong photograph; deriving it means the layout is always right whatever is
   in the table.

   Default effect: High-contrast monochrome black & white photograph.
   Hover effect: Smoothly transitions into full vibrant natural color with
   gentle scale and revealed story caption.

   Every image source goes through mediaUrl(). Two kinds of path live side by
   side in dbo.GalleryImages: /assets/... shipped with the frontend, and
   /uploads/... written to the API's wwwroot. Both are root-relative, so the
   browser resolves both against the page origin - which is right for the
   first and 404s for the second.
   -------------------------------------------------------------------------- */

const CATEGORIES = [
  "resort",
  "villas",
  "dining",
  "wellness",
  "experiences",
  "nature",
];

const DEFAULT_GALLERY_IMAGES = [
  {
    id: "g01",
    url: "/assets/images/gallery/gallery-01.jpg",
    title: "Canopy Villa at Twilight",
    caption:
      "Golden hour reflection over the private plunge pool and misty forest canopy.",
    category: "villas",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g02",
    url: "/assets/images/gallery/gallery-02.jpg",
    title: "Aerial Rainforest Sanctuary",
    caption:
      "Ninety acres of untouched botanical reserve and ancient primary rainforest.",
    category: "resort",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g03",
    url: "/assets/images/gallery/gallery-03.jpg",
    title: "Wildlife Passage at Dawn",
    caption:
      "Protected elephant family grazing peacefully through the morning mist.",
    category: "nature",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g04",
    url: "/assets/images/gallery/gallery-04.jpg",
    title: "The Canopy Table",
    caption:
      "Sensory fine dining elevated into the jungle tree canopy with warm ambient candlelight.",
    category: "dining",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g05",
    url: "/assets/images/gallery/gallery-05.jpg",
    title: "Forest Pavilion Spa",
    caption:
      "Holistic Ayurvedic rituals surrounded by natural springs and bamboo groves.",
    category: "wellness",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g06",
    url: "/assets/images/gallery/gallery-06.jpg",
    title: "Lagoon Water Suite",
    caption: "Over-water timber deck facing the tranquil lagoon at twilight.",
    category: "villas",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g07",
    url: "/assets/images/gallery/gallery-07.jpg",
    title: "Jungle Waterfall Trek",
    caption:
      "Private guided expedition along ancient trails to hidden cascading waterfalls.",
    category: "experiences",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g08",
    url: "/assets/images/gallery/gallery-08.jpg",
    title: "Ocean Sunset Catamaran",
    caption: "Private luxury catamaran cruise along the secluded coastline.",
    category: "experiences",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g09",
    url: "/assets/images/gallery/gallery-09.jpg",
    title: "Morning Mist Infinity Pool",
    caption:
      "Quiet dawn reflections over the main resort infinity pool as the canopy awakens.",
    category: "resort",
    showOnHome: true,
    isActive: true,
  },
  {
    id: "g10",
    url: "/assets/images/gallery/gallery-10.jpg",
    title: "Sky Villa Penthouse",
    caption:
      "Starlit panoramic terrace with heated plunge pool overlooking the reserve.",
    category: "villas",
    showOnHome: true,
    isActive: true,
  },
];

/** Even rows: wide then narrow. Odd rows: narrow then wide. */
const tileSpan = (index) => {
  const row = Math.floor(index / 2);
  const isFirstInRow = index % 2 === 0;
  const wideFirst = row % 2 === 0;
  return (wideFirst ? isFirstInRow : !isFirstInRow) ? "wide" : "narrow";
};

const EMPTY_IMAGE = {
  id: null,
  url: "",
  title: "",
  caption: "",
  category: "resort",
  showOnHome: true,
  isActive: true,
  storedFileName: null,
};

const errorText = (err, fallback) =>
  err?.data?.message || err?.error || fallback;

const inputClass =
  "w-full px-3.5 py-2.5 text-xs bg-white border border-outline-variant/40 rounded-xl " +
  "text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all";

function GalleryTile({ image, index, onOpen }) {
  const span = tileSpan(index);

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(image)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (index % 6) * 0.05 }}
      className={[
        "group relative overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer text-left",
        "border border-primary/20 hover:border-primary/60 shadow-xs hover:shadow-2xl transition-all duration-500",
        "h-52 sm:h-64 md:h-72",
        span === "wide" ? "sm:col-span-3" : "sm:col-span-2",
      ].join(" ")}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={image.id || image.url}
          src={mediaUrl(image.url)}
          alt={image.title || "Aviora Resort"}
          loading="lazy"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.05] brightness-95 group-hover:grayscale-0 group-hover:contrast-100 group-hover:brightness-100 group-hover:scale-[1.06] transition-[filter,transform] duration-700 ease-out"
        />
      </AnimatePresence>

      {/* Subtle gradient overlay at bottom for title and caption contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none transition-opacity duration-500" />

      {/* Subtle border highlight on hover */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-400/40 rounded-xl sm:rounded-2xl pointer-events-none transition-colors duration-500" />

      {/* Category badge */}
      {image.category && (
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-wider text-amber-200 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          {image.category}
        </span>
      )}

      {/* Caption plate */}
      {(image.title || image.caption) && (
        <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-left pointer-events-none">
          {image.title && (
            <span
              className="block text-sm sm:text-base font-bold text-white drop-shadow-md italic leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {image.title}
            </span>
          )}
          {image.caption && (
            <span className="mt-1 block text-[11px] sm:text-xs text-white/85 font-medium leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow">
              {image.caption}
            </span>
          )}
        </span>
      )}
    </motion.button>
  );
}

export default function HomeGallery() {
  const currentUser = useSelector(selectCurrentUser);

  /* The button is hidden here, but that is presentation only - every write
     goes to AdminGalleryController behind [Authorize(Roles = "admin")]. */
  const isAdmin = currentUser?.role === "admin";

  const {
    data: images = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetGalleryImagesQuery({ homeOnly: true });

  const [managerOpen, setManagerOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [activeOffset, setActiveOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Pool of all available active images (combining API images or curated resort fallback pool)
  const allImages =
    images && Array.isArray(images) && images.length > 0
      ? images.filter((i) => i.isActive !== false)
      : DEFAULT_GALLERY_IMAGES;

  // Auto transition slideshow across all available images
  useEffect(() => {
    if (isPaused || managerOpen || lightbox || allImages.length <= 1) return;

    const timer = setInterval(() => {
      setActiveOffset((prev) => (prev + 1) % allImages.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, managerOpen, lightbox, allImages.length]);

  // Bento grid displays up to 6 tiles at a time, cycling dynamically through the full collection
  const VISIBLE_COUNT = Math.min(allImages.length, 6);
  const displayedImages = Array.from({ length: VISIBLE_COUNT }, (_, i) => {
    return allImages[(activeOffset + i) % allImages.length];
  });

  if (isLoading && (!images || images.length === 0)) {
    return (
      <section className="py-20 md:py-28">
        <div className="container-resort text-center">
          <Loader2 size={26} className="mx-auto animate-spin text-primary/40" />
        </div>
      </section>
    );
  }

  // If there's an error and no fallback items
  if (isError && allImages.length === 0) {
    if (!isAdmin) return null;

    return (
      <section className="py-20 md:py-28">
        <div className="container-resort text-center">
          <AlertTriangle size={30} className="mx-auto text-amber-500 mb-3" />
          <p className="text-sm font-bold text-deep-wood">
            {isError
              ? "The gallery could not be loaded."
              : "The gallery is empty."}
          </p>
          <p className="mt-1 text-xs text-deep-wood/60">
            {isError
              ? errorText(error, "The resort system did not respond.")
              : "Guests see nothing here until a photograph is added."}
          </p>
          <button
            onClick={() => (isError ? refetch() : setManagerOpen(true))}
            className="mt-5 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            {isError ? "Retry" : "Add Photographs"}
          </button>
        </div>

        <AnimatePresence>
          {managerOpen && (
            <GalleryManager onClose={() => setManagerOpen(false)} />
          )}
        </AnimatePresence>
      </section>
    );
  }

  return (
    <section
      id="resort-gallery"
      aria-label="Resort Gallery"
      className="py-20 md:py-28 bg-transparent"
    >
      <div className="container-resort">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-10 md:mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
            <Camera size={13} /> The Estate in Frames
          </span>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-deep-wood mb-4"
            style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
          >
            Light, Water &amp; Canopy
          </h2>

          <p className="text-sm md:text-base text-deep-wood/70 leading-relaxed font-medium">
            Ninety acres of rainforest, lagoon and shoreline, photographed
            across a single season. Rest on any frame to see it in full living
            colour.
          </p>
        </motion.div>

        {/* Bento grid with reduced gap. Ten columns so a wide tile takes three of five per row
            and a narrow one takes two - the 3:2 proportion in the layout. */}
        <div
          className="grid grid-cols-1 sm:grid-cols-5 gap-2 md:gap-2.5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {displayedImages.map((image, index) => (
            <GalleryTile
              key={`tile-${index}-${image.id || image.url}`}
              image={image}
              index={index}
              onOpen={setLightbox}
            />
          ))}
        </div>

        {/* Subtle Carousel & Rotation Controls */}
        {allImages.length > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-deep-wood/70 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="px-3 py-1.5 rounded-full bg-white border border-outline-variant/40 hover:bg-surface-container-high text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs text-deep-wood"
                aria-label={isPaused ? "Resume rotation" : "Pause rotation"}
              >
                {isPaused ? (
                  <Play size={11} className="text-primary fill-primary" />
                ) : (
                  <Pause size={11} className="text-primary fill-primary" />
                )}
                <span>{isPaused ? "Resume Slideshow" : "Auto Rotating"}</span>
              </button>
              <span className="hidden sm:inline-block text-[11px] text-deep-wood/50 font-medium">
                · Hover any frame to reveal full colour &amp; story
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveOffset(
                    (prev) => (prev - 1 + allImages.length) % allImages.length,
                  )
                }
                className="w-8 h-8 rounded-full bg-white border border-outline-variant/40 hover:bg-surface-container-high flex items-center justify-center text-deep-wood transition-colors cursor-pointer shadow-2xs active:scale-95"
                aria-label="Previous frames"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex items-center gap-1">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveOffset(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeOffset === idx
                        ? "w-5 bg-primary"
                        : "w-1.5 bg-outline-variant/60 hover:bg-primary/50"
                    }`}
                    aria-label={`Go to frame ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveOffset((prev) => (prev + 1) % allImages.length)
                }
                className="w-8 h-8 rounded-full bg-white border border-outline-variant/40 hover:bg-surface-container-high flex items-center justify-center text-deep-wood transition-colors cursor-pointer shadow-2xs active:scale-95"
                aria-label="Next frames"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Admin entry point. Sits under the grid rather than beside the
            heading, so a guest's view of the section is untouched. */}
        {isAdmin && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="px-6 py-3 rounded-xl bg-deep-wood hover:bg-deep-wood/90 text-sand text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <ImageIcon size={15} /> Manage Gallery
              <span className="px-2 py-0.5 rounded-md bg-amber-300/20 text-amber-300 text-[10px] tracking-normal">
                Staff
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full"
            >
              <img
                src={mediaUrl(lightbox.url)}
                alt={lightbox.title || ""}
                className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />

              {(lightbox.title || lightbox.caption) && (
                <div className="mt-4 text-center">
                  {lightbox.title && (
                    <h3
                      className="text-xl font-bold text-sand italic"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {lightbox.title}
                    </h3>
                  )}
                  {lightbox.caption && (
                    <p className="mt-1 text-xs text-white/70 font-medium max-w-2xl mx-auto leading-relaxed">
                      {lightbox.caption}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white text-deep-wood flex items-center justify-center shadow-lg cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {managerOpen && (
          <GalleryManager onClose={() => setManagerOpen(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Gallery manager. Admin only.
   -------------------------------------------------------------------------- */
function GalleryManager({ onClose }) {
  const { data: images = [], isLoading } = useGetAdminGalleryQuery();

  const [uploadImage, { isLoading: uploading }] =
    useUploadGalleryImageMutation();
  const [saveImage, { isLoading: saving }] = useSaveGalleryImageMutation();
  const [deleteImage] = useDeleteGalleryImageMutation();
  const [reorderGallery, { isLoading: reordering }] =
    useReorderGalleryMutation();

  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const result = await uploadImage(form).unwrap();

      // Upload and save are two steps, so a failed save leaves an orphaned
      // file rather than a row pointing at nothing.
      setEditing({
        ...EMPTY_IMAGE,
        url: result.url,
        storedFileName: result.storedFileName,
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      });
    } catch (err) {
      setFormError(errorText(err, "The image could not be uploaded."));
    } finally {
      // Reset so choosing the same file twice still fires onChange.
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleSave = async () => {
    setFormError("");

    if (!editing.url.trim()) return setFormError("An image is required.");

    try {
      const res = await saveImage({
        id: editing.id,
        url: editing.url.trim(),
        title: editing.title.trim() || null,
        caption: editing.caption.trim() || null,
        category: editing.category,
        showOnHome: editing.showOnHome,
        isActive: editing.isActive,
        storedFileName: editing.storedFileName,
      }).unwrap();

      setNotice(res?.message || "Saved.");
      setEditing(null);
    } catch (err) {
      setFormError(errorText(err, "The photograph could not be saved."));
    }
  };

  const handleDelete = async (image) => {
    try {
      const res = await deleteImage(image.id).unwrap();
      setNotice(res?.message || "Removed.");
    } catch (err) {
      setNotice(errorText(err, "The photograph could not be removed."));
    }
  };

  const move = async (index, direction) => {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];

    try {
      await reorderGallery({ orderedIds: next.map((i) => i.id) }).unwrap();
    } catch (err) {
      setNotice(errorText(err, "The order could not be saved."));
    }
  };

  const homeCount = images.filter((i) => i.showOnHome && i.isActive).length;

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center p-4 pt-20 md:pt-10 pb-10 overflow-y-auto bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border-2 border-primary my-auto text-deep-wood"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div className="px-6 sm:px-8 py-6 bg-deep-wood text-resort-white flex items-center justify-between border-b border-primary/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Camera size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300 block font-mono mb-1">
                Gallery Management
              </span>
              <h3
                className="text-xl sm:text-2xl font-bold text-sand italic leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                The Estate in Frames
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 sm:px-8 py-3 bg-surface-container-low/50 border-b border-primary/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] font-semibold text-deep-wood/70">
            {homeCount} on the home page · {images.length} in the library
          </span>

          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              Upload
            </button>
            <button
              type="button"
              onClick={() => setEditing({ ...EMPTY_IMAGE })}
              className="px-4 py-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-surface-container-high"
            >
              <Plus size={13} /> By Path
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-surface overflow-y-auto flex-1 space-y-3">
          <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-primary/20 text-[11px] text-deep-wood/70 flex items-start gap-2.5">
            <Info size={14} className="text-primary shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              The grid alternates wide and narrow tiles by position, so the
              order below is the layout. Photographs work best around 1600 px
              wide and under 6 MB — JPEG, PNG, WebP or AVIF.
            </span>
          </div>

          {isLoading && (
            <div className="py-12 text-center">
              <Loader2
                size={26}
                className="mx-auto animate-spin text-primary/50"
              />
            </div>
          )}

          {!isLoading && images.length === 0 && (
            <div className="py-12 text-center">
              <ImageIcon size={36} className="mx-auto text-primary/30 mb-2" />
              <p className="text-xs font-semibold text-deep-wood/70">
                Nothing in the library yet.
              </p>
            </div>
          )}

          {images.map((image, index) => (
            <div
              key={image.id}
              className={[
                "p-3 rounded-2xl border bg-white flex items-center gap-3 transition-colors",
                image.isActive
                  ? "border-outline-variant/30"
                  : "border-dashed border-amber-500/50 opacity-70",
              ].join(" ")}
            >
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || reordering}
                  className="p-1 rounded text-deep-wood/40 hover:text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                  aria-label="Move up"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1 || reordering}
                  className="p-1 rounded text-deep-wood/40 hover:text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                  aria-label="Move down"
                >
                  <ArrowDown size={13} />
                </button>
              </div>

              <div className="w-24 h-16 rounded-xl overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/30">
                <img
                  src={mediaUrl(image.url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-deep-wood truncate">
                    {image.title || "Untitled"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-[9px] font-bold uppercase tracking-wider text-deep-wood/60">
                    {image.category}
                  </span>
                  {image.showOnHome ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-bold uppercase tracking-wider">
                      Home · {tileSpan(index)}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-deep-wood/50 text-[9px] font-bold uppercase tracking-wider">
                      Library only
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-deep-wood/55 line-clamp-1">
                  {image.caption || image.url}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...EMPTY_IMAGE,
                      ...image,
                      title: image.title ?? "",
                      caption: image.caption ?? "",
                    })
                  }
                  className="p-2 rounded-lg text-deep-wood/50 hover:text-primary hover:bg-primary/10 cursor-pointer"
                  aria-label="Edit"
                >
                  {image.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(image)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {(formError || notice) && (
          <div
            className={[
              "mx-6 sm:mx-8 mb-2 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 shrink-0 border",
              formError
                ? "bg-red-100 border-red-300 text-red-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900",
            ].join(" ")}
          >
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{formError || notice}</span>
          </div>
        )}

        <div className="px-6 sm:px-8 py-4 bg-surface-container-low/50 border-t-2 border-primary/20 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </motion.div>

      {/* Detail editor */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-primary overflow-hidden"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <div className="px-6 py-5 bg-deep-wood text-sand flex items-center gap-3">
                <ImageIcon size={20} className="text-amber-300" />
                <h4
                  className="text-lg font-bold italic"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {editing.id ? "Edit Photograph" : "New Photograph"}
                </h4>
              </div>

              <div className="p-6 bg-surface space-y-4">
                {editing.url && (
                  <div className="h-40 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-high">
                    <img
                      src={mediaUrl(editing.url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                    Image Path <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`${inputClass} font-mono`}
                    value={editing.url}
                    onChange={(e) =>
                      setEditing((v) => ({ ...v, url: e.target.value }))
                    }
                    placeholder="/assets/images/villas/canopy-villa-01.jpg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                    Title
                  </label>
                  <input
                    className={inputClass}
                    value={editing.title}
                    onChange={(e) =>
                      setEditing((v) => ({ ...v, title: e.target.value }))
                    }
                    placeholder="Canopy Living"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                    Caption
                  </label>
                  <textarea
                    rows={2}
                    className={`${inputClass} resize-none leading-relaxed`}
                    value={editing.caption}
                    onChange={(e) =>
                      setEditing((v) => ({ ...v, caption: e.target.value }))
                    }
                    placeholder="Shown when a guest rests on the tile."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5">
                      Category
                    </label>
                    <select
                      className={`${inputClass} capitalize cursor-pointer`}
                      value={editing.category}
                      onChange={(e) =>
                        setEditing((v) => ({ ...v, category: e.target.value }))
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-deep-wood cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editing.showOnHome}
                        onChange={(e) =>
                          setEditing((v) => ({
                            ...v,
                            showOnHome: e.target.checked,
                          }))
                        }
                        className="accent-primary w-4 h-4 cursor-pointer"
                      />
                      Show on home page
                    </label>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-deep-wood cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editing.isActive}
                        onChange={(e) =>
                          setEditing((v) => ({
                            ...v,
                            isActive: e.target.checked,
                          }))
                        }
                        className="accent-primary w-4 h-4 cursor-pointer"
                      />
                      Published
                    </label>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="mx-6 mb-2 p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold">
                  {formError}
                </div>
              )}

              <div className="px-6 py-4 bg-surface-container-low/50 border-t border-primary/20 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
