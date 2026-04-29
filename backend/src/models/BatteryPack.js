/**
 * models/BatteryPack.js
 * Configuration & metadata for each battery pack.
 * Thresholds here drive the alert logic in mqttService.
 */

"use strict";

const mongoose = require("mongoose");

const batteryPackSchema = new mongoose.Schema(
  {
    pack_id:           { type: String, required: true, unique: true },
    name:              { type: String, default: "Unnamed Pack" },
    cell_count:        { type: Number, required: true },
    chemistry:         { type: String, default: "LiFePO4" },  // LiFePO4, Li-ion, etc.

    // Per-cell thresholds (drives alerts)
    nominal_voltage:   { type: Number, default: 3.2 },   // V
    max_voltage:       { type: Number, default: 3.65 },  // V — overcharge limit
    min_voltage:       { type: Number, default: 2.5 },   // V — over-discharge limit
    max_temp_celsius:  { type: Number, default: 60 },    // °C — thermal runaway risk
    max_current_amps:  { type: Number, default: 20 },    // A

    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("BatteryPack", batteryPackSchema, "battery_packs");
