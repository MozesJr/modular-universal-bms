<template>
  <div class="flex flex-wrap mt-4">
    <div class="w-full mb-12 px-4">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded"
      >
        <!-- Header -->
        <div
          class="rounded-t bg-white mb-0 px-6 py-6 border-b border-solid border-blueGray-100"
        >
          <div class="flex justify-between items-center">
            <div>
              <h6 class="text-blueGray-700 text-xl font-bold">
                Reset password untuk user
              </h6>
              <p class="text-blueGray-400 text-sm mt-1">
                <strong class="text-blueGray-600">{{ username }}</strong>
              </p>
            </div>
            <router-link
              to="/admin/users"
              class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center gap-1"
            >
              <i class="fas fa-arrow-left mr-1"></i> Kembali ke User Management
            </router-link>
          </div>
        </div>

        <div class="bg-white shadow-lg rounded-lg p-6">
          <div
            v-if="error"
            class="bg-red-100 border border-red-300 text-red-600 text-sm rounded px-4 py-2 mb-4"
          >
            {{ error }}
          </div>
          <div
            v-if="success"
            class="bg-emerald-100 border border-emerald-300 text-emerald-700 text-sm rounded px-4 py-2 mb-4"
          >
            <i class="fas fa-check-circle mr-1"></i> Password berhasil direset!
          </div>

          <div class="space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                >Password Baru</label
              >
              <input
                v-model="newPassword"
                type="password"
                class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring"
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                >Konfirmasi Password</label
              >
              <input
                v-model="confirmPassword"
                type="password"
                class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring"
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <router-link
              to="/admin/users"
              class="px-4 py-2 text-sm text-blueGray-500 hover:text-blueGray-700"
            >
              Batal
            </router-link>
            <button
              @click="submit"
              :disabled="loading"
              class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center gap-1"
            >
              <i class="fas fa-spinner fa-spin mr-1" v-if="loading"></i>
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/services/api";

export default {
  data() {
    return {
      username: this.$route.query.username || "User",
      newPassword: "",
      confirmPassword: "",
      loading: false,
      error: "",
      success: false,
    };
  },
  methods: {
    async submit() {
      this.error = "";
      if (!this.newPassword || this.newPassword.length < 8) {
        this.error = "Password minimal 8 karakter";
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.error = "Konfirmasi password tidak cocok";
        return;
      }
      this.loading = true;
      try {
        await api.patch(`/admin/users/${this.$route.query.id}/reset-password`, {
          newPassword: this.newPassword,
        });
        this.success = true;
        setTimeout(() => this.$router.push("/admin/users"), 1500);
      } catch (err) {
        this.error = err.response?.data?.error || "Gagal reset password";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
