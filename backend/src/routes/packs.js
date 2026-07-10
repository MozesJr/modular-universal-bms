"use strict";
const { Router } = require("express");
const Pack = require("../models/Pack");
const Bms = require("../models/Bms");
const BmsModel = require("../models/BmsModel");
const { invalidatePackCache } = require("../services/mqttService");
const { protect, canAccessPack } = require("../middleware/auth");
const router = Router();

// GET /api/packs — scoped lewat Bms yang accessible
router.get("/", protect, async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role !== "admin") {
      const accessibleBms = await Bms.find({
        $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
      })
        .select("bms_id")
        .lean();
      filter = { bms_id: { $in: accessibleBms.map((b) => b.bms_id) } };
    }
    const packs = await Pack.find(filter).lean();
    res.json(packs);
  } catch (err) {
    next(err);
  }
});

// GET /api/packs/presets — tetap public
router.get("/presets", (_req, res) => {
  // ... tetap sama persis
});

// GET /api/packs/:packId
router.get("/:packId", protect, canAccessPack, async (req, res, next) => {
  try {
    res.json(req.pack);
  } catch (err) {
    next(err);
  }
});

// POST /api/packs — bms_id wajib, cek akses ke Bms induk dulu
router.post("/", protect, async (req, res, next) => {
  try {
    const body = req.body;
    if (!body.bms_id)
      return res.status(400).json({ error: "bms_id wajib diisi" });

    const bms = await Bms.findOne({ bms_id: body.bms_id });
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
        .json({ error: "Tidak punya izin menambah pack di BMS ini" });
    }

    if (body.bms_model_name && !body.bms_model_id) {
      const model = await BmsModel.findOne({ model_name: body.bms_model_name });
      if (model) body.bms_model_id = model._id;
    }

    if (!body.cells || body.cells.length === 0) {
      body.cells = Array.from({ length: body.cell_count || 1 }, (_, i) => ({
        cell_no: i + 1,
      }));
    }

    const pack = await Pack.create(body);
    res.status(201).json(pack);
  } catch (err) {
    next(err);
  }
});

// PUT /api/packs/:packId — config only, bms_id tidak boleh diubah lewat sini
router.put("/:packId", protect, canAccessPack, async (req, res, next) => {
  try {
    if (!["owner", "admin", "maintain"].includes(req.accessLevel)) {
      return res.status(403).json({ error: "Tidak punya izin edit pack ini" });
    }

    const body = req.body;
    delete body.bms_id; // pindah device pakai endpoint terpisah kalau perlu nanti

    if (body.cell_count && req.pack.cell_count !== body.cell_count) {
      body.cells = Array.from({ length: body.cell_count }, (_, i) => ({
        cell_no: i + 1,
      }));
    }

    const pack = await Pack.findOneAndUpdate(
      { pack_id: req.params.packId },
      body,
      { new: true, runValidators: true },
    );
    invalidatePackCache(req.params.packId);
    res.json(pack);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/packs/:packId
router.delete("/:packId", protect, canAccessPack, async (req, res, next) => {
  try {
    if (!["owner", "admin"].includes(req.accessLevel)) {
      return res
        .status(403)
        .json({ error: "Hanya owner atau admin yang dapat menghapus" });
    }
    const { packId } = req.params;
    await Pack.findOneAndDelete({ pack_id: packId });
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
