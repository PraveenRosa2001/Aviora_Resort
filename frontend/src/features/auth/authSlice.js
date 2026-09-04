import { createSlice } from '@reduxjs/toolkit';
import apiClient, { SESSION_KEY } from '../../services/apiClient';

/* ------------------------------------------------------------------ */
/*  Session persistence helpers                                        */
/* ------------------------------------------------------------------ */

const saveSession = (user, token) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
  } catch (e) {
    console.error('Failed to persist auth session', e);
  }
};

const clearStoredSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear auth session', e);
  }
};

const loadSavedSession = () => {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        user: parsed.user || null,
        token: parsed.token || null,
        isAuthenticated: !!(parsed.user && parsed.token),
      };
    }
  } catch (e) {
    console.error('Error reading auth session', e);
  }
  return { user: null, token: null, isAuthenticated: false };
};

const savedSession = loadSavedSession();

/* ------------------------------------------------------------------ */
/*  Slice                                                              */
/* ------------------------------------------------------------------ */

const initialState = {
  user: savedSession.user,
  token: savedSession.token,
  isAuthenticated: savedSession.isAuthenticated,
  loading: false,
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    loginStart: (state) => {
      state.loading = true;
      state.error = null;
      state.successMessage = null;
    },

    // payload: { user, token, message }
    loginSuccess: (state, action) => {
      const { user, token, message } = action.payload;
      state.loading = false;
      state.isAuthenticated = true;
      state.user = user;
      state.token = token;
      state.error = null;
      state.successMessage = message ?? `Welcome back, ${user.name}!`;
      saveSession(user, token);
    },

    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Used when GET /auth/me confirms the stored token is still valid
    sessionRestored: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      saveSession(action.payload, state.token);
    },

    logoutSuccess: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.successMessage = null;
      state.loading = false;
      clearStoredSession();
    },

    profileUpdated: (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.error = null;
      state.successMessage = 'Profile updated successfully.';
      saveSession(action.payload, state.token);
    },
  },
});

export const {
  clearAuthError,
  loginStart,
  loginSuccess,
  loginFailure,
  sessionRestored,
  logoutSuccess,
  profileUpdated,
} = authSlice.actions;
export const verifyAdminSession = async () => {
  return await apiClient.get('/admin/session');
};
/* ------------------------------------------------------------------ */
/*  Thunks - these talk to the ASP.NET Core API                        */
/* ------------------------------------------------------------------ */

// POST /api/auth/login
// export const performLogin = (credentials) => async (dispatch) => {
//   dispatch(loginStart());
//   try {
//     const data = await apiClient.post('/auth/login', {
//       email: (credentials.email || '').trim(),
//       password: credentials.password || '',
//     });
//     dispatch(
//       loginSuccess({
//         user: data.user,
//         token: data.token,
//         message: `Welcome back, ${data.user.name}!`,
//       })
//     );
//   } catch (err) {
//     dispatch(loginFailure(err.message));
//   }
// };

export const performLogin = (credentials) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const data = await apiClient.post('/auth/login', {
      email: (credentials.email || '').trim(),
      password: credentials.password || '',
    });
    dispatch(
      loginSuccess({
        user: data.user,
        token: data.token,
        message: `Welcome back, ${data.user.name}!`,
      })
    );
  } catch (err) {
    // 423 Locked and 429 Too Many Requests already carry a clear message
    // from the API. Pass it through unchanged.
    dispatch(loginFailure(err.message));
  }
};

// POST /api/auth/register
// Name kept as registerUser so AuthPage.jsx needs no change.
export const registerUser = (form) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const data = await apiClient.post('/auth/register', {
      firstName: (form.firstName || '').trim(),
      lastName: (form.lastName || '').trim(),
      email: (form.email || '').trim(),
      phone: (form.phone || '').trim(),
      country: (form.country || '').trim(),
      password: form.password || '',
    });
    dispatch(
      loginSuccess({
        user: data.user,
        token: data.token,
        message: `Account created successfully. Welcome to Aviora, ${data.user.firstName}!`,
      })
    );
  } catch (err) {
    dispatch(loginFailure(err.message));
  }
};

// POST /api/auth/logout
// Name kept as logout so UserDropdownMenu, MobileMenuOverlay and
// AdminDashboard need no change.
export const logout = () => async (dispatch) => {
  try {
    await apiClient.post('/auth/logout');
  } catch (e) {
    // The JWT is stateless, so a failed call does not block signing out.
  }
  dispatch(logoutSuccess());
};

// GET /api/auth/me - runs once on app start to check the stored token
export const restoreSession = () => async (dispatch, getState) => {
  const { token } = getState().auth;
  if (!token) return;

  try {
    const user = await apiClient.get('/auth/me');
    dispatch(sessionRestored(user));
  } catch (err) {
    // Only sign out when the API actually rejected the token. A network error
    // means the backend is not running, which should not clear the session.
    if (err.status === 401 || err.status === 403) {
      dispatch(logoutSuccess());
    }
  }
};

// PUT /api/auth/profile
export const updateProfile = (payload) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const user = await apiClient.put('/auth/profile', {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone ?? null,
      country: payload.country ?? null,
      avatar: payload.avatar ?? null,
    });
    dispatch(profileUpdated(user));
  } catch (err) {
    dispatch(loginFailure(err.message));
  }
};

// POST /api/auth/forgot-password
// Resolves to the API message. Always succeeds, whether or not the address
// exists, so the endpoint cannot be used to discover registered emails.
export const requestPasswordReset = async (email) => {
  const data = await apiClient.post('/auth/forgot-password', {
    email: (email || '').trim(),
  });
  return data.message;
};

// POST /api/auth/reset-password
export const submitPasswordReset = async (token, newPassword) => {
  const data = await apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return data.message;
};


/* ------------------------------------------------------------------ */
/*  Selectors                                                          */
/* ------------------------------------------------------------------ */

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role ?? null;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthSuccessMessage = (state) => state.auth.successMessage;
export const selectSessionExpiresAt = (state) => state.auth.expiresAt ?? null;

export default authSlice.reducer;