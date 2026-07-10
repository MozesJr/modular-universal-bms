"use strict";
const { Router } = require("express");
const AlertLog = require("../models/AlertLog");
const Pack = require("../models/Pack");
const Bms = require("../models/Bms");
const { protect, getAccessiblePackIds } = require("../middleware/auth");
const router = Router();

router.get("/", protect, async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.packId) {
      const pack = await Pack.findOne({ pack_id: req.query.packId });
      if (!pack) return res.status(404).json({ error: "Pack not found" });

      const bms = await Bms.findOne({ bms_id: pack.bms_id });
      if (!bms)
        return res.status(404).json({ error: "BMS induk tidak ditemukan" });

      const isOwner = bms.owner.equals(req.user._id);
      const isCollab = bms.collaborators.some((c) =>
        c.user.equals(req.user._id),
      );
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isCollab && !isAdmin) {
        return res
          .status(403)
          .json({ error: "Anda tidak punya akses ke pack ini" });
      }
      filter.pack_id = req.query.packId;
    } else {
      const accessibleIds = await getAccessiblePackIds(req.user);
      if (accessibleIds !== null) filter.pack_id = { $in: accessibleIds };
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const alerts = await AlertLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

router.put("/:id/acknowledge", protect, async (req, res, next) => {
  try {
    const alert = await AlertLog.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });

    const pack = await Pack.findOne({ pack_id: alert.pack_id });
    if (!pack)
      return res.status(404).json({ error: "Pack terkait tidak ditemukan" });

    const bms = await Bms.findOne({ bms_id: pack.bms_id });
    if (!bms)
      return res.status(404).json({ error: "BMS induk tidak ditemukan" });

    const isOwner = bms.owner.equals(req.user._id);
    const collab = bms.collaborators.find((c) => c.user.equals(req.user._id));
    const isAdmin = req.user.role === "admin";

    const canMaintain =
      isAdmin || isOwner || (collab && collab.permission === "maintain");
    if (!canMaintain) {
      return res
        .status(403)
        .json({ error: "Tidak punya izin untuk acknowledge alert ini" });
    }

    const result = await AlertLog.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolved_at: new Date() },
      { new: true },
    ).lean();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
