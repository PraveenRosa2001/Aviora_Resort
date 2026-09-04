// Centralised environment configuration.
// Reads variables exposed by Vite through import.meta.env.
// Supports AVIORA_ and VITE_ prefixes configured in vite.config.js.

const rawApiBaseUrl =
  import.meta.env.AVIORA_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://localhost:7215/api';

// Strip any trailing slash for consistent endpoint concatenation
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

export const env = {
  apiBaseUrl,
  staticDataPath: import.meta.env.VITE_STATIC_DATA_PATH || '/mock-api',
  emailJs: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

export default env;
