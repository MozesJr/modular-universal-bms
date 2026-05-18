<template>
  <div class="bg-white border border-blueGray-200 rounded-xl shadow-sm p-4">
    <div class="text-xs text-blueGray-400 uppercase font-semibold mb-1">{{ label }}</div>
    <div class="text-2xl font-bold font-mono text-blueGray-700">
      {{ value }}<span class="text-sm text-blueGray-400 ml-1">{{ unit }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ label: String, value: [String, Number], unit: String });
</script>
