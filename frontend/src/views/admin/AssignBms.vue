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
              <h6 class="text-blueGray-700 text-xl font-bold">Assign BMS</h6>
              <p class="text-blueGray-400 text-sm mt-1">
                Kelola kepemilikan dan verifikasi BMS device
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
            {{ filteredBms.length }} BMS ditemukan
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
                  BMS
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
                  Model
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
              <tr v-else-if="filteredBms.length === 0">
                <td colspan="5" class="text-center py-8 text-blueGray-400">
                  Tidak ada BMS dengan filter ini
                </td>
              </tr>
              <tr
                v-for="bms in filteredBms"
                :key="bms._id"
                class="border-b hover:bg-blueGray-50"
              >
                <!-- BMS info -->
                <td class="px-6 py-4">
                  <div class="font-semibold text-blueGray-700 text-sm">
                    {{ bms.bms_id }}
                  </div>
                  <div class="text-xs text-blueGray-400">
                    {{ bms.name || "Unnamed BMS" }}
                  </div>
                </td>

                <!-- Owner -->
                <td class="px-6 py-4">
                  <div v-if="bms.owner" class="text-sm text-blueGray-700">
                    <i class="fas fa-user mr-1 text-blueGray-300"></i>
                    {{ bms.owner.username }}
                    <div class="text-xs text-blueGray-400">
                      {{ bms.owner.email }}
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
                    :class="statusClass(bms.status)"
                  >
                    {{ statusLabel(bms.status) }}
                  </span>
                </td>

                <!-- Model -->
                <td class="px-6 py-4 text-sm text-blueGray-600">
                  {{ bms.bms_model_name || "-" }}
                </td>

                <!-- Actions -->
                <td class="px-6 py-4">
                  <div class="flex gap-2 flex-wrap">
                    <!-- Approve/Reject untuk pending -->
                    <template v-if="bms.status === 'pending_verification'">
                      <button
                        @click="verify(bms, 'approve')"
                        class="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded"
                      >
                        <i class="fas fa-check mr-1"></i> Approve
                      </button>
                      <button
                        @click="verify(bms, 'reject')"
                        class="text-xs bg-red-400 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        <i class="fas fa-times mr-1"></i> Reject
                      </button>
                    </template>

                    <!-- Assign ke user lain -->
                    <button
                      @click="goAssign(bms)"
                      class="text-xs bg-blueGray-600 hover:bg-blueGray-800 text-white px-2 py-1 rounded"
                    >
                      <i class="fas fa-exchange-alt mr-1"></i> Assign
                    </button>

                    <!-- Suspend/Unsuspend -->
                    <button
                      v-if="['active', 'suspended'].includes(bms.status)"
                      @click="toggleSuspend(bms)"
                      class="text-xs px-2 py-1 rounded"
                      :class="
                        bms.status === 'suspended'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      "
                    >
                      <i
                        class="fas mr-1"
                        :class="
                          bms.status === 'suspended' ? 'fa-play' : 'fa-pause'
                        "
                      ></i>
                      {{ bms.status === "suspended" ? "Unsuspend" : "Suspend" }}
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
      bmsList: [],
      loading: false,
      filter: "all",
    };
  },
  computed: {
    filteredBms() {
      if (this.filter === "all") return this.bmsList;
      return this.bmsList.filter((b) => b.status === this.filter);
    },
  },
  async created() {
    await this.fetchBmsList();
  },
  methods: {
    async fetchBmsList() {
      this.loading = true;
      try {
        const { data } = await api.get("/bms");
        this.bmsList = data;
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

    async verify(bms, decision) {
      const label = decision === "approve" ? "approve" : "reject";
      if (!confirm(`${label} BMS ${bms.bms_id}?`)) return;
      try {
        const { data } = await api.patch(`/bms/${bms.bms_id}/verify`, {
          decision,
        });
        const idx = this.bmsList.findIndex((b) => b._id === bms._id);
        if (idx !== -1)
          this.bmsList.splice(idx, 1, {
            ...this.bmsList[idx],
            status: data.bms.status,
          });
      } catch (err) {
        alert(err.response?.data?.error || "Gagal verifikasi");
      }
    },

    async toggleSuspend(bms) {
      const isSuspended = bms.status === "suspended";
      if (
        !confirm(`${isSuspended ? "Unsuspend" : "Suspend"} BMS ${bms.bms_id}?`)
      )
        return;
      try {
        const { data } = await api.patch(`/bms/${bms.bms_id}/suspend`);
        const idx = this.bmsList.findIndex((b) => b._id === bms._id);
        if (idx !== -1)
          this.bmsList.splice(idx, 1, {
            ...this.bmsList[idx],
            status: data.bms.status,
          });
      } catch (err) {
        alert(err.response?.data?.error || "Gagal update status");
      }
    },

    goAssign(bms) {
      this.$router.push(
        `/admin/assign-pack-form?bmsId=${bms.bms_id}&ownerId=${
          bms.owner?._id || ""
        }`,
      );
    },
  },
};
</script>
