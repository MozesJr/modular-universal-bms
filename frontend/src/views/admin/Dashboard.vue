<template>
  <div>
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 mb-6 bg-white/60 backdrop-blur-md p-4 rounded-xl border border-blueGray-100 shadow-sm"
    >
      <div>
        <h2
          class="text-xl font-extrabold text-blueGray-800 tracking-tight flex items-center gap-2"
        >
          <i class="fas fa-chart-network text-indigo-500 text-base"></i> Live
          Telemetry Monitor
        </h2>
        <p class="text-xs text-blueGray-400 mt-0.5">
          Real-time balancing and thermal register tracking
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div
          class="flex items-center gap-2 px-3 py-1.5 bg-blueGray-50 rounded-lg border border-blueGray-200/60 text-xs font-medium"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              :class="
                bmsStore.cellsForPack.length ? 'bg-emerald-400' : 'bg-amber-400'
              "
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2"
              :class="
                bmsStore.cellsForPack.length ? 'bg-emerald-500' : 'bg-amber-500'
              "
            ></span>
          </span>
          <span class="text-blueGray-600 font-mono text-[11px]">
            {{
              bmsStore.cellsForPack.length
                ? "ESP32 STREAMING"
                : "CONNECTING GATEWAY"
            }}
          </span>
        </div>

        <div class="relative w-full sm:w-64">
          <select
            v-model="bmsStore.selectedPackId"
            @change="handlePackChange"
            class="w-full appearance-none bg-white border border-blueGray-300 hover:border-indigo-500 text-blueGray-700 text-sm font-semibold rounded-lg pl-3 pr-10 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono cursor-pointer"
          >
            <option v-if="bmsStore.packs.length === 0" disabled value="">
              Loading register clusters…
            </option>
            <option
              v-for="p in bmsStore.packs"
              :key="p.pack_id"
              :value="p.pack_id"
            >
              📦 {{ p.name || "Unnamed" }} [{{ p.cell_count }}S]
            </option>
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blueGray-400"
          >
            <i class="fas fa-chevron-down text-xs"></i>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="bmsStore.cellsForPack.length"
      class="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 mb-6"
    >
      <div
        v-for="stat in quickStats"
        :key="stat.title"
        class="bg-white p-4 rounded-xl border border-blueGray-100 shadow-sm flex items-center justify-between"
      >
        <div>
          <p
            class="text-[10px] font-bold text-blueGray-400 uppercase tracking-wider"
          >
            {{ stat.title }}
          </p>
          <h4 class="text-lg font-bold text-blueGray-700 mt-1 font-mono">
            {{ stat.value }}
          </h4>
        </div>
        <div
          :class="`h-10 w-10 rounded-lg flex items-center justify-center text-sm shadow-sm ${stat.bgClass}`"
        >
          <i :class="stat.icon"></i>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap">
      <div class="w-full xl:w-8/12 mb-6 xl:mb-0 px-4">
        <div
          class="bg-white rounded-xl border border-blueGray-100 shadow-sm p-2"
        >
          <card-line-chart />
        </div>
      </div>
      <div class="w-full xl:w-4/12 px-4">
        <div
          class="bg-white rounded-xl border border-blueGray-100 shadow-sm p-2"
        >
          <card-bar-chart />
        </div>
      </div>
    </div>

    <div class="flex flex-wrap mt-6">
      <div class="w-full px-4">
        <div class="bg-white rounded-xl border border-blueGray-100 shadow-sm">
          <card-page-visits />
        </div>
      </div>
    </div>

    <div class="flex flex-wrap mt-6 px-4 mb-12">
      <div class="w-full">
        <div
          class="flex justify-between items-center border-b border-blueGray-200 pb-3 mb-6"
        >
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            <h3 class="font-bold text-lg text-blueGray-800 tracking-tight">
              Symmetric Cell Balancing Matrix
            </h3>
          </div>
          <span
            class="text-xs bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono px-2.5 py-1 rounded-md font-bold shadow-sm"
          >
            CLUSTER TARGET ID: {{ bmsStore.selectedPackId || "NO_CLUSTER" }}
          </span>
        </div>

        <div v-if="cellChunks.length">
          <div
            v-for="(chunk, rowIndex) in cellChunks"
            :key="'row-' + rowIndex"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
          >
            <div
              v-for="cell in chunk"
              :key="`${cell.pack_id}:${cell.cell_id}`"
              class="transform transition-all duration-300 hover:-translate-y-1"
            >
              <cell-card
                :cell="cell"
                :history="bmsStore.getCellHistory(cell.pack_id, cell.cell_id)"
                :pack-config="bmsStore.selectedPack"
              />
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-blueGray-400 text-center py-20 border border-dashed border-blueGray-300 rounded-2xl bg-white shadow-inner my-4 max-w-2xl mx-auto flex flex-col items-center justify-center p-6"
        >
          <div
            class="h-16 w-16 bg-slate-50 border border-slate-100 shadow-sm rounded-full flex items-center justify-center mb-4"
          >
            <i
              class="fas fa-satellite-dish text-2xl text-indigo-400 animate-bounce"
            ></i>
          </div>
          <h4 class="text-blueGray-700 font-bold text-base">
            Awaiting Cluster Pipeline Stream
          </h4>
          <p class="text-xs text-blueGray-400 mt-1 max-w-sm leading-relaxed">
            No real-time matrix registers loaded. Broker MQTT cache will spin up
            automatically on packet delivery.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, computed } from "vue";
