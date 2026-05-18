<template>
  <div class="px-4">
    <h1 class="text-xl font-semibold text-blueGray-700 mb-4">Pack Configuration</h1>
    <p class="text-blueGray-500 text-sm mb-6">
      Manage battery pack profiles — cell count, chemistry, voltage limits, thermal thresholds.
    </p>

    <div v-if="bmsStore.packs.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="pack in bmsStore.packs"
        :key="pack.pack_id"
        class="bg-white rounded-xl border border-blueGray-200 shadow-sm p-4"
      >
        <h3 class="font-semibold text-blueGray-700 mb-2">{{ pack.name }}</h3>
        <div class="text-xs text-blueGray-400 space-y-1">
          <div>ID: <span class="font-mono text-blueGray-600">{{ pack.pack_id }}</span></div>
          <div>Chemistry: <span class="text-blueGray-600">{{ pack.chemistry }}</span></div>
          <div>Cells: <span class="text-blueGray-600">{{ pack.cell_count }}</span></div>
          <div>Max Voltage: <span class="text-blueGray-600">{{ pack.max_voltage }} V</span></div>
          <div>Max Temp: <span class="text-blueGray-600">{{ pack.max_temp_celsius }} °C</span></div>
        </div>
      </div>
    </div>

    <div v-else class="text-blueGray-400 text-center py-20 border border-dashed border-blueGray-200 rounded-xl">
      No packs loaded — check backend connection.
    </div>
  </div>
</template>

<script>
import { useBmsStore } from "@/stores/bmsStore";
export default {
  name: "pack-config-page",
  setup() {
    return { bmsStore: useBmsStore() };
  },
};
</script>
