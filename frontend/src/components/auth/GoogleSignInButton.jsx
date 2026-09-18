import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, Loader2 } from "lucide-react";
import { signInWithGoogle } from "../../features/auth/authSlice";

/* --------------------------------------------------------------------------
   Google Sign-In.

   Google Identity Services renders the button itself, inside an iframe that
   this page cannot read. That is deliberate on Google's part and worth
   understanding rather than fighting: the credential is produced in a context
   the host page has no access to, so a script injected into this site cannot
   lift a token out of it.

   The practical consequence is that the button's appearance is configured,
   not styled. `theme`, `shape`, `size` and `width` are the whole vocabulary -
   there is no CSS reaching inside. The wrapper below handles the rest.

   The token goes straight to POST /api/auth/google, which validates it WITH
   GOOGLE before believing anything in it. Nothing this component reads out of
   the credential is trusted, and it deliberately reads nothing.
   -------------------------------------------------------------------------- */

const SCRIPT_ID = "google-identity-services";
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/** Loads the GIS script once, however many components ask for it. */
function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID);

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", () => reject(new Error("script failed")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("script failed"));
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  label = "signin_with",
  disabled = false,
}) {
  const dispatch = useDispatch();
  const holder = useRef(null);

  const [clientId, setClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
  );
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* The server is the authority on whether this feature is available. Asking
     it means the button cannot appear on a deployment where the API has no
     client id configured - which would render fine and then fail with a 503
     the moment somebody pressed it. */
  useEffect(() => {
    if (clientId) return;

    let alive = true;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (alive && cfg?.enabled && cfg.clientId) setClientId(cfg.clientId);
      })
      .catch(() => {
        // Silent. A missing config endpoint means no Google button, which is
        // a complete and working state - password sign-in is untouched.
      });

    return () => {
      alive = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !holder.current) return;

    let alive = true;

    const handleCredential = async (response) => {
      if (!alive) return;

      setError("");
      setBusy(true);

      try {
        // response.credential is the ID token. It is passed on untouched -
        // this component does not decode it, and must not: anything read here
        // would be unverified.
        //
        // authSlice uses plain thunks rather than createAsyncThunk, so this
        // awaits the dispatch and catches - there is no .unwrap().
        const result = await dispatch(signInWithGoogle(response.credential));

        onSuccess?.(result);
      } catch (err) {
        const message =
          err?.message ||
          "That Google sign-in could not be completed.";

        setError(message);
        onError?.(message);
      } finally {
        if (alive) setBusy(false);
      }
    };

    loadGoogleScript()
      .then(() => {
        if (!alive || !window.google?.accounts?.id || !holder.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,

          // No One Tap. It appears unbidden over the page, and on a sign-in
          // screen that already offers two ways in it is noise rather than
          // convenience.
          auto_select: false,
          cancel_on_tap_outside: true,

          // FedCM is where browsers are going as third-party cookies end.
          // Opting in now means the button keeps working rather than
          // silently failing in a future Chrome.
          use_fedcm_for_prompt: true,
        });

        holder.current.innerHTML = "";

        window.google.accounts.id.renderButton(holder.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: label,
          logo_alignment: "left",
          width: holder.current.offsetWidth || 320,
        });

        setReady(true);
      })
      .catch(() => {
        if (alive)
          setError(
            "Google sign-in could not load. Please use your email and password.",
          );
      });

    return () => {
      alive = false;
    };
  }, [clientId, dispatch, label, onSuccess, onError]);

  // No client id anywhere: the feature is off. Render nothing rather than a
  // dead button - password sign-in is complete on its own.
  if (!clientId) return null;

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Google renders into this node. Its width is read at render time,
            so the wrapper must have a width before the script runs. */}
        <div
          ref={holder}
          className={[
            "w-full min-h-[44px] flex justify-center transition-opacity",
            ready && !busy && !disabled ? "opacity-100" : "opacity-60",
            busy || disabled ? "pointer-events-none" : "",
          ].join(" ")}
        />

        {/* Placeholder until the script lands, so the form does not jump. */}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full border border-outline-variant/40 bg-white text-deep-wood/50 text-xs font-semibold pointer-events-none">
            <Loader2 size={13} className="animate-spin" />
            Loading Google
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-white/85 text-deep-wood text-xs font-bold">
            <Loader2 size={14} className="animate-spin text-primary" />
            Signing you in…
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-600 font-semibold flex items-start gap-1.5">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          {error}
        </p>
      )}
    </div>
  );
}
