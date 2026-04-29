<!-- SummaryCard.vue -->
<template>
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <div class="text-xs text-gray-500 mb-1">{{ label }}</div>
    <div class="text-2xl font-bold font-mono">{{ value }}<span class="text-sm text-gray-400 ml-1">{{ unit }}</span></div>
  </div>
</template>

<script setup>
defineProps({ label: String, value: [String, Number], unit: String });
</script>
