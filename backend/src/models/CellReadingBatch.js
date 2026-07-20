/**
 * models/CellReadingBatch.js
 * Menyimpan hasil agregasi periodik dari CellReading (raw, real-time).
 * Satu dokumen = ringkasan statistik satu cell untuk satu jendela waktu.
 *
 * Kenapa perlu ini terpisah dari CellReading:
 * - CellReading raw bisa jutaan baris (tiap 1-2 detik per cell), berat kalau
 *   dipakai buat query histori panjang (harian/mingguan/bulanan).
 * - CellReadingBatch jauh lebih ringkas (1 dokumen per cell per jam, misalnya),
 *   dipakai untuk grafik tren jangka panjang di dashboard.
 */
"use strict";
const mongoose = require("mongoose");

const cellReadingBatchSchema = new mongoose.Schema(
  {
    pack_id: { type: String, required: true, index: true },
    cell_id: { type: Number, required: true, index: true },

    period_start: { type: Date, required: true, index: true },
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

// Satu batch per pack+cell+period_start -> cegah duplikat kalau job re-run
cellReadingBatchSchema.index(
  { pack_id: 1, cell_id: 1, period_start: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "CellReadingBatch",
  cellReadingBatchSchema,
  "cell_reading_batches",
);
