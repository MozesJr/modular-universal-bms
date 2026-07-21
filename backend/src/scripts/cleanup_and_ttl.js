/**
 * models/CellReadingBatch.js
 * Agregat per jam dari CellReading. TTL 7 hari juga -- kalau butuh histori
 * lebih panjang dari itu, naikkan angka retensinya (lihat batchAggregationService
 * juga kalau mau ubah window agregasinya).
 */
"use strict";
const mongoose = require("mongoose");

const cellReadingBatchSchema = new mongoose.Schema(
  {
    pack_id: { type: String, required: true, index: true },
    cell_id: { type: Number, required: true, index: true },

    period_start: {
      type: Date,
      required: true,
      expires: 60 * 60 * 24 * 7, // TTL 7 hari
    },
    period_end: { type: Date, required: true },

    voltage_min: { type: Number, default: null },
    voltage_max: { type: Number, default: null },
    voltage_avg: { type: Number, default: null },

    current_min: { type: Number, default: null },
    current_max: { type: Number, default: null },
    current_avg: { type: Number, default: null },

    temperature_min: { type: Number, default: null },
    temperature_max: { type: Number, default: null },
    temperature_avg: { type: Number, default: null },

    soc_last: { type: Number, default: null },
    soh_last: { type: Number, default: null },

    alert_count: { type: Number, default: 0 },
    sample_count: { type: Number, required: true },
  },
  { versionKey: false },
);

cellReadingBatchSchema.index(
  { pack_id: 1, cell_id: 1, period_start: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "CellReadingBatch",
  cellReadingBatchSchema,
  "cell_reading_batches",
);
