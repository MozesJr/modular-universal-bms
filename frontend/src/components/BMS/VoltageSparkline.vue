/* eslint-disable */
<template>
  <div class="w-full h-10">
    <svg v-if="svgPoints" :viewBox="`0 0 ${W} ${H}`" class="w-full h-full">
      <polyline
        :points="svgPoints"
        fill="none"
        stroke="#10b981"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle v-if="lastPoint" :cx="lastPoint.x" :cy="lastPoint.y" r="2" fill="#10b981" />
    </svg>
    <div v-else class="text-xs text-blueGray-300 text-center pt-2">—</div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({ history: { type: Array, default: () => [] } });

const W = 200;
const H = 40;
const PAD = 4;

const svgPoints = computed(() => {
  const data = props.history.map((r) => r.metrics?.voltage).filter((v) => v != null);
  if (data.length < 2) return null;
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
