<template>
  <div class="relative bg-emerald-600 md:pt-32 pb-32 pt-12">
    <div class="px-4 md:px-10 mx-auto w-full">
      <div>
        <div class="flex flex-wrap">
          <div class="w-full lg:w-6/12 xl:w-3/12 px-4">
            <card-stats
              statSubtitle="BATTERY PACKS"
              :statTitle="String(bmsStore.packs.length)"
              statArrow="up"
              statPercent=""
              statPercentColor="text-emerald-500"
              statDescripiron="Configured packs"
              statIconName="fas fa-battery-full"
              statIconColor="bg-red-500"
            />
          </div>
          <div class="w-full lg:w-6/12 xl:w-3/12 px-4">
            <card-stats
              statSubtitle="ACTIVE CELLS"
              :statTitle="String(bmsStore.cellReadings.size)"
              statArrow="up"
              statPercent=""
              statPercentColor="text-emerald-500"
              statDescripiron="Cells reporting live"
              statIconName="fas fa-microchip"
              statIconColor="bg-orange-500"
            />
          </div>
          <div class="w-full lg:w-6/12 xl:w-3/12 px-4">
            <card-stats
              statSubtitle="ACTIVE ALERTS"
              :statTitle="String(bmsStore.alerts.length)"
              :statArrow="bmsStore.hasActiveAlert ? 'up' : 'down'"
              statPercent=""
              :statPercentColor="bmsStore.hasActiveAlert ? 'text-red-500' : 'text-emerald-500'"
              statDescripiron="Threshold violations"
              statIconName="fas fa-exclamation-triangle"
              statIconColor="bg-pink-500"
            />
          </div>
          <div class="w-full lg:w-6/12 xl:w-3/12 px-4">
            <card-stats
              statSubtitle="CONNECTION"
              :statTitle="connected ? 'Live' : 'Offline'"
              :statArrow="connected ? 'up' : 'down'"
              statPercent=""
              :statPercentColor="connected ? 'text-emerald-500' : 'text-red-500'"
              statDescripiron="Socket.io stream"
              statIconName="fas fa-wifi"
              statIconColor="bg-emerald-500"
            />
          </div>
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
