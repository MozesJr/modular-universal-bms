/**
 * routes/bmsModels.js
 * CRUD untuk BmsModel (mapping tabel bms_model)
 * GET /api/bms-models
 * POST /api/bms-models
 * PUT /api/bms-models/:id
 * DELETE /api/bms-models/:id
 */
"use strict";
const { Router } = require("express");
const BmsModel = require("../models/BmsModel");
const BatteryPack = require("../models/BatteryPack");
const router = Router();

// GET /api/bms-models
router.get("/", async (_req, res, next) => {
  try {
    const models = await BmsModel.find().sort({ model_name: 1 }).lean();
    res.json(models);
  } catch (err) {
    next(err);
  }
});

// POST /api/bms-models
router.post("/", async (req, res, next) => {
  try {
    const model = await BmsModel.create({ model_name: req.body.model_name });
    res.status(201).json(model);
  } catch (err) {
    next(err);
  }
});

// PUT /api/bms-models/:id
router.put("/:id", async (req, res, next) => {
  try {
    const model = await BmsModel.findByIdAndUpdate(
      req.params.id,
      { model_name: req.body.model_name },
      { new: true, runValidators: true },
    );
    if (!model) return res.status(404).json({ error: "BmsModel not found" });

    // Sync nama ke semua BatteryPack yang pakai model ini
    await BatteryPack.updateMany(
      { bms_model_id: model._id },
      { bms_model_name: model.model_name },
    );
    res.json(model);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/bms-models/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const model = await BmsModel.findByIdAndDelete(req.params.id);
    if (!model) return res.status(404).json({ error: "BmsModel not found" });

    // Nullify referensi di BatteryPack
    await BatteryPack.updateMany(
      { bms_model_id: model._id },
      { bms_model_id: null, bms_model_name: null },
    );
    res.json({
      success: true,
      message: `BmsModel "${model.model_name}" deleted`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
