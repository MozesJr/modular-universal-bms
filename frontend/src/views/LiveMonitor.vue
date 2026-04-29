<template>
  <div>
    <!-- Pack Selector -->
    <div class="flex items-center gap-4 mb-6">
      <h1 class="text-xl font-semibold">Live Cell Monitor</h1>
      <select v-model="bmsStore.selectedPackId"
              class="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm">
        <option v-for="p in bmsStore.packs" :key="p.pack_id" :value="p.pack_id">
          {{ p.name }} ({{ p.cell_count }} cells)
        </option>
      </select>
      <span class="ml-auto text-xs text-gray-500">
        {{ connected ? '🟢 Live' : '🔴 Disconnected' }}
      </span>
    </div>

    <!-- Pack Summary Bar -->
    <div v-if="bmsStore.selectedPack" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <SummaryCard label="Total Cells" :value="bmsStore.selectedPack.cell_count" unit="" />
      <SummaryCard label="Chemistry" :value="bmsStore.selectedPack.chemistry" unit="" />
      <SummaryCard label="Max Voltage" :value="bmsStore.selectedPack.max_voltage" unit="V" />
      <SummaryCard label="Max Temp" :value="bmsStore.selectedPack.max_temp_celsius" unit="°C" />
    </div>

    <!-- Cell Grid -->
    <div v-if="bmsStore.cellsForPack.length"
         class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <CellCard
        v-for="cell in bmsStore.cellsForPack"
        :key="`${cell.pack_id}:${cell.cell_id}`"
        :cell="cell"
        :history="bmsStore.getCellHistory(cell.pack_id, cell.cell_id)"
      />
    </div>

    <div v-else class="text-gray-500 text-center py-20">
      Waiting for data from ESP32 via MQTT…
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useBmsStore } from "@/stores/bmsStore";
import { useSocket } from "@/composables/useSocket";
import CellCard from "@/components/CellCard.vue";
import SummaryCard from "@/components/SummaryCard.vue";

const bmsStore = useBmsStore();
const { connected, joinPack } = useSocket();

onMounted(() => {
  if (bmsStore.selectedPackId) joinPack(bmsStore.selectedPackId);
});
</script>
