// import { useMemo, useState } from 'react';

// import { motion, AnimatePresence } from 'framer-motion';

// import {
//   UtensilsCrossed,
//   CalendarDays,
//   Users,
//   Clock,
//   Pencil,
//   Trash2,
//   Plus,
//   X,
//   Save,
//   Loader2,
//   AlertTriangle,
//   Info,
//   ChefHat,
//   Search,
//   Phone,
//   Mail,
//   Leaf,
//   Star,
//   ClipboardList,
//   Check,
//   ArrowLeft,
//   Sparkles,
//   ImagePlus,
//   CheckCircle2,
// } from 'lucide-react';

// import {
//   useGetAdminDiningReservationsQuery,
//   useSetDiningReservationStatusMutation,
//   useGetAdminDiningVenuesQuery,
//   useSaveDiningVenueMutation,
//   useDeleteDiningVenueMutation,
//   useSaveDiningMenuMutation,
// } from '../features/rooms/roomsApi';

// /* --------------------------------------------------------------------------
//    The dining desk and venue management.
//    Two sections behind one switcher, mirroring how Reservations and Villas are
//    split on the stays side:
//      Covers  - today's tables, who is coming, and their dietary notes
//      Venues  - the details a guest reads, including the menu
//    The menu editor is the part that was missing. usp_Admin_Dining_SaveVenue
//    writes the venue, gallery and ingredients but never touched
//    dbo.DiningMenuSections or dbo.DiningMenuItems, so a chef changing a course
//    needed a SQL script.
//    -------------------------------------------------------------------------- */
// const VENUE_TYPES = ['restaurant', 'brasserie', 'bar', 'cafe', 'private'];

// const STATUS_FLOW = {
//   Confirmed: ['Seated', 'Cancelled', 'No-Show'],
//   Seated: ['Completed', 'No-Show'],
//   Completed: [],
//   Cancelled: [],
//   'No-Show': [],
// };

// const STATUS_STYLES = {
//   Confirmed: 'bg-amber-100 text-amber-900 border-amber-200',
//   Seated: 'bg-blue-100 text-blue-800 border-blue-200',
//   Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
//   Cancelled: 'bg-red-100 text-red-800 border-red-200',
//   'No-Show':
//     'bg-surface-container-high text-deep-wood/70 border-outline-variant/40',
// };

// const toIso = (d) => d.toISOString().split('T')[0];

// const toSlug = (value) =>
//   value
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9\s-]/g, '')
//     .replace(/\s+/g, '-')
//     .replace(/-+/g, '-');

// const errorText = (err, fallback) =>
//   err?.data?.message || err?.error || fallback;

// const inputClass =
//   'w-full px-3.5 py-2.5 text-xs bg-white border border-outline-variant/40 rounded-xl ' +
//   'text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all';

// function Field({ label, children, hint, span = 1, required = false }) {
//   return (
//     <div className={span === 2 ? 'sm:col-span-2' : ''}>
//       <label className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5">
//         {label} {required && <span className="text-red-500">*</span>}
//       </label>
//       {children}
//       {hint && (
//         <p className="mt-1 text-[10px] text-deep-wood/60 font-medium">
//           {hint}
//         </p>
//       )}
//     </div>
//   );
// }

// function CustomCheckbox({
//   checked,
//   onChange,
//   size = 'md',
//   id,
//   name,
//   disabled,
// }) {
//   const isMd = size === 'md';
//   const boxClass = isMd ? 'w-4 h-4' : 'w-3.5 h-3.5';
//   const iconSize = isMd ? 11 : 9.5;

//   return (
//     <span
//       className={`relative inline-flex items-center justify-center shrink-0 ${boxClass}`}
//     >
//       <input
//         id={id}
//         name={name}
//         type="checkbox"
//         checked={!!checked}
//         onChange={onChange}
//         disabled={disabled}
//         className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
//       />
//       <span
//         aria-hidden="true"
//         className={`w-full h-full rounded border flex items-center justify-center transition-all duration-150 select-none pointer-events-none ${
//           checked
//             ? 'bg-primary border-primary shadow-xs'
//             : 'bg-white border-outline-variant/80 hover:border-primary/50'
//         } peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1 peer-checked:bg-primary peer-checked:border-primary ${
//           disabled ? 'opacity-50' : ''
//         }`}
//       >
//         {checked && (
//           <Check
//             size={iconSize}
//             strokeWidth={3.2}
//             className="text-white shrink-0"
//           />
//         )}
//       </span>
//     </span>
//   );
// }

// const EMPTY_VENUE = {
//   id: '',
//   name: '',
//   type: 'restaurant',
//   tagline: '',
//   description: '',
//   cuisine: '',
//   dressCode: '',
//   capacity: 30,
//   cancellationNoticeHours: 4,
//   openHours: '',
//   chefName: '',
//   chefBio: '',
//   image: '',
//   reservationRequired: true,
//   featured: false,
//   displayOrder: 0,
//   isActive: true,
//   images: [],
//   ingredients: [],
// };

// const EMPTY_ITEM = {
//   name: '',
//   description: '',
//   price: '',
//   isVegetarian: false,
//   isVegan: false,
//   isSignature: false,
//   allergens: '',
// };

// export default function AdminDiningTab() {
//   const [section, setSection] = useState('covers'); // 'covers' | 'venues'
//   const [toast, setToast] = useState('');

//   const showToast = (message) => {
//     setToast(message);
//     setTimeout(() => setToast(''), 4000);
//   };

//   /* ---------------- covers ---------------- */
//   const today = toIso(new Date());
//   const [from, setFrom] = useState(today);
//   const [to, setTo] = useState(today);
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [search, setSearch] = useState('');

//   const {
//     data: reservations = [],
//     isLoading: coversLoading,
//     isFetching: coversFetching,
//     isError: coversError,
//     error: coversErrObj,
//     refetch: refetchCovers,
//   } = useGetAdminDiningReservationsQuery({
//     from,
//     to,
//     status: statusFilter,
//     search: search.trim() || undefined,
//   });

//   const [setStatus, { isLoading: statusSaving }] =
//     useSetDiningReservationStatusMutation();

//   /* ---------------- venues ---------------- */
//   const { data: venues = [], isLoading: venuesLoading } =
//     useGetAdminDiningVenuesQuery();

//   const [saveVenue, { isLoading: savingVenue }] =
//     useSaveDiningVenueMutation();

//   const [deleteVenue] = useDeleteDiningVenueMutation();

//   const [saveMenu, { isLoading: savingMenu }] =
//     useSaveDiningMenuMutation();

//   const [editing, setEditing] = useState(null);
//   const [isNew, setIsNew] = useState(false);
//   const [formError, setFormError] = useState('');
//   const [menuDraft, setMenuDraft] = useState([]);
//   const [editorTab, setEditorTab] = useState('details'); // 'details' | 'menu'

//   /* Expected covers for the window, so the kitchen has a headcount.
//      Cancelled and no-show tables are excluded - they are not eating. */
//   const expectedCovers = useMemo(
//     () =>
//       reservations
//         .filter((r) => r.status === 'Confirmed' || r.status === 'Seated')
//         .reduce((sum, r) => sum + r.partySize, 0),
//     [reservations],
//   );

//   const dietaryCount = useMemo(
//     () => reservations.filter((r) => r.dietaryNotes?.trim()).length,
//     [reservations],
//   );

//   const handleStatus = async (reservation, newStatus) => {
//     try {
//       const res = await setStatus({
//         referenceId: reservation.referenceId,
//         status: newStatus,
//       }).unwrap();

//       showToast(
//         res?.message || `${reservation.referenceId} moved to ${newStatus}.`,
//       );
//     } catch (err) {
//       showToast(errorText(err, 'The table could not be updated.'));
//     }
//   };

//   const openVenue = (venue) => {
//     setEditing(
//       venue
//         ? {
//             ...EMPTY_VENUE,
//             ...venue,
//             tagline: venue.tagline ?? '',
//             description: venue.description ?? '',
//             cuisine: venue.cuisine ?? '',
//             dressCode: venue.dressCode ?? '',
//             cancellationNoticeHours:
//               venue.cancellationNoticeHours ?? EMPTY_VENUE.cancellationNoticeHours,
//             openHours: venue.openHours ?? '',
//             chefName: venue.chefName ?? '',
//             chefBio: venue.chefBio ?? '',
//             image: venue.image ?? '',
//             images: venue.images ?? [],
//             ingredients: venue.ingredients ?? [],
//           }
//         : { ...EMPTY_VENUE },
//     );

//     // The menu is edited and saved through its own endpoint, so it is held in
//     // a separate draft rather than folded into the venue form.
//     setMenuDraft(
//       (venue?.menu ?? []).map((s) => ({
//         title: s.title,
//         subtitle: s.subtitle ?? '',
//         items: (s.items ?? []).map((i) => ({
//           name: i.name,
//           description: i.description ?? '',
//           price: i.price ?? '',
//           isVegetarian: i.isVegetarian,
//           isVegan: i.isVegan,
//           isSignature: i.isSignature,
//           allergens: i.allergens ?? '',
//         })),
//       })),
//     );

