<template>
  <div class="flex flex-wrap mt-4">
    <!-- ══════════════════════════════════════════════
         SECTION 2 — Fleet Overview Mini Stats Bar
    ════════════════════════════════════════════════ -->
    <div class="w-full px-4 mb-6">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full mb-0 shadow-lg rounded"
      >
        <div class="flex flex-wrap divide-x divide-blueGray-100">
          <div class="flex-1 px-6 py-4">
            <p
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider mb-1"
            >
              Total Pack
            </p>
            <h4 class="text-2xl font-bold text-blueGray-700">
              {{ bmsStore.packs.length }}
            </h4>
            <p class="text-xs text-blueGray-400 mt-1">
              {{ activePacks }} streaming
            </p>
          </div>

          <div class="flex-1 px-6 py-4">
            <p
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider mb-1"
            >
              Avg SoC Fleet
            </p>
            <h4 class="text-2xl font-bold text-blueGray-700 font-mono">
              {{ fleetAvgSoC.toFixed(0) }}%
            </h4>
            <p class="text-xs text-blueGray-400 mt-1">
              {{ totalActiveCells }} sel aktif
            </p>
          </div>

          <div class="flex-1 px-6 py-4">
            <p
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider mb-1"
            >
              Max Temp
            </p>
            <h4
              class="text-2xl font-bold font-mono"
              :class="fleetMaxTemp > 45 ? 'text-red-500' : 'text-blueGray-700'"
            >
              {{ fleetMaxTemp.toFixed(1) }} °C
            </h4>
            <p
              class="text-xs mt-1"
              :class="fleetMaxTemp > 45 ? 'text-red-400' : 'text-blueGray-400'"
            >
              {{ fleetMaxTemp > 45 ? "⚠ Perlu perhatian" : "Normal" }}
            </p>
          </div>

          <div class="flex-1 px-6 py-4">
            <p
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider mb-1"
            >
              Fleet Δ Voltage
            </p>
            <h4
              class="text-2xl font-bold font-mono"
              :class="
                fleetDeltaV > 0.1
                  ? 'text-red-500'
                  : fleetDeltaV > 0.05
                  ? 'text-amber-500'
                  : 'text-blueGray-700'
              "
            >
              {{ fleetDeltaV.toFixed(3) }} V
            </h4>
            <p
              class="text-xs mt-1"
              :class="
                fleetDeltaV > 0.1
                  ? 'text-red-400'
                  : fleetDeltaV > 0.05
                  ? 'text-amber-500'
                  : 'text-blueGray-400'
              "
            >
              {{
                fleetDeltaV > 0.1
                  ? "⚠ Imbalance"
                  : fleetDeltaV > 0.05
                  ? "Watch"
                  : "Balanced"
              }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         SECTION 3 — Pack Cards Grid
    ════════════════════════════════════════════════ -->
    <div class="w-full px-4 mb-6">
      <div v-if="bmsStore.packs.length" class="flex flex-wrap -mx-4">
        <div
          v-for="pack in bmsStore.packs"
          :key="pack.pack_id"
          class="w-full lg:w-6/12 xl:w-4/12 px-4 mb-6"
        >
          <pack-card
            :pack="pack"
            :cells="getCellsForPack(pack.pack_id)"
            :alerts="getAlertsForPack(pack.pack_id)"
            @click="goToDetail(pack.pack_id)"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded"
      >
        <div
          class="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
          <div
            class="h-16 w-16 flex items-center justify-center rounded-full bg-blueGray-50 border border-blueGray-100 mb-4"
          >
            <i class="fas fa-battery-slash text-2xl text-blueGray-300"></i>
          </div>
          <h4 class="text-blueGray-600 font-bold text-base mb-2">
            Belum ada BMS terdaftar
          </h4>
          <p class="text-xs text-blueGray-400 max-w-sm leading-relaxed">
            Tambahkan Pack via menu
            <router-link
              to="/admin/config"
              class="text-indigo-500 font-bold hover:underline"
              >Pack Config</router-link
            >, atau tunggu ESP32 mengirim data pertama.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import CardStats from "@/components/Cards/CardStats.vue";
import PackCard from "@/components/BMS/PackCard.vue";
import { useBmsStore } from "@/stores/bmsStore";
import { useSocket } from "@/composables/useSocket";

export default {
  name: "dashboard-page",
  components: { CardStats, PackCard },
  setup() {
    const bmsStore = useBmsStore();
    const router = useRouter();
    const { connect } = useSocket();

    onMounted(async () => {
      connect();
      await bmsStore.fetchPacks();
    });

    function getCellsForPack(packId) {
      const entries = [];
      for (const [key, reading] of bmsStore.cellReadings.entries()) {
        if (key.startsWith(packId + ":")) entries.push(reading);
      }
      return entries;
    }

    function getAlertsForPack(packId) {
      return bmsStore.alerts.filter((a) => a.pack_id === packId);
    }

    function goToDetail(packId) {
      bmsStore.selectedPackId = packId;
      router.push({ path: "/admin/pack-detail", query: { pack: packId } });
    }

    const allCells = computed(() => {
      const arr = [];
      for (const v of bmsStore.cellReadings.values()) arr.push(v);
      return arr;
    });

    const totalActiveCells = computed(() => allCells.value.length);

    const activePacks = computed(
      () =>
        bmsStore.packs.filter((p) => {
          for (const key of bmsStore.cellReadings.keys()) {
            if (key.startsWith(p.pack_id + ":")) return true;
          }
          return false;
        }).length,
    );

    const fleetAvgSoC = computed(() => {
      const socs = allCells.value.map((c) => c.soc ?? c.metrics?.soc ?? 0);
      return socs.length ? socs.reduce((a, b) => a + b, 0) / socs.length : 0;
    });

    const fleetMaxTemp = computed(() => {
      const temps = allCells.value
        .map((c) => c.temperature ?? c.metrics?.temperature ?? 0)
        .filter(Boolean);
      return temps.length ? Math.max(...temps) : 0;
    });

    const fleetDeltaV = computed(() => {
      const voltages = allCells.value
        .map((c) => c.voltage ?? c.metrics?.voltage ?? 0)
        .filter(Boolean);
      if (!voltages.length) return 0;
      return Math.max(...voltages) - Math.min(...voltages);
    });

    return {
      bmsStore,
      totalActiveCells,
      activePacks,
      fleetAvgSoC,
      fleetMaxTemp,
      fleetDeltaV,
      getCellsForPack,
      getAlertsForPack,
      goToDetail,
    };
  },
};
</script>
