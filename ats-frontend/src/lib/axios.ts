import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if it exists.
// Reads the same `ats_token` key that services/api.ts (auth.setSession) writes
// to. Previously this read a `token` key that nothing else in the app ever
// wrote, so authenticated axios-based requests silently went out with no
// Authorization header.
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ats_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Clear session on 401 Unauthorized.
// Clears the actual storage keys (`ats_token`/`ats_user`) and asks the
// session route to drop the httpOnly `ats_session` cookie middleware.ts
// checks (that cookie can't be cleared via document.cookie since it's
// httpOnly). Previously this cleared a `token`/`token` cookie pair that
// nothing else in the app reads or sets, so a 401 never actually logged the
// user out of the parts of the app middleware/services/api.ts care about.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ats_token');
        localStorage.removeItem('ats_user');
        fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {
          // Non-fatal: worst case the httpOnly cookie lingers until it
          // expires; localStorage is already cleared so the client-side
          // session is gone either way.
        });
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
