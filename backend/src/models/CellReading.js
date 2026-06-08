/**
 * models/CellReading.js
 * Mapping dari tabel: bms_log + cell_log (digabung)
 *
 * bms_log  → pack_metrics (voltage, current, soh, soc, temp agregat pack)
 * cell_log → metrics (voltage, soh, soc, temp per sel individual)
 *
 * MQTT payload dari ESP32:
 * Topic: bms/{pack_id}/cell/{cell_id}
 * {
 *   "voltage":      3.27,    → cl_voltage
 *   "current":      1.50,    → current per sel
 *   "temperature":  28.4,    → cl_temp
 *   "soc":          82.5,    → cl_soc
 *   "soh":          97.0,    → cl_soh
 *   "state":        "normal", → cl_state (bms_state enum)
 *   "pack_voltage": 13.08,   → bmslog_voltage (opsional)
 *   "pack_current": 1.50,    → bmslog_current
 *   "pack_soc":     82.5,    → bmslog_soc
 *   "pack_soh":     97.0,    → bmslog_soh
 *   "pack_temp":    28.4     → bmslog_temp
 * }
 */
"use strict";
const mongoose = require("mongoose");

const BMS_STATE = ["normal", "charging", "discharging", "fault", "standby"];

const cellReadingSchema = new mongoose.Schema(
  {
    // ── Time-series metadata ────────────────────────────────
    timestamp: { type: Date, default: Date.now, required: true, index: true },
    pack_id: { type: String, required: true, index: true },
    cell_id: { type: Number, required: true, index: true },

    // ── Metrics per sel (cell_log) ──────────────────────────
    metrics: {
      voltage: { type: Number, required: true }, // cl_voltage (V, ±0.01V)
      current: { type: Number, default: 0 }, // arus sel (A, resistor shunt)
      temperature: { type: Number, default: null }, // cl_temp (°C, DS18B20)
      soc: { type: Number, default: null }, // cl_soc (%)
      soh: { type: Number, default: null }, // cl_soh (%)
    },

    // ── Metrics pack-level (bms_log) — opsional ─────────────
    // Dikirim ESP32 jika cell_id === 1 (master cell), atau broadcast semua
    pack_metrics: {
      voltage: { type: Number, default: null }, // bmslog_voltage
      current: { type: Number, default: null }, // bmslog_current
      temperature: { type: Number, default: null }, // bmslog_temp
      soc: { type: Number, default: null }, // bmslog_soc
      soh: { type: Number, default: null }, // bmslog_soh
    },

    // ── State (cl_state / bmslog_state enum) ────────────────
    state: { type: String, enum: BMS_STATE, default: "normal" },

    // ── Alert flags ─────────────────────────────────────────
    alerts: { type: [String], default: [] },

    // Raw payload untuk debugging / schema evolution
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { versionKey: false },
);

// Compound index untuk query histori per sel
cellReadingSchema.index({ pack_id: 1, cell_id: 1, timestamp: -1 });

module.exports = mongoose.model(
  "CellReading",
  cellReadingSchema,
  "cell_readings",
);
