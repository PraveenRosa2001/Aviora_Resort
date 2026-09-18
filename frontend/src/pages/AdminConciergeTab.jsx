import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Mail,
  Phone,
  MessageCircle,
  Search,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  StickyNote,
  X,
  UserCheck,
  Flag,
  Archive,
  CircleDot,
  RefreshCw,
  Copy,
  MailCheck,
  MailX,
  History,
} from "lucide-react";
import {
  useGetAdminInquiriesQuery,
  useGetInquiryCountsQuery,
  useGetInquiryDetailQuery,
  useMarkInquiryReadMutation,
  useUpdateInquiryMutation,
  useAddInquiryReplyMutation,
} from "../features/rooms/roomsApi";

/* --------------------------------------------------------------------------
   The concierge desk.

   Every inquiry is already in the database by the time it reaches this
   screen - nothing here depends on an email having been delivered. What an
   email provider used to do is replaced piece by piece:

     acknowledgement  ->  the reference the guest was shown
     notification     ->  the unread count in the header
     outbound send    ->  the mailto:/WhatsApp handoff below
     shared mailbox   ->  the thread, from dbo.InquiryReplies

   The handoff matters more than it looks. The desk writes the reply here, the
   button opens it in their own mail client, and the same text is stored as a
   row. So the message leaves from a real person's address - which is what
   makes it arrive - while the record stays with the inquiry.
   -------------------------------------------------------------------------- */

const STATUS_STYLES = {
  New: "bg-amber-100 text-amber-900 border-amber-200",
  Open: "bg-blue-100 text-blue-800 border-blue-200",
  Answered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Closed:
    "bg-surface-container-high text-deep-wood/70 border-outline-variant/40",
};

const PRIORITY_STYLES = {
  High: "bg-red-100 text-red-800 border-red-200",
  Normal:
    "bg-surface-container-high text-deep-wood/60 border-outline-variant/40",
  Low: "bg-surface-container-high text-deep-wood/45 border-outline-variant/30",
};

const CHANNEL_ICONS = {
  email: Mail,
  whatsapp: MessageCircle,
  phone: Phone,
  note: StickyNote,
};

/* Whether the email actually left the building. Recorded and Sent are two
   different things, and conflating them is how a guest ends up believing
   they were answered. */
const DELIVERY = {
  Sent: {
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: MailCheck,
    label: "Delivered",
  },
  Failed: {
    chip: "bg-red-100 text-red-800 border-red-200",
    icon: MailX,
    label: "Not sent",
  },
  Recorded: {
    chip: "bg-amber-50 text-amber-900 border-amber-200",
    icon: Clock,
    label: "Awaiting send",
  },
};

const errorText = (err, fallback) =>
  err?.data?.message || err?.error || fallback;

const inputClass =
  "w-full px-3.5 py-2.5 text-xs bg-white border border-outline-variant/40 rounded-xl " +
  "text-deep-wood font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs transition-all";

/** "3 hours ago", "2 days ago" — the desk cares about the gap, not the clock. */
const waited = (hours) => {
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
};

const stamp = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
};