//     setIsNew(!venue);
//     setEditorTab('details');
//     setFormError('');
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const closeEditor = () => {
//     setEditing(null);
//     setFormError('');
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleSaveVenue = async () => {
//     setFormError('');

//     const v = editing;

//     if (!v.name.trim()) return setFormError('The venue needs a name.');
//     if (!v.id.trim()) return setFormError('The venue needs a slug.');

//     if (!/^[a-z0-9-]+$/.test(v.id))
//       return setFormError(
//         'The slug may contain lowercase letters, numbers and hyphens only.',
//       );

//     if (Number(v.capacity) < 1)
//       return setFormError('Capacity must be at least one cover.');

//     const gallery = v.images.map((i) => i.trim()).filter(Boolean);
//     const hero = v.image.trim();

//     if (gallery.length > 6)
//       return setFormError(
//         'A venue may have at most 6 gallery images, not counting the hero.',
//       );

//     if (gallery.some((i) => i.toLowerCase() === hero.toLowerCase()))
//       return setFormError(
//         'The hero image must not also appear in the gallery.',
//       );

//     try {
//       const res = await saveVenue({
//         slug: isNew ? undefined : v.id,
//         id: v.id,
//         name: v.name.trim(),
//         type: v.type,
//         tagline: v.tagline.trim() || null,
//         description: v.description.trim() || null,
//         cuisine: v.cuisine.trim() || null,
//         dressCode: v.dressCode.trim() || null,
//         capacity: Number(v.capacity),
//         cancellationNoticeHours: Number(v.cancellationNoticeHours),
//         openHours: v.openHours.trim() || null,
//         chefName: v.chefName.trim() || null,
//         chefBio: v.chefBio.trim() || null,
//         image: hero || null,
//         reservationRequired: v.reservationRequired,
//         featured: v.featured,
//         displayOrder: Number(v.displayOrder),
//         isActive: v.isActive,
//         images: gallery,
//         ingredients: v.ingredients.map((i) => i.trim()).filter(Boolean),
//       }).unwrap();

//       showToast(res?.message || 'Venue saved.');
//       setEditing(null);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     } catch (err) {
//       setFormError(errorText(err, 'The venue could not be saved.'));
//     }
//   };

//   const handleSaveMenu = async () => {
//     setFormError('');

//     const sections = menuDraft
//       .filter((s) => s.title.trim())
//       .map((s) => ({
//         title: s.title.trim(),
//         subtitle: s.subtitle.trim() || null,
//         items: s.items
//           .filter((i) => i.name.trim())
//           .map((i) => ({
//             name: i.name.trim(),
//             description: i.description.trim() || null,
//             // Blank means "no separate price" - a course on a fixed tasting
//             // menu - which is different from zero.
//             price: i.price === '' ? null : Number(i.price),
//             isVegetarian: i.isVegetarian || i.isVegan,
//             isVegan: i.isVegan,
//             isSignature: i.isSignature,
//             allergens: i.allergens.trim() || null,
//           })),
//       }));

//     if (sections.length === 0)
//       return setFormError('A menu needs at least one section.');

//     if (sections.every((s) => s.items.length === 0))
//       return setFormError('Every section is empty. Add at least one dish.');

//     try {
//       const res = await saveMenu({
//         slug: editing.id,
//         sections,
//       }).unwrap();

//       showToast(res?.message || 'Menu saved.');
//     } catch (err) {
//       setFormError(errorText(err, 'The menu could not be saved.'));
//     }
//   };

//   const handleRetire = async (venue) => {
//     try {
//       const res = await deleteVenue(venue.id).unwrap();
//       showToast(res?.message || 'Venue retired.');
//     } catch (err) {
//       showToast(errorText(err, 'The venue could not be retired.'));
//     }
//   };

//   /* ---------------- menu draft helpers ---------------- */
//   const updateSection = (index, patch) =>
//     setMenuDraft((prev) =>
//       prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
//     );

//   const updateItem = (sectionIndex, itemIndex, patch) =>
//     setMenuDraft((prev) =>
//       prev.map((s, i) =>
//         i === sectionIndex
//           ? {
//               ...s,
//               items: s.items.map((it, j) =>
//                 j === itemIndex ? { ...it, ...patch } : it,
//               ),
//             }
//           : s,
//       ),
//     );

//   /* ------------------------------------------------------------------ */
//   if (coversLoading && venuesLoading) {
//     return (
//       <div className="p-16 text-center">
//         <Loader2 size={28} className="mx-auto animate-spin text-primary/60" />
//         <p className="mt-3 text-xs font-bold uppercase tracking-wider text-deep-wood/50">
//           Loading the dining desk
//         </p>
//       </div>
//     );
//   }

//   /* ==========================================================================
//      FULL-PAGE DINING VENUE & MENU WORKSPACE VIEW (When Editing)
//      ========================================================================== */
//   if (editing) {
//     return (
//       <div
//         className="p-6 md:p-8 space-y-6 text-deep-wood"
//         style={{ fontFamily: 'var(--font-body)' }}
//       >
//         {/* ── Top Header & Breadcrumb Strip ── */}
//         <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
//           <div className="space-y-1">
//             <div className="flex items-center gap-2 text-xs font-semibold text-deep-wood/60">
//               <button
//                 type="button"
//                 onClick={closeEditor}
//                 className="hover:text-primary transition-colors cursor-pointer"
//               >
//                 Dining Venues
//               </button>
//               <span>/</span>
//               <span className="text-primary font-bold">
//                 {isNew ? 'New Dining Venue' : `Edit: ${editing.name || editing.id}`}
//               </span>
//             </div>

//             <div className="flex flex-wrap items-center gap-3">
//               <button
//                 type="button"
//                 onClick={closeEditor}
//                 className="w-9 h-9 rounded-xl bg-white border border-outline-variant/40 hover:bg-primary hover:text-white text-deep-wood flex items-center justify-center transition-colors cursor-pointer mr-1 shadow-xs"
//                 title="Return to dining venues list"
//               >
//                 <ArrowLeft size={16} />
//               </button>

//               <h2
//                 className="text-2xl sm:text-3xl font-bold text-deep-wood italic"
//                 style={{ fontFamily: 'var(--font-heading)' }}
//               >
//                 {isNew ? 'Create Dining Venue' : editing.name || 'Edit Venue'}
//               </h2>

//               <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
//                 {editing.type} • {editing.cuisine || 'Cuisine'}
//               </span>

//               {!isNew && (
//                 <span className="text-xs font-mono text-deep-wood/60 font-semibold">
//                   Slug: {editing.id}
//                 </span>
//               )}

//               {editing.isActive ? (
//                 <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
//                   Live
//                 </span>
//               ) : (
//                 <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
//                   Hidden
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* Quick Header Action Buttons */}
//           <div className="flex items-center gap-3 shrink-0">
//             <button
//               type="button"
//               onClick={closeEditor}
//               className="px-5 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs"
//             >
//               Cancel
//             </button>

//             <button
//               type="button"
//               onClick={editorTab === 'menu' ? handleSaveMenu : handleSaveVenue}
//               disabled={savingVenue || savingMenu}
//               className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
//             >
//               {savingVenue || savingMenu ? (
//                 <Loader2 size={14} className="animate-spin" />
//               ) : (
//                 <Save size={14} />
//               )}
//               <span>
//                 {editorTab === 'menu'
//                   ? 'Save Menu'
//                   : isNew
//                     ? 'Create Venue'
//                     : 'Save Specifications'}
//               </span>
//             </button>
//           </div>
//         </div>

//         {/* ── Form Error Banner ── */}
//         {formError && (
//           <div className="p-4 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2.5 shadow-sm">
//             <AlertTriangle size={18} className="text-red-600 shrink-0" />
//             <span>{formError}</span>
//           </div>
//         )}

//         {/* ── Mode Switcher: Specifications vs Menu ── */}
//         <div className="flex items-center gap-2 p-1.5 bg-surface-container-low/50 border border-primary/20 rounded-2xl w-fit shadow-xs">
//           {[
//             { id: 'details', label: 'Venue Specifications', icon: Info },
//             { id: 'menu', label: 'Curated Menu', icon: ChefHat },
//           ].map((t) => {
//             const Icon = t.icon;
//             const disabled = t.id === 'menu' && isNew;

//             return (
//               <button
//                 key={t.id}
//                 type="button"
//                 disabled={disabled}
//                 onClick={() => {
//                   setEditorTab(t.id);
//                   setFormError('');
//                 }}
//                 className={[
//                   'px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all',
//                   disabled ? 'opacity-40 cursor-not-allowed' : '',
//                   editorTab === t.id
//                     ? 'bg-primary text-white shadow-sm'
//                     : 'text-deep-wood/70 hover:text-deep-wood hover:bg-primary/10',
//                 ].join(' ')}
//               >
//                 <Icon size={15} />
//                 {t.label}
//                 {t.id === 'menu' && !isNew && (
//                   <span
//                     className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
//                       editorTab === 'menu'
//                         ? 'bg-white/20 text-white'
//                         : 'bg-primary/10 text-primary'
//                     }`}
//                   >
//                     {menuDraft.reduce(
//                       (acc, s) => acc + (s.items?.length || 0),
//                       0,
//                     )}{' '}
//                     items
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </div>

//         {/* ── TAB 1: VENUE SPECIFICATIONS (2-Column Grid) ── */}
//         {editorTab === 'details' ? (
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
//             {/* Left Column: Form Sections (8 Cols) */}
//             <div className="lg:col-span-8 space-y-6">
//               {/* Section 1: Venue Concept & Identity */}
//               <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
//                 <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
//                   <Sparkles size={18} className="text-primary" />
//                   <h3
//                     className="text-lg font-bold text-deep-wood"
//                     style={{
//                       fontFamily: 'var(--font-heading)',
//                       fontStyle: 'italic',
//                     }}
//                   >
//                     Venue Concept &amp; Identity
//                   </h3>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <Field label="Venue Name" span={2} required>
//                     <input
//                       className={inputClass}
//                       value={editing.name}
//                       onChange={(e) => {
//                         const val = e.target.value;
//                         setEditing((v) => ({
//                           ...v,
//                           name: val,
//                           id: isNew ? toSlug(val) : v.id,
//                         }));
//                       }}
//                       placeholder="e.g. Amber & Ember, The Canopy Table"
//                     />
//                   </Field>

//                   <Field
//                     label="Slug / Route Code"
//                     required
//                     hint={
//                       isNew
//                         ? 'Auto-generated from name. Used in public URLs.'
//                         : 'Locked after creation to protect bookmarks and links.'
//                     }
//                   >
//                     <input
//                       className={`${inputClass} font-mono ${
//                         !isNew ? 'opacity-70 cursor-not-allowed bg-surface-container-low/50' : ''
//                       }`}
//                       value={editing.id}
//                       disabled={!isNew}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           id: toSlug(e.target.value),
//                         }))
//                       }
//                       placeholder="e.g. amber-and-ember"
//                     />
//                   </Field>

//                   <Field label="Venue Classification" required>
//                     <select
//                       className={`${inputClass} capitalize cursor-pointer`}
//                       value={editing.type}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           type: e.target.value,
//                         }))
//                       }
//                     >
//                       {VENUE_TYPES.map((t) => (
//                         <option key={t} value={t}>
//                           {t.charAt(0).toUpperCase() + t.slice(1)}
//                         </option>
//                       ))}
//                     </select>
//                   </Field>

//                   <Field label="Cuisine Focus">
//                     <input
//                       className={inputClass}
//                       value={editing.cuisine}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           cuisine: e.target.value,
//                         }))
//                       }
//                       placeholder="e.g. Contemporary Sri Lankan, Coastal Grill"
//                     />
//                   </Field>

//                   <Field label="Tagline / Epigram" span={2}>
//                     <input
//                       className={inputClass}
//                       value={editing.tagline}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           tagline: e.target.value,
//                         }))
//                       }
//                       placeholder="e.g. Hearth, sea, and cellar above the canopy"
//                     />
//                   </Field>

//                   <Field label="Narrative & Atmosphere Description" span={2}>
//                     <textarea
//                       rows={4}
//                       className={`${inputClass} resize-none leading-relaxed`}
//                       value={editing.description}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           description: e.target.value,
//                         }))
//                       }
//                       placeholder="Describe the architectural setting, culinary story, and ambience..."
//                     />
//                   </Field>
//                 </div>
//               </div>

//               {/* Section 2: Atmosphere, Service & Operations */}
//               <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
//                 <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
//                   <Clock size={18} className="text-primary" />
//                   <h3
//                     className="text-lg font-bold text-deep-wood"
//                     style={{
//                       fontFamily: 'var(--font-heading)',
//                       fontStyle: 'italic',
//                     }}
//                   >
//                     Atmosphere, Hours &amp; Capacity
//                   </h3>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <Field label="Price Tier">
//                     <select
//                       className={`${inputClass} cursor-pointer`}
//                       value={editing.priceTier || '$$$'}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           priceTier: e.target.value,
//                         }))
//                       }
//                     >
//                       <option value="$">$ (Casual Dining)</option>
//                       <option value="$$">$$ (Moderate Fine Casual)</option>
//                       <option value="$$$">$$$ (Upscale Signature)</option>
//                       <option value="$$$$">$$$$ (Haute Cuisine / Tasting)</option>
//                     </select>
//                   </Field>

//                   <Field label="Dress Code">
//                     <input
//                       className={inputClass}
//                       value={editing.dressCode}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           dressCode: e.target.value,
//                         }))
//                       }
//                       placeholder="e.g. Resort Casual, Smart Elegant"
//                     />
//                   </Field>

//                   <Field
//                     label="Hours of Service"
//                     hint="Shown verbatim to guests on venue cards and overview."
//                   >
//                     <input
//                       className={inputClass}
//                       value={editing.openHours}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           openHours: e.target.value,
//                         }))
//                       }
//                       placeholder="e.g. 18:30 – 22:30 Daily"
//                     />
//                   </Field>

//                   <Field
//                     label="Seating Capacity (Covers per sitting)"
//                     required
//                     hint="Refused if lower than future confirmed covers."
//                   >
//                     <input
//                       type="number"
//                       min={1}
//                       max={1000}
//                       className={inputClass}
//                       value={editing.capacity}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           capacity: e.target.value,
//                         }))
//                       }
//                     />
//                   </Field>

//                   <Field
//                     label="Cancellation Notice (Hours)"
//                     hint="Minimum notice required before a booking. 0 allows cancellation anytime."
//                   >
//                     <input
//                       type="number"
//                       min={0}
//                       max={720}
//                       className={inputClass}
//                       value={editing.cancellationNoticeHours}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           cancellationNoticeHours: e.target.value,
//                         }))
//                       }
//                     />
//                   </Field>

//                   <Field label="Head Chef / Culinary Lead">
//                     <input
//                       className={inputClass}
//                       value={editing.chefName}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           chefName: e.target.value,
//                         }))
//                       }
//                       placeholder="e.g. Chef Nuwan Senanayake"
//                     />
//                   </Field>

//                   <Field label="Chef Biography & Philosophy" span={2}>
//                     <textarea
//                       rows={3}
//                       className={`${inputClass} resize-none leading-relaxed`}
//                       value={editing.chefBio}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           chefBio: e.target.value,
//                         }))
//                       }
//                       placeholder="Culinary background, Michelin experience, artisanal philosophy..."
//                     />
//                   </Field>
//                 </div>
//               </div>

//               {/* Section 3: Culinary Sourcing & Highlights */}
//               <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
//                 <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
//                   <Leaf size={18} className="text-primary" />
//                   <h3
//                     className="text-lg font-bold text-deep-wood"
//                     style={{
//                       fontFamily: 'var(--font-heading)',
//                       fontStyle: 'italic',
//                     }}
//                   >
//                     Culinary Sourcing &amp; Highlights
//                   </h3>
//                 </div>

//                 <Field
//                   label="Key Ingredients & Sourcing Notes"
//                   span={2}
//                   hint="One highlight per line. Displayed as 'Key Ingredients & Culinary Highlights' on the guest site."
//                 >
//                   <textarea
//                     rows={4}
//                     className={`${inputClass} resize-none leading-relaxed`}
//                     value={editing.ingredients.join('\n')}
//                     onChange={(e) =>
//                       setEditing((v) => ({
//                         ...v,
//                         ingredients: e.target.value.split('\n'),
//                       }))
//                     }
//                     placeholder="Estate-pressed Ceylon cinnamon&#10;Line-caught yellowfin tuna from Mirissa&#10;Organic heirloom red rice from Kandy"
//                   />
//                 </Field>
//               </div>

//               {/* Section 4: Publishing & Operational Controls */}
//               <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
//                 <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
//                   <CheckCircle2 size={18} className="text-primary" />
//                   <h3
//                     className="text-lg font-bold text-deep-wood"
//                     style={{
//                       fontFamily: 'var(--font-heading)',
//                       fontStyle: 'italic',
//                     }}
//                   >
//                     Publishing &amp; Operational Controls
//                   </h3>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <Field
//                     label="Display Sort Order"
//                     hint="Lower numbers appear first in the resort dining directory."
//                   >
//                     <input
//                       type="number"
//                       className={inputClass}
//                       value={editing.displayOrder}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           displayOrder: e.target.value,
//                         }))
//                       }
//                     />
//                   </Field>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
//                   {[
//                     [
//                       'reservationRequired',
//                       'Takes table reservations',
//                       'Enables guest booking flow',
//                     ],
//                     [
//                       'featured',
//                       'Feature on dining page',
//                       'Spotlight in hero banners',
//                     ],
//                     [
//                       'isActive',
//                       'Live on the guest site',
//                       'Visible to resort visitors',
//                     ],
//                   ].map(([field, label, sub]) => (
//                     <label
//                       key={field}
//                       className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
//                         editing[field]
//                           ? 'bg-primary/5 border-primary/40 text-deep-wood shadow-2xs'
//                           : 'bg-surface-container-low/50 border-primary/20 text-deep-wood/80 hover:bg-primary/5'
//                       }`}
//                     >
//                       <div className="mt-0.5">
//                         <CustomCheckbox
//                           checked={editing[field]}
//                           onChange={(e) =>
//                             setEditing((v) => ({
//                               ...v,
//                               [field]: e.target.checked,
//                             }))
//                           }
//                         />
//                       </div>
//                       <div>
//                         <span className="text-xs font-bold block">{label}</span>
//                         <span className="text-[10px] text-deep-wood/60 font-medium">
//                           {sub}
//                         </span>
//                       </div>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {/* Advisory Card */}
//               <div className="p-4 rounded-xl bg-surface-container-low/50 border border-primary/20 text-xs text-deep-wood/75 flex items-start gap-3 shadow-xs">
//                 <Info size={16} className="text-primary shrink-0 mt-0.5" />
//                 <span className="leading-relaxed">
//                   <strong>Operational Note:</strong> Retiring a venue hides it from
//                   the guest dining page but preserves every past and upcoming table
//                   reservation intact in the database.
//                 </span>
//               </div>
//             </div>

//             {/* Right Column: Visual Assets & Live Preview (4 Cols - Sticky) */}
//             <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
//               {/* Visual Assets & Gallery */}
//               <div className="p-6 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
//                 <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
//                   <ImagePlus size={18} className="text-primary" />
//                   <h3
//                     className="text-base sm:text-lg font-bold text-deep-wood"
//                     style={{
//                       fontFamily: 'var(--font-heading)',
//                       fontStyle: 'italic',
//                     }}
//                   >
//                     Visual Assets &amp; Gallery
//                   </h3>
//                 </div>

//                 {/* Hero Main Image */}
//                 <Field
//                   label="Hero Main Photograph URL"
//                   required
//                   hint="Main photography featured on venue cards and headers."
//                 >
//                   <div className="space-y-2">
//                     <input
//                       className={`${inputClass} font-mono text-xs`}
//                       value={editing.image}
//                       onChange={(e) =>
//                         setEditing((v) => ({ ...v, image: e.target.value }))
//                       }
//                       placeholder="/assets/images/dining/canopy-table.jpg"
//                     />

//                     {editing.image && (
//                       <div className="relative h-36 rounded-xl overflow-hidden border border-primary/20 bg-surface-container-high shadow-inner">
//                         <img
//                           src={editing.image}
//                           alt="Hero preview"
//                           className="w-full h-full object-cover"
//                           onError={(e) => {
//                             e.currentTarget.style.display = 'none';
//                           }}
//                         />
//                       </div>
//                     )}
//                   </div>
//                 </Field>

//                 {/* Gallery URLs */}
//                 <Field
//                   label={`Gallery Photographs (${editing.images.length} of 6)`}
//                   hint="One URL per line. Up to 6 supplementary photographs."
//                 >
//                   <div className="space-y-2">
//                     <textarea
//                       rows={3}
//                       className={`${inputClass} font-mono text-xs resize-none`}
//                       value={editing.images.join('\n')}
//                       onChange={(e) =>
//                         setEditing((v) => ({
//                           ...v,
//                           images: e.target.value.split('\n'),
//                         }))
//                       }
//                       placeholder="/assets/images/dining/venue-01.jpg&#10;/assets/images/dining/venue-02.jpg"
//                     />

//                     {editing.images.filter((u) => u.trim()).length > 0 && (
//                       <div className="grid grid-cols-3 gap-2 pt-1">
//                         {editing.images
//                           .filter((u) => u.trim())
//                           .slice(0, 6)
//                           .map((url, idx) => (
//                             <div
//                               key={idx}
//                               className="relative h-16 rounded-lg overflow-hidden border border-primary/20 bg-surface-container-high shadow-xs"
//                             >
//                               <img
//                                 src={url.trim()}
//                                 alt={`Gallery ${idx + 1}`}
//                                 className="w-full h-full object-cover"
//                                 onError={(e) => {
//                                   e.currentTarget.style.display = 'none';
//                                 }}
//                               />
//                               <span className="absolute bottom-1 right-1 bg-deep-wood/80 text-white text-[9px] px-1 rounded font-mono">
//                                 #{idx + 1}
//                               </span>
//                             </div>
//                           ))}
//                       </div>
//                     )}
//                   </div>
//                 </Field>
//               </div>

//               {/* Live Guest Card Preview */}
//               <div className="p-5 bg-white border border-primary/25 rounded-2xl shadow-sm space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-[10px] font-bold uppercase tracking-widest text-primary block font-mono">
//                     Live Guest Card Preview
//                   </span>
//                   <span className="text-[10px] font-semibold text-deep-wood/50">
//                     Guest Site Format
//                   </span>
//                 </div>

//                 <div className="rounded-xl overflow-hidden border border-primary/20 bg-white shadow-xs">
//                   <div className="relative h-40 bg-surface-container-high overflow-hidden">
//                     <img
//                       src={editing.image || '/assets/images/dining/canopy-table.jpg'}
//                       alt="Preview"
//                       className="w-full h-full object-cover"
//                       onError={(e) => {
//                         e.currentTarget.src =
//                           'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
//                       }}
//                     />
//                     <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-deep-wood/85 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase rounded-md tracking-wider">
//                       {editing.type || 'Restaurant'}
//                     </div>
//                     {editing.cuisine && (
//                       <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium rounded-md">
//                         {editing.cuisine}
//                       </div>
//                     )}
//                   </div>

//                   <div className="p-4 space-y-2">
//                     <h4
//                       className="text-base font-bold text-deep-wood italic"
//                       style={{ fontFamily: 'var(--font-heading)' }}
//                     >
//                       {editing.name || 'Venue Sanctuary'}
//                     </h4>

//                     {editing.tagline && (
//                       <p className="text-xs text-deep-wood/70 line-clamp-2">
//                         {editing.tagline}
//                       </p>
//                     )}

//                     <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-[11px] text-deep-wood/65">
//                       <span>{editing.openHours || 'Hours not configured'}</span>
//                       <span>{editing.dressCode || 'Dress code'}</span>
//                     </div>

//                     <div className="pt-1">
//                       <div className="w-full py-2 rounded-lg bg-primary/10 text-primary text-center text-[10px] font-bold uppercase tracking-wider">
//                         {editing.reservationRequired
//                           ? 'Reserve a Table'
//                           : 'Walk-ins Welcome'}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : (
//           /* ── TAB 2: CURATED MENU BUILDER ── */
//           <div className="space-y-6">
//             <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-primary/20 text-xs text-deep-wood/80 flex items-start gap-3 shadow-xs">
//               <Info size={16} className="text-primary shrink-0 mt-0.5" />
//               <span className="leading-relaxed">
//                 Saving replaces the whole menu. Leave a price blank for a course on
//                 a fixed tasting menu — that is different from zero, and blank shows
//                 no price figure to the guest.
//               </span>
//             </div>

//             {menuDraft.length === 0 && (
//               <div className="p-12 text-center rounded-2xl border-2 border-dashed border-primary/30 bg-white space-y-3 shadow-xs">
//                 <ChefHat size={36} className="mx-auto text-primary/40" />
//                 <h4
//                   className="text-base font-bold text-deep-wood"
//                   style={{ fontFamily: 'var(--font-heading)' }}
//                 >
//                   No Menu Courses Configured Yet
//                 </h4>
//                 <p className="text-xs text-deep-wood/60 max-w-md mx-auto">
//                   The guest page displays nothing behind &ldquo;Sample Menu&rdquo;
//                   until you create at least one course section.
//                 </p>
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setMenuDraft([
//                       {
//                         title: 'First Courses',
//                         subtitle: 'Artisanal starters',
//                         items: [{ ...EMPTY_ITEM }],
//                       },
//                     ])
//                   }
//                   className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container cursor-pointer transition-colors shadow-xs inline-flex items-center gap-2"
//                 >
//                   <Plus size={14} /> Create First Course / Section
//                 </button>
//               </div>
//             )}

//             {menuDraft.map((sec, si) => (
//               <div
//                 key={si}
//                 className="p-6 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5"
//               >
//                 {/* Course Header */}
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
//                   <div className="flex items-center gap-2.5">
//                     <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center">
//                       {si + 1}
//                     </span>
//                     <h4
//                       className="text-base font-bold text-deep-wood"
//                       style={{
//                         fontFamily: 'var(--font-heading)',
//                         fontStyle: 'italic',
//                       }}
//                     >
//                       {sec.title || `Course Section ${si + 1}`}
//                     </h4>
//                     <span className="text-[11px] font-semibold text-deep-wood/50">
//                       ({sec.items.length}{' '}
//                       {sec.items.length === 1 ? 'dish' : 'dishes'})
//                     </span>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() =>
//                       setMenuDraft((prev) => prev.filter((_, i) => i !== si))
//                     }
//                     className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer self-end sm:self-auto p-1.5 hover:bg-red-50 rounded-lg transition-colors"
//                     title="Remove this section and its dishes"
//                   >
//                     <Trash2 size={14} /> Remove Course Section
//                   </button>
//                 </div>

//                 {/* Section Title & Subtitle */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <Field label="Course / Section Title" required>
//                     <input
//                       className={inputClass}
//                       value={sec.title}
//                       onChange={(e) =>
//                         updateSection(si, {
//                           title: e.target.value,
//                         })
//                       }
//                       placeholder="e.g. First Courses, Wood-Fired Mains, Chef's Tasting"
//                     />
//                   </Field>

//                   <Field label="Section Subtitle / Culinary Note">
//                     <input
//                       className={inputClass}
//                       value={sec.subtitle}
//                       onChange={(e) =>
//                         updateSection(si, {
//                           subtitle: e.target.value,
//                         })
//                       }
//                       placeholder="e.g. Served with house-baked pol roti and cultured butter"
//                     />
//                   </Field>
//                 </div>

//                 {/* Dishes */}
//                 <div className="space-y-3 pt-2">
//                   <span className="text-xs font-bold uppercase tracking-wider text-deep-wood/70 block">
//                     Dishes in this Course
//                   </span>

//                   {sec.items.map((item, ii) => (
//                     <div
//                       key={ii}
//                       className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 space-y-3 shadow-2xs"
//                     >
//                       <div className="flex items-start gap-3">
//                         <div className="w-6 h-6 rounded-md bg-white border border-primary/20 text-deep-wood/60 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-2">
//                           {ii + 1}
//                         </div>

//                         <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
//                           <div className="sm:col-span-8">
//                             <input
//                               className={`${inputClass} font-bold`}
//                               value={item.name}
//                               onChange={(e) =>
//                                 updateItem(si, ii, {
//                                   name: e.target.value,
//                                 })
//                               }
//                               placeholder="Dish Name (e.g. Lagoon Crab & Young Jackfruit)"
//                             />
//                           </div>

//                           <div className="sm:col-span-4">
//                             <input
//                               type="number"
//                               min={0}
//                               step={100}
//                               className={inputClass}
//                               value={item.price}
//                               onChange={(e) =>
//                                 updateItem(si, ii, {
//                                   price: e.target.value,
//                                 })
//                               }
//                               placeholder="Price (LKR) — Blank if tasting"
//                             />
//                           </div>
//                         </div>

//                         <button
//                           type="button"
//                           onClick={() =>
//                             updateSection(si, {
//                               items: sec.items.filter((_, j) => j !== ii),
//                             })
//                           }
//                           className="p-2 rounded-lg text-deep-wood/40 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0 mt-1"
//                           title="Remove dish"
//                         >
//                           <X size={15} />
//                         </button>
//                       </div>

//                       <input
//                         className={inputClass}
//                         value={item.description}
//                         onChange={(e) =>
//                           updateItem(si, ii, {
//                             description: e.target.value,
//                           })
//                         }
//                         placeholder="Description of ingredients, culinary preparation and tasting notes..."
//                       />

//                       <div className="flex flex-wrap items-center gap-4 pt-1">
//                         <input
//                           className={`${inputClass} flex-1 min-w-[200px]`}
//                           value={item.allergens}
//                           onChange={(e) =>
//                             updateItem(si, ii, {
//                               allergens: e.target.value,
//                             })
//                           }
//                           placeholder="Allergens (e.g. Crustacean, Dairy, Tree Nuts)"
//                         />

//                         <div className="flex items-center gap-3">
//                           {[
//                             ['isVegetarian', 'Vegetarian'],
//                             ['isVegan', 'Vegan'],
//                             ['isSignature', 'Signature'],
//                           ].map(([field, label]) => (
//                             <label
//                               key={field}
//                               className="flex items-center gap-1.5 text-[11px] font-bold text-deep-wood/70 cursor-pointer whitespace-nowrap hover:text-deep-wood transition-colors select-none"
//                             >
//                               <CustomCheckbox
//                                 size="sm"
//                                 checked={item[field]}
//                                 onChange={(e) =>
//                                   updateItem(si, ii, {
//                                     [field]: e.target.checked,
//                                   })
//                                 }
//                               />
//                               <span>{label}</span>
//                             </label>
//                           ))}
//                         </div>
//                       </div>

//                       {item.isVegan && (
//                         <p className="text-[10px] text-emerald-700 font-semibold pl-1">
//                           Shown as Vegan on guest menu. Vegetarian is implied.
//                         </p>
//                       )}
//                     </div>
//                   ))}

//                   <button
//                     type="button"
//                     onClick={() =>
//                       updateSection(si, {
//                         items: [...sec.items, { ...EMPTY_ITEM }],
//                       })
//                     }
//                     className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
//                   >
//                     <Plus size={14} /> Add Dish to {sec.title || 'Course'}
//                   </button>
//                 </div>
//               </div>
//             ))}

//             <button
//               type="button"
//               onClick={() =>
//                 setMenuDraft((prev) => [
//                   ...prev,
//                   {
//                     title: '',
//                     subtitle: '',
//                     items: [{ ...EMPTY_ITEM }],
//                   },
//                 ])
//               }
//               className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary/40 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
//             >
//               <Plus size={16} /> Add Another Menu Section / Course
//             </button>
//           </div>
//         )}

//         {/* ── Bottom Action Bar ── */}
//         <div className="p-5 bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
//           <button
//             type="button"
//             onClick={closeEditor}
//             className="px-5 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs"
//           >
//             Cancel &amp; Return
//           </button>

//           <button
//             type="button"
//             onClick={editorTab === 'menu' ? handleSaveMenu : handleSaveVenue}
//             disabled={savingVenue || savingMenu}
//             className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
//           >
//             {savingVenue || savingMenu ? (
//               <Loader2 size={14} className="animate-spin" />
//             ) : (
//               <Save size={14} />
//             )}
//             <span>
//               {editorTab === 'menu'
//                 ? 'Save Menu'
//                 : isNew
//                   ? 'Create Venue'
//                   : 'Save Specifications'}
//             </span>
//           </button>
//         </div>

//         {/* Toast within editor view */}
//         <AnimatePresence>
//           {toast && (
//             <motion.div
//               initial={{ opacity: 0, y: 16 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 16 }}
//               className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3.5 rounded-2xl bg-deep-wood text-sand text-xs font-bold shadow-2xl max-w-md text-center border border-primary/30"
//             >
//               {toast}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       {/* Section switcher */}
//       <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
//         <div className="flex items-center gap-1.5 p-1 bg-surface-container-high rounded-xl border border-primary/20">
//           {[
//             {
//               id: 'covers',
//               label: 'Covers',
//               icon: ClipboardList,
//               count: reservations.length,
//             },
//             {
//               id: 'venues',
//               label: 'Venues',
//               icon: UtensilsCrossed,
//               count: venues.length,
//             },
//           ].map((tab) => {
//             const Icon = tab.icon;

//             return (
//               <button
//                 key={tab.id}
//                 type="button"
//                 onClick={() => setSection(tab.id)}
//                 className={[
//                   'px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer',
//                   section === tab.id
//                     ? 'bg-primary text-white shadow-xs'
//                     : 'text-deep-wood/70 hover:text-deep-wood hover:bg-primary/10',
//                 ].join(' ')}
//               >
//                 <Icon size={14} />
//                 <span>
//                   {tab.label} ({tab.count})
//                 </span>
//               </button>
//             );
//           })}
//         </div>

//         {section === 'venues' && (
//           <button
//             type="button"
//             onClick={() => openVenue(null)}
//             className="px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
//           >
//             <Plus size={15} /> Add Venue
//           </button>
//         )}
//       </div>

//       {/* ---------------- covers ---------------- */}
//       {section === 'covers' && (
//         <>
//           <div className="mb-4 flex flex-wrap items-end gap-3">
//             <div>
//               <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
//                 From
//               </label>

//               <input
//                 type="date"
//                 className={inputClass}
//                 value={from}
//                 onChange={(e) => setFrom(e.target.value)}
//               />
//             </div>

//             <div>
//               <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
//                 To
//               </label>

//               <input
//                 type="date"
//                 className={inputClass}
//                 min={from}
//                 value={to}
//                 onChange={(e) => setTo(e.target.value)}
//               />
//             </div>

//             <div>
//               <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
//                 Status
//               </label>

//               <select
//                 className={`${inputClass} cursor-pointer`}
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="all">All statuses</option>

//                 {Object.keys(STATUS_FLOW).map((s) => (
//                   <option key={s} value={s}>
//                     {s}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex-1 min-w-[200px]">
//               <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
//                 Search
//               </label>

//               <div className="relative">
//                 <Search
//                   size={14}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-wood/40"
//                 />

//                 <input
//                   className={`${inputClass} pl-9`}
//                   placeholder="Reference, name or email"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>
//             </div>

//             <button
//               type="button"
//               onClick={() => {
//                 setFrom(today);
//                 setTo(today);
//                 setStatusFilter('all');
//                 setSearch('');
//               }}
//               className="px-4 py-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood text-[11px] font-bold uppercase tracking-wider hover:bg-surface-container-high cursor-pointer"
//             >
//               Today
//             </button>
//           </div>

//           {/* Kitchen headcount */}
//           <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
//             <div className="p-4 rounded-2xl bg-surface border border-outline-variant/30">
//               <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55 block">
//                 Expected Covers
//               </span>

//               <span className="text-2xl font-bold text-deep-wood font-heading">
//                 {expectedCovers}
//               </span>

//               <span className="text-[10px] text-deep-wood/50 block">
//                 excludes cancelled and no-shows
//               </span>
//             </div>

//             <div className="p-4 rounded-2xl bg-surface border border-outline-variant/30">
//               <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55 block">
//                 Tables
//               </span>

//               <span className="text-2xl font-bold text-deep-wood font-heading">
//                 {reservations.length}
//               </span>

//               <span className="text-[10px] text-deep-wood/50 block">
//                 {from === to ? from : `${from} → ${to}`}
//               </span>
//             </div>

//             <div
//               className={[
//                 'p-4 rounded-2xl border',
//                 dietaryCount > 0
//                   ? 'bg-amber-50 border-amber-200'
//                   : 'bg-surface border-outline-variant/30',
//               ].join(' ')}
//             >
//               <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55 block">
//                 Dietary Notes
//               </span>

//               <span className="text-2xl font-bold text-deep-wood font-heading">
//                 {dietaryCount}
//               </span>

//               <span className="text-[10px] text-deep-wood/50 block">
//                 {dietaryCount > 0 ? 'brief the kitchen' : 'none today'}
//               </span>
//             </div>
//           </div>

//           {coversError ? (
//             <div className="p-12 text-center rounded-2xl border border-outline-variant/30 bg-surface">
//               <AlertTriangle
//                 size={30}
//                 className="mx-auto text-amber-500 mb-2"
//               />

//               <p className="text-sm font-bold text-deep-wood">
//                 The dining desk could not be loaded.
//               </p>

//               <p className="mt-1 text-xs text-deep-wood/60">
//                 {errorText(
//                   coversErrObj,
//                   'The resort system did not respond.',
//                 )}
//               </p>

//               <button
//                 onClick={refetchCovers}
//                 className="mt-4 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
//               >
//                 Retry
//               </button>
//             </div>
//           ) : reservations.length === 0 ? (
//             <div className="p-16 text-center rounded-2xl border border-outline-variant/30 bg-surface">
//               <UtensilsCrossed
//                 size={40}
//                 className="mx-auto text-primary/30 mb-3"
//               />

//               <p className="text-sm font-bold text-deep-wood">
//                 No tables for these dates.
//               </p>

//               <p className="mt-1 text-xs text-deep-wood/60">
//                 Widen the range or clear the filters to see more.
//               </p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface">
//               {coversFetching && (
//                 <div className="px-4 py-1.5 bg-primary/5 text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
//                   <Loader2 size={11} className="animate-spin" /> Refreshing
//                 </div>
//               )}

//               <table className="w-full text-left text-xs">
//                 <thead className="bg-surface-container-high text-deep-wood/70 uppercase tracking-wider text-[10px] font-bold">
//                   <tr>
//                     <th className="px-4 py-3">Reference</th>
//                     <th className="px-4 py-3">Guest</th>
//                     <th className="px-4 py-3">Venue</th>
//                     <th className="px-4 py-3">Sitting</th>
//                     <th className="px-4 py-3">Party</th>
//                     <th className="px-4 py-3">Status</th>
//                     <th className="px-4 py-3 text-right">Actions</th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-outline-variant/20">
//                   {reservations.map((r) => (
//                     <tr
//                       key={r.referenceId}
//                       className={r.status === 'Cancelled' ? 'opacity-55' : ''}
//                     >
//                       <td className="px-4 py-3 align-top">
//                         <span className="font-mono font-bold text-primary block">
//                           {r.referenceId}
//                         </span>

//                         {r.stayReference && (
//                           <span className="text-[10px] text-deep-wood/50 font-mono">
//                             stay {r.stayReference}
//                           </span>
//                         )}
//                       </td>

//                       <td className="px-4 py-3 align-top">
//                         <span className="font-bold text-deep-wood block">
//                           {r.guestName}
//                         </span>

//                         <span className="text-[10px] text-deep-wood/60 flex items-center gap-1">
//                           <Mail size={9} /> {r.email}
//                         </span>

//                         {r.phone && (
//                           <span className="text-[10px] text-deep-wood/60 flex items-center gap-1">
//                             <Phone size={9} /> {r.phone}
//                           </span>
//                         )}

//                         {r.dietaryNotes && (
//                           <span className="mt-1 inline-flex items-start gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 max-w-[220px]">
//                             <Leaf size={10} className="shrink-0 mt-0.5" />
//                             {r.dietaryNotes}
//                           </span>
//                         )}

//                         {r.occasion && (
//                           <span className="mt-1 block text-[10px] font-semibold text-secondary">
//                             {r.occasion}
//                           </span>
//                         )}
//                       </td>

//                       <td className="px-4 py-3 align-top">
//                         <span className="font-semibold text-deep-wood block">
//                           {r.venueName}
//                         </span>

//                         <span className="text-[10px] text-deep-wood/55 capitalize">
//                           {r.venueType}
//                         </span>
//                       </td>

//                       <td className="px-4 py-3 align-top text-deep-wood/80">
//                         <span className="flex items-center gap-1">
//                           <CalendarDays size={11} /> {r.date}
//                         </span>

//                         <span className="flex items-center gap-1 font-bold text-deep-wood">
//                           <Clock size={11} /> {r.time}
//                         </span>
//                       </td>

//                       <td className="px-4 py-3 align-top">
//                         <span className="flex items-center gap-1 font-bold text-deep-wood">
//                           <Users size={11} /> {r.partySize}
//                         </span>
//                       </td>

//                       <td className="px-4 py-3 align-top">
//                         <span
//                           className={[
//                             'px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border',
//                             STATUS_STYLES[r.status] ??
//                               'bg-surface-container-high text-deep-wood/70 border-outline-variant/40',
//                           ].join(' ')}
//                         >
//                           {r.status}
//                         </span>
//                       </td>

//                       <td className="px-4 py-3 align-top">
//                         <div className="flex flex-wrap items-center justify-end gap-1.5">
//                           {(STATUS_FLOW[r.status] ?? []).map((next) => (
//                             <button
//                               key={next}
//                               type="button"
//                               onClick={() => handleStatus(r, next)}
//                               disabled={statusSaving}
//                               className={[
//                                 'px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40',
//                                 next === 'Cancelled' || next === 'No-Show'
//                                   ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
//                                   : 'bg-emerald-600 text-white hover:bg-emerald-700',
//                               ].join(' ')}
//                             >
//                               {next}
//                             </button>
//                           ))}

//                           {(STATUS_FLOW[r.status] ?? []).length === 0 && (
//                             <span className="text-[10px] text-deep-wood/40 font-semibold">
//                               Closed
//                             </span>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </>
//       )}

//       {/* ---------------- venues ---------------- */}
//       {section === 'venues' && (
//         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
//           {venues.map((venue) => (
//             <div
//               key={venue.id}
//               className={[
//                 'rounded-2xl border overflow-hidden bg-surface flex flex-col justify-between transition-all',
//                 venue.isActive
//                   ? 'border-outline-variant/30 hover:shadow-md'
//                   : 'border-dashed border-amber-500/50 opacity-70',
//               ].join(' ')}
//             >
//               <div className="relative h-32">
//                 <img
//                   src={venue.image}
//                   alt={venue.name}
//                   className="w-full h-full object-cover"
//                 />

//                 <span
//                   className={[
//                     'absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-sm',
//                     venue.isActive
//                       ? 'bg-emerald-600 text-white'
//                       : 'bg-amber-500 text-white',
//                   ].join(' ')}
//                 >
//                   {venue.isActive ? 'Live' : 'Retired'}
//                 </span>

//                 <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-deep-wood/80 backdrop-blur-md text-sand text-[10px] font-bold uppercase tracking-wider">
//                   {venue.type}
//                 </span>

//                 <span
//                   className={[
//                     'absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md',
//                     (venue.menu?.length ?? 0) > 0
//                       ? 'bg-deep-wood/75 text-sand'
//                       : 'bg-amber-500/90 text-white',
//                   ].join(' ')}
//                 >
//                   {venue.menu?.reduce(
//                     (n, s) => n + (s.items?.length ?? 0),
//                     0,
//                   ) ?? 0}{' '}
//                   dishes
//                 </span>
//               </div>

//               <div className="p-4 flex-1 flex flex-col justify-between">
//                 <div>
//                   <h3 className="font-bold text-deep-wood text-sm mb-0.5">
//                     {venue.name}
//                   </h3>

//                   <p className="text-[11px] text-deep-wood/60 line-clamp-2">
//                     {venue.tagline}
//                   </p>

//                   <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold">
//                     <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-deep-wood/70 flex items-center gap-1">
//                       <Users size={9} /> {venue.capacity} covers
//                     </span>

//                     {venue.reservationRequired && (
//                       <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">
//                         Booking required
//                       </span>
//                     )}

//                     {venue.featured && (
//                       <span className="px-2 py-0.5 rounded-md bg-secondary/15 text-secondary flex items-center gap-1">
//                         <Star size={9} /> Featured
//                       </span>
//                     )}
//                   </div>

//                   {venue.chefName && (
//                     <p className="mt-2 text-[10px] text-deep-wood/55 flex items-center gap-1">
//                       <ChefHat size={10} /> Chef {venue.chefName}
//                     </p>
//                   )}
//                 </div>

//                 <div className="mt-4 pt-3 border-t border-outline-variant/20 grid grid-cols-2 gap-2">
//                   <button
//                     type="button"
//                     onClick={() => openVenue(venue)}
//                     className="py-2.5 rounded-xl bg-white border border-primary/30 hover:bg-primary/5 text-deep-wood text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
//                   >
//                     <Pencil size={12} className="text-primary" /> Edit
//                   </button>

//                   <button
//                     type="button"
//                     onClick={() => handleRetire(venue)}
//                     disabled={!venue.isActive}
//                     className="py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-700 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
//                     title="Retire. Past reservations keep their record."
//                   >
//                     <Trash2 size={12} /> Retire
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Toast */}
//       <AnimatePresence>
//         {toast && (
//           <motion.div
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 16 }}
//             className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3.5 rounded-2xl bg-deep-wood text-sand text-xs font-bold shadow-2xl max-w-md text-center border border-primary/30"
//           >
//             {toast}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

