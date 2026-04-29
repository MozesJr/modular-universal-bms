<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <!-- Navigation -->
    <nav class="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
      <span class="text-green-400 font-bold text-lg tracking-wide">⚡ BMS Dashboard</span>
      <router-link to="/" class="nav-link">Live Monitor</router-link>
      <router-link to="/history" class="nav-link">History</router-link>
      <router-link to="/alerts" class="nav-link">Alerts</router-link>
      <router-link to="/config" class="nav-link">Config</router-link>
    </nav>

    <!-- Alert Banner -->
    <div v-if="bmsStore.hasActiveAlert"
         class="bg-red-900 border-b border-red-700 px-6 py-2 text-sm text-red-200 animate-pulse">
      🚨 Active alert detected — check the Alerts tab
    </div>

    <!-- Page Content -->
    <main class="p-6">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useBmsStore } from "@/stores/bmsStore";
import { useSocket } from "@/composables/useSocket";

const bmsStore = useBmsStore();
const { connect } = useSocket();

onMounted(() => {
  connect();
  bmsStore.fetchPacks();
});
</script>

<style>
.nav-link {
  @apply text-gray-400 hover:text-green-400 text-sm transition-colors;
}
.router-link-active {
  @apply text-green-400 font-medium;
}
</style>
