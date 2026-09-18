import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  Archive,
  Mail,
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  useGetMyInquiriesQuery,
  useLazyLookupInquiryQuery,
} from "../../features/rooms/roomsApi";
import { selectIsAuthenticated } from "../../features/auth/authSlice";

/* --------------------------------------------------------------------------
   What happened to a message the guest sent.

   Two ways in, because a guest who wrote before signing up has no account to
   look it up under:

     signed in  ->  GET /api/contact/my, everything they have ever sent
     signed out ->  reference + email, which is the pair the API demands

   The reference alone is guessable - AVQ-3001, AVQ-3002 - and the messages
   hold names, telephone numbers and travel plans, so the email is not
   optional politeness.

   Internal notes are filtered out in SQL, not here. Nothing on this screen
   could show one even if it tried.
   -------------------------------------------------------------------------- */

const STATUS_STYLES = {
  New: {
    chip: "bg-amber-100 text-amber-900 border-amber-200",
    icon: Clock,
    label: "Received",
    note: "With our concierge team.",
  },
  Open: {
    chip: "bg-blue-100 text-blue-800 border-blue-200",
    icon: MessageSquare,
    label: "Being handled",
    note: "Someone is looking into this.",
  },
  Answered: {
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    label: "Answered",
    note: "Our reply is below.",
  },
  Closed: {
    chip: "bg-surface-container-high text-deep-wood/70 border-outline-variant/40",
    icon: Archive,
    label: "Closed",
    note: "This conversation has been completed.",
  },
};

const stamp = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const stampTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const inputClass =
  "w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-outline-variant/40 rounded-xl " +
  "text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all placeholder:text-deep-wood/35";

