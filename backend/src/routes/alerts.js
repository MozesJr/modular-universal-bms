/**
 * routes/alerts.js — Query and resolve alerts
 */
"use strict";

const { Router } = require("express");
const CellReading = require("../models/CellReading");
const router = Router();

// GET /api/alerts?packId=PACK_001&limit=50
router.get("/", async (req, res, next) => {
  try {
    const filter = { alerts: true };
    if (req.query.packId) filter.pack_id = req.query.packId;

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const alerts = await CellReading.find(filter)
      .select("timestamp pack_id cell_id metrics alerts -_id")
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json(alerts);
  } catch (err) { next(err); }
});

module.exports = router;
