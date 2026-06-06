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
  const alertLogs = ref([]);

  // ── Computed ────────────────────────────────────────────────
  const selectedPack = computed(() =>
    packs.value.find((p) => p.pack_id === selectedPackId.value),
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

  // ── Pack CRUD ────────────────────────────────────────────────

  async function fetchPacks() {
    const { data } = await api.get("/packs");
    packs.value = data;
    if (data.length > 0 && !selectedPackId.value) {
      selectedPackId.value = data[0].pack_id;
    }
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

  // ── TAMBAHAN: Delete pack ────────────────────────────────────
  async function deletePack(packId) {
    await api.delete(`/packs/${packId}`);
    packs.value = packs.value.filter((p) => p.pack_id !== packId);

    // Bersihkan cell readings & history terkait pack ini
    for (const key of [...cellReadings.value.keys()]) {
      if (key.startsWith(packId + ":")) cellReadings.value.delete(key);
    }
    for (const key of [...cellHistory.value.keys()]) {
      if (key.startsWith(packId + ":")) cellHistory.value.delete(key);
    }

    // Reset selectedPackId jika pack yang dihapus sedang dipilih
    if (selectedPackId.value === packId) {
      selectedPackId.value = packs.value.length ? packs.value[0].pack_id : null;
    }
  }

  // ── Real-time readings ───────────────────────────────────────
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

  // ── Alerts ───────────────────────────────────────────────────
  async function fetchAlertLogs() {
    const { data } = await api.get("/alerts");
    alertLogs.value = data;
  }

  async function acknowledgeAlert(alertId) {
    const { data } = await api.put(`/alerts/${alertId}/acknowledge`);
    const idx = alertLogs.value.findIndex(
      (a) => a._id === alertId || a.id === alertId,
    );
    if (idx !== -1) alertLogs.value.splice(idx, 1, data);
  }

  // ── Historical cell data ─────────────────────────────────────
  async function fetchCellHistory(packId, cellId, hours = 1) {
    const to = new Date();
    const from = new Date(to - hours * 3600 * 1000);
    const { data } = await api.get(`/cells/${packId}/${cellId}/history`, {
      params: { from: from.toISOString(), to: to.toISOString() },
    });
    const key = `${packId}:${cellId}`;
    cellHistory.value.set(key, data.data || []);
  }

  return {
    // State
    packs,
    selectedPackId,
    selectedPack,
    cellReadings,
    cellHistory,
    alerts,
    alertLogs,
    // Computed
    cellsForPack,
    hasActiveAlert,
    // Pack CRUD
    fetchPacks,
    createPack,
    updatePack,
    deletePack,
    // Readings
    applyReading,
    getCellHistory,
    fetchCellHistory,
    // Alerts
    fetchAlertLogs,
    acknowledgeAlert,
  };
});
