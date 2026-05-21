<template>
  <div class="min-h-screen bg-blueGray-100">
    <!-- ── Header Bar ─────────────────────────────────────────── -->
    <div class="px-4 pt-4 mb-5">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md px-5 py-4 rounded-2xl border border-blueGray-200/70 shadow-sm"
      >
        <!-- Title -->
        <div>
          <h2
            class="text-xl font-extrabold text-blueGray-800 tracking-tight flex items-center gap-2"
          >
            <span
              class="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500 shadow"
            >
              <i class="fas fa-bolt text-white text-xs"></i>
            </span>
            Live Telemetry Monitor
          </h2>
          <p class="text-xs text-blueGray-400 mt-0.5 ml-9">
            Real-time balancing &amp; thermal register tracking
          </p>
        </div>

        <!-- Controls -->
        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <!-- Status pill -->
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium bg-blueGray-50 border-blueGray-200/60"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                :class="
                  bmsStore.cellsForPack.length
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                "
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2"
                :class="
                  bmsStore.cellsForPack.length
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                "
              ></span>
            </span>
            <span
              class="text-blueGray-600 font-mono text-[11px] uppercase tracking-wide"
            >
              {{
                bmsStore.cellsForPack.length ? "ESP32 Streaming" : "Connecting…"
              }}
            </span>
          </div>

          <!-- Pack selector -->
          <div class="relative w-full sm:w-60">
            <select
              v-model="bmsStore.selectedPackId"
              @change="handlePackChange"
              class="w-full appearance-none bg-white border border-blueGray-300 hover:border-indigo-400 text-blueGray-700 text-sm font-semibold rounded-lg pl-3 pr-10 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono cursor-pointer"
            >
              <option v-if="bmsStore.packs.length === 0" disabled value="">
                Loading clusters…
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
    </div>

    <!-- ── Quick Stats ─────────────────────────────────────────── -->
    <transition name="fade-slide">
      <div
        v-if="bmsStore.cellsForPack.length"
        class="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 mb-5"
      >
        <div
          v-for="stat in quickStats"
          :key="stat.title"
          class="bg-white rounded-xl border border-blueGray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3"
        >
          <div class="min-w-0">
            <p
              class="text-[10px] font-bold text-blueGray-400 uppercase tracking-wider truncate"
            >
              {{ stat.title }}
            </p>
            <h4
              class="text-lg font-black text-blueGray-800 font-mono leading-tight mt-0.5"
            >
              {{ stat.value }}
            </h4>
            <p class="text-[10px] text-blueGray-300 font-mono mt-0.5">
              {{ stat.sub }}
            </p>
          </div>
          <div
            :class="`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-sm shadow-sm ${stat.bgClass}`"
          >
            <i :class="stat.icon"></i>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── Charts Row ──────────────────────────────────────────── -->
    <div class="flex flex-wrap px-4 gap-y-4 mb-5">
      <div class="w-full xl:w-8/12 xl:pr-3">
        <div
          class="bg-white rounded-xl border border-blueGray-100 shadow-sm p-2 h-full"
        >
          <card-line-chart />
        </div>
      </div>
      <div class="w-full xl:w-4/12 xl:pl-1">
        <div
          class="bg-white rounded-xl border border-blueGray-100 shadow-sm p-2 h-full"
        >
          <card-bar-chart />
        </div>
      </div>
    </div>

    <!-- ── Alerts Table ────────────────────────────────────────── -->
    <div class="px-4 mb-5">
      <div class="bg-white rounded-xl border border-blueGray-100 shadow-sm">
        <card-page-visits />
      </div>
    </div>

    <!-- ── Cell Balancing Matrix ───────────────────────────────── -->
    <div class="px-4 mb-12">
      <!-- Section header -->
      <div class="flex justify-between items-center mb-5">
        <div class="flex items-center gap-2.5">
          <span
            class="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow shadow-emerald-200"
          ></span>
          <h3 class="font-extrabold text-base text-blueGray-800 tracking-tight">
            Symmetric Cell Balancing Matrix
          </h3>
          <span
            v-if="bmsStore.cellsForPack.length"
            class="text-[10px] bg-blueGray-100 text-blueGray-500 font-mono px-2 py-0.5 rounded-md"
          >
            {{ bmsStore.cellsForPack.length }} cells
          </span>
        </div>
        <span
          class="text-xs bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono px-2.5 py-1 rounded-lg font-bold shadow-sm"
        >
          {{ bmsStore.selectedPackId || "NO_CLUSTER" }}
        </span>
      </div>

      <!-- ✅ FIXED: flat grid, selalu 4 kolom di lg, 2 di sm, 1 di xs -->
      <div
        v-if="bmsStore.cellsForPack.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <div
          v-for="cell in bmsStore.cellsForPack"
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

      <!-- Empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-blueGray-200 rounded-2xl bg-white shadow-inner max-w-2xl mx-auto my-4 text-center"
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
          No real-time matrix registers loaded. MQTT broker cache will spin up
          automatically on first packet delivery.
        </p>
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
      if (bmsStore.selectedPackId) joinPack(bmsStore.selectedPackId);
    });

    function handlePackChange() {
      if (bmsStore.selectedPackId) joinPack(bmsStore.selectedPackId);
    }

    const quickStats = computed(() => {
      const cells = bmsStore.cellsForPack || [];
      if (!cells.length) return [];

      const voltages = cells.map((c) => c.voltage || 0);
      const temps = cells.map((c) => c.temperature || 0);
      const socs = cells.map((c) => c.soc || 0);

      const maxV = Math.max(...voltages);
      const minV = Math.min(...voltages);
      const delta = maxV - minV;
      const maxT = Math.max(...temps);
      const avgSoC = socs.reduce((a, b) => a + b, 0) / cells.length;

      const deltaColor =
        delta > 0.1
          ? "text-red-500"
          : delta > 0.05
            ? "text-amber-500"
            : "text-emerald-500";

      return [
        {
          title: "Highest Cell",
          value: `${maxV.toFixed(3)} V`,
          sub: `Cell ${voltages.indexOf(maxV) + 1}`,
          icon: "fas fa-arrow-up text-red-500",
          bgClass: "bg-red-50 text-red-400",
        },
        {
          title: "Lowest Cell",
          value: `${minV.toFixed(3)} V`,
          sub: `Cell ${voltages.indexOf(minV) + 1}`,
          icon: "fas fa-arrow-down text-blue-500",
          bgClass: "bg-blue-50 text-blue-400",
        },
        {
          title: "Delta / Imbalance",
          value: `${delta.toFixed(3)} V`,
          sub: delta > 0.1 ? "⚠ High imbalance" : "Balanced",
          icon: `fas fa-balance-scale ${deltaColor}`,
          bgClass:
            delta > 0.1
              ? "bg-red-50 text-red-400"
              : "bg-emerald-50 text-emerald-400",
        },
        {
          title: "Max Temp",
          value: `${maxT.toFixed(1)} °C`,
          sub: `Avg SoC ${avgSoC.toFixed(0)}%`,
          icon: "fas fa-thermometer-half text-orange-500",
          bgClass: "bg-orange-50 text-orange-400",
        },
      ];
    });

    return { bmsStore, quickStats, handlePackChange };
  },
};
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
