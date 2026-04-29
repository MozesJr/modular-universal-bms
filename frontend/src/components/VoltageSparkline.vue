<!-- VoltageSparkline.vue — lightweight SVG sparkline (no Chart.js overhead) -->
<template>
  <div class="w-full h-10">
    <svg v-if="points.length > 1" :viewBox="`0 0 ${W} ${H}`" class="w-full h-full">
      <polyline
        :points="points"
        fill="none"
        stroke="#4ade80"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- latest value dot -->
      <circle v-if="lastPoint" :cx="lastPoint.x" :cy="lastPoint.y" r="2" fill="#4ade80" />
    </svg>
    <div v-else class="text-xs text-gray-700 text-center pt-2">—</div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({ history: { type: Array, default: () => [] } });

const W = 200;
const H = 40;
const PAD = 4;

const points = computed(() => {
  const data = props.history.map((r) => r.metrics?.voltage).filter((v) => v != null);
  if (data.length < 2) return "";

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.01;

  return data
    .map((v, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
});

const lastPoint = computed(() => {
  const data = props.history.map((r) => r.metrics?.voltage).filter((v) => v != null);
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.01;
  const v = data[data.length - 1];
  return {
    x: (W - PAD).toFixed(1),
    y: (H - PAD - ((v - min) / range) * (H - PAD * 2)).toFixed(1),
  };
});
</script>
