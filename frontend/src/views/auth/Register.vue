<template>
  <div class="container mx-auto px-4 h-full">
    <div class="flex content-center items-center justify-center h-full">
      <div class="w-full lg:w-5/12 px-4">
        <div
          class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0"
        >
          <div class="rounded-t px-6 pt-8 pb-4 text-center">
            <i
              class="fas fa-battery-three-quarters text-emerald-500 text-4xl mb-3 block"
            ></i>
            <h2 class="text-blueGray-700 font-bold text-xl mb-1">
              Buat Akun Baru
            </h2>
            <p class="text-blueGray-400 text-sm">
              DIKE 2026 &middot; Universitas Gadjah Mada
            </p>
            <hr class="mt-6 border-b border-blueGray-300" />
          </div>

          <div class="flex-auto px-4 lg:px-10 py-8 pt-4">
            <!-- Success state -->
            <div
              v-if="registered"
              class="bg-emerald-100 border border-emerald-300 text-emerald-700 text-sm rounded px-4 py-3 mb-4 text-center"
            >
              <i class="fas fa-check-circle mr-2"></i>
              Akun berhasil dibuat! Menunggu verifikasi admin untuk akses BMS.
              <div class="mt-3">
                <router-link to="/auth/login" class="font-bold underline">
                  Kembali ke Login
                </router-link>
              </div>
            </div>

            <template v-else>
              <div
                v-if="error"
                class="bg-red-100 border border-red-300 text-red-600 text-sm rounded px-4 py-2 mb-4 text-center"
              >
                {{ error }}
              </div>

              <form @submit.prevent="handleRegister">
                <div class="relative w-full mb-4">
                  <label
                    class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  >
                    Username
                  </label>
                  <input
                    v-model="form.username"
                    type="text"
                    autocomplete="username"
                    placeholder="Username"
                    class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  />
                </div>

                <div class="relative w-full mb-4">
                  <label
                    class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  >
                    Email
                  </label>
                  <input
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    placeholder="email@example.com"
                    class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  />
                </div>

                <div class="relative w-full mb-4">
                  <label
                    class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  >
                    Password
                  </label>
                  <input
                    v-model="form.password"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Minimal 8 karakter"
                    class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  />
                </div>

                <div class="relative w-full mb-6">
                  <label
                    class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                  >
                    Konfirmasi Password
                  </label>
                  <input
                    v-model="form.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Ulangi password"
                    class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  />
                </div>

                <button
                  type="submit"
                  :disabled="loading"
                  class="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none w-full ease-linear transition-all duration-150 disabled:opacity-50"
                >
                  <i class="fas fa-spinner fa-spin mr-2" v-if="loading"></i>
                  <i class="fas fa-user-plus mr-2" v-else></i>
                  {{ loading ? "Mendaftar..." : "Buat Akun" }}
                </button>
              </form>

              <div class="text-center mt-4">
                <router-link
                  to="/auth/login"
                  class="text-blueGray-500 text-sm hover:text-blueGray-700"
                >
                  Sudah punya akun? <span class="font-bold">Login</span>
                </router-link>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from "@/stores/authStore";

export default {
  data() {
    return {
      form: { username: "", email: "", password: "", confirmPassword: "" },
      error: "",
      loading: false,
      registered: false,
    };
  },
  methods: {
    async handleRegister() {
      this.error = "";
      const { username, email, password, confirmPassword } = this.form;

      if (!username || !email || !password) {
        this.error = "Semua field wajib diisi.";
        return;
      }
      if (password.length < 8) {
        this.error = "Password minimal 8 karakter.";
        return;
      }
      if (password !== confirmPassword) {
        this.error = "Konfirmasi password tidak cocok.";
        return;
      }

      this.loading = true;
      try {
        const auth = useAuthStore();
        await auth.register(username, email, password);
        // Setelah register, langsung login dan masuk dashboard
        this.$router.push("/admin/dashboard");
      } catch (err) {
        this.error =
          err.response?.data?.error || "Registrasi gagal, coba lagi.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
