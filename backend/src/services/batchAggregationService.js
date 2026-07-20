/**
 * services/batchAggregationService.js
 *
 * Menjalankan agregasi periodik: ambil semua CellReading (raw, real-time)
 * dalam satu jendela waktu, hitung statistiknya per pack_id+cell_id,
 * simpan sebagai satu dokumen CellReadingBatch.
 *
 * Dipanggil berkala lewat setInterval dari server.js (default tiap 1 jam).
 * Data raw di CellReading TIDAK dihapus oleh service ini — retensi/pruning
 * raw data itu keputusan terpisah, atur sendiri kalau diperlukan (mis. TTL index).
 */
"use strict";
const CellReading = require("../models/CellReading");
const CellReadingBatch = require("../models/CellReadingBatch");

/**
 * @param {number} windowMs - lebar jendela waktu batch dalam milidetik (default 1 jam)
 */
async function runBatchAggregation(windowMs = 60 * 60 * 1000) {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - windowMs);

  const results = await CellReading.aggregate([
    { $match: { timestamp: { $gte: periodStart, $lt: periodEnd } } },
    {
      $group: {
        _id: { pack_id: "$pack_id", cell_id: "$cell_id" },
        voltage_min: { $min: "$metrics.voltage" },
        voltage_max: { $max: "$metrics.voltage" },
        voltage_avg: { $avg: "$metrics.voltage" },
        current_min: { $min: "$metrics.current" },
        current_max: { $max: "$metrics.current" },
        current_avg: { $avg: "$metrics.current" },
        temperature_min: { $min: "$metrics.temperature" },
        temperature_max: { $max: "$metrics.temperature" },
        temperature_avg: { $avg: "$metrics.temperature" },
        soc_last: { $last: "$metrics.soc" },
        soh_last: { $last: "$metrics.soh" },
        alert_count: {
          $sum: { $cond: [{ $gt: [{ $size: "$alerts" }, 0] }, 1, 0] },
        },
        sample_count: { $sum: 1 },
      },
    },
  ]);

  if (results.length === 0) {
    console.log(
      `ℹ️  Batch aggregation: tidak ada data baru pada ${periodStart.toISOString()} - ${periodEnd.toISOString()}`,
    );
    return { inserted: 0, skipped: 0 };
  }

  let inserted = 0;
  let skipped = 0;

  for (const r of results) {
    try {
      await CellReadingBatch.create({
        pack_id: r._id.pack_id,
        cell_id: r._id.cell_id,
        period_start: periodStart,
        period_end: periodEnd,
        voltage_min: r.voltage_min,
        voltage_max: r.voltage_max,
        voltage_avg: r.voltage_avg,
        current_min: r.current_min,
        current_max: r.current_max,
        current_avg: r.current_avg,
        temperature_min: r.temperature_min,
        temperature_max: r.temperature_max,
        temperature_avg: r.temperature_avg,
        soc_last: r.soc_last,
        soh_last: r.soh_last,
        alert_count: r.alert_count,
        sample_count: r.sample_count,
      });
      inserted++;
    } catch (err) {
      // Duplicate key (unique index pack_id+cell_id+period_start) -> sudah pernah di-batch, skip
      if (err.code === 11000) {
        skipped++;
      } else {
        console.error("❌ Batch aggregation error:", err.message);
      }
    }
  }

  console.log(
    `✅ Batch aggregation selesai (${periodStart.toISOString()} - ${periodEnd.toISOString()}): ${inserted} dibuat, ${skipped} dilewati (duplikat)`,
  );
  return { inserted, skipped };
}

/**
 * Jalankan aggregation berkala. Dipanggil sekali di server.js setelah DB connect.
 * @param {number} intervalMs - jarak antar-run (default 1 jam)
 */
function scheduleBatchAggregation(intervalMs = 60 * 60 * 1000) {
  console.log(
    `🕐 Batch aggregation dijadwalkan tiap ${intervalMs / 60000} menit`,
  );
  setInterval(() => {
    runBatchAggregation(intervalMs).catch((err) =>
      console.error("❌ Scheduled batch aggregation gagal:", err),
    );
  }, intervalMs);
}

module.exports = { runBatchAggregation, scheduleBatchAggregation };
