<template>
  <div class="relative bg-emerald-600 md:pt-32 pb-32 pt-12">
    <!-- ══════════════════════════════════════════════
         SECTION 1 — Fleet Summary Stats
         Pakai CardStats.vue yang sudah ada di template
    ════════════════════════════════════════════════ -->
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
            :statTitle="String(totalActiveCells)"
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
            :statTitle="totalActiveCells > 0 ? 'Live' : 'Standby'"
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
import CardStats from "@/components/Cards/CardStats.vue";
import { useBmsStore } from "@/stores/bmsStore";
import { useSocket } from "@/composables/useSocket";

export default {
  components: { CardStats },
  setup() {
    const bmsStore = useBmsStore();
    const { connected } = useSocket();
    return { bmsStore, connected };
  },
};
</script>
