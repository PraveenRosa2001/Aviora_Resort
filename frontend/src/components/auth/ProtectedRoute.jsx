import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  verifyAdminSession,
} from '../../features/auth/authSlice';

/**
 * Route protection wrapper.
 *
 * For guest routes this is a client-side check and nothing more.
 *
 * For requiredRole="admin" it additionally calls GET /api/admin/session before
 * rendering. That endpoint carries [Authorize(Roles = "admin")], so the answer
 * comes from the server: a role value edited in localStorage produces a 401
 * (no valid signed token) or a 403 (token is not an admin token) and the page
 * never renders.
 *
 * The client-side check is kept because it avoids a pointless network call for
 * anyone who is plainly not signed in. It is convenience, not security.
 *
 * @param {Object} props
 * @param {'admin' | 'guest' | 'any'} [props.requiredRole='any']
 * @param {React.ReactNode} props.children
 */
export default function ProtectedRoute({ children, requiredRole = 'any' }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const location = useLocation();

  const needsServerCheck = requiredRole === 'admin';

  // 'idle' | 'checking' | 'granted' | 'denied' | 'unreachable'
  const [status, setStatus] = useState(needsServerCheck ? 'checking' : 'granted');

  useEffect(() => {
    if (!needsServerCheck || !isAuthenticated) return;

    let cancelled = false;
    setStatus('checking');

    verifyAdminSession()
      .then(() => {
        if (!cancelled) setStatus('granted');
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 / 403 - the server refused. Anything else (network failure,
        // API not running) is treated as unreachable rather than a refusal,
        // so a stopped backend does not look like a permissions problem.
        setStatus(err.status === 401 || err.status === 403 ? 'denied' : 'unreachable');
      });

    return () => {
      cancelled = true;
    };
    // location.key is included so navigating back to /admin re-verifies
  }, [needsServerCheck, isAuthenticated, location.key]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Cheap local check first - avoids a network call for an obvious non-admin
  if (requiredRole === 'admin' && currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (needsServerCheck) {
    if (status === 'checking') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#fdfcfb]">
          <div className="h-8 w-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
          <p className="text-xs font-medium uppercase tracking-wider text-deep-wood/60">
            Verifying administrator access
          </p>
        </div>
      );
    }

    if (status === 'denied') {
      return <Navigate to="/" replace />;
    }

    if (status === 'unreachable') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-[#fdfcfb]">
          <p className="text-sm font-semibold text-deep-wood">
            Unable to verify administrator access
          </p>
          <p className="text-xs text-deep-wood/60 max-w-sm">
            The reservation system did not respond. Check that the API is running,
            then try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      );
    }
  }

  return children;
}
