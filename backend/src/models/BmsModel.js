/**
 * models/BmsModel.js
 * Mapping dari tabel: bms_model
 * Menyimpan tipe/model perangkat BMS hardware.
 */
"use strict";
const mongoose = require("mongoose");

const bmsModelSchema = new mongoose.Schema(
  {
    model_name: { type: String, required: true, unique: true, trim: true },
  },
  { versionKey: false },
);

module.exports = mongoose.model("BmsModel", bmsModelSchema, "bms_models");