import { useMemo, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

import {
  UtensilsCrossed,
  CalendarDays,
  Users,
  Clock,
  Pencil,
  Trash2,
  Plus,
  X,
  Save,
  Loader2,
  AlertTriangle,
  Info,
  ChefHat,
  Search,
  Phone,
  Mail,
  Leaf,
  Star,
  ClipboardList,
  Check,
  ArrowLeft,
  Sparkles,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";

import {
  useGetAdminDiningReservationsQuery,
  useSetDiningReservationStatusMutation,
  useGetAdminDiningVenuesQuery,
  useSaveDiningVenueMutation,
  useDeleteDiningVenueMutation,
  useSaveDiningMenuMutation,
} from "../features/rooms/roomsApi";
import { TableDocuments } from "../components/documents/ReservationDocuments";
import { mediaUrl } from '../config/mediaUrl';

/* --------------------------------------------------------------------------
   The dining desk and venue management.
   Two sections behind one switcher, mirroring how Reservations and Villas are
   split on the stays side:
     Covers  - today's tables, who is coming, and their dietary notes
     Venues  - the details a guest reads, including the menu
   The menu editor is the part that was missing. usp_Admin_Dining_SaveVenue
   writes the venue, gallery and ingredients but never touched
   dbo.DiningMenuSections or dbo.DiningMenuItems, so a chef changing a course
   needed a SQL script.
   -------------------------------------------------------------------------- */
const VENUE_TYPES = ["restaurant", "brasserie", "bar", "cafe", "private"];

const STATUS_FLOW = {
  Confirmed: ["Seated", "Cancelled", "No-Show"],
  Seated: ["Completed", "No-Show"],
  Completed: [],
  Cancelled: [],
  "No-Show": [],
};

const STATUS_STYLES = {
  Confirmed: "bg-amber-100 text-amber-900 border-amber-200",
  Seated: "bg-blue-100 text-blue-800 border-blue-200",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
  "No-Show":
    "bg-surface-container-high text-deep-wood/70 border-outline-variant/40",
};

const toIso = (d) => d.toISOString().split("T")[0];

const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const errorText = (err, fallback) =>
  err?.data?.message || err?.error || fallback;

const inputClass =
  "w-full px-3.5 py-2.5 text-xs bg-white border border-outline-variant/40 rounded-xl " +
  "text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all";

function Field({ label, children, hint, span = 1, required = false }) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[10px] text-deep-wood/60 font-medium">{hint}</p>
      )}
    </div>
  );
}

