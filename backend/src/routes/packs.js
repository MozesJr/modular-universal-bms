/**
 * routes/packs.js — CRUD for battery pack configurations
 */
"use strict";

const { Router } = require("express");
const BatteryPack = require("../models/BatteryPack");
const { invalidatePackCache } = require("../services/mqttService");
const router = Router();

// GET /api/packs/
router.get("/", async (_req, res, next) => {
  try {
    const packs = await BatteryPack.find().lean();
    res.json(packs);
  } catch (err) {
    next(err);
  }
});

// GET /api/packs/presets — must be BEFORE /:packId
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

// GET /api/packs/:packId
router.get("/:packId", async (req, res, next) => {
  try {
    const pack = await BatteryPack.findOne({
      pack_id: req.params.packId,
    }).lean();
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    res.json(pack);
  } catch (err) {
    next(err);
  }
});

// POST /api/packs/
router.post("/", async (req, res, next) => {
  try {
    const pack = await BatteryPack.create(req.body);
    res.status(201).json(pack);
  } catch (err) {
    next(err);
  }
});

// PUT /api/packs/:packId
router.put("/:packId", async (req, res, next) => {
  try {
    const pack = await BatteryPack.findOneAndUpdate(
      { pack_id: req.params.packId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    invalidatePackCache(req.params.packId);
    res.json(pack);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/packs/:packId
router.delete("/:packId", async (req, res, next) => {
  try {
    const { packId } = req.params;

    const pack = await BatteryPack.findOneAndDelete({ pack_id: packId });
    if (!pack)
      return res.status(404).json({ error: `Pack "${packId}" not found` });

    // Bust threshold cache agar MQTT tidak pakai config lama
    invalidatePackCache(packId);

    res.json({
      success: true,
      message: `Pack "${packId}" deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
