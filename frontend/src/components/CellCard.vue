<template>
  <div :class="[
    'rounded-xl border p-4 flex flex-col gap-3 transition-all duration-300',
    cell.alerts
      ? 'border-red-600 bg-red-950/30 shadow-red-900/30 shadow-lg'
      : 'border-gray-800 bg-gray-900'
  ]">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <span class="font-semibold text-sm">Cell {{ cell.cell_id }}</span>
      <span v-if="cell.alerts" class="text-xs text-red-400 animate-pulse font-bold">⚠ ALERT</span>
      <span v-else class="text-xs text-green-500">● OK</span>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-2 gap-2">
      <MetricBadge
        label="Voltage"
        :value="fmt(cell.metrics.voltage, 3)"
        unit="V"
        :warn="isVoltageWarn"
      />
      <MetricBadge
        label="Current"
        :value="fmt(cell.metrics.current, 2)"
        unit="A"
      />
      <MetricBadge
        label="Temp"
        :value="fmt(cell.metrics.temperature, 1)"
        unit="°C"
        :warn="isTempWarn"
      />
      <MetricBadge
        label="SoC"
        :value="fmt(cell.metrics.soc, 1)"
        unit="%"
      />
    </div>

    <!-- SoC Progress Bar -->
    <div class="w-full bg-gray-800 rounded-full h-1.5">
      <div
        class="h-1.5 rounded-full transition-all duration-500"
        :class="socColor"
        :style="{ width: `${Math.min(cell.metrics.soc || 0, 100)}%` }"
      />
    </div>

    <!-- Voltage Sparkline -->
    <VoltageSparkline :history="history" />

    <!-- Timestamp -->
    <span class="text-xs text-gray-600 text-right">
      {{ timeAgo(cell.timestamp) }}
    </span>
  </div>
</template>

<script setup>
import { computed } from "vue";
import MetricBadge from "./MetricBadge.vue";
import VoltageSparkline from "./VoltageSparkline.vue";

const props = defineProps({
  cell: { type: Object, required: true },
  history: { type: Array, default: () => [] },
});

const fmt = (v, dec) => (v != null ? Number(v).toFixed(dec) : "—");

const isVoltageWarn = computed(() => {
  const v = props.cell.metrics.voltage;
  return v > 3.65 || v < 2.5;
});

const isTempWarn = computed(() => {
  const t = props.cell.metrics.temperature;
  return t != null && t > 60;
});

const socColor = computed(() => {
  const s = props.cell.metrics.soc || 0;
  if (s > 60) return "bg-green-500";
  if (s > 30) return "bg-yellow-500";
  return "bg-red-500";
});

function timeAgo(ts) {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}
</script>
