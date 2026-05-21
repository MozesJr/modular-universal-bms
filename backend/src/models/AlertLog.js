// backend/src/models/AlertLog.js
// Model for persisted alert logs with acknowledgement support.

"use strict";

const mongoose = require("mongoose");

const alertLogSchema = new mongoose.Schema(
  {
    pack_id: { type: String, required: true },
    cell_id: { type: Number, required: true },
    type: { type: String, required: true }, // e.g., overcharge, thermal_runaway, over_current, over_discharge
    timestamp: { type: Date, default: Date.now, required: true, index: true },
    resolved: { type: Boolean, default: false },
    resolved_at: { type: Date, default: null },
  },
  { versionKey: false }
);

module.exports = mongoose.model("AlertLog", alertLogSchema, "alert_logs");
