<template>
  <div>
    <h1 class="text-xl font-semibold mb-4">Alerts</h1>
    <div v-if="bmsStore.alerts.length" class="space-y-2">
      <div v-for="(alert, i) in bmsStore.alerts" :key="i"
           class="bg-red-950/40 border border-red-800 rounded-lg p-3 text-sm">
        <span class="text-red-400 font-bold">🚨 {{ alert.pack_id }} / Cell {{ alert.cell_id }}</span>
        <span class="text-gray-400 ml-3">{{ new Date(alert.timestamp).toLocaleString() }}</span>
        <div class="mt-1 text-gray-300">
          V={{ alert.metrics.voltage?.toFixed(3) }}V
          I={{ alert.metrics.current?.toFixed(2) }}A
          T={{ alert.metrics.temperature?.toFixed(1) }}°C
        </div>
      </div>
    </div>
    <div v-else class="text-gray-600 text-center py-20">
      ✅ No active alerts
    </div>
  </div>
</template>

<script setup>
import { useBmsStore } from "@/stores/bmsStore";
const bmsStore = useBmsStore();
</script>
