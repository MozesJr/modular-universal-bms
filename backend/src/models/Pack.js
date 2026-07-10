/**
 * models/Pack.js
 * Konfigurasi grup sel di bawah satu Bms device.
 * Ownership TIDAK ADA disini lagi — cek lewat Bms via bms_id.
 */
"use strict";
const mongoose = require("mongoose");

const CELL_CHEMISTRY = ["LiFePO4", "Li-ion 18650", "NMC", "LCO", "Custom"];
const BMS_STATE = ["normal", "charging", "discharging", "fault", "standby"];

const cellSchema = new mongoose.Schema(
  {
    cell_no: { type: Number, required: true },
    cell_pos: { type: String, default: null },
  },
  { _id: false },
);

const packSchema = new mongoose.Schema(
  {
    pack_id: { type: String, required: true, unique: true },
    bms_id: { type: String, required: true, index: true }, // ← FK ke Bms.bms_id
    name: { type: String, default: "Unnamed Pack" },

    cell_count: { type: Number, required: true },
    chemistry: { type: String, enum: CELL_CHEMISTRY, default: "LiFePO4" },
    cycle_count: { type: Number, default: 0 },
    capacity_ah: { type: Number, default: 100 },
    pack_num: { type: Number, default: 1 },
    cell_series: { type: Number, default: 1 },

    nominal_voltage: { type: Number, default: 3.2 },
    min_voltage: { type: Number, default: 2.5 },
    max_voltage: { type: Number, default: 3.65 },
    max_temp_celsius: { type: Number, default: 60 },
    max_current_amps: { type: Number, default: 20 },

    cells: { type: [cellSchema], default: [] },
    state: { type: String, enum: BMS_STATE, default: "standby" },

    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

module.exports = mongoose.model("Pack", packSchema, "packs");
