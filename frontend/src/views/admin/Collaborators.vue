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
              <h6 class="text-blueGray-700 text-xl font-bold">Collaborators</h6>
              <p class="text-blueGray-400 text-sm mt-1">
                Kelola akses kolaborasi pada pack milikmu
              </p>
            </div>
          </div>
        </div>

        <!-- Pack selector -->
        <div
          class="bg-white rounded-lg shadow px-4 py-3 mb-4 flex gap-3 items-center"
        >
          <label class="text-sm font-semibold text-blueGray-600"
            >Pilih Pack:</label
          >
          <select
            v-model="selectedPackId"
            class="border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none"
            @change="loadCollaborators"
          >
            <option value="">-- Pilih Pack --</option>
            <option
              v-for="pack in ownedPacks"
              :key="pack._id"
              :value="pack.pack_id"
            >
              {{ pack.pack_id }} · {{ pack.name || "Unnamed" }}
            </option>
          </select>
        </div>

        <div
          v-if="selectedPackId"
          class="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <!-- Collaborator list -->
          <div class="bg-white shadow-lg rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-blueGray-700">Collaborator Aktif</h3>
            </div>

            <div
              v-if="collaborators.length === 0"
              class="text-center py-6 text-blueGray-400 text-sm"
            >
              Belum ada collaborator di pack ini
            </div>

            <div
              v-for="collab in collaborators"
              :key="collab.user._id"
              class="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div class="flex items-center">
                <div
                  class="w-8 h-8 rounded-full bg-blueGray-100 flex items-center justify-center mr-3"
                >
                  <i class="fas fa-user text-blueGray-400 text-xs"></i>
                </div>
                <div>
                  <div class="text-sm font-semibold text-blueGray-700">
                    {{ collab.user.username }}
                  </div>
                  <div class="text-xs text-blueGray-400">
                    {{ collab.user.email }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <!-- Toggle permission -->
                <select
                  v-model="collab.permission"
                  @change="updatePermission(collab)"
                  class="text-xs border border-blueGray-200 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="view">View</option>
                  <option value="maintain">Maintain</option>
                </select>
                <!-- Remove -->
                <button
                  @click="removeCollaborator(collab.user._id)"
                  class="text-red-400 hover:text-red-600 text-sm"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Tambah collaborator -->
          <div class="bg-white shadow-lg rounded-lg p-4">
            <h3 class="font-bold text-blueGray-700 mb-4">
              Tambah Collaborator
            </h3>

            <div
              v-if="addError"
              class="bg-red-100 text-red-600 text-xs rounded px-3 py-2 mb-3"
            >
              {{ addError }}
            </div>

            <div class="space-y-3">
              <div>
                <label
                  class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                  >User</label
                >
                <select
                  v-model="newCollab.userId"
                  class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">-- Pilih User --</option>
                  <option
                    v-for="user in availableUsers"
                    :key="user._id"
                    :value="user._id"
                  >
                    {{ user.username }} ({{ user.email }})
                  </option>
                </select>
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-blueGray-600 uppercase mb-1"
                  >Permission</label
                >
                <select
                  v-model="newCollab.permission"
                  class="w-full border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="view">View — hanya lihat data</option>
                  <option value="maintain">
                    Maintain — bisa acknowledge alert
                  </option>
                </select>
              </div>

              <button
                @click="addCollaborator"
                :disabled="!newCollab.userId || addLoading"
                class="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold py-2 rounded"
              >
                <i class="fas fa-spinner fa-spin mr-1" v-if="addLoading"></i>
                <i class="fas fa-user-plus mr-1" v-else></i>
                Tambah Collaborator
              </button>
            </div>
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
      ownedPacks: [],
      selectedPackId: "",
      collaborators: [],
      allUsers: [],
      newCollab: { userId: "", permission: "view" },
      addLoading: false,
      addError: "",
    };
  },
  computed: {
    // user yang belum jadi collab dan bukan owner
    availableUsers() {
      const collabIds = this.collaborators.map((c) => c.user._id);
      return this.allUsers.filter((u) => !collabIds.includes(u._id));
    },
  },
  async created() {
    const [packsRes, usersRes] = await Promise.all([
      api.get("/packs"),
      api.get("/admin/users").catch(() => ({ data: [] })),
    ]);
    // hanya pack yang dia owns (bukan collab)
    this.ownedPacks = packsRes.data.filter((p) => p.status === "active");
    this.allUsers = usersRes.data;
  },
  methods: {
    async loadCollaborators() {
      if (!this.selectedPackId) return;
      try {
        const { data } = await api.get(`/packs/${this.selectedPackId}`);
        this.collaborators = data.collaborators || [];
      } catch (err) {
        console.error(err);
      }
    },

    async addCollaborator() {
      this.addError = "";
      this.addLoading = true;
      try {
        const { data } = await api.post(
          `/packs/${this.selectedPackId}/collaborators`,
          {
            collaboratorId: this.newCollab.userId,
            permission: this.newCollab.permission,
          },
        );
        this.collaborators = data.pack.collaborators || [];
        this.newCollab = { userId: "", permission: "view" };
      } catch (err) {
        this.addError =
          err.response?.data?.error || "Gagal menambahkan collaborator";
      } finally {
        this.addLoading = false;
      }
    },

    async updatePermission(collab) {
      try {
        await api.post(`/packs/${this.selectedPackId}/collaborators`, {
          collaboratorId: collab.user._id,
          permission: collab.permission,
        });
      } catch (err) {
        alert(err.response?.data?.error || "Gagal update permission");
      }
    },

    async removeCollaborator(userId) {
      if (!confirm("Hapus collaborator ini?")) return;
      try {
        const { data } = await api.delete(
          `/packs/${this.selectedPackId}/collaborators`,
          {
            data: { collaboratorId: userId },
          },
        );
        this.collaborators = data.pack.collaborators || [];
      } catch (err) {
        alert(err.response?.data?.error || "Gagal menghapus collaborator");
      }
    },
  },
};
</script>
