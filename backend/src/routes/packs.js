/**
 * routes/packs.js — CRUD for battery pack configurations
 */
"use strict";

const { Router } = require("express");
const BatteryPack = require("../models/BatteryPack");
const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const packs = await BatteryPack.find().lean();
    res.json(packs);
  } catch (err) { next(err); }
});

router.get("/:packId", async (req, res, next) => {
  try {
    const pack = await BatteryPack.findOne({ pack_id: req.params.packId }).lean();
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    res.json(pack);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const pack = await BatteryPack.create(req.body);
    res.status(201).json(pack);
  } catch (err) { next(err); }
});

router.put("/:packId", async (req, res, next) => {
  try {
    const pack = await BatteryPack.findOneAndUpdate(
      { pack_id: req.params.packId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    res.json(pack);
  } catch (err) { next(err); }
});

module.exports = router;
