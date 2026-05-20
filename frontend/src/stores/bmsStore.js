import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useBmsStore = defineStore("bms", () => {
  const packs = ref([]);
  const selectedPackId = ref(null);
  const cellReadings = ref(new Map());
  const cellHistory = ref(new Map());
  const HISTORY_MAX = 60;
  const alerts = ref([]);

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

  async function fetchPacks() {
    const { data } = await api.get("/packs");
    packs.value = data;
    if (data.length > 0 && !selectedPackId.value) {
      selectedPackId.value = data[0].pack_id;
    }
  }

  function applyReading(reading) {
    const key = `${reading.pack_id}:${reading.cell_id}`;
    cellReadings.value.set(key, reading);

    if (!cellHistory.value.has(key)) cellHistory.value.set(key, []);
    const history = cellHistory.value.get(key);
    history.push(reading);
    if (history.length > HISTORY_MAX) history.shift();

    if (reading.alerts && reading.alerts.length) {
      alerts.value.unshift(reading);
      if (alerts.value.length > 50) alerts.value.pop();
    }
  }

  function getCellHistory(packId, cellId) {
    return cellHistory.value.get(`${packId}:${cellId}`) || [];
  }

  async function createPack(packData) {
    const { data } = await api.post("/packs", packData);
    packs.value.push(data);
    return data;
  }

  async function updatePack(packId, packData) {
    const { data } = await api.put(`/packs/${packId}`, packData);
    const idx = packs.value.findIndex((p) => p.pack_id === packId);
    if (idx !== -1) packs.value.splice(idx, 1, data);
    return data;
  }

  return {
    packs, selectedPackId, selectedPack,
    cellReadings, cellHistory, alerts,
    cellsForPack, hasActiveAlert,
    fetchPacks, applyReading, getCellHistory,
    createPack, updatePack,
  };
});
