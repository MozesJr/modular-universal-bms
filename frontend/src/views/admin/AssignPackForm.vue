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
              <h6 class="text-blueGray-700 text-xl font-bold">Assign Pack</h6>
              <p class="text-blueGray-400 text-sm mt-1">
                Kelola kepemilikan dan verifikasi BMS pack
              </p>
            </div>
            <router-link
              to="/admin/assign-pack"
              class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center gap-1"
            >
              <i class="fas fa-arrow-left mr-1"></i> Kembali ke Assign Pack
            </router-link>
          </div>
        </div>

        <div class="bg-white shadow-lg rounded-lg p-6">
          <h2 class="text-xl font-bold text-blueGray-700 mb-1">
            Assign Pack ke User
          </h2>
          <p class="text-blueGray-400 text-sm mb-6">
            Pindahkan kepemilikan
            <strong class="text-blueGray-600">{{ packId }}</strong> ke user lain
          </p>

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
              >
                Pilih User Penerima
              </label>
              <select
                v-model="selectedUserId"
                class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring"
              >
                <option value="">-- Pilih User --</option>
                <option v-for="user in users" :key="user._id" :value="user._id">
                  {{ user.username }} ({{ user.email }}) · {{ user.role }}
                </option>
              </select>
            </div>
          </div>

          <!-- Preview user terpilih -->
          <div
            v-if="selectedUser"
            class="mt-4 bg-blueGray-50 rounded p-3 text-sm"
          >
            <div class="font-semibold text-blueGray-700">
              {{ selectedUser.username }}
            </div>
            <div class="text-blueGray-400 text-xs">
              {{ selectedUser.email }}
            </div>
            <div class="mt-1">
              <span
                class="text-xs px-2 py-0.5 rounded"
                :class="
                  selectedUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                "
              >
                {{ selectedUser.role }}
              </span>
              <span class="text-xs text-blueGray-400 ml-2">
                {{ selectedUser.packCount }} pack dimiliki
              </span>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <router-link
              to="/admin/assign-pack"
              class="px-4 py-2 text-sm text-blueGray-500 hover:text-blueGray-700"
            >
              Batal
            </router-link>
            <button
              @click="submit"
              :disabled="loading || !selectedUserId"
              class="px-6 py-2 text-sm font-bold text-white bg-blueGray-700 hover:bg-blueGray-800 rounded shadow disabled:opacity-50"
            >
              <i class="fas fa-spinner fa-spin mr-1" v-if="loading"></i>
              Assign Pack
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
      packId: this.$route.query.packId || "",
      users: [],
      selectedUserId: this.$route.query.ownerId || "",
      loading: false,
      error: "",
    };
  },
  computed: {
    selectedUser() {
      return this.users.find((u) => u._id === this.selectedUserId) || null;
    },
  },
  async created() {
    try {
      const { data } = await api.get("/admin/users");
      this.users = data;
    } catch (err) {
      this.error = "Gagal memuat daftar user";
    }
  },
  methods: {
    async submit() {
      if (!this.selectedUserId) return;
      this.loading = true;
      this.error = "";
      try {
        await api.patch(`/packs/${this.packId}/assign`, {
          userId: this.selectedUserId,
        });
        this.$router.push("/admin/assign-pack");
      } catch (err) {
        this.error = err.response?.data?.error || "Gagal assign pack";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
