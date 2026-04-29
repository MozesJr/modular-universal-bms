/**
 * routes/cells.js
 * REST endpoints for querying cell reading history.
 *
 * GET /api/cells/:packId                   — Latest reading per cell
 * GET /api/cells/:packId/:cellId/history   — Time-series history
 * GET /api/cells/:packId/:cellId/stats     — Aggregated stats (min/max/avg)
 */

"use strict";

const { Router } = require("express");
const CellReading = require("../models/CellReading");

const router = Router();

/**
 * GET /api/cells/:packId
 * Returns the most recent reading for every cell in the pack.
 */
router.get("/:packId", async (req, res, next) => {
  try {
    const { packId } = req.params;

    // Aggregate: for each cell_id, grab the latest document
    const readings = await CellReading.aggregate([
      { $match: { pack_id: packId } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$cell_id",
          latest: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latest" } },
      { $sort: { cell_id: 1 } },
    ]);

    res.json({ pack_id: packId, cells: readings });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cells/:packId/:cellId/history
 * Query params:
 *   from  — ISO date string (default: 1 hour ago)
 *   to    — ISO date string (default: now)
 *   limit — max records (default: 500)
 */
router.get("/:packId/:cellId/history", async (req, res, next) => {
  try {
    const { packId, cellId } = req.params;
    const to   = req.query.to   ? new Date(req.query.to)   : new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(to - 3600 * 1000);
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);

    const readings = await CellReading.find({
      pack_id:   packId,
      cell_id:   parseInt(cellId),
      timestamp: { $gte: from, $lte: to },
    })
      .select("timestamp metrics alerts -_id")
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();

    res.json({ pack_id: packId, cell_id: parseInt(cellId), from, to, data: readings });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cells/:packId/:cellId/stats
 * Returns min/max/avg for voltage, current, temperature over a time range.
 */
router.get("/:packId/:cellId/stats", async (req, res, next) => {
  try {
    const { packId, cellId } = req.params;
    const to   = req.query.to   ? new Date(req.query.to)   : new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(to - 86400 * 1000);

    const [stats] = await CellReading.aggregate([
      {
        $match: {
          pack_id:   packId,
          cell_id:   parseInt(cellId),
          timestamp: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          voltage_min:  { $min: "$metrics.voltage" },
          voltage_max:  { $max: "$metrics.voltage" },
          voltage_avg:  { $avg: "$metrics.voltage" },
          current_min:  { $min: "$metrics.current" },
          current_max:  { $max: "$metrics.current" },
          temp_min:     { $min: "$metrics.temperature" },
          temp_max:     { $max: "$metrics.temperature" },
          temp_avg:     { $avg: "$metrics.temperature" },
          soc_latest:   { $last: "$metrics.soc" },
          soh_latest:   { $last: "$metrics.soh" },
          alert_count:  { $sum: { $cond: ["$alerts", 1, 0] } },
          sample_count: { $sum: 1 },
        },
      },
    ]);

    res.json({ pack_id: packId, cell_id: parseInt(cellId), from, to, stats: stats || {} });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