function CustomCheckbox({
  checked,
  onChange,
  size = "md",
  id,
  name,
  disabled,
}) {
  const isMd = size === "md";
  const boxClass = isMd ? "w-4 h-4" : "w-3.5 h-3.5";
  const iconSize = isMd ? 11 : 9.5;

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${boxClass}`}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <span
        aria-hidden="true"
        className={`w-full h-full rounded border flex items-center justify-center transition-all duration-150 select-none pointer-events-none ${
          checked
            ? "bg-primary border-primary shadow-xs"
            : "bg-white border-outline-variant/80 hover:border-primary/50"
        } peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1 peer-checked:bg-primary peer-checked:border-primary ${
          disabled ? "opacity-50" : ""
        }`}
      >
        {checked && (
          <Check
            size={iconSize}
            strokeWidth={3.2}
            className="text-white shrink-0"
          />
        )}
      </span>
    </span>
  );
}

const EMPTY_VENUE = {
  id: "",
  name: "",
  type: "restaurant",
  tagline: "",
  description: "",
  cuisine: "",
  dressCode: "",
  capacity: 30,
  cancellationNoticeHours: 4,
  openHours: "",
  chefName: "",
  chefBio: "",
  image: "",
  reservationRequired: true,
  featured: false,
  displayOrder: 0,
  isActive: true,
  images: [],
  ingredients: [],
};

const EMPTY_ITEM = {
  name: "",
  description: "",
  price: "",
  isVegetarian: false,
  isVegan: false,
  isSignature: false,
  allergens: "",
};

export default function AdminDiningTab() {
  const [section, setSection] = useState("covers"); // 'covers' | 'venues'
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  };

  /* ---------------- covers ---------------- */
  const today = toIso(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const {
    data: reservations = [],
    isLoading: coversLoading,
    isFetching: coversFetching,
    isError: coversError,
    error: coversErrObj,
    refetch: refetchCovers,
  } = useGetAdminDiningReservationsQuery({
    from,
    to,
    status: statusFilter,
    search: search.trim() || undefined,
  });

  const [setStatus, { isLoading: statusSaving }] =
    useSetDiningReservationStatusMutation();

  /* ---------------- venues ---------------- */
  const { data: venues = [], isLoading: venuesLoading } =
    useGetAdminDiningVenuesQuery();

  const [saveVenue, { isLoading: savingVenue }] = useSaveDiningVenueMutation();

  const [deleteVenue] = useDeleteDiningVenueMutation();

  const [saveMenu, { isLoading: savingMenu }] = useSaveDiningMenuMutation();

  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [formError, setFormError] = useState("");
  const [menuDraft, setMenuDraft] = useState([]);
  const [editorTab, setEditorTab] = useState("details"); // 'details' | 'menu'

  /* Expected covers for the window, so the kitchen has a headcount.
     Cancelled and no-show tables are excluded - they are not eating. */
  const expectedCovers = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "Confirmed" || r.status === "Seated")
        .reduce((sum, r) => sum + r.partySize, 0),
    [reservations],
  );

  const dietaryCount = useMemo(
    () => reservations.filter((r) => r.dietaryNotes?.trim()).length,
    [reservations],
  );

  const handleStatus = async (reservation, newStatus) => {
    try {
      const res = await setStatus({
        referenceId: reservation.referenceId,
        status: newStatus,
      }).unwrap();

      showToast(
        res?.message || `${reservation.referenceId} moved to ${newStatus}.`,
      );
    } catch (err) {
      showToast(errorText(err, "The table could not be updated."));
    }
  };

  const openVenue = (venue) => {
    setEditing(
      venue
        ? {
            ...EMPTY_VENUE,
            ...venue,
            tagline: venue.tagline ?? "",
            description: venue.description ?? "",
            cuisine: venue.cuisine ?? "",
            dressCode: venue.dressCode ?? "",
            cancellationNoticeHours:
              venue.cancellationNoticeHours ??
              EMPTY_VENUE.cancellationNoticeHours,
            openHours: venue.openHours ?? "",
            chefName: venue.chefName ?? "",
            chefBio: venue.chefBio ?? "",
            image: venue.image ?? "",
            images: venue.images ?? [],
            ingredients: venue.ingredients ?? [],
          }
        : { ...EMPTY_VENUE },
    );

    // The menu is edited and saved through its own endpoint, so it is held in
    // a separate draft rather than folded into the venue form.
    setMenuDraft(
      (venue?.menu ?? []).map((s) => ({
        title: s.title,
        subtitle: s.subtitle ?? "",
        items: (s.items ?? []).map((i) => ({
          name: i.name,
          description: i.description ?? "",
          price: i.price ?? "",
          isVegetarian: i.isVegetarian,
          isVegan: i.isVegan,
          isSignature: i.isSignature,
          allergens: i.allergens ?? "",
        })),
      })),
    );

    setIsNew(!venue);
    setEditorTab("details");
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeEditor = () => {
    setEditing(null);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveVenue = async () => {
    setFormError("");

    const v = editing;

    if (!v.name.trim()) return setFormError("The venue needs a name.");
    if (!v.id.trim()) return setFormError("The venue needs a slug.");

    if (!/^[a-z0-9-]+$/.test(v.id))
      return setFormError(
        "The slug may contain lowercase letters, numbers and hyphens only.",
      );

    if (Number(v.capacity) < 1)
      return setFormError("Capacity must be at least one cover.");

    const gallery = v.images.map((i) => i.trim()).filter(Boolean);
    const hero = v.image.trim();

    if (gallery.length > 6)
      return setFormError(
        "A venue may have at most 6 gallery images, not counting the hero.",
      );

    if (gallery.some((i) => i.toLowerCase() === hero.toLowerCase()))
      return setFormError(
        "The hero image must not also appear in the gallery.",
      );

    try {
      const res = await saveVenue({
        slug: isNew ? undefined : v.id,
        id: v.id,
        name: v.name.trim(),
        type: v.type,
        tagline: v.tagline.trim() || null,
        description: v.description.trim() || null,
        cuisine: v.cuisine.trim() || null,
        dressCode: v.dressCode.trim() || null,
        capacity: Number(v.capacity),
        cancellationNoticeHours: Number(v.cancellationNoticeHours),
        openHours: v.openHours.trim() || null,
        chefName: v.chefName.trim() || null,
        chefBio: v.chefBio.trim() || null,
        image: hero || null,
        reservationRequired: v.reservationRequired,
        featured: v.featured,
        displayOrder: Number(v.displayOrder),
        isActive: v.isActive,
        images: gallery,
        ingredients: v.ingredients.map((i) => i.trim()).filter(Boolean),
      }).unwrap();

      showToast(res?.message || "Venue saved.");
      setEditing(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFormError(errorText(err, "The venue could not be saved."));
    }
  };

  const handleSaveMenu = async () => {
    setFormError("");

    const sections = menuDraft
      .filter((s) => s.title.trim())
      .map((s) => ({
        title: s.title.trim(),
        subtitle: s.subtitle.trim() || null,
        items: s.items
          .filter((i) => i.name.trim())
          .map((i) => ({
            name: i.name.trim(),
            description: i.description.trim() || null,
            // Blank means "no separate price" - a course on a fixed tasting
            // menu - which is different from zero.
            price: i.price === "" ? null : Number(i.price),
            isVegetarian: i.isVegetarian || i.isVegan,
            isVegan: i.isVegan,
            isSignature: i.isSignature,
            allergens: i.allergens.trim() || null,
          })),
      }));

    if (sections.length === 0)
      return setFormError("A menu needs at least one section.");

    if (sections.every((s) => s.items.length === 0))
      return setFormError("Every section is empty. Add at least one dish.");

    try {
      const res = await saveMenu({
        slug: editing.id,
        sections,
      }).unwrap();

      showToast(res?.message || "Menu saved.");
    } catch (err) {
      setFormError(errorText(err, "The menu could not be saved."));
    }
  };

  const handleRetire = async (venue) => {
    try {
      const res = await deleteVenue(venue.id).unwrap();
      showToast(res?.message || "Venue retired.");
    } catch (err) {
      showToast(errorText(err, "The venue could not be retired."));
    }
  };

  /* ---------------- menu draft helpers ---------------- */
  const updateSection = (index, patch) =>
    setMenuDraft((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );

  const updateItem = (sectionIndex, itemIndex, patch) =>
    setMenuDraft((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              items: s.items.map((it, j) =>
                j === itemIndex ? { ...it, ...patch } : it,
              ),
            }
          : s,
      ),
    );

  /* ------------------------------------------------------------------ */
  if (coversLoading && venuesLoading) {
    return (
      <div className="p-16 text-center">
        <Loader2 size={28} className="mx-auto animate-spin text-primary/60" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-deep-wood/50">
          Loading the dining desk
        </p>
      </div>
    );
  }

  /* ==========================================================================
     FULL-PAGE DINING VENUE & MENU WORKSPACE VIEW (When Editing)
     ========================================================================== */
  if (editing) {
    return (
      <div
        className="p-6 md:p-8 space-y-6 text-deep-wood"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {/* ── Top Header & Breadcrumb Strip ── */}
        <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-deep-wood/60">
              <button
                type="button"
                onClick={closeEditor}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Dining Venues
              </button>
              <span>/</span>
              <span className="text-primary font-bold">
                {isNew
                  ? "New Dining Venue"
                  : `Edit: ${editing.name || editing.id}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={closeEditor}
                className="w-9 h-9 rounded-xl bg-white border border-outline-variant/40 hover:bg-primary hover:text-white text-deep-wood flex items-center justify-center transition-colors cursor-pointer mr-1 shadow-xs"
                title="Return to dining venues list"
              >
                <ArrowLeft size={16} />
              </button>

              <h2
                className="text-2xl sm:text-3xl font-bold text-deep-wood italic"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {isNew ? "Create Dining Venue" : editing.name || "Edit Venue"}
              </h2>

              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {editing.type} • {editing.cuisine || "Cuisine"}
              </span>

              {!isNew && (
                <span className="text-xs font-mono text-deep-wood/60 font-semibold">
                  Slug: {editing.id}
                </span>
              )}

              {editing.isActive ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  Hidden
                </span>
              )}
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={closeEditor}
              className="px-5 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={editorTab === "menu" ? handleSaveMenu : handleSaveVenue}
              disabled={savingVenue || savingMenu}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {savingVenue || savingMenu ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>
                {editorTab === "menu"
                  ? "Save Menu"
                  : isNew
                    ? "Create Venue"
                    : "Save Specifications"}
              </span>
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

        {/* ── Mode Switcher: Specifications vs Menu ── */}
        <div className="flex items-center gap-2 p-1.5 bg-surface-container-low/50 border border-primary/20 rounded-2xl w-fit shadow-xs">
          {[
            { id: "details", label: "Venue Specifications", icon: Info },
            { id: "menu", label: "Curated Menu", icon: ChefHat },
          ].map((t) => {
            const Icon = t.icon;
            const disabled = t.id === "menu" && isNew;

            return (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setEditorTab(t.id);
                  setFormError("");
                }}
                className={[
                  "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all",
                  disabled ? "opacity-40 cursor-not-allowed" : "",
                  editorTab === t.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-deep-wood/70 hover:text-deep-wood hover:bg-primary/10",
                ].join(" ")}
              >
                <Icon size={15} />
                {t.label}
                {t.id === "menu" && !isNew && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      editorTab === "menu"
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {menuDraft.reduce(
                      (acc, s) => acc + (s.items?.length || 0),
                      0,
                    )}{" "}
                    items
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: VENUE SPECIFICATIONS (2-Column Grid) ── */}
        {editorTab === "details" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Sections (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section 1: Venue Concept & Identity */}
              <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                  <Sparkles size={18} className="text-primary" />
                  <h3
                    className="text-lg font-bold text-deep-wood"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                    }}
                  >
                    Venue Concept &amp; Identity
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Venue Name" span={2} required>
                    <input
                      className={inputClass}
                      value={editing.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditing((v) => ({
                          ...v,
                          name: val,
                          id: isNew ? toSlug(val) : v.id,
                        }));
                      }}
                      placeholder="e.g. Amber & Ember, The Canopy Table"
                    />
                  </Field>

                  <Field
                    label="Slug / Route Code"
                    required
                    hint={
                      isNew
                        ? "Auto-generated from name. Used in public URLs."
                        : "Locked after creation to protect bookmarks and links."
                    }
                  >
                    <input
                      className={`${inputClass} font-mono ${
                        !isNew
                          ? "opacity-70 cursor-not-allowed bg-surface-container-low/50"
                          : ""
                      }`}
                      value={editing.id}
                      disabled={!isNew}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          id: toSlug(e.target.value),
                        }))
                      }
                      placeholder="e.g. amber-and-ember"
                    />
                  </Field>

                  <Field label="Venue Classification" required>
                    <select
                      className={`${inputClass} capitalize cursor-pointer`}
                      value={editing.type}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          type: e.target.value,
                        }))
                      }
                    >
                      {VENUE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Cuisine Focus">
                    <input
                      className={inputClass}
                      value={editing.cuisine}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          cuisine: e.target.value,
                        }))
                      }
                      placeholder="e.g. Contemporary Sri Lankan, Coastal Grill"
                    />
                  </Field>

                  <Field label="Tagline / Epigram" span={2}>
                    <input
                      className={inputClass}
                      value={editing.tagline}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          tagline: e.target.value,
                        }))
                      }
                      placeholder="e.g. Hearth, sea, and cellar above the canopy"
                    />
                  </Field>

                  <Field label="Narrative & Atmosphere Description" span={2}>
                    <textarea
                      rows={4}
                      className={`${inputClass} resize-none leading-relaxed`}
                      value={editing.description}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the architectural setting, culinary story, and ambience..."
                    />
                  </Field>
                </div>
              </div>

              {/* Section 2: Atmosphere, Service & Operations */}
              <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                  <Clock size={18} className="text-primary" />
                  <h3
                    className="text-lg font-bold text-deep-wood"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                    }}
                  >
                    Atmosphere, Hours &amp; Capacity
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Price Tier">
                    <select
                      className={`${inputClass} cursor-pointer`}
                      value={editing.priceTier || "$$$"}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          priceTier: e.target.value,
                        }))
                      }
                    >
                      <option value="$">$ (Casual Dining)</option>
                      <option value="$$">$$ (Moderate Fine Casual)</option>
                      <option value="$$$">$$$ (Upscale Signature)</option>
                      <option value="$$$$">
                        $$$$ (Haute Cuisine / Tasting)
                      </option>
                    </select>
                  </Field>

                  <Field label="Dress Code">
                    <input
                      className={inputClass}
                      value={editing.dressCode}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          dressCode: e.target.value,
                        }))
                      }
                      placeholder="e.g. Resort Casual, Smart Elegant"
                    />
                  </Field>

                  <Field
                    label="Hours of Service"
                    hint="Shown verbatim to guests on venue cards and overview."
                  >
                    <input
                      className={inputClass}
                      value={editing.openHours}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          openHours: e.target.value,
                        }))
                      }
                      placeholder="e.g. 18:30 – 22:30 Daily"
                    />
                  </Field>

                  <Field
                    label="Seating Capacity (Covers per sitting)"
                    required
                    hint="Refused if lower than future confirmed covers."
                  >
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      className={inputClass}
                      value={editing.capacity}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          capacity: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field
                    label="Cancellation Notice (Hours)"
                    hint="Minimum notice required before a booking. 0 allows cancellation anytime."
                  >
                    <input
                      type="number"
                      min={0}
                      max={720}
                      className={inputClass}
                      value={editing.cancellationNoticeHours}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          cancellationNoticeHours: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Head Chef / Culinary Lead">
                    <input
                      className={inputClass}
                      value={editing.chefName}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          chefName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Chef Nuwan Senanayake"
                    />
                  </Field>

                  <Field label="Chef Biography & Philosophy" span={2}>
                    <textarea
                      rows={3}
                      className={`${inputClass} resize-none leading-relaxed`}
                      value={editing.chefBio}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          chefBio: e.target.value,
                        }))
                      }
                      placeholder="Culinary background, Michelin experience, artisanal philosophy..."
                    />
                  </Field>
                </div>
              </div>

              {/* Section 3: Culinary Sourcing & Highlights */}
              <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                  <Leaf size={18} className="text-primary" />
                  <h3
                    className="text-lg font-bold text-deep-wood"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                    }}
                  >
                    Culinary Sourcing &amp; Highlights
                  </h3>
                </div>

                <Field
                  label="Key Ingredients & Sourcing Notes"
                  span={2}
                  hint="One highlight per line. Displayed as 'Key Ingredients & Culinary Highlights' on the guest site."
                >
                  <textarea
                    rows={4}
                    className={`${inputClass} resize-none leading-relaxed`}
                    value={editing.ingredients.join("\n")}
                    onChange={(e) =>
                      setEditing((v) => ({
                        ...v,
                        ingredients: e.target.value.split("\n"),
                      }))
                    }
                    placeholder="Estate-pressed Ceylon cinnamon&#10;Line-caught yellowfin tuna from Mirissa&#10;Organic heirloom red rice from Kandy"
                  />
                </Field>
              </div>

              {/* Section 4: Publishing & Operational Controls */}
              <div className="p-6 sm:p-7 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                  <CheckCircle2 size={18} className="text-primary" />
                  <h3
                    className="text-lg font-bold text-deep-wood"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                    }}
                  >
                    Publishing &amp; Operational Controls
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Display Sort Order"
                    hint="Lower numbers appear first in the resort dining directory."
                  >
                    <input
                      type="number"
                      className={inputClass}
                      value={editing.displayOrder}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          displayOrder: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    [
                      "reservationRequired",
                      "Takes table reservations",
                      "Enables guest booking flow",
                    ],
                    [
                      "featured",
                      "Feature on dining page",
                      "Spotlight in hero banners",
                    ],
                    [
                      "isActive",
                      "Live on the guest site",
                      "Visible to resort visitors",
                    ],
                  ].map(([field, label, sub]) => (
                    <label
                      key={field}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                        editing[field]
                          ? "bg-primary/5 border-primary/40 text-deep-wood shadow-2xs"
                          : "bg-surface-container-low/50 border-primary/20 text-deep-wood/80 hover:bg-primary/5"
                      }`}
                    >
                      <div className="mt-0.5">
                        <CustomCheckbox
                          checked={editing[field]}
                          onChange={(e) =>
                            setEditing((v) => ({
                              ...v,
                              [field]: e.target.checked,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{label}</span>
                        <span className="text-[10px] text-deep-wood/60 font-medium">
                          {sub}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Advisory Card */}
              <div className="p-4 rounded-xl bg-surface-container-low/50 border border-primary/20 text-xs text-deep-wood/75 flex items-start gap-3 shadow-xs">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Operational Note:</strong> Retiring a venue hides it
                  from the guest dining page but preserves every past and
                  upcoming table reservation intact in the database.
                </span>
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
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontStyle: "italic",
                    }}
                  >
                    Visual Assets &amp; Gallery
                  </h3>
                </div>

                {/* Hero Main Image */}
                <Field
                  label="Hero Main Photograph URL"
                  required
                  hint="Main photography featured on venue cards and headers."
                >
                  <div className="space-y-2">
                    <input
                      className={`${inputClass} font-mono text-xs`}
                      value={editing.image}
                      onChange={(e) =>
                        setEditing((v) => ({ ...v, image: e.target.value }))
                      }
                      placeholder="/assets/images/dining/canopy-table.jpg"
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

                {/* Gallery URLs */}
                <Field
                  label={`Gallery Photographs (${editing.images.length} of 6)`}
                  hint="One URL per line. Up to 6 supplementary photographs."
                >
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      className={`${inputClass} font-mono text-xs resize-none`}
                      value={editing.images.join("\n")}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          images: e.target.value.split("\n"),
                        }))
                      }
                      placeholder="/assets/images/dining/venue-01.jpg&#10;/assets/images/dining/venue-02.jpg"
                    />

                    {editing.images.filter((u) => u.trim()).length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {editing.images
                          .filter((u) => u.trim())
                          .slice(0, 6)
                          .map((url, idx) => (
                            <div
                              key={idx}
                              className="relative h-16 rounded-lg overflow-hidden border border-primary/20 bg-surface-container-high shadow-xs"
                            >
                              <img
                                src={url.trim()}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <span className="absolute bottom-1 right-1 bg-deep-wood/80 text-white text-[9px] px-1 rounded font-mono">
                                #{idx + 1}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </Field>
              </div>

              {/* Live Guest Card Preview */}
              <div className="p-5 bg-white border border-primary/25 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary block font-mono">
                    Live Guest Card Preview
                  </span>
                  <span className="text-[10px] font-semibold text-deep-wood/50">
                    Guest Site Format
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden border border-primary/20 bg-white shadow-xs">
                  <div className="relative h-40 bg-surface-container-high overflow-hidden">
                    <img
                      src={
                        editing.image ||
                        "/assets/images/dining/canopy-table.jpg"
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-deep-wood/85 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase rounded-md tracking-wider">
                      {editing.type || "Restaurant"}
                    </div>
                    {editing.cuisine && (
                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium rounded-md">
                        {editing.cuisine}
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <h4
                      className="text-base font-bold text-deep-wood italic"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {editing.name || "Venue Sanctuary"}
                    </h4>

                    {editing.tagline && (
                      <p className="text-xs text-deep-wood/70 line-clamp-2">
                        {editing.tagline}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-[11px] text-deep-wood/65">
                      <span>{editing.openHours || "Hours not configured"}</span>
                      <span>{editing.dressCode || "Dress code"}</span>
                    </div>

                    <div className="pt-1">
                      <div className="w-full py-2 rounded-lg bg-primary/10 text-primary text-center text-[10px] font-bold uppercase tracking-wider">
                        {editing.reservationRequired
                          ? "Reserve a Table"
                          : "Walk-ins Welcome"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── TAB 2: CURATED MENU BUILDER ── */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-primary/20 text-xs text-deep-wood/80 flex items-start gap-3 shadow-xs">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Saving replaces the whole menu. Leave a price blank for a course
                on a fixed tasting menu — that is different from zero, and blank
                shows no price figure to the guest.
              </span>
            </div>

            {menuDraft.length === 0 && (
              <div className="p-12 text-center rounded-2xl border-2 border-dashed border-primary/30 bg-white space-y-3 shadow-xs">
                <ChefHat size={36} className="mx-auto text-primary/40" />
                <h4
                  className="text-base font-bold text-deep-wood"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  No Menu Courses Configured Yet
                </h4>
                <p className="text-xs text-deep-wood/60 max-w-md mx-auto">
                  The guest page displays nothing behind &ldquo;Sample
                  Menu&rdquo; until you create at least one course section.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setMenuDraft([
                      {
                        title: "First Courses",
                        subtitle: "Artisanal starters",
                        items: [{ ...EMPTY_ITEM }],
                      },
                    ])
                  }
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-container cursor-pointer transition-colors shadow-xs inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Create First Course / Section
                </button>
              </div>
            )}

            {menuDraft.map((sec, si) => (
              <div
                key={si}
                className="p-6 bg-white border border-primary/20 rounded-2xl shadow-sm space-y-5"
              >
                {/* Course Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center">
                      {si + 1}
                    </span>
                    <h4
                      className="text-base font-bold text-deep-wood"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                      }}
                    >
                      {sec.title || `Course Section ${si + 1}`}
                    </h4>
                    <span className="text-[11px] font-semibold text-deep-wood/50">
                      ({sec.items.length}{" "}
                      {sec.items.length === 1 ? "dish" : "dishes"})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMenuDraft((prev) => prev.filter((_, i) => i !== si))
                    }
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer self-end sm:self-auto p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove this section and its dishes"
                  >
                    <Trash2 size={14} /> Remove Course Section
                  </button>
                </div>

                {/* Section Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Course / Section Title" required>
                    <input
                      className={inputClass}
                      value={sec.title}
                      onChange={(e) =>
                        updateSection(si, {
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g. First Courses, Wood-Fired Mains, Chef's Tasting"
                    />
                  </Field>

                  <Field label="Section Subtitle / Culinary Note">
                    <input
                      className={inputClass}
                      value={sec.subtitle}
                      onChange={(e) =>
                        updateSection(si, {
                          subtitle: e.target.value,
                        })
                      }
                      placeholder="e.g. Served with house-baked pol roti and cultured butter"
                    />
                  </Field>
                </div>

                {/* Dishes */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-deep-wood/70 block">
                    Dishes in this Course
                  </span>

                  {sec.items.map((item, ii) => (
                    <div
                      key={ii}
                      className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-md bg-white border border-primary/20 text-deep-wood/60 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-2">
                          {ii + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-8">
                            <input
                              className={`${inputClass} font-bold`}
                              value={item.name}
                              onChange={(e) =>
                                updateItem(si, ii, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="Dish Name (e.g. Lagoon Crab & Young Jackfruit)"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <input
                              type="number"
                              min={0}
                              step={100}
                              className={inputClass}
                              value={item.price}
                              onChange={(e) =>
                                updateItem(si, ii, {
                                  price: e.target.value,
                                })
                              }
                              placeholder="Price (LKR) — Blank if tasting"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateSection(si, {
                              items: sec.items.filter((_, j) => j !== ii),
                            })
                          }
                          className="p-2 rounded-lg text-deep-wood/40 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0 mt-1"
                          title="Remove dish"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <input
                        className={inputClass}
                        value={item.description}
                        onChange={(e) =>
                          updateItem(si, ii, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Description of ingredients, culinary preparation and tasting notes..."
                      />

                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <input
                          className={`${inputClass} flex-1 min-w-[200px]`}
                          value={item.allergens}
                          onChange={(e) =>
                            updateItem(si, ii, {
                              allergens: e.target.value,
                            })
                          }
                          placeholder="Allergens (e.g. Crustacean, Dairy, Tree Nuts)"
                        />

                        <div className="flex items-center gap-3">
                          {[
                            ["isVegetarian", "Vegetarian"],
                            ["isVegan", "Vegan"],
                            ["isSignature", "Signature"],
                          ].map(([field, label]) => (
                            <label
                              key={field}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-deep-wood/70 cursor-pointer whitespace-nowrap hover:text-deep-wood transition-colors select-none"
                            >
                              <CustomCheckbox
                                size="sm"
                                checked={item[field]}
                                onChange={(e) =>
                                  updateItem(si, ii, {
                                    [field]: e.target.checked,
                                  })
                                }
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {item.isVegan && (
                        <p className="text-[10px] text-emerald-700 font-semibold pl-1">
                          Shown as Vegan on guest menu. Vegetarian is implied.
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      updateSection(si, {
                        items: [...sec.items, { ...EMPTY_ITEM }],
                      })
                    }
                    className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Add Dish to {sec.title || "Course"}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setMenuDraft((prev) => [
                  ...prev,
                  {
                    title: "",
                    subtitle: "",
                    items: [{ ...EMPTY_ITEM }],
                  },
                ])
              }
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary/40 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Another Menu Section / Course
            </button>
          </div>
        )}

        {/* ── Bottom Action Bar ── */}
        <div className="p-5 bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
          <button
            type="button"
            onClick={closeEditor}
            className="px-5 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer shadow-xs"
          >
            Cancel &amp; Return
          </button>

          <button
            type="button"
            onClick={editorTab === "menu" ? handleSaveMenu : handleSaveVenue}
            disabled={savingVenue || savingMenu}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {savingVenue || savingMenu ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>
              {editorTab === "menu"
                ? "Save Menu"
                : isNew
                  ? "Create Venue"
                  : "Save Specifications"}
            </span>
          </button>
        </div>

        {/* Toast within editor view */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3.5 rounded-2xl bg-deep-wood text-sand text-xs font-bold shadow-2xl max-w-md text-center border border-primary/30"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
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
              id: "covers",
              label: "Covers",
              icon: ClipboardList,
              count: reservations.length,
            },
            {
              id: "venues",
              label: "Venues",
              icon: UtensilsCrossed,
              count: venues.length,
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

        {section === "venues" && (
          <button
            type="button"
            onClick={() => openVenue(null)}
            className="px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
          >
            <Plus size={15} /> Add Venue
          </button>
        )}
      </div>

      {/* ---------------- covers ---------------- */}
      {section === "covers" && (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
                From
              </label>

              <input
                type="date"
                className={inputClass}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
                To
              </label>

              <input
                type="date"
                className={inputClass}
                min={from}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
                Status
              </label>

              <select
                className={`${inputClass} cursor-pointer`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>

                {Object.keys(STATUS_FLOW).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
                Search
              </label>

              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-wood/40"
                />

                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Reference, name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFrom(today);
                setTo(today);
                setStatusFilter("all");
                setSearch("");
              }}
              className="px-4 py-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood text-[11px] font-bold uppercase tracking-wider hover:bg-surface-container-high cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Kitchen headcount */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-surface border border-outline-variant/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55 block">
                Expected Covers
              </span>

              <span className="text-2xl font-bold text-deep-wood font-heading">
                {expectedCovers}
              </span>

              <span className="text-[10px] text-deep-wood/50 block">
                excludes cancelled and no-shows
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-outline-variant/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55 block">
                Tables
              </span>

              <span className="text-2xl font-bold text-deep-wood font-heading">
                {reservations.length}
              </span>

              <span className="text-[10px] text-deep-wood/50 block">
                {from === to ? from : `${from} → ${to}`}
              </span>
            </div>

            <div
              className={[
                "p-4 rounded-2xl border",
                dietaryCount > 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-surface border-outline-variant/30",
              ].join(" ")}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55 block">
                Dietary Notes
              </span>

              <span className="text-2xl font-bold text-deep-wood font-heading">
                {dietaryCount}
              </span>

              <span className="text-[10px] text-deep-wood/50 block">
                {dietaryCount > 0 ? "brief the kitchen" : "none today"}
              </span>
            </div>
          </div>

          {coversError ? (
            <div className="p-12 text-center rounded-2xl border border-outline-variant/30 bg-surface">
              <AlertTriangle
                size={30}
                className="mx-auto text-amber-500 mb-2"
              />

              <p className="text-sm font-bold text-deep-wood">
                The dining desk could not be loaded.
              </p>

              <p className="mt-1 text-xs text-deep-wood/60">
                {errorText(coversErrObj, "The resort system did not respond.")}
              </p>

              <button
                onClick={refetchCovers}
                className="mt-4 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-16 text-center rounded-2xl border border-outline-variant/30 bg-surface">
              <UtensilsCrossed
                size={40}
                className="mx-auto text-primary/30 mb-3"
              />

              <p className="text-sm font-bold text-deep-wood">
                No tables for these dates.
              </p>

              <p className="mt-1 text-xs text-deep-wood/60">
                Widen the range or clear the filters to see more.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface">
              {coversFetching && (
                <div className="px-4 py-1.5 bg-primary/5 text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" /> Refreshing
                </div>
              )}

              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-high text-deep-wood/70 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Venue</th>
                    <th className="px-4 py-3">Sitting</th>
                    <th className="px-4 py-3">Party</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/20">
                  {reservations.map((r) => (
                    <tr
                      key={r.referenceId}
                      className={r.status === "Cancelled" ? "opacity-55" : ""}
                    >
                      <td className="px-4 py-3 align-top">
                        <span className="font-mono font-bold text-primary block">
                          {r.referenceId}
                        </span>

                        {r.stayReference && (
                          <span className="text-[10px] text-deep-wood/50 font-mono">
                            stay {r.stayReference}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span className="font-bold text-deep-wood block">
                          {r.guestName}
                        </span>

                        <span className="text-[10px] text-deep-wood/60 flex items-center gap-1">
                          <Mail size={9} /> {r.email}
                        </span>

                        {r.phone && (
                          <span className="text-[10px] text-deep-wood/60 flex items-center gap-1">
                            <Phone size={9} /> {r.phone}
                          </span>
                        )}

                        {r.dietaryNotes && (
                          <span className="mt-1 inline-flex items-start gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 max-w-[220px]">
                            <Leaf size={10} className="shrink-0 mt-0.5" />
                            {r.dietaryNotes}
                          </span>
                        )}

                        {r.occasion && (
                          <span className="mt-1 block text-[10px] font-semibold text-secondary">
                            {r.occasion}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span className="font-semibold text-deep-wood block">
                          {r.venueName}
                        </span>

                        <span className="text-[10px] text-deep-wood/55 capitalize">
                          {r.venueType}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top text-deep-wood/80">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} /> {r.date}
                        </span>

                        <span className="flex items-center gap-1 font-bold text-deep-wood">
                          <Clock size={11} /> {r.time}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span className="flex items-center gap-1 font-bold text-deep-wood">
                          <Users size={11} /> {r.partySize}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span
                          className={[
                            "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border",
                            STATUS_STYLES[r.status] ??
                              "bg-surface-container-high text-deep-wood/70 border-outline-variant/40",
                          ].join(" ")}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {(STATUS_FLOW[r.status] ?? []).map((next) => (
                            <button
                              key={next}
                              type="button"
                              onClick={() => handleStatus(r, next)}
                              disabled={statusSaving}
                              className={[
                                "px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40",
                                next === "Cancelled" || next === "No-Show"
                                  ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700",
                              ].join(" ")}
                            >
                              {next}
                            </button>
                          ))}

                          {(STATUS_FLOW[r.status] ?? []).length === 0 && (
                            <span className="text-[10px] text-deep-wood/40 font-semibold">
                              Closed
                            </span>
                          )}

                          {/* Voucher, plus the pass copy. A table takes no
                              money at booking, so the second document is a
                              service docket - covers, timing and allergies -
                              rather than an invoice with no amount on it. */}
                          <TableDocuments table={r} isAdmin compact />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ---------------- venues ---------------- */}
      {section === "venues" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className={[
                "rounded-2xl border overflow-hidden bg-surface flex flex-col justify-between transition-all",
                venue.isActive
                  ? "border-outline-variant/30 hover:shadow-md"
                  : "border-dashed border-amber-500/50 opacity-70",
              ].join(" ")}
            >
              <div className="relative h-32">
                <img
                  src={mediaUrl(venue.image)}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />

                <span
                  className={[
                    "absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-sm",
                    venue.isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-500 text-white",
                  ].join(" ")}
                >
                  {venue.isActive ? "Live" : "Retired"}
                </span>

                <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-deep-wood/80 backdrop-blur-md text-sand text-[10px] font-bold uppercase tracking-wider">
                  {venue.type}
                </span>

                <span
                  className={[
                    "absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md",
                    (venue.menu?.length ?? 0) > 0
                      ? "bg-deep-wood/75 text-sand"
                      : "bg-amber-500/90 text-white",
                  ].join(" ")}
                >
                  {venue.menu?.reduce(
                    (n, s) => n + (s.items?.length ?? 0),
                    0,
                  ) ?? 0}{" "}
                  dishes
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-deep-wood text-sm mb-0.5">
                    {venue.name}
                  </h3>

                  <p className="text-[11px] text-deep-wood/60 line-clamp-2">
                    {venue.tagline}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-deep-wood/70 flex items-center gap-1">
                      <Users size={9} /> {venue.capacity} covers
                    </span>

                    {venue.reservationRequired && (
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                        Booking required
                      </span>
                    )}

                    {venue.featured && (
                      <span className="px-2 py-0.5 rounded-md bg-secondary/15 text-secondary flex items-center gap-1">
                        <Star size={9} /> Featured
                      </span>
                    )}
                  </div>

                  {venue.chefName && (
                    <p className="mt-2 text-[10px] text-deep-wood/55 flex items-center gap-1">
                      <ChefHat size={10} /> Chef {venue.chefName}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/20 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openVenue(venue)}
                    className="py-2.5 rounded-xl bg-white border border-primary/30 hover:bg-primary/5 text-deep-wood text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Pencil size={12} className="text-primary" /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRetire(venue)}
                    disabled={!venue.isActive}
                    className="py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-700 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Retire. Past reservations keep their record."
                  >
                    <Trash2 size={12} /> Retire
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3.5 rounded-2xl bg-deep-wood text-sand text-xs font-bold shadow-2xl max-w-md text-center border border-primary/30"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
