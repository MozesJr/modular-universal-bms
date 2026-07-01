import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

const TOKEN_KEY = "bms_token";
const USER_KEY = "bms_user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || null);
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || "null"));

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  function setSession(data) {
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  async function login(username, password) {
    const { data } = await api.post("/auth/login", { username, password });
    setSession(data);
    return data.user;
  }

  async function register(username, email, password) {
    const { data } = await api.post("/auth/register", {
      username,
      email,
      password,
    });
    setSession(data);
    return data.user;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Dipanggil sekali saat app start untuk validasi token masih hidup
  async function fetchProfile() {
    if (!token.value) return null;
    try {
      const { data } = await api.get("/auth/me");
      user.value = data;
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      return data;
    } catch (err) {
      logout(); // token invalid/expired
      return null;
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    fetchProfile,
  };
});
