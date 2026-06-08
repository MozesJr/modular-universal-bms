/**
 * models/AlertLog.js
 * Alert log — tidak berubah dari skema sebelumnya.
 * Dihasilkan ketika cl_state = 'fault' atau threshold terlampaui.
 */
"use strict";
const mongoose = require("mongoose");

const alertLogSchema = new mongoose.Schema(
  {
    pack_id: { type: String, required: true, index: true },
    cell_id: { type: Number, required: true },
    type: { type: String, required: true }, // overcharge, thermal_runaway, over_current, over_discharge
    timestamp: { type: Date, default: Date.now, required: true, index: true },
    resolved: { type: Boolean, default: false },
    resolved_at: { type: Date, default: null },
  },
  { versionKey: false },
);

module.exports = mongoose.model("AlertLog", alertLogSchema, "alert_logs");
