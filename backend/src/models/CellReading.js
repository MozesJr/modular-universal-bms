/**
 * models/CellReading.js
 * Data mentah real-time per cell. TTL 7 hari (auto-hapus otomatis oleh MongoDB)
 * -- histori jangka panjang pakai CellReadingBatch (agregat per jam), bukan ini.
 */
"use strict";
const mongoose = require("mongoose");
const BMS_STATE = ["normal", "charging", "discharging", "fault", "standby"];
const cellReadingSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      expires: 60 * 60 * 24 * 7, // TTL 7 hari
    },
    pack_id: { type: String, required: true, index: true },
    cell_id: { type: Number, required: true, index: true },
    metrics: {
      voltage: { type: Number, required: true },
      current: { type: Number, default: 0 },
      temperature: { type: Number, default: null },
      soc: { type: Number, default: null },
      soh: { type: Number, default: null },
    },
    pack_metrics: {
      voltage: { type: Number, default: null },
      current: { type: Number, default: null },
      temperature: { type: Number, default: null },
      soc: { type: Number, default: null },
      soh: { type: Number, default: null },
    },
    state: { type: String, enum: BMS_STATE, default: "normal" },
    alerts: { type: [String], default: [] },
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { versionKey: false },
);
cellReadingSchema.index({ pack_id: 1, cell_id: 1, timestamp: -1 });
module.exports = mongoose.model(
  "CellReading",
  cellReadingSchema,
  "cell_readings",
);
