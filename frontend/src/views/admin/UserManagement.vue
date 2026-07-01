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
                User Management
              </h6>
              <p class="text-blueGray-400 text-sm mt-1">
                Kelola akun pengguna sistem BMS
              </p>
            </div>
            <button
              @click="openCreateModal"
              class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center gap-1"
            >
              <i class="fas fa-user-plus mr-2"></i> Tambah User
            </button>
          </div>
        </div>

        <div class="block w-full overflow-x-auto">
          <table class="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr class="bg-blueGray-50">
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-blueGray-500 uppercase border-b border-solid border-blueGray-100"
                >
                  User
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-blueGray-500 uppercase border-b border-solid border-blueGray-100"
                >
                  Role
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-blueGray-500 uppercase border-b border-solid border-blueGray-100"
                >
                  Status
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-blueGray-500 uppercase border-b border-solid border-blueGray-100"
                >
                  Pack
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-blueGray-500 uppercase border-b border-solid border-blueGray-100"
                >
                  Dibuat
                </th>
                <th
                  class="px-6 py-4 text-center text-xs font-semibold text-blueGray-500 uppercase border-b border-solid border-blueGray-100"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-8 text-blueGray-400">
                  <i class="fas fa-spinner fa-spin mr-2"></i> Memuat data...
                </td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="6" class="text-center py-8 text-blueGray-400">
                  Belum ada user terdaftar
                </td>
              </tr>
              <tr
                v-for="user in users"
                :key="user._id"
                class="border-b border-blueGray-100 hover:bg-blueGray-50 transition-colors duration-150"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-10 h-10 rounded-full bg-blueGray-100 flex items-center justify-center mr-3 border border-blueGray-200"
                    >
                      <i class="fas fa-user text-blueGray-400 text-sm"></i>
                    </div>
                    <div>
                      <div class="font-semibold text-blueGray-700 text-sm">
                        {{ user.username }}
                      </div>
                      <div class="text-blueGray-400 text-xs">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="text-xs font-bold px-2.5 py-1 rounded-md inline-flex items-center"
                    :class="
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    "
                  >
                    <i
                      class="fas mr-1.5"
                      :class="
                        user.role === 'admin' ? 'fa-shield-alt' : 'fa-user'
                      "
                    ></i>
                    {{ user.role }}
                  </span>
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="text-xs font-bold px-2.5 py-1 rounded-md inline-flex items-center"
                    :class="
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    "
                  >
                    <i
                      class="fas mr-1.5"
                      :class="user.isActive ? 'fa-check-circle' : 'fa-ban'"
                    ></i>
                    {{ user.isActive ? "Aktif" : "Nonaktif" }}
                  </span>
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="text-sm text-blueGray-600 font-medium inline-flex items-center"
                  >
                    <i class="fas fa-battery-half mr-1.5 text-blueGray-400"></i>
                    {{ user.packCount }} pack
                  </span>
                </td>

                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-blueGray-500"
                >
                  {{ formatDate(user.createdAt) }}
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="flex items-center justify-center gap-3">
                    <button
                      @click="openEditModal(user)"
                      class="text-blueGray-400 hover:text-blueGray-600 transition-colors p-1"
                      title="Edit role & status"
                    >
                      <i class="fas fa-edit text-base"></i>
                    </button>
                    <button
                      @click="openResetModal(user)"
                      class="text-blue-400 hover:text-blue-600 transition-colors p-1"
                      title="Reset password"
                    >
                      <i class="fas fa-key text-base"></i>
                    </button>
                    <button
                      @click="toggleStatus(user)"
                      class="transition-colors p-1"
                      :class="
                        user.isActive
                          ? 'text-orange-400 hover:text-orange-600'
                          : 'text-emerald-400 hover:text-emerald-600'
                      "
                      :title="user.isActive ? 'Nonaktifkan' : 'Aktifkan'"
                    >
                      <i
                        class="fas text-base"
                        :class="user.isActive ? 'fa-ban' : 'fa-check'"
                      ></i>
                    </button>
                    <button
                      @click="confirmDelete(user)"
                      class="text-red-400 hover:text-red-600 transition-colors p-1"
                      title="Hapus user"
                    >
                      <i class="fas fa-trash text-base"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
      users: [],
      loading: false,
      modal: {
        show: false,
        type: null, // 'create' | 'edit' | 'reset' | 'delete'
        target: null,
        loading: false,
        error: "",
      },
      form: {
        username: "",
        email: "",
        password: "",
        role: "user",
        isActive: true,
        newPassword: "",
      },
    };
  },

  async created() {
    await this.fetchUsers();
  },

  methods: {
    async fetchUsers() {
      this.loading = true;
      try {
        const { data } = await api.get("/admin/users");
        this.users = data;
      } catch (err) {
        console.error("Gagal load users:", err);
      } finally {
        this.loading = false;
      }
    },

    formatDate(iso) {
      if (!iso) return "-";
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },

    openCreateModal() {
      this.$router.push("/admin/user-form");
    },
    openEditModal(user) {
      this.$router.push(`/admin/user-form?id=${user._id}`);
    },
    openResetModal(user) {
      this.$router.push(
        `/admin/user-reset-password?id=${user._id}&username=${user.username}`,
      );
    },

    async confirmDelete(user) {
      if (
        !confirm(
          `Hapus user "${user.username}"? Pack miliknya akan dipindahkan ke admin.`,
        )
      )
        return;
      try {
        await api.delete(`/admin/users/${user._id}`);
        this.users = this.users.filter((u) => u._id !== user._id);
      } catch (err) {
        alert(err.response?.data?.error || "Gagal hapus user");
      }
    },

    closeModal() {
      this.modal.show = false;
    },

    async submitForm() {
      this.modal.error = "";
      this.modal.loading = true;
      try {
        if (this.modal.type === "create") {
          const { data } = await api.post("/admin/users", {
            username: this.form.username,
            email: this.form.email,
            password: this.form.password,
            role: this.form.role,
          });
          this.users.unshift(data);
        } else {
          const { data } = await api.patch(
            `/admin/users/${this.modal.target._id}`,
            {
              role: this.form.role,
              isActive: this.form.isActive,
            },
          );
          const idx = this.users.findIndex(
            (u) => u._id === this.modal.target._id,
          );
          if (idx !== -1)
            this.users.splice(idx, 1, { ...this.users[idx], ...data });
        }
        this.closeModal();
      } catch (err) {
        this.modal.error = err.response?.data?.error || "Terjadi kesalahan";
      } finally {
        this.modal.loading = false;
      }
    },

    async submitReset() {
      this.modal.error = "";
      if (!this.form.newPassword || this.form.newPassword.length < 8) {
        this.modal.error = "Password minimal 8 karakter";
        return;
      }
      this.modal.loading = true;
      try {
        await api.patch(
          `/admin/users/${this.modal.target._id}/reset-password`,
          {
            newPassword: this.form.newPassword,
          },
        );
        this.closeModal();
      } catch (err) {
        this.modal.error = err.response?.data?.error || "Gagal reset password";
      } finally {
        this.modal.loading = false;
      }
    },

    async submitDelete() {
      this.modal.loading = true;
      try {
        await api.delete(`/admin/users/${this.modal.target._id}`);
        this.users = this.users.filter((u) => u._id !== this.modal.target._id);
        this.closeModal();
      } catch (err) {
        this.modal.error = err.response?.data?.error || "Gagal hapus user";
      } finally {
        this.modal.loading = false;
      }
    },

    async toggleStatus(user) {
      try {
        const { data } = await api.patch(`/admin/users/${user._id}`, {
          isActive: !user.isActive,
        });
        const idx = this.users.findIndex((u) => u._id === user._id);
        if (idx !== -1)
          this.users.splice(idx, 1, {
            ...this.users[idx],
            isActive: data.isActive,
          });
      } catch (err) {
        alert(err.response?.data?.error || "Gagal update status");
      }
    },
  },
};
</script>
