<template>
  <div class="px-4">
    <h1 class="text-xl font-semibold text-blueGray-700 mb-4">Alerts</h1>
    <div v-if="bmsStore.alerts.length" class="space-y-2">
      <div
        v-for="(alert, i) in bmsStore.alerts"
        :key="i"
        class="bg-red-50 border border-red-300 rounded-lg p-3 text-sm"
      >
        <span class="text-red-600 font-bold">&#9888; {{ alert.pack_id }} / Cell {{ alert.cell_id }}</span>
        <span class="text-blueGray-400 ml-3">{{ new Date(alert.timestamp).toLocaleString() }}</span>
        <div class="mt-1 text-blueGray-600">
          V={{ alert.metrics?.voltage?.toFixed(3) }}V &nbsp;
          I={{ alert.metrics?.current?.toFixed(2) }}A &nbsp;
          T={{ alert.metrics?.temperature?.toFixed(1) }}°C
        </div>
      </div>
    </div>
    <div v-else class="text-blueGray-400 text-center py-20 border border-dashed border-blueGray-200 rounded-xl">
      No active alerts
    </div>
  </div>
</template>

<script>
import { useBmsStore } from "@/stores/bmsStore";
export default {
  name: "alerts-page",
  setup() {
    return { bmsStore: useBmsStore() };
  },
};
</script>