function InquiryCard({
  inquiry,
  isOpen: controlledOpen,
  onToggle,
  defaultOpen = false,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalOpen((v) => !v);
    }
  };

  const meta = STATUS_STYLES[inquiry.status] ?? STATUS_STYLES.Closed;
  const StatusIcon = meta.icon;
  const replies = inquiry.replies ?? [];

  return (
    <div
      className={[
        "rounded-2xl border bg-white overflow-hidden transition-all",
        replies.length > 0
          ? "border-primary/30 shadow-xs"
          : "border-outline-variant/30",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="w-full text-left p-4 sm:p-5 cursor-pointer hover:bg-surface-container-low/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-primary">
                {inquiry.referenceId}
              </span>
              <span
                className={[
                  "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1",
                  meta.chip,
                ].join(" ")}
              >
                <StatusIcon size={9} />
                {meta.label}
              </span>
              {replies.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold uppercase tracking-wider">
                  {replies.length} repl{replies.length === 1 ? "y" : "ies"}
                </span>
              )}
            </div>

            <h4
              className="text-sm font-bold text-deep-wood truncate"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {inquiry.subject}
            </h4>

            <p className="mt-0.5 text-[11px] text-deep-wood/60 font-medium">
              Sent {stamp(inquiry.createdAt)} · {meta.note}
            </p>
          </div>

          <ChevronDown
            size={16}
            className={[
              "text-deep-wood/40 shrink-0 mt-1 transition-transform duration-300",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 space-y-3 border-t border-outline-variant/20 pt-4 max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar">
              {/* What they wrote */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/50 block mb-1.5">
                  Your message · {stampTime(inquiry.createdAt)}
                </span>
                <p className="text-xs text-deep-wood/85 leading-relaxed whitespace-pre-wrap">
                  {inquiry.message}
                </p>
              </div>

              {/* What came back */}
              {replies.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 text-center">
                  <Clock size={18} className="mx-auto text-amber-600 mb-1.5" />
                  <p className="text-[11px] font-bold text-amber-900">
                    No reply yet.
                  </p>
                  <p className="mt-0.5 text-[11px] text-amber-800/80 leading-relaxed">
                    Our concierge answers most messages within a few hours. You will
                    receive an email, and it will also appear here.
                  </p>
                </div>
              ) : (
                replies.map((r, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white border-l-[3px] border-primary border-y border-r border-outline-variant/30"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Mail size={10} /> {r.author}
                      </span>
                      <span className="text-[10px] text-deep-wood/45 font-semibold shrink-0">
                        {stampTime(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-deep-wood/85 leading-relaxed whitespace-pre-wrap">
                      {r.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MyInquiries() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const {
    data: mine = [],
    isLoading,
    isError,
  } = useGetMyInquiriesQuery(undefined, { skip: !isAuthenticated });

  /* Signed-out lookup */
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [found, setFound] = useState(null);

  const [runLookup, { isFetching: looking }] = useLazyLookupInquiryQuery();

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError("");
    setFound(null);

    if (!reference.trim() || !email.trim()) {
      setLookupError("Both the reference and the email address are needed.");
      return;
    }

    try {
      const result = await runLookup({
        referenceId: reference.trim().toUpperCase(),
        email: email.trim(),
      }).unwrap();

      setFound(result);
    } catch (err) {
      // The API returns the same message for an unknown reference and a wrong
      // email, so the endpoint cannot be used to discover which references
      // exist. Shown verbatim.
      setLookupError(
        err?.data?.message ||
          "No message was found for that reference and email address.",
      );
    }
  };

  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (mine.length > 0 && openId === null) {
      setOpenId(mine[0].referenceId);
    }
  }, [mine, openId]);

  const answered = useMemo(
    () => mine.filter((q) => (q.replies?.length ?? 0) > 0).length,
    [mine],
  );

  /* ---------------- signed in ---------------- */
  if (isAuthenticated) {
    if (isLoading) {
      return (
        <div className="py-16 text-center">
          <Loader2 size={26} className="mx-auto animate-spin text-primary/50 mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-deep-wood/50">
            Loading your inquiries
          </p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="py-16 text-center">
          <AlertCircle size={30} className="mx-auto text-amber-500 mb-2" />
          <p className="text-sm font-bold text-deep-wood">
            Your inquiries could not be loaded.
          </p>
        </div>
      );
    }

    if (mine.length === 0) {
      return (
        <div className="py-16 text-center">
          <Inbox size={40} className="mx-auto text-primary/30 mb-3" />
          <h4
            className="text-lg font-bold text-deep-wood italic"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Nothing here yet
          </h4>
          <p className="mt-1 text-xs text-deep-wood/65 max-w-sm mx-auto leading-relaxed">
            Messages you send us will appear here with our replies, so you can
            come back to them whenever you like.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-deep-wood/60">
            {mine.length} inquir{mine.length === 1 ? "y" : "ies"}
            {answered > 0 && ` · ${answered} answered`}
          </span>
          <span className="text-[10px] text-deep-wood/45 font-medium">
            Newest first · Click to expand
          </span>
        </div>

        <div className="space-y-3 max-h-[460px] sm:max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
          {mine.map((q) => (
            <InquiryCard
              key={q.referenceId}
              inquiry={q}
              isOpen={openId === q.referenceId}
              onToggle={() =>
                setOpenId((prev) => (prev === q.referenceId ? null : q.referenceId))
              }
            />
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- signed out ---------------- */
  return (
    <div className="space-y-5">
      <div className="text-center">
        <Search size={28} className="mx-auto text-primary/40 mb-2" />
        <h4
          className="text-lg font-bold text-deep-wood italic"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Look up an inquiry
        </h4>
        <p className="mt-1 text-xs text-deep-wood/65 max-w-sm mx-auto leading-relaxed">
          Enter the reference from your confirmation, and the email address you
          sent it from. Signing in shows all of your messages at once.
        </p>
      </div>

      <form onSubmit={handleLookup} className="space-y-3">
        <div>
          <label
            htmlFor="lookup-reference"
            className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5"
          >
            Reference
          </label>
          <input
            id="lookup-reference"
            className={`${inputClass} font-mono`}
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="AVQ-3001"
          />
        </div>

        <div>
          <label
            htmlFor="lookup-email"
            className="block text-[11px] font-bold uppercase tracking-wider text-deep-wood mb-1.5"
          >
            Email Address
          </label>
          <input
            id="lookup-email"
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {lookupError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={looking}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
        >
          {looking ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
          Find My Inquiry
        </button>
      </form>

      {found && (
        <div className="pt-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
          <InquiryCard inquiry={found} defaultOpen />
        </div>
      )}
    </div>
  );
}
