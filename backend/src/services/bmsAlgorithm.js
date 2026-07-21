// backend/src/services/bmsAlgorithm.js
// Dua metode estimasi State-of-Charge (SoC):
//
// 1. estimateSoc()            — Coulomb counting, butuh sensor ARUS.
//    Cocok kalau nanti rig sudah punya current sensor (shunt/ACS712/dll).
//
// 2. estimateSocFromVoltage() — OCV-based (Open Circuit Voltage lookup),
//    cuma butuh tegangan sel. Ini yang dipakai sekarang karena rig belum
//    punya sensor arus (current selalu 0 dari firmware).
//
// Catatan akurasi: OCV-based SoC paling akurat saat baterai RESTING
// (nggak lagi charge/discharge aktif) — di bawah beban, tegangan terminal
// sedikit menyimpang dari OCV asli (voltage sag/rise). Untuk monitoring
// kasar/dashboard, ini sudah cukup; untuk BMS presisi tinggi, kombinasikan
// dengan Coulomb counting begitu sensor arus tersedia.

"use strict";

/**
 * Coulomb counting SoC estimator.
 * @param {number} prevSoc - SoC sebelumnya (%).
 * @param {number} current - Arus terukur (A, positif = discharge).
 * @param {number} deltaSec - Selisih waktu sejak pembacaan sebelumnya (detik).
 * @param {number} capacityAh - Kapasitas nominal pack (Ah).
 * @returns {number} SoC baru (%, 0-100).
 */
function estimateSoc(prevSoc, current, deltaSec, capacityAh) {
  if (capacityAh <= 0) return prevSoc;
  const deltaHours = deltaSec / 3600;
  const deltaSoc = ((current * deltaHours) / capacityAh) * 100;
  let newSoc = prevSoc - deltaSoc;
  if (newSoc > 100) newSoc = 100;
  if (newSoc < 0) newSoc = 0;
  return Math.round(newSoc * 10) / 10;
}

// ── OCV (Open Circuit Voltage) -> SoC lookup table ──────────────
// Nilai per-sel LiFePO4 (V), pendekatan kurva discharge standar.
// Kurva LiFePO4 relatif FLAT di tengah (banyak SoC di rentang voltage sempit),
// makanya titik-titik di tengah lebih rapat.
const LIFEPO4_OCV_TABLE = [
  { soc: 100, v: 3.45 },
  { soc: 90, v: 3.35 },
  { soc: 80, v: 3.32 },
  { soc: 70, v: 3.28 },
  { soc: 60, v: 3.25 },
  { soc: 50, v: 3.22 },
  { soc: 40, v: 3.2 },
  { soc: 30, v: 3.17 },
  { soc: 20, v: 3.12 },
  { soc: 10, v: 3.0 },
  { soc: 0, v: 2.5 },
];

/**
 * Interpolasi linear terhadap tabel OCV (harus terurut voltage menurun).
 */
function interpolateOcvTable(voltage, table) {
  if (voltage >= table[0].v) return 100;
  if (voltage <= table[table.length - 1].v) return 0;

  for (let i = 0; i < table.length - 1; i++) {
    const hi = table[i];
    const lo = table[i + 1];
    if (voltage <= hi.v && voltage >= lo.v) {
      const ratio = (voltage - lo.v) / (hi.v - lo.v);
      const soc = lo.soc + ratio * (hi.soc - lo.soc);
      return Math.round(soc * 10) / 10;
    }
  }
  return 0;
}

/**
 * Estimasi SoC dari tegangan sel (OCV-based). Tidak butuh sensor arus.
 * @param {number} voltage - Tegangan sel saat ini (V).
 * @param {string} chemistry - Chemistry pack (default "LiFePO4").
 * @param {number} minVoltage - Batas bawah pack (fallback linear utk chemistry lain).
 * @param {number} maxVoltage - Batas atas pack (fallback linear utk chemistry lain).
 * @returns {number} SoC estimasi (%, 0-100).
 */
function estimateSocFromVoltage(
  voltage,
  chemistry = "LiFePO4",
  minVoltage = 2.5,
  maxVoltage = 3.65,
) {
  if (chemistry === "LiFePO4") {
    return interpolateOcvTable(voltage, LIFEPO4_OCV_TABLE);
  }
  // Chemistry lain: belum ada tabel OCV spesifik, fallback linear
  // sederhana antara min_voltage dan max_voltage pack. Kurang akurat
  // (chemistry lain umumnya tidak linear), tapi lebih baik daripada 0%.
  const clamped = Math.max(minVoltage, Math.min(maxVoltage, voltage));
  const pct = ((clamped - minVoltage) / (maxVoltage - minVoltage)) * 100;
  return Math.round(pct * 10) / 10;
}

module.exports = { estimateSoc, estimateSocFromVoltage };
