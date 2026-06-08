/**
 * routes/packs.js — CRUD untuk BatteryPack (bms + cell_pack + cell)
 */
"use strict";
const { Router } = require("express");
const BatteryPack = require("../models/BatteryPack");
const BmsModel = require("../models/BmsModel");
const { invalidatePackCache } = require("../services/mqttService");
const router = Router();

// GET /api/packs
router.get("/", async (_req, res, next) => {
  try {
    const packs = await BatteryPack.find().lean();
    res.json(packs);
  } catch (err) {
    next(err);
  }
});

// GET /api/packs/presets — chemistry presets (harus sebelum /:packId)
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
    {
      key: "NMC",
      label: "NMC (Nickel Manganese Cobalt)",
      nominal_voltage: 3.7,
      min_voltage: 3.0,
      max_voltage: 4.2,
      max_temp_celsius: 55,
      max_current_amps: 25,
    },
    {
      key: "LCO",
      label: "LCO (Lithium Cobalt Oxide)",
      nominal_voltage: 3.7,
      min_voltage: 3.0,
      max_voltage: 4.2,
      max_temp_celsius: 50,
      max_current_amps: 15,
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

// POST /api/packs
router.post("/", async (req, res, next) => {
  try {
    const body = req.body;

    // Resolve bms_model_id dari nama jika dikirim sebagai string
    if (body.bms_model_name && !body.bms_model_id) {
      const model = await BmsModel.findOne({ model_name: body.bms_model_name });
      if (model) body.bms_model_id = model._id;
    }

    // Auto-generate cells array jika tidak dikirim
    if (!body.cells || body.cells.length === 0) {
      body.cells = Array.from({ length: body.cell_count || 1 }, (_, i) => ({
        cell_no: i + 1,
      }));
    }

    const pack = await BatteryPack.create(body);
    res.status(201).json(pack);
  } catch (err) {
    next(err);
  }
});

// PUT /api/packs/:packId
router.put("/:packId", async (req, res, next) => {
  try {
    const body = req.body;

    // Resolve bms_model_id dari nama jika berubah
    if (body.bms_model_name && !body.bms_model_id) {
      const model = await BmsModel.findOne({ model_name: body.bms_model_name });
      if (model) body.bms_model_id = model._id;
    }

    // Regenerate cells jika cell_count berubah
    if (body.cell_count) {
      const existing = await BatteryPack.findOne({
        pack_id: req.params.packId,
      });
      if (existing && existing.cell_count !== body.cell_count) {
        body.cells = Array.from({ length: body.cell_count }, (_, i) => ({
          cell_no: i + 1,
        }));
      }
    }

    const pack = await BatteryPack.findOneAndUpdate(
      { pack_id: req.params.packId },
      body,
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
