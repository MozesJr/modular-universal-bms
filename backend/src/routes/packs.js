/**
 * routes/packs.js — CRUD for battery pack configurations
 */
"use strict";

const { Router } = require("express");
const BatteryPack = require("../models/BatteryPack");
const { invalidatePackCache } = require("../services/mqttService");
const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const packs = await BatteryPack.find().lean();
    res.json(packs);
  } catch (err) { next(err); }
});

// GET /api/packs/presets — static chemistry presets used by the frontend
// form to auto-populate threshold fields. Must be registered BEFORE /:packId
// so that the literal string "presets" is not treated as a pack ID parameter.
router.get("/presets", (_req, res) => {
  res.json([
    {
      key: "LiFePO4",
      label: "LiFePO4 (Lithium Iron Phosphate)",
      nominal_voltage: 3.2,
      min_voltage: 2.5,
      max_voltage: 3.65,
      max_temp_celsius: 55,
      max_current_amps: 20,
    },
    {
      key: "Li-ion 18650",
      label: "Li-ion 18650",
      nominal_voltage: 3.6,
      min_voltage: 3.0,
      max_voltage: 4.2,
      max_temp_celsius: 60,
      max_current_amps: 20,
    },
  ]);
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

    // Bust the in-memory threshold cache so the next MQTT message
    // picks up the updated limits from MongoDB immediately.
    invalidatePackCache(req.params.packId);

    res.json(pack);
  } catch (err) { next(err); }
});

module.exports = router;
