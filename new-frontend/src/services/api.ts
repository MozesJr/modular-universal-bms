import axios, { AxiosError } from 'axios';
import paths from 'routes/paths';

export const AUTH_TOKEN_KEY = 'bms_token';
export const AUTH_USER_KEY = 'bms_user';

// Fired whenever a request comes back 401 so AuthContext can sync its state
// without api.ts needing to import React/context directly.
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

// In dev, .env sets VITE_API_URL to the backend's own origin (it isn't
// behind a proxy). In production this is deliberately left unset at build
// time (see new-frontend/Dockerfile) so requests fall back to a relative
// path — same-origin, going through the nginx reverse proxy in
// new-frontend/nginx.conf instead of a domain baked into the JS bundle.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Login/register/me failures (wrong password, expired token on boot, etc.)
    // are handled by the caller — only a 401 on a non-auth request means the
    // session itself has gone stale and should be torn down globally.
    const isAuthEndpoint = error.config?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));

      if (window.location.pathname !== paths.signin) {
        window.location.assign(paths.signin);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
