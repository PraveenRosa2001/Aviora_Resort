import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const ToastContext = createContext(null);

/**
 * Toast Notification Item with animated timer progress bar
 */
export function ToastItem({
  id,
  message,
  type = "success", // 'success' | 'error' | 'warning' | 'info'
  duration = 2500,
  title,
  onClose,
}) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const config = {
    success: {
      bg: "bg-emerald-600/35 border-emerald-500/40 text-white",
      icon: (
        <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0 mt-0.5" />
      ),
      defaultTitle: "Success",
      progressBg: "bg-white/60",
    },
    error: {
      bg: "bg-rose-600/35 border-rose-500/40 text-white",
      icon: <AlertCircle className="w-5 h-5 text-rose-100 shrink-0 mt-0.5" />,
      defaultTitle: "Error",
      progressBg: "bg-white/60",
    },

    warning: {
      bg: "bg-amber-600/35 border-amber-500/40 text-white",
      icon: (
        <AlertTriangle className="w-5 h-5 text-amber-100 shrink-0 mt-0.5" />
      ),
      defaultTitle: "Warning",
      progressBg: "bg-white/60",
    },

    info: {
      bg: "bg-sky-600/35 border-sky-500/40 text-white",
      icon: <Info className="w-5 h-5 text-sky-100 shrink-0 mt-0.5" />,
      defaultTitle: "Information",
      progressBg: "bg-white/60",
    },
  }[type] || {
    bg: "bg-emerald-600 border-emerald-500/40 text-white",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0 mt-0.5" />,
    defaultTitle: "Notification",
    progressBg: "bg-white/60",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={`pointer-events-auto w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden border backdrop-blur-md ${config.bg} flex flex-col`}
    >
      <div className="p-3 flex items-start gap-3">
        {config.icon}
        <div className="flex-1 min-w-0 pr-1">
          <h5 className="text-xs font-bold uppercase tracking-wider text-white/90 mb-0.5">
            {title || config.defaultTitle}
          </h5>
          <p className="text-xs sm:text-sm font-medium text-white leading-relaxed break-words">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onClose(id)}
          className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-all cursor-pointer shrink-0 mt-0.5"
          title="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>

      {/* Reducing countdown progress bar */}
      {duration > 0 && (
        <div className="w-full bg-black/15 h-1 overflow-hidden">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`h-full ${config.progressBg}`}
          />
        </div>
      )}
    </motion.div>
  );
}

/**
 * Top-right standalone Toast Alert (for components with local toast state)
 */
export function ToastAlert({
  toast, // string or { message, type, title, duration }
  onClose,
  duration = 4000,
}) {
  if (!toast) return null;

  const message = typeof toast === "string" ? toast : toast?.message;
  if (!message) return null;

  const isErrorMessage =
    typeof toast === "string" &&
    (toast.toLowerCase().includes("could not") ||
      toast.toLowerCase().includes("failed") ||
      toast.toLowerCase().includes("error") ||
      toast.toLowerCase().includes("unable"));

  const type =
    typeof toast === "string"
      ? isErrorMessage
        ? "error"
        : "success"
      : toast.type || (isErrorMessage ? "error" : "success");

  const title = typeof toast === "object" ? toast.title : undefined;
  const toastDuration =
    typeof toast === "object" && toast.duration !== undefined
      ? toast.duration
      : duration;

  return (
    <div className="fixed top-16 right-4 z-[99999] pointer-events-none flex flex-col items-end gap-3">
      <AnimatePresence>
        <ToastItem
          id="standalone-toast"
          message={message}
          type={type}
          title={title}
          duration={toastDuration}
          onClose={onClose}
        />
      </AnimatePresence>
    </div>
  );
}

/**
 * Toast Provider for app-wide toasts
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", options = {}) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = {
      id,
      message,
      type,
      duration: options.duration !== undefined ? options.duration : 4000,
      title: options.title,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const showSuccess = useCallback(
    (msg, opts) => showToast(msg, "success", opts),
    [showToast],
  );
  const showError = useCallback(
    (msg, opts) => showToast(msg, "error", opts),
    [showToast],
  );
  const showWarning = useCallback(
    (msg, opts) => showToast(msg, "warning", opts),
    [showToast],
  );
  const showInfo = useCallback(
    (msg, opts) => showToast(msg, "info", opts),
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
      }}
    >
      {children}
      {/* Top-Right Notification Portal */}
      <div className="fixed top-5 right-4 z-[99999] pointer-events-none flex flex-col items-end gap-3">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              id={t.id}
              message={t.message}
              type={t.type}
              title={t.title}
              duration={t.duration}
              onClose={removeToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastAlert;