import CardLineChart from "@/components/Cards/CardLineChart.vue";
import CardBarChart from "@/components/Cards/CardBarChart.vue";
import CardPageVisits from "@/components/Cards/CardPageVisits.vue";
import CellCard from "@/components/BMS/CellCard.vue";
import { useBmsStore } from "@/stores/bmsStore";
import { useSocket } from "@/composables/useSocket";

export default {
  name: "dashboard-page",
  components: { CardLineChart, CardBarChart, CardPageVisits, CellCard },
  setup() {
    const bmsStore = useBmsStore();
    const { connect, joinPack } = useSocket();

    onMounted(async () => {
      connect();
      await bmsStore.fetchPacks();
      if (bmsStore.selectedPackId) {
        joinPack(bmsStore.selectedPackId);
      }
    });

    function handlePackChange() {
      if (bmsStore.selectedPackId) {
        joinPack(bmsStore.selectedPackId);
      }
    }

    // Memotong array cells agar konsisten 4 kolom per baris
    const cellChunks = computed(() => {
      const chunks = [];
      const cells = bmsStore.cellsForPack || [];
      for (let i = 0; i < cells.length; i += 4) {
        chunks.push(cells.slice(i, i + 4));
      }
      return chunks;
    });

    // Kalkulasi otomatis ringkasan widget atas
    const quickStats = computed(() => {
      const cells = bmsStore.cellsForPack || [];
      if (!cells.length) return [];

      const voltages = cells.map((c) => c.voltage || 0);
      const temps = cells.map((c) => c.temperature || 0);

      const maxV = Math.max(...voltages);
      const minV = Math.min(...voltages);
      const avgV = voltages.reduce((a, b) => a + b, 0) / cells.length;
      const maxT = Math.max(...temps);

      return [
        {
          title: "Highest Cell",
          value: `${maxV.toFixed(3)} V`,
          icon: "fas fa-arrow-up text-red-500",
          bgClass: "bg-red-50 text-red-600",
        },
        {
          title: "Lowest Cell",
          value: `${minV.toFixed(3)} V`,
          icon: "fas fa-arrow-down text-blue-500",
          bgClass: "bg-blue-50 text-blue-600",
        },
        {
          title: "Delta / Imbalance",
          value: `${(maxV - minV).toFixed(3)} V`,
          icon: "fas fa-balance-scale text-amber-500",
          bgClass: "bg-amber-50 text-amber-600",
        },
        {
          title: "Max Temp Hotspot",
          value: `${maxT.toFixed(1)} °C`,
          icon: "fas fa-thermometer-full text-orange-500",
          bgClass: "bg-orange-50 text-orange-600",
        },
      ];
    });

    return {
      bmsStore,
      cellChunks,
      quickStats,
      handlePackChange,
    };
  },
};
</script>
