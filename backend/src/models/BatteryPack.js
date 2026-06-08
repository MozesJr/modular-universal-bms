/**
 * models/BatteryPack.js
 * Mapping dari tabel: bms + cell_pack + cell
 *
 * Menggabungkan info BMS hardware (bms), konfigurasi pack (cell_pack),
 * dan daftar sel (cell) menjadi satu dokumen MongoDB yang fleksibel.
 *
 * bms fields  : bms_sernum, bms_model → ref ke BmsModel, bms_cellnum,
 *               bms_cellchem, bms_cyclecount, bms_capacity, bms_packnum, bms_celnum
 * cell_pack   : cp_config (chemistry preset thresholds) → embedded sebagai thresholds
 * cell        : list sel baterai → embedded array cells[]
 */
"use strict";
const mongoose = require("mongoose");

const CELL_CHEMISTRY = ["LiFePO4", "Li-ion 18650", "NMC", "LCO", "Custom"];
const BMS_STATE = ["normal", "charging", "discharging", "fault", "standby"];

// Sub-schema: sel individual (mapping tabel `cell`)
const cellSchema = new mongoose.Schema(
  {
    cell_no: { type: Number, required: true }, // nomor urut sel dalam pack
    cell_pos: { type: String, default: null }, // posisi fisik opsional
  },
  { _id: false },
);

const batteryPackSchema = new mongoose.Schema(
  {
    // ── Identitas pack ─────────────────────────────────────
    pack_id: { type: String, required: true, unique: true }, // e.g. PACK_001
    name: { type: String, default: "Unnamed Pack" },

    // Serial number perangkat BMS hardware (bms_sernum)
    bms_sernum: { type: String, default: null },

    // Referensi model BMS (bms_model_id → embed nama untuk kemudahan)
    bms_model_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BmsModel",
      default: null,
    },
    bms_model_name: { type: String, default: null },

    // ── Konfigurasi sel (bms + cell_pack) ─────────────────
    cell_count: { type: Number, required: true }, // bms_cellnum
    chemistry: { type: String, enum: CELL_CHEMISTRY, default: "LiFePO4" }, // bms_cellchem
    cycle_count: { type: Number, default: 0 }, // bms_cyclecount
    capacity_ah: { type: Number, default: 100 }, // bms_capacity (Ah)
    pack_num: { type: Number, default: 1 }, // bms_packnum
    cell_series: { type: Number, default: 1 }, // bms_celnum

    // ── Threshold keamanan (cell_pack.cp_config) ──────────
    nominal_voltage: { type: Number, default: 3.2 },
    min_voltage: { type: Number, default: 2.5 },
    max_voltage: { type: Number, default: 3.65 },
    max_temp_celsius: { type: Number, default: 60 },
    max_current_amps: { type: Number, default: 20 },

    // ── Daftar sel (tabel cell) ────────────────────────────
    cells: { type: [cellSchema], default: [] },

    // ── Status saat ini ────────────────────────────────────
    state: { type: String, enum: BMS_STATE, default: "standby" },

    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

module.exports = mongoose.model(
  "BatteryPack",
  batteryPackSchema,
  "battery_packs",
);
