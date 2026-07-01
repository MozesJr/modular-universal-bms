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
          </div>
        </div>

        <!-- Filter bar -->
        <div
          class="bg-white rounded-lg shadow px-4 py-3 mb-4 flex flex-wrap gap-3 items-center"
        >
          <select
            v-model="filter"
            class="border border-blueGray-200 rounded px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="pending_verification">Pending Verifikasi</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <span class="text-sm text-blueGray-400">
            {{ filteredPacks.length }} pack ditemukan
          </span>
        </div>

        <!-- Table -->
        <div class="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table class="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-blueGray-500 uppercase border-b"
                >
                  Pack
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-blueGray-500 uppercase border-b"
                >
                  Owner
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-blueGray-500 uppercase border-b"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-blueGray-500 uppercase border-b"
                >
                  Chemistry
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-blueGray-500 uppercase border-b"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="text-center py-8 text-blueGray-400">
                  <i class="fas fa-spinner fa-spin mr-2"></i> Memuat...
                </td>
              </tr>
              <tr v-else-if="filteredPacks.length === 0">
                <td colspan="5" class="text-center py-8 text-blueGray-400">
                  Tidak ada pack dengan filter ini
                </td>
              </tr>
              <tr
                v-for="pack in filteredPacks"
                :key="pack._id"
                class="border-b hover:bg-blueGray-50"
              >
                <!-- Pack info -->
                <td class="px-6 py-4">
                  <div class="font-semibold text-blueGray-700 text-sm">
                    {{ pack.pack_id }}
                  </div>
                  <div class="text-xs text-blueGray-400">
                    {{ pack.name || "Unnamed" }} · {{ pack.cell_count }} sel
                  </div>
                </td>

                <!-- Owner -->
                <td class="px-6 py-4">
                  <div v-if="pack.owner" class="text-sm text-blueGray-700">
                    <i class="fas fa-user mr-1 text-blueGray-300"></i>
                    {{ pack.owner.username }}
                    <div class="text-xs text-blueGray-400">
                      {{ pack.owner.email }}
                    </div>
                  </div>
                  <span v-else class="text-xs text-blueGray-400 italic"
                    >Belum ada owner</span
                  >
                </td>

                <!-- Status badge -->
                <td class="px-6 py-4">
                  <span
                    class="text-xs font-bold px-2 py-1 rounded"
                    :class="statusClass(pack.status)"
                  >
                    {{ statusLabel(pack.status) }}
                  </span>
                </td>

                <!-- Chemistry -->
                <td class="px-6 py-4 text-sm text-blueGray-600">
                  {{ pack.chemistry || "-" }}
                </td>

                <!-- Actions -->
                <td class="px-6 py-4">
                  <div class="flex gap-2 flex-wrap">
                    <!-- Approve/Reject untuk pending -->
                    <template v-if="pack.status === 'pending_verification'">
                      <button
                        @click="verify(pack, 'approve')"
                        class="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded"
                      >
                        <i class="fas fa-check mr-1"></i> Approve
                      </button>
                      <button
                        @click="verify(pack, 'reject')"
                        class="text-xs bg-red-400 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        <i class="fas fa-times mr-1"></i> Reject
                      </button>
                    </template>

                    <!-- Assign ke user lain -->
                    <button
                      @click="goAssign(pack)"
                      class="text-xs bg-blueGray-600 hover:bg-blueGray-800 text-white px-2 py-1 rounded"
                    >
                      <i class="fas fa-exchange-alt mr-1"></i> Assign
                    </button>

                    <!-- Suspend/Unsuspend -->
                    <button
                      @click="toggleSuspend(pack)"
                      class="text-xs px-2 py-1 rounded"
                      :class="
                        pack.status === 'suspended'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      "
                    >
                      <i
                        class="fas mr-1"
                        :class="
                          pack.status === 'suspended' ? 'fa-play' : 'fa-pause'
                        "
                      ></i>
                      {{
                        pack.status === "suspended" ? "Unsuspend" : "Suspend"
                      }}
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
      packs: [],
      loading: false,
      filter: "all",
    };
  },
  computed: {
    filteredPacks() {
      if (this.filter === "all") return this.packs;
      return this.packs.filter((p) => p.status === this.filter);
    },
  },
  async created() {
    await this.fetchPacks();
  },
  methods: {
    async fetchPacks() {
      this.loading = true;
      try {
        const { data } = await api.get("/packs");
        this.packs = data;
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    statusLabel(s) {
      return (
        {
          pending_verification: "Pending",
          active: "Active",
          rejected: "Rejected",
          suspended: "Suspended",
        }[s] || s
      );
    },

    statusClass(s) {
      return (
        {
          pending_verification: "bg-yellow-100 text-yellow-700",
          active: "bg-emerald-100 text-emerald-700",
          rejected: "bg-red-100 text-red-700",
          suspended: "bg-orange-100 text-orange-700",
        }[s] || "bg-blueGray-100 text-blueGray-600"
      );
    },

    async verify(pack, decision) {
      const label = decision === "approve" ? "approve" : "reject";
      if (!confirm(`${label} pack ${pack.pack_id}?`)) return;
      try {
        const { data } = await api.patch(`/packs/${pack.pack_id}/verify`, {
          decision,
        });
        const idx = this.packs.findIndex((p) => p._id === pack._id);
        if (idx !== -1)
          this.packs.splice(idx, 1, {
            ...this.packs[idx],
            status: data.pack.status,
          });
      } catch (err) {
        alert(err.response?.data?.error || "Gagal verifikasi");
      }
    },

    async toggleSuspend(pack) {
      const isSuspended = pack.status === "suspended";
      if (
        !confirm(
          `${isSuspended ? "Unsuspend" : "Suspend"} pack ${pack.pack_id}?`,
        )
      )
        return;
      try {
        // reuse endpoint assign untuk update status
        const newStatus = isSuspended ? "active" : "suspended";
        await api.patch(`/packs/${pack.pack_id}/assign`, {
          userId: pack.owner?._id,
          status: newStatus,
        });
        const idx = this.packs.findIndex((p) => p._id === pack._id);
        if (idx !== -1)
          this.packs.splice(idx, 1, { ...this.packs[idx], status: newStatus });
      } catch (err) {
        alert(err.response?.data?.error || "Gagal update status");
      }
    },

    goAssign(pack) {
      this.$router.push(
        `/admin/assign-pack-form?packId=${pack.pack_id}&ownerId=${
          pack.owner?._id || ""
        }`,
      );
    },
  },
};
</script>
