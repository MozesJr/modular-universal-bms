<template>
  <div class="container mx-auto px-4 h-full">
    <div class="flex content-center items-center justify-center h-full">
      <div class="w-full lg:w-4/12 px-4">

        <!-- Card -->
        <div class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
          <div class="rounded-t px-6 pt-8 pb-4 text-center">
            <i class="fas fa-battery-three-quarters text-emerald-500 text-4xl mb-3 block"></i>
            <h2 class="text-blueGray-700 font-bold text-xl mb-1">Modular Universal BMS</h2>
            <p class="text-blueGray-400 text-sm">DIKE 2026 &middot; Universitas Gadjah Mada</p>
            <hr class="mt-6 border-b border-blueGray-300" />
          </div>

          <div class="flex-auto px-4 lg:px-10 py-8 pt-4">
            <!-- Error banner -->
            <div
              v-if="error"
              class="bg-red-100 border border-red-300 text-red-600 text-sm rounded px-4 py-2 mb-4 text-center"
            >
              {{ error }}
            </div>

            <form @submit.prevent="handleLogin">
              <div class="relative w-full mb-4">
                <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Username
                </label>
                <input
                  v-model="username"
                  type="text"
                  autocomplete="username"
                  placeholder="Username"
                  class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                />
              </div>

              <div class="relative w-full mb-6">
                <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Password
                </label>
                <input
                  v-model="password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Password"
                  class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                />
              </div>

              <button
                type="submit"
                class="bg-blueGray-800 hover:bg-blueGray-700 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none w-full ease-linear transition-all duration-150"
              >
                <i class="fas fa-sign-in-alt mr-2"></i> Sign In
              </button>
            </form>
          </div>
        </div>

        <div class="text-center">
          <router-link to="/" class="text-blueGray-400 text-sm hover:text-blueGray-600">
            <i class="fas fa-arrow-left mr-1"></i> Back to home
          </router-link>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from "@/stores/authStore";

const VALID_USERNAME = "CapstoneDike2026";
const VALID_PASSWORD = "CapstoneDike2026";

export default {
  data() {
    return {
      username: "",
      password: "",
      error: "",
    };
  },
  methods: {
    handleLogin() {
      this.error = "";
      if (this.username === VALID_USERNAME && this.password === VALID_PASSWORD) {
        const auth = useAuthStore();
        auth.login();
        this.$router.push("/admin/dashboard");
      } else {
        this.error = "Invalid username or password.";
      }
    },
  },
};
</script>
