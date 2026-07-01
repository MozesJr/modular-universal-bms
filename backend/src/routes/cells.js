"use strict";
const { Router } = require("express");
const CellReading = require("../models/CellReading");
const { protect, canAccessPack } = require("../middleware/auth");
const router = Router();

// Semua route di bawah ini sudah ter-prefix /:packId,
// middleware ini otomatis berlaku untuk semua sub-route (pack-log, history, stats)
router.use("/:packId", protect, canAccessPack);

// GET /api/cells/:packId — latest reading per cell
router.get("/:packId", async (req, res, next) => {
  try {
    const { packId } = req.params;
    const readings = await CellReading.aggregate([
      { $match: { pack_id: packId } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$cell_id", latest: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latest" } },
      { $sort: { cell_id: 1 } },
    ]);
    res.json({ pack_id: packId, cells: readings });
  } catch (err) {
    next(err);
  }
});

// GET /api/cells/:packId/pack-log — latest pack-level (bms_log) metrics
// Ambil dari cell_id=1 (atau cell pertama yang ada pack_metrics)
router.get("/:packId/pack-log", async (req, res, next) => {
  try {
    const { packId } = req.params;
    const latest = await CellReading.findOne({
      pack_id: packId,
      "pack_metrics.voltage": { $ne: null },
    })
      .sort({ timestamp: -1 })
      .select("timestamp pack_metrics state -_id")
      .lean();
    res.json({ pack_id: packId, pack_log: latest || null });
  } catch (err) {
    next(err);
  }
});

// GET /api/cells/:packId/:cellId/history
router.get("/:packId/:cellId/history", async (req, res, next) => {
  try {
    const { packId, cellId } = req.params;
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date(to - 3600 * 1000);
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);

    const readings = await CellReading.find({
      pack_id: packId,
      cell_id: parseInt(cellId),
      timestamp: { $gte: from, $lte: to },
    })
      .select("timestamp metrics pack_metrics state alerts -_id")
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();

    res.json({
      pack_id: packId,
      cell_id: parseInt(cellId),
      from,
      to,
      data: readings,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cells/:packId/:cellId/stats
router.get("/:packId/:cellId/stats", async (req, res, next) => {
  try {
    const { packId, cellId } = req.params;
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date(to - 86400 * 1000);

    const [stats] = await CellReading.aggregate([
      {
        $match: {
          pack_id: packId,
          cell_id: parseInt(cellId),
          timestamp: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          voltage_min: { $min: "$metrics.voltage" },
          voltage_max: { $max: "$metrics.voltage" },
          voltage_avg: { $avg: "$metrics.voltage" },
          current_min: { $min: "$metrics.current" },
          current_max: { $max: "$metrics.current" },
          temp_min: { $min: "$metrics.temperature" },
          temp_max: { $max: "$metrics.temperature" },
          temp_avg: { $avg: "$metrics.temperature" },
          soc_latest: { $last: "$metrics.soc" },
          soh_latest: { $last: "$metrics.soh" },
          alert_count: {
            $sum: { $cond: [{ $gt: [{ $size: "$alerts" }, 0] }, 1, 0] },
          },
          sample_count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      pack_id: packId,
      cell_id: parseInt(cellId),
      from,
      to,
      stats: stats || {},
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
