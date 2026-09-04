import axios from 'axios';
import env from '../config/env';

export const SESSION_KEY = 'aviora_auth_session';

// baseURL comes straight from the config module. No '/mock-api' fallback:
// if the variable is missing, env.js has already thrown a clear error.
const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - attach the JWT if a session exists
apiClient.interceptors.request.use(
  (config) => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const { token } = JSON.parse(savedSession);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // corrupt session entry - send the request unauthenticated
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - unwrap the body and normalise errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    // A 401 from login or register means wrong credentials, not an expired
    // session. Only sign the user out for 401s on other endpoints.
    const isCredentialCheck =
      url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isCredentialCheck) {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (e) {
        // ignore
      }
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred.';

    const normalised = new Error(message);
    normalised.status = status ?? null;
    return Promise.reject(normalised);
  }
);

export default apiClient;