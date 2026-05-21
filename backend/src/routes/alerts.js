/**
 * routes/alerts.js — Alert log CRUD
 */
"use strict";

const { Router } = require("express");
const AlertLog = require("../models/AlertLog");
const router = Router();

// GET /api/alerts?packId=PACK_001&limit=50
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.packId) filter.pack_id = req.query.packId;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const alerts = await AlertLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(alerts);
  } catch (err) { next(err); }
});

// PUT /api/alerts/:id/acknowledge
router.put("/:id/acknowledge", async (req, res, next) => {
  try {
    const result = await AlertLog.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolved_at: new Date() },
      { new: true }
    ).lean();
    if (!result) return res.status(404).json({ error: "Alert not found" });
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
