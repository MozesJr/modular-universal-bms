<template>
  <div>
    <!-- Pack selector -->
    <div class="flex flex-wrap items-center gap-4 px-4 mb-6">
      <h2 class="text-blueGray-700 font-semibold text-lg">Live Monitor</h2>
      <select
        v-model="bmsStore.selectedPackId"
        class="border border-blueGray-300 text-blueGray-700 text-sm rounded px-3 py-1.5"
      >
        <option v-if="bmsStore.packs.length === 0" disabled value="">Loading packs…</option>
        <option v-for="p in bmsStore.packs" :key="p.pack_id" :value="p.pack_id">
          {{ p.name }} ({{ p.cell_count }} cells)
        </option>
      </select>
    </div>

    <!-- Charts row -->
    <div class="flex flex-wrap">
      <div class="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
        <card-line-chart />
      </div>
      <div class="w-full xl:w-4/12 px-4">
        <card-bar-chart />
      </div>
    </div>

    <!-- Alerts + pack summary row -->
    <div class="flex flex-wrap mt-4">
      <div class="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
        <card-page-visits />
      </div>
      <div class="w-full xl:w-4/12 px-4">
        <card-social-traffic />
      </div>
    </div>

    <!-- Live cell grid -->
    <div class="flex flex-wrap mt-4 px-4">
      <div class="w-full">
        <h3 class="font-semibold text-blueGray-700 mb-4">
          Cell Details — {{ bmsStore.selectedPackId || "—" }}
        </h3>
        <div
          v-if="bmsStore.cellsForPack.length"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <cell-card
            v-for="cell in bmsStore.cellsForPack"
            :key="`${cell.pack_id}:${cell.cell_id}`"
            :cell="cell"
            :history="bmsStore.getCellHistory(cell.pack_id, cell.cell_id)"
          />
        </div>
        <div v-else class="text-blueGray-400 text-center py-16 border border-dashed border-blueGray-200 rounded-xl">
          Waiting for data from ESP32 via MQTT…
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from "vue";
import CardLineChart from "@/components/Cards/CardLineChart.vue";
import CardBarChart from "@/components/Cards/CardBarChart.vue";
import CardPageVisits from "@/components/Cards/CardPageVisits.vue";
import CardSocialTraffic from "@/components/Cards/CardSocialTraffic.vue";
import CellCard from "@/components/BMS/CellCard.vue";
import { useBmsStore } from "@/stores/bmsStore";
import { useSocket } from "@/composables/useSocket";

export default {
  name: "dashboard-page",
  components: { CardLineChart, CardBarChart, CardPageVisits, CardSocialTraffic, CellCard },
  setup() {
    const bmsStore = useBmsStore();
    const { connect, joinPack } = useSocket();

    onMounted(async () => {
      connect();
      await bmsStore.fetchPacks();
      if (bmsStore.selectedPackId) joinPack(bmsStore.selectedPackId);
    });

    return { bmsStore };
  },
};
</script>
