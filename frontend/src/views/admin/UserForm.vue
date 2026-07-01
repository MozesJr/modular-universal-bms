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
                {{ isEdit ? "Edit User" : "Tambah User Baru" }}
              </h6>
              <p class="text-blueGray-400 text-sm mt-1">
                {{
                  isEdit
                    ? `Ubah role atau status untuk ${form.username}`
                    : "Buat akun baru, langsung aktif tanpa verifikasi"
                }}
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

        <div class="block w-full overflow-x-auto">
          <div
            v-if="error"
            class="bg-red-100 border border-red-300 text-red-600 text-sm rounded px-4 py-2 mb-4"
          >
            {{ error }}
          </div>

          <div class="space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                >Username</label
              >
              <input
                v-model="form.username"
                type="text"
                :disabled="isEdit"
                class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring disabled:bg-blueGray-100"
                placeholder="Username"
              />
            </div>

            <div v-if="!isEdit">
              <label
                class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                >Email</label
              >
              <input
                v-model="form.email"
                type="email"
                class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring"
                placeholder="email@example.com"
              />
            </div>

            <div v-if="!isEdit">
              <label
                class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                >Password</label
              >
              <input
                v-model="form.password"
                type="password"
                class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring"
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div>
              <label
                class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                >Role</label
              >
              <select
                v-model="form.role"
                class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div v-if="isEdit">
              <label
                class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                >Status</label
              >
              <select
                v-model="form.isActive"
                class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring"
              >
                <option :value="true">Aktif</option>
                <option :value="false">Nonaktif</option>
              </select>
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
              class="px-6 py-2 text-sm font-bold text-white rounded shadow"
              :class="
                isEdit
                  ? 'bg-blueGray-700 hover:bg-blueGray-800'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              "
            >
              <i class="fas fa-spinner fa-spin mr-1" v-if="loading"></i>
              {{ isEdit ? "Simpan Perubahan" : "Buat Akun" }}
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
      form: {
        username: "",
        email: "",
        password: "",
        role: "user",
        isActive: true,
      },
      loading: false,
      error: "",
    };
  },
  computed: {
    isEdit() {
      return !!this.$route.query.id;
    },
  },
  async created() {
    if (this.isEdit) {
      try {
        const { data } = await api.get("/admin/users");
        const user = data.find((u) => u._id === this.$route.query.id);
        if (user) {
          this.form = {
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          };
        }
      } catch (err) {
        this.error = "Gagal memuat data user";
      }
    }
  },
  methods: {
    async submit() {
      this.error = "";
      this.loading = true;
      try {
        if (this.isEdit) {
          await api.patch(`/admin/users/${this.$route.query.id}`, {
            role: this.form.role,
            isActive: this.form.isActive,
          });
        } else {
          if (!this.form.username || !this.form.email || !this.form.password) {
            this.error = "Semua field wajib diisi";
            return;
          }
          if (this.form.password.length < 8) {
            this.error = "Password minimal 8 karakter";
            return;
          }
          await api.post("/admin/users", this.form);
        }
        this.$router.push("/admin/users");
      } catch (err) {
        this.error = err.response?.data?.error || "Terjadi kesalahan";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
