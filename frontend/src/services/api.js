import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes("/auth/");
    // Hanya auto-logout kalau bukan dari endpoint login/register
    // Kalau dari login, biarkan error mengalir ke catch di komponen
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("bms_token");
      localStorage.removeItem("bms_user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(err);
  },
);

export default api;
