<template>
  <div class="flex flex-wrap mt-4">
    <div class="w-full px-4">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded border border-blueGray-100"
      >
        <div
          class="rounded-t bg-white mb-0 px-6 py-6 border-b border-solid border-blueGray-100"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1
                class="text-xl font-bold text-blueGray-700 flex items-center gap-2"
              >
                <i class="fas fa-shield-alt text-red-500"></i> Smart Protection
                Logs
              </h1>
              <p class="text-xs text-blueGray-400 mt-1">
                Siklus manajemen penanganan kondisi kritis sel baterai
                (Real-time DB Sync)
              </p>
            </div>

            <div
              class="flex items-center gap-1 bg-blueGray-100 p-1 rounded-lg text-xs font-bold uppercase"
            >
              <button
                @click="currentFilter = 'all'"
                :class="[
                  'px-3 py-1.5 rounded-md transition-all',
                  currentFilter === 'all'
                    ? 'bg-white text-blueGray-800 shadow-sm'
                    : 'text-blueGray-500 hover:text-blueGray-800',
                ]"
              >
                All
              </button>
              <button
                @click="currentFilter = 'active'"
                :class="[
                  'px-3 py-1.5 rounded-md transition-all',
                  currentFilter === 'active'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-blueGray-500 hover:text-red-500',
                ]"
              >
                🔴 Active Unresolved
              </button>
              <button
                @click="currentFilter = 'resolved'"
                :class="[
                  'px-3 py-1.5 rounded-md transition-all',
                  currentFilter === 'resolved'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-blueGray-500 hover:text-emerald-500',
                ]"
              >
                🟢 Resolved
              </button>
            </div>
          </div>
        </div>

        <div
          class="block w-full max-h-[650px] overflow-y-auto p-6 bg-blueGray-50/50 custom-scrollbar"
        >
          <div v-if="filteredAlerts.length" class="space-y-3">
            <div
              v-for="log in filteredAlerts"
              :key="log._id || log.id"
              :class="[
                'border rounded-xl p-4 transition-all duration-300 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                log.resolved
                  ? 'border-emerald-200 bg-emerald-50/5'
                  : 'border-red-200 ring-1 ring-red-100',
              ]"
            >
              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    class="font-mono font-bold text-sm text-blueGray-700 bg-blueGray-100 px-2 py-0.5 rounded"
                  >
                    {{ log.pack_id }}
                  </span>
                  <span class="text-sm font-semibold text-blueGray-600">
                    Cell {{ log.cell_id }}
                  </span>

                  <span
                    :class="[
                      'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm tracking-wider',
                      alertTypeClass(log.type),
                    ]"
                  >
                    {{ log.type?.replace("_", " ") || "ANOMALY" }}
                  </span>
                </div>

                <div
                  class="text-xs text-blueGray-600 font-medium flex gap-4 mt-2"
                >
                  <span class="bg-blueGray-100 px-2 py-1 rounded"
                    >⚡ <strong>V:</strong>
                    {{ log.metrics?.voltage?.toFixed(3) ?? "—" }}V</span
                  >
                  <span class="bg-blueGray-100 px-2 py-1 rounded"
                    >🔌 <strong>I:</strong>
                    {{ log.metrics?.current?.toFixed(2) ?? "—" }}A</span
                  >
                  <span class="bg-blueGray-100 px-2 py-1 rounded"
                    >🌡️ <strong>T:</strong>
                    {{ log.metrics?.temperature?.toFixed(1) ?? "—" }}°C</span
                  >
                </div>

                <div
                  class="text-[11px] text-blueGray-400 font-mono mt-3 flex items-center gap-2"
                >
                  <i class="far fa-clock"></i> Triggered:
                  {{ new Date(log.timestamp).toLocaleString() }}
                  <span
                    v-if="log.resolved"
                    class="text-emerald-600 font-medium ml-2"
                  >
                    <i class="fas fa-check-double"></i> Resolved at:
                    {{ new Date(log.resolved_at).toLocaleTimeString() }}
                  </span>
                </div>
              </div>

              <div class="flex items-center sm:justify-end min-w-[130px]">
                <button
                  v-if="!log.resolved"
                  @click="handleAcknowledge(log._id || log.id)"
                  :disabled="actionLoading === (log._id || log.id)"
                  class="w-full bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2.5 rounded-lg shadow hover:shadow-md outline-none focus:outline-none transition-all duration-150 disabled:opacity-50 text-center flex items-center justify-center gap-1"
                  type="button"
                >
                  <i
                    v-if="actionLoading === (log._id || log.id)"
                    class="fas fa-spinner fa-spin"
                  ></i>
                  <i v-else class="fas fa-check-circle"></i> Fix & Clear
                </button>
                <span
                  v-else
                  class="w-full text-center text-xs font-bold uppercase text-emerald-600 bg-emerald-100/70 border border-emerald-200 py-2 rounded-lg tracking-wide flex items-center justify-center gap-1"
                >
                  <i class="fas fa-check"></i> Cleaned
                </span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-center py-20 border border-dashed border-blueGray-200 rounded-xl bg-white shadow-sm my-4"
          >
            <div
              class="h-12 w-12 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mx-auto mb-4 text-xl"
            >
              <i class="fas fa-heartbeat"></i>
            </div>
            <p class="text-blueGray-700 font-bold text-base">
              No Matching Alert Logs Found
            </p>
            <p class="text-blueGray-400 text-xs mt-1 px-4 max-w-sm mx-auto">
              Seluruh parameter sel baterai berada di bawah ambang batas normal
              konfigurasi preset kimia
              {{ currentFilter === "all" ? "" : "untuk filter ini" }}.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useBmsStore } from "@/stores/bmsStore";

export default {
  name: "alerts-page",
  setup() {
    const bmsStore = useBmsStore();
    const currentFilter = ref("all");
    const actionLoading = ref(null);

    onMounted(async () => {
      // Ambil data riwayat log persisten dari MongoDB
      await bmsStore.fetchAlertLogs();
    });

    const filteredAlerts = computed(() => {
      const logs = bmsStore.alertLogs || [];
      if (currentFilter.value === "active")
        return logs.filter((l) => !l.resolved);
      if (currentFilter.value === "resolved")
        return logs.filter((l) => l.resolved);
      return logs;
    });

    function alertTypeClass(type) {
      const maps = {
        thermal_runaway:
          "bg-red-200 text-red-700 border border-red-300 animate-pulse",
        overcharge: "bg-orange-200 text-orange-700 border border-orange-300",
        over_discharge: "bg-amber-200 text-amber-700 border border-amber-300",
        over_current: "bg-yellow-200 text-yellow-700 border border-yellow-300",
      };
      return maps[type] || "bg-blueGray-200 text-blueGray-700";
    }

    async function handleAcknowledge(id) {
      actionLoading.value = id;
      try {
        await bmsStore.acknowledgeAlert(id);
      } catch (err) {
        console.error("Failed to acknowledge log:", err);
      } finally {
        actionLoading.value = null;
      }
    }

    return {
      bmsStore,
      currentFilter,
      filteredAlerts,
      alertTypeClass,
      handleAcknowledge,
      actionLoading,
    };
  },
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>
