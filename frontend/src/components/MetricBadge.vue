<!-- MetricBadge.vue -->
<template>
  <div class="bg-gray-800 rounded-lg p-2 text-center">
    <div class="text-xs text-gray-400 mb-0.5">{{ label }}</div>
    <div :class="['text-base font-mono font-semibold', warn ? 'text-red-400' : 'text-white']">
      {{ value }}<span class="text-xs text-gray-400 ml-0.5">{{ unit }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  unit: String,
  warn: { type: Boolean, default: false },
});
</script>
