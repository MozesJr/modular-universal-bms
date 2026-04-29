// src/stores/bmsStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useBmsStore = defineStore("bms", () => {
  // ─── State ─────────────────────────────────────
  const packs = ref([]);
  const selectedPackId = ref(null);

  // Map: "PACK_001:1" → latest CellReading object
  const cellReadings = ref(new Map());

  // Ring-buffer for sparkline charts (last N readings per cell)
  const cellHistory = ref(new Map()); // "PACK_001:1" → reading[]
  const HISTORY_MAX = 60; // keep last 60 readings per cell in memory

  const alerts = ref([]); // latest alert events

  // ─── Computed ──────────────────────────────────
  const selectedPack = computed(() =>
    packs.value.find((p) => p.pack_id === selectedPackId.value)
  );

  const cellsForPack = computed(() => {
    if (!selectedPackId.value) return [];
    const entries = [];
    for (const [key, reading] of cellReadings.value.entries()) {
      if (key.startsWith(selectedPackId.value + ":")) entries.push(reading);
    }
    return entries.sort((a, b) => a.cell_id - b.cell_id);
  });

  const hasActiveAlert = computed(() => alerts.value.length > 0);

  // ─── Actions ───────────────────────────────────
  async function fetchPacks() {
    const { data } = await api.get("/packs");
    packs.value = data;
    if (data.length > 0 && !selectedPackId.value) {
      selectedPackId.value = data[0].pack_id;
    }
  }

  /** Called by useSocket when a cell:update event arrives */
  function applyReading(reading) {
    const key = `${reading.pack_id}:${reading.cell_id}`;

    cellReadings.value.set(key, reading);

    // Append to sparkline history ring-buffer
    if (!cellHistory.value.has(key)) cellHistory.value.set(key, []);
    const history = cellHistory.value.get(key);
    history.push(reading);
    if (history.length > HISTORY_MAX) history.shift();

    if (reading.alerts) {
      alerts.value.unshift(reading);
      if (alerts.value.length > 50) alerts.value.pop();
    }
  }

  function getCellHistory(packId, cellId) {
    return cellHistory.value.get(`${packId}:${cellId}`) || [];
  }

  return {
    packs, selectedPackId, selectedPack,
    cellReadings, cellHistory, alerts,
    cellsForPack, hasActiveAlert,
    fetchPacks, applyReading, getCellHistory,
  };
});
