import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useBmsStore = defineStore("bms", () => {
  const packs = ref([]);
  const bmsModels = ref([]);
  const bmsDevices = ref([]); // 🆕 daftar BMS device
  const selectedPackId = ref(null);
  const alerts = ref([]);
  const alertLogs = ref([]);
  const HISTORY_MAX = 60;

  const cellReadings = ref({});
  const cellHistory = ref({});

  // ── Computed ──────────────────────────────────────────────
  const selectedPack = computed(() =>
    packs.value.find((p) => p.pack_id === selectedPackId.value),
  );

  const cellsForPack = computed(() => {
    if (!selectedPackId.value) return [];
    const prefix = selectedPackId.value + ":";
    return Object.entries(cellReadings.value)
      .filter(([key]) => key.startsWith(prefix))
      .map(([, reading]) => reading)
      .sort((a, b) => a.cell_id - b.cell_id);
  });

  const hasActiveAlert = computed(() => alerts.value.length > 0);

  // ── BmsModel (katalog tipe — tidak berubah) ────────────────
  async function fetchBmsModels() {
    const { data } = await api.get("/bms-models");
    bmsModels.value = data;
    return data;
  }

  async function createBmsModel(modelName) {
    const { data } = await api.post("/bms-models", { model_name: modelName });
    bmsModels.value.push(data);
    return data;
  }

  // ── 🆕 Bms Device CRUD ──────────────────────────────────────
  async function fetchBmsDevices() {
    const { data } = await api.get("/bms");
    bmsDevices.value = data;
    return data;
  }

  async function createBms(bmsData) {
    const { data } = await api.post("/bms", bmsData);
    bmsDevices.value.push(data);
    return data;
  }

  async function updateBms(bmsId, bmsData) {
    const { data } = await api.put(`/bms/${bmsId}`, bmsData);
    const idx = bmsDevices.value.findIndex((b) => b.bms_id === bmsId);
    if (idx !== -1) bmsDevices.value.splice(idx, 1, data);
    return data;
  }

  async function deleteBms(bmsId) {
    await api.delete(`/bms/${bmsId}`);
    bmsDevices.value = bmsDevices.value.filter((b) => b.bms_id !== bmsId);
  }

  async function fetchPacksForBms(bmsId) {
    const { data } = await api.get(`/bms/${bmsId}/packs`);
    return data;
  }

  // ── Pack CRUD (config only, bms_id wajib) ──────────────────
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

  async function deletePack(packId) {
    await api.delete(`/packs/${packId}`);
    packs.value = packs.value.filter((p) => p.pack_id !== packId);

    const keysToDelete = Object.keys(cellReadings.value).filter((k) =>
      k.startsWith(packId + ":"),
    );
    keysToDelete.forEach((k) => {
      delete cellReadings.value[k];
      delete cellHistory.value[k];
    });

    if (selectedPackId.value === packId) {
      selectedPackId.value = packs.value.length ? packs.value[0].pack_id : null;
    }
  }

  // ── Real-time readings (tidak berubah) ─────────────────────
  function applyReading(reading) {
    const key = `${reading.pack_id}:${reading.cell_id}`;
    const flat = {
      ...reading,
      voltage: reading.metrics?.voltage ?? 0,
      current: reading.metrics?.current ?? 0,
      temperature: reading.metrics?.temperature ?? 0,
      soc: reading.metrics?.soc ?? 0,
      soh: reading.metrics?.soh ?? 100,
      state: reading.state ?? "normal",
    };
    cellReadings.value[key] = flat;

    if (!cellHistory.value[key]) cellHistory.value[key] = [];
    cellHistory.value[key].push(reading);
    if (cellHistory.value[key].length > HISTORY_MAX) {
      cellHistory.value[key].shift();
    }

    if (reading.alerts && reading.alerts.length) {
      alerts.value.unshift({ ...flat, timestamp: reading.timestamp });
      if (alerts.value.length > 50) alerts.value.pop();
    }
  }

  function getCellHistory(packId, cellId) {
    return cellHistory.value[`${packId}:${cellId}`] || [];
  }

  // ── Alerts (tidak berubah) ──────────────────────────────────
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

  async function fetchCellHistory(packId, cellId, hours = 1) {
    const to = new Date();
    const from = new Date(to - hours * 3600 * 1000);
    const { data } = await api.get(`/cells/${packId}/${cellId}/history`, {
      params: { from: from.toISOString(), to: to.toISOString() },
    });
    const key = `${packId}:${cellId}`;
    cellHistory.value[key] = data.data || [];
  }

  return {
    packs,
    bmsModels,
    bmsDevices,
    selectedPackId,
    selectedPack,
    cellReadings,
    cellHistory,
    alerts,
    alertLogs,
    cellsForPack,
    hasActiveAlert,
    fetchPacks,
    createPack,
    updatePack,
    deletePack,
    fetchBmsModels,
    createBmsModel,
    fetchBmsDevices,
    createBms,
    updateBms,
    deleteBms,
    fetchPacksForBms,
    applyReading,
    getCellHistory,
    fetchCellHistory,
    fetchAlertLogs,
    acknowledgeAlert,
  };
});