function StatCard({ label, value, tone = "plain", hint }) {
  const tones = {
    plain: "bg-surface border-outline-variant/30",
    alert: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  };

  return (
    <div className={`p-4 rounded-2xl border ${tones[tone]}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55 block">
        {label}
      </span>
      <span
        className="text-2xl font-bold text-deep-wood"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </span>
      {hint && (
        <span className="text-[10px] text-deep-wood/50 block">{hint}</span>
      )}
    </div>
  );
}

export default function AdminConciergeTab() {
  /* "open" is the server's default - New and Open only. "All" is a real
     value the procedure understands, and it is what makes an answered
     inquiry visible again: recording a reply sets the status to Answered,
     which used to drop it out of the only view the desk had. */
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [openRef, setOpenRef] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  };

  const {
    data: inquiries = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminInquiriesQuery({
    // "open" is the absence of a status filter - the procedure's own default
    // is New and Open. Sending the literal would not match any status.
    status: status === "open" ? undefined : status,
    priority,
    unreadOnly,
    search: search.trim() || undefined,
  });

  const { data: counts } = useGetInquiryCountsQuery(undefined, {
    // The counts are the notification, so they have to be fresh without the
    // desk reloading. Every reply and status change also invalidates the
    // "Inquiry" tag, so the numbers move the moment the desk acts - the poll
    // only catches messages arriving while nobody is touching the screen.
    pollingInterval: 30000,
    refetchOnFocus: true,
  });

  const [markRead] = useMarkInquiryReadMutation();

  const openInquiry = async (inquiry) => {
    setOpenRef(inquiry.referenceId);

    // Opening it is what "read" means. The procedure writes FirstReadAt once
    // and never overwrites it, so "how long before anyone looked at this"
    // stays answerable afterwards.
    if (!inquiry.isRead) {
      try {
        await markRead({
          referenceId: inquiry.referenceId,
          isRead: true,
        }).unwrap();
      } catch {
        // Not worth interrupting the desk over — the thread still opens.
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <Loader2 size={28} className="mx-auto animate-spin text-primary/60" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-deep-wood/50">
          Loading the concierge desk
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Counts.

          Answered and Total are here because a desk with everything handled
          would otherwise see five zeros beside "Today 3" and read the screen
          as broken. Zero unread is the goal, not a fault. */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <StatCard
          label="Unread"
          value={counts?.unread ?? 0}
          tone={counts?.unread > 0 ? "alert" : "plain"}
          hint={counts?.unread > 0 ? "nobody has opened these" : "all opened"}
        />
        <StatCard
          label="Open"
          value={counts?.open ?? 0}
          hint={counts?.open > 0 ? "awaiting a reply" : "nothing waiting"}
        />
        <StatCard
          label="Overdue"
          value={counts?.overdue ?? 0}
          tone={counts?.overdue > 0 ? "danger" : "plain"}
          hint="open over 24 hours"
        />
        <StatCard
          label="High Priority"
          value={counts?.highPriority ?? 0}
          tone={counts?.highPriority > 0 ? "alert" : "plain"}
        />
        <StatCard
          label="Answered"
          value={counts?.answered ?? 0}
          hint={`${counts?.total ?? 0} received in total`}
        />
        <StatCard
          label="Today"
          value={counts?.today ?? 0}
          hint="arrived today"
        />
      </div>

      {/* The worst state in the system, so it gets a line of its own rather
          than a tile among five. */}
      {counts?.failedDelivery > 0 && (
        <button
          type="button"
          onClick={() => {
            setStatus("All");
            setUnreadOnly(false);
            setPriority("all");
          }}
          className="w-full mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-left flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors"
        >
          <MailX size={18} className="text-red-700 shrink-0" />
          <span className="text-xs font-bold text-red-900">
            {counts.failedDelivery} repl
            {counts.failedDelivery === 1 ? "y was" : "ies were"} recorded but
            never sent.
            <span className="block font-medium text-red-800/80 mt-0.5">
              Those guests believe they have been answered. Open Full history to
              find them.
            </span>
          </span>
        </button>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
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
              placeholder="Reference, name, email, subject or message text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
            Status
          </label>
          <select
            className={`${inputClass} cursor-pointer`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="open">Needs attention</option>
            <option value="All">All inquiries</option>
            <option value="New">New</option>
            <option value="Open">Open</option>
            <option value="Answered">Answered</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-wood/70 mb-1">
            Priority
          </label>
          <select
            className={`${inputClass} cursor-pointer`}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="all">Any</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isError ? (
        <div className="p-12 text-center rounded-2xl border border-outline-variant/30 bg-surface">
          <AlertTriangle size={30} className="mx-auto text-amber-500 mb-2" />
          <p className="text-sm font-bold text-deep-wood">
            The concierge desk could not be loaded.
          </p>
          <p className="mt-1 text-xs text-deep-wood/60">
            {errorText(error, "The resort system did not respond.")}
          </p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-outline-variant/30 bg-surface">
          <Inbox size={40} className="mx-auto text-primary/30 mb-3" />
          <p className="text-sm font-bold text-deep-wood">Nothing waiting.</p>
          <p className="mt-1 text-xs text-deep-wood/60">
            {status === "open"
              ? "Every inquiry has been answered or closed. Choose Full history to see them."
              : "No inquiries match these filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {inquiries.map((q) => {
            const ChannelIcon = CHANNEL_ICONS[q.preferredChannel] ?? Mail;
            const overdue =
              !["Answered", "Closed"].includes(q.status) &&
              q.hoursWaiting >= 24;

            return (
              <button
                key={q.referenceId}
                type="button"
                onClick={() => openInquiry(q)}
                className={[
                  "w-full text-left p-4 rounded-2xl border-2 bg-white transition-all duration-300 cursor-pointer",
                  "border-primary/25 hover:border-primary/60 hover:shadow-xl",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* The unread dot carries the same meaning as the count
                          above, at the row a person is actually looking at. */}
                      {!q.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}

                      <span className="font-mono font-bold text-primary text-xs">
                        {q.referenceId}
                      </span>

                      <span
                        className={[
                          "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border",
                          STATUS_STYLES[q.status] ?? STATUS_STYLES.Closed,
                        ].join(" ")}
                      >
                        {q.status}
                      </span>

                      {q.priority !== "Normal" && (
                        <span
                          className={[
                            "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border",
                            PRIORITY_STYLES[q.priority],
                          ].join(" ")}
                        >
                          {q.priority}
                        </span>
                      )}

                      {overdue && (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <Clock size={9} /> {waited(q.hoursWaiting)}
                        </span>
                      )}

                      {/* The worst state on this screen: the desk believes it
                          answered, the guest received nothing. */}
                      {q.failedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-red-600 text-white border border-red-700 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <MailX size={9} /> Reply not sent
                        </span>
                      )}
                    </div>

                    <h4
                      className={[
                        "text-sm mb-0.5 truncate",
                        q.isRead
                          ? "font-semibold text-deep-wood/85"
                          : "font-bold text-deep-wood",
                      ].join(" ")}
                    >
                      {q.subject}
                    </h4>

                    <p className="text-[11px] text-deep-wood/60 line-clamp-2 leading-relaxed">
                      {q.message}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-deep-wood/55 font-semibold">
                      <span className="text-deep-wood/75">
                        {q.firstName} {q.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChannelIcon size={10} /> prefers {q.preferredChannel}
                      </span>
                      {q.isRegisteredGuest && (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <UserCheck size={10} /> registered guest
                        </span>
                      )}
                      {q.replyCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Send size={10} /> {q.replyCount} repl
                          {q.replyCount === 1 ? "y" : "ies"}
                        </span>
                      )}
                      {q.noteCount > 0 && (
                        <span className="flex items-center gap-1">
                          <StickyNote size={10} /> {q.noteCount} note
                          {q.noteCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {q.assignedTo && (
                        <span className="text-primary">
                          assigned to {q.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-deep-wood/50 block">
                      {waited(q.hoursWaiting)}
                    </span>
                    <span className="text-[10px] text-deep-wood/40 block">
                      {stamp(q.createdAt)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {openRef && (
          <InquiryThread
            referenceId={openRef}
            onClose={() => setOpenRef(null)}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] px-6 py-3.5 rounded-2xl bg-deep-wood text-sand text-xs font-bold shadow-2xl max-w-md text-center border border-primary/30"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------------------------------------------------
   One inquiry, its thread, and the handoff.
   -------------------------------------------------------------------------- */
function InquiryThread({ referenceId, onClose, onToast }) {
  const { data: inquiry, isLoading } = useGetInquiryDetailQuery(referenceId);

  const [updateInquiry, { isLoading: updating }] = useUpdateInquiryMutation();
  const [addReply, { isLoading: replying }] = useAddInquiryReplyMutation();

  const [body, setBody] = useState("");
  const [isNote, setIsNote] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSend = async (channel) => {
    setFormError("");

    if (!body.trim()) {
      setFormError(
        isNote
          ? "The note cannot be empty."
          : "Write the reply before sending it.",
      );
      return;
    }

    try {
      // The API records the reply, then sends it over SMTP and stamps the
      // outcome onto the row. No mailto: handoff any more - that needed the
      // desk to press send in a second application, and nothing knew whether
      // they had.
      const res = await addReply({
        referenceId,
        body: body.trim(),
        channel: isNote ? "note" : channel,
        isInternalNote: isNote,
      }).unwrap();

      setBody("");
      setIsNote(false);

      if (res?.sent === false && !isNote && channel === "email") {
        // Recorded but not delivered. Left on screen rather than a toast,
        // because it needs acting on.
        setFormError(
          res?.deliveryError
            ? `Recorded, but not sent — ${res.deliveryError}`
            : "Recorded, but the email could not be sent. It is marked Not sent on the thread.",
        );
      }

      onToast(res?.message || "Recorded.");
    } catch (err) {
      setFormError(errorText(err, "The reply could not be recorded."));
    }
  };

  const setField = async (patch, label) => {
    try {
      const res = await updateInquiry({ referenceId, ...patch }).unwrap();
      onToast(res?.message || `${label} updated.`);
    } catch (err) {
      onToast(errorText(err, "The inquiry could not be updated."));
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(inquiry.email);
      onToast("Email address copied.");
    } catch {
      onToast("Could not copy — select the address instead.");
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-start justify-center p-4 pt-20 md:pt-18 pb-8 overflow-y-auto bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border-2 border-primary my-auto text-deep-wood"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div className="px-6 sm:px-8 py-5 bg-deep-wood text-resort-white flex items-start justify-between gap-4 border-b border-primary/30 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
              <Inbox size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300 block font-mono mb-0.5">
                {referenceId}
              </span>
              <h3
                className="text-lg sm:text-xl font-bold text-sand italic leading-tight truncate"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {inquiry?.subject ?? "Loading…"}
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

        {isLoading || !inquiry ? (
          <div className="p-16 text-center">
            <Loader2
              size={26}
              className="mx-auto animate-spin text-primary/50"
            />
          </div>
        ) : (
          <>
            <div className="p-6 md:p-8 bg-surface overflow-y-auto flex-1 space-y-5">
              {/* Who wrote it */}
              <div className="p-4 rounded-2xl bg-white border border-primary/20 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-deep-wood">
                      {inquiry.firstName} {inquiry.lastName}
                      {inquiry.isRegisteredGuest && (
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                          Registered
                        </span>
                      )}
                    </h4>

                    <button
                      type="button"
                      onClick={copyEmail}
                      className="mt-1 text-[11px] text-deep-wood/70 font-semibold flex items-center gap-1.5 hover:text-primary cursor-pointer"
                    >
                      <Mail size={11} /> {inquiry.email}
                      <Copy size={10} className="opacity-50" />
                    </button>

                    {inquiry.phone && (
                      <a
                        href={`tel:${inquiry.phone}`}
                        className="mt-0.5 text-[11px] text-deep-wood/70 font-semibold flex items-center gap-1.5 hover:text-primary"
                      >
                        <Phone size={11} /> {inquiry.phone}
                      </a>
                    )}
                  </div>

                  <div className="text-right text-[10px] text-deep-wood/55 font-semibold">
                    <span className="block">
                      Arrived {stamp(inquiry.createdAt)}
                    </span>
                    <span className="block">
                      {inquiry.firstReadAt
                        ? `First opened ${stamp(inquiry.firstReadAt)}`
                        : "Not yet opened"}
                    </span>
                    {inquiry.sourcePage && (
                      <span className="block font-mono opacity-70">
                        {inquiry.sourcePage}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-3 pt-3 border-t border-outline-variant/20 text-xs text-deep-wood/85 leading-relaxed whitespace-pre-wrap">
                  {inquiry.message}
                </p>

                <p className="mt-2 text-[10px] text-deep-wood/50 font-semibold">
                  Guest asked to be answered by{" "}
                  <strong className="text-deep-wood/70">
                    {inquiry.preferredChannel}
                  </strong>
                </p>
              </div>

              {/* Status / priority */}
              <div className="flex flex-wrap items-center gap-2">
                {["Open", "Answered", "Closed"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={updating || inquiry.status === s}
                    onClick={() => setField({ status: s }, "Status")}
                    className={[
                      "px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer disabled:opacity-100 disabled:cursor-default",
                      inquiry.status === s
                        ? STATUS_STYLES[s]
                        : "bg-white text-deep-wood/70 border-outline-variant/40 hover:bg-surface-container-high",
                    ].join(" ")}
                  >
                    {s === "Closed" ? (
                      <span className="flex items-center gap-1.5">
                        <Archive size={11} /> {s}
                      </span>
                    ) : (
                      s
                    )}
                  </button>
                ))}

                <span className="w-px h-6 bg-outline-variant/40 mx-1" />

                {["High", "Normal", "Low"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={updating || inquiry.priority === p}
                    onClick={() => setField({ priority: p }, "Priority")}
                    className={[
                      "px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer disabled:opacity-100 disabled:cursor-default",
                      inquiry.priority === p
                        ? PRIORITY_STYLES[p]
                        : "bg-white text-deep-wood/70 border-outline-variant/40 hover:bg-surface-container-high",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-1.5">
                      {p === "High" && <Flag size={11} />}
                      {p}
                    </span>
                  </button>
                ))}
              </div>

              {/* Thread */}
              {inquiry.replies.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55">
                    Thread
                  </span>

                  {inquiry.replies.map((r) => {
                    const Icon = CHANNEL_ICONS[r.channel] ?? Mail;

                    return (
                      <div
                        key={r.id}
                        className={[
                          "p-3.5 rounded-xl border text-xs leading-relaxed",
                          r.isInternalNote
                            ? "bg-amber-50/70 border-amber-200 border-dashed"
                            : "bg-white border-outline-variant/30",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/60 flex items-center gap-1.5">
                            <Icon size={10} />
                            {r.author}
                            {r.isInternalNote && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 tracking-normal">
                                internal note — not sent to the guest
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-deep-wood/45 font-semibold shrink-0 flex items-center gap-2">
                            {/* Recorded and Sent are different outcomes. A
                                reply the mail server refused must not look
                                the same as one that arrived. */}
                            {!r.isInternalNote &&
                              r.channel !== "phone" &&
                              DELIVERY[r.delivery] && (
                                <span
                                  className={[
                                    "px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider flex items-center gap-1",
                                    DELIVERY[r.delivery].chip,
                                  ].join(" ")}
                                >
                                  {(() => {
                                    const D = DELIVERY[r.delivery].icon;
                                    return <D size={9} />;
                                  })()}
                                  {DELIVERY[r.delivery].label}
                                </span>
                              )}
                            {stamp(r.createdAt)}
                          </span>
                        </div>
                        <p className="text-deep-wood/85 whitespace-pre-wrap">
                          {r.body}
                        </p>

                        {r.deliveryError && (
                          <p className="mt-2 pt-2 border-t border-red-200/60 text-[10px] text-red-800 font-semibold leading-relaxed">
                            Mail server said: {r.deliveryError}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compose */}
              <div className="p-4 rounded-2xl bg-white border border-primary/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-deep-wood/55">
                    {isNote ? "Internal Note" : "Reply to the Guest"}
                  </span>

                  <label className="flex items-center gap-2 text-[11px] font-bold text-deep-wood/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNote}
                      onChange={(e) => setIsNote(e.target.checked)}
                      className="accent-primary w-3.5 h-3.5 cursor-pointer"
                    />
                    Internal note
                  </label>
                </div>

                <textarea
                  rows={5}
                  className={`${inputClass} resize-none leading-relaxed`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    isNote
                      ? "Only the desk sees this. The guest never does."
                      : "Write the reply. Sending opens it in your own mail client with the guest's message quoted underneath."
                  }
                />

                {formError && (
                  <p className="text-[11px] text-red-700 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={12} /> {formError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {isNote ? (
                    <button
                      type="button"
                      onClick={() => handleSend("note")}
                      disabled={replying}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {replying ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <StickyNote size={13} />
                      )}
                      Save Note
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSend("email")}
                        disabled={replying}
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {replying ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        Send Reply
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSend("phone")}
                        disabled={replying}
                        className="px-4 py-2.5 rounded-xl bg-white border border-outline-variant/40 text-deep-wood text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-surface-container-high disabled:opacity-50"
                        title="Record what was said on a telephone call"
                      >
                        <Phone size={13} /> Log a Call
                      </button>
                    </>
                  )}
                </div>

                {!isNote && (
                  <p className="text-[10px] text-deep-wood/50 leading-relaxed">
                    The reply is written to the inquiry first, then sent to{" "}
                    <strong className="text-deep-wood/70">
                      {inquiry.email}
                    </strong>
                    . If the send fails it is marked <em>Not sent</em> on the
                    thread rather than disappearing, so it is never mistaken for
                    answered.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 bg-surface-container-low border-t-2 border-primary/20 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[10px] text-deep-wood/55 font-semibold flex items-center gap-1.5">
                {inquiry.status === "Answered" ||
                inquiry.status === "Closed" ? (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Last activity {stamp(inquiry.lastActivityAt)}
                  </>
                ) : (
                  <>
                    <Clock size={12} className="text-amber-600" />
                    Waiting {waited(inquiry.hoursWaiting)}
                  </>
                )}
              </span>

              {/* <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white border border-outline-variant/50 text-deep-wood text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high cursor-pointer shadow-xs"
              >
                Close
              </button> */}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
