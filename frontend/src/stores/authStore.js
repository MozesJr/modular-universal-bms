import { defineStore } from "pinia";
import { ref, computed } from "vue";

const STORAGE_KEY = "bms_authed";

export const useAuthStore = defineStore("auth", () => {
  const authed = ref(localStorage.getItem(STORAGE_KEY) === "true");

  const isAuthenticated = computed(() => authed.value);

  function login() {
    authed.value = true;
    localStorage.setItem(STORAGE_KEY, "true");
  }

  function logout() {
    authed.value = false;
    localStorage.removeItem(STORAGE_KEY);
  }

  return { isAuthenticated, login, logout };
});
