/**
 * models/CellReading.js
 * Time-series document for individual cell sensor data from ESP32.
 *
 * MQTT payload expected from ESP32:
 * Topic: bms/{pack_id}/cell/{cell_id}
 * {
 *   "voltage": 3.27,
 *   "current": 1.50,
 *   "temperature": 28.4,
 *   "soc": 82.5,
 *   "soh": 97.0
 * }
 */

"use strict";

const mongoose = require("mongoose");

const cellReadingSchema = new mongoose.Schema(
  {
    // ─── Time-series metadata ────────────────────
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },

    // pack_id + cell_id identify the source uniquely
    pack_id: { type: String, required: true, index: true },
    cell_id: { type: Number, required: true, index: true },

    // ─── Sensor metrics ──────────────────────────
    metrics: {
      voltage:     { type: Number, required: true },   // Volts (±0.01 V tolerance)
      current:     { type: Number, default: 0 },       // Amps (shunt resistor)
      temperature: { type: Number, default: null },    // °C (DS18B20)
      soc:         { type: Number, default: null },    // % State of Charge
      soh:         { type: Number, default: null },    // % State of Health
    },

    // ─── Alert flag ──────────────────────────────
    // Set true when any metric breaches the pack's configured thresholds
    alerts: { type: Boolean, default: false },

    // Raw payload preserved for debugging/schema evolution
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  {
    // Disable default _id versioning on time-series inserts for performance
    versionKey: false,
  }
);

// Compound index optimised for per-cell historical range queries
cellReadingSchema.index({ pack_id: 1, cell_id: 1, timestamp: -1 });

module.exports = mongoose.model("CellReading", cellReadingSchema, "cell_readings");
