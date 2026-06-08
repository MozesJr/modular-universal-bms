<template>
  <div class="relative bg-emerald-600 md:pt-32 pb-32 pt-12">
    <!-- SECTION 1 — Fleet Summary Stats -->
    <div class="w-full px-4 mb-6">
      <div class="flex flex-wrap -mx-4">
        <div class="w-full lg:w-3/12 xl:w-3/12 px-4 mb-4">
          <card-stats
            statSubtitle="Battery Packs"
            :statTitle="String(bmsStore.packs.length)"
            statArrow="up"
            statPercent=""
            statPercentColor="text-emerald-500"
            statDescription="Configured packs"
            statIconName="fas fa-server"
            statIconColor="bg-indigo-500"
          />
        </div>

        <div class="w-full lg:w-3/12 xl:w-3/12 px-4 mb-4">
          <card-stats
            statSubtitle="Active Cells"
            :statTitle="String(activeCellCount)"
            statArrow="up"
            statPercent=""
            statPercentColor="text-emerald-500"
            statDescription="Cells reporting live"
            statIconName="fas fa-microchip"
            statIconColor="bg-orange-500"
          />
        </div>

        <div class="w-full lg:w-3/12 xl:w-3/12 px-4 mb-4">
          <card-stats
            statSubtitle="Active Alerts"
            :statTitle="String(bmsStore.alerts.length)"
            statArrow="down"
            statPercent=""
            statPercentColor="text-red-500"
            statDescription="Threshold violations"
            statIconName="fas fa-exclamation-triangle"
            statIconColor="bg-pink-500"
          />
        </div>

        <div class="w-full lg:w-3/12 xl:w-3/12 px-4 mb-4">
          <card-stats
            statSubtitle="Connection"
            :statTitle="activeCellCount > 0 ? 'Live' : 'Standby'"
            statArrow="up"
            statPercent=""
            statPercentColor="text-emerald-500"
            statDescription="Socket.io stream"
            statIconName="fas fa-wifi"
            statIconColor="bg-emerald-500"
          />
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

    // ── FIX: cellReadings sekarang plain object, bukan Map ────
    // Gunakan Object.keys/values/entries bukan .keys()/.values()

    function getCellsForPack(packId) {
      return Object.entries(bmsStore.cellReadings)
        .filter(([key]) => key.startsWith(packId + ":"))
        .map(([, reading]) => reading);
    }

    function getAlertsForPack(packId) {
      return bmsStore.alerts.filter((a) => a.pack_id === packId);
    }

    function goToDetail(packId) {
      bmsStore.selectedPackId = packId;
      router.push({ path: "/admin/pack-detail", query: { pack: packId } });
    }

    // Semua readings sebagai array (reactive karena object ref)
    const allReadings = computed(() => Object.values(bmsStore.cellReadings));

    const activeCellCount = computed(() => allReadings.value.length);

    const activePacks = computed(
      () =>
        bmsStore.packs.filter((p) =>
          Object.keys(bmsStore.cellReadings).some((k) =>
            k.startsWith(p.pack_id + ":"),
          ),
        ).length,
    );

    const fleetAvgSoC = computed(() => {
      const cells = allReadings.value;
      if (!cells.length) return "0";
      const socs = cells.map((c) => c.soc ?? c.metrics?.soc ?? 0);
      return (socs.reduce((a, b) => a + b, 0) / socs.length).toFixed(0);
    });

    const fleetMaxTemp = computed(() => {
      const cells = allReadings.value;
      if (!cells.length) return "0.0";
      const temps = cells
        .map((c) => c.temperature ?? c.metrics?.temperature ?? 0)
        .filter(Boolean);
      return temps.length ? Math.max(...temps).toFixed(1) : "0.0";
    });

    const fleetDeltaV = computed(() => {
      const cells = allReadings.value;
      if (!cells.length) return "0.000";
      const voltages = cells
        .map((c) => c.voltage ?? c.metrics?.voltage ?? 0)
        .filter(Boolean);
      if (!voltages.length) return "0.000";
      return (Math.max(...voltages) - Math.min(...voltages)).toFixed(3);
    });

    return {
      bmsStore,
      activeCellCount,
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
