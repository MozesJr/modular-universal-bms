"use strict";
const { Router } = require("express");
const Bms = require("../models/Bms");
const BmsModel = require("../models/BmsModel");
const Pack = require("../models/Pack");
const User = require("../models/UserModel");
const { protect, isAdmin, canAccessBms } = require("../middleware/auth");
const router = Router();

// GET /api/bms — scoped ke owner/collaborator, admin lihat semua
router.get("/", protect, async (req, res, next) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : {
            $or: [
              { owner: req.user._id },
              { "collaborators.user": req.user._id },
            ],
          };
    const list = await Bms.find(query)
      .populate("owner", "username email role")
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/bms/:bmsId
router.get("/:bmsId", protect, canAccessBms, async (req, res, next) => {
  try {
    res.json(req.bms);
  } catch (err) {
    next(err);
  }
});

// GET /api/bms/:bmsId/packs — daftar pack di bawah device ini
router.get("/:bmsId/packs", protect, canAccessBms, async (req, res, next) => {
  try {
    const packs = await Pack.find({ bms_id: req.params.bmsId }).lean();
    res.json(packs);
  } catch (err) {
    next(err);
  }
});

// POST /api/bms — registrasi device baru
router.post("/", protect, async (req, res, next) => {
  try {
    const body = req.body;
    if (body.bms_model_name && !body.bms_model_id) {
      const model = await BmsModel.findOne({ model_name: body.bms_model_name });
      if (model) body.bms_model_id = model._id;
    }
    body.owner = req.user._id;
    body.status = req.user.role === "admin" ? "active" : "pending_verification";
    if (req.user.role === "admin") {
      body.verified_by = req.user._id;
      body.verified_at = new Date();
    }
    const bms = await Bms.create(body);
    res.status(201).json(bms);
  } catch (err) {
    next(err);
  }
});

// PUT /api/bms/:bmsId — edit info device
router.put("/:bmsId", protect, canAccessBms, async (req, res, next) => {
  try {
    if (!["owner", "admin", "maintain"].includes(req.accessLevel)) {
      return res.status(403).json({ error: "Tidak punya izin edit BMS ini" });
    }
    const body = req.body;
    delete body.owner;
    delete body.collaborators;
    delete body.transfer_history;
    delete body.status;
    if (body.bms_model_name && !body.bms_model_id) {
      const model = await BmsModel.findOne({ model_name: body.bms_model_name });
      if (model) body.bms_model_id = model._id;
    }
    const bms = await Bms.findOneAndUpdate({ bms_id: req.params.bmsId }, body, {
      new: true,
      runValidators: true,
    });
    res.json(bms);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/bms/:bmsId — cegah hapus kalau masih ada Pack anak
router.delete("/:bmsId", protect, canAccessBms, async (req, res, next) => {
  try {
    if (!["owner", "admin"].includes(req.accessLevel)) {
      return res
        .status(403)
        .json({ error: "Hanya owner atau admin yang dapat menghapus" });
    }
    const childCount = await Pack.countDocuments({ bms_id: req.params.bmsId });
    if (childCount > 0) {
      return res.status(400).json({
        error: `BMS ini masih punya ${childCount} pack aktif. Hapus/pindahkan pack dulu.`,
      });
    }
    await Bms.findOneAndDelete({ bms_id: req.params.bmsId });
    res.json({
      success: true,
      message: `BMS "${req.params.bmsId}" deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: assign & verify ──────────────────────────────────
router.patch("/:bmsId/assign", protect, isAdmin, async (req, res, next) => {
  try {
    const { userId } = req.body;
    const targetUser = await User.findById(userId);
    if (!targetUser)
      return res.status(404).json({ error: "User tujuan tidak ditemukan" });
    const bms = await Bms.findOneAndUpdate(
      { bms_id: req.params.bmsId },
      {
        owner: userId,
        status: "active",
        verified_by: req.user._id,
        verified_at: new Date(),
      },
      { new: true },
    );
    if (!bms) return res.status(404).json({ error: "BMS not found" });
    res.json({ message: `BMS di-assign ke ${targetUser.username}`, bms });
  } catch (err) {
    next(err);
  }
});

router.patch("/:bmsId/verify", protect, isAdmin, async (req, res, next) => {
  try {
    const { decision } = req.body;
    const bms = await Bms.findOne({ bms_id: req.params.bmsId });
    if (!bms) return res.status(404).json({ error: "BMS not found" });
    if (bms.status !== "pending_verification") {
      return res
        .status(400)
        .json({ error: "BMS sudah diverifikasi sebelumnya" });
    }
    bms.status = decision === "approve" ? "active" : "rejected";
    bms.verified_by = req.user._id;
    bms.verified_at = new Date();
    await bms.save();
    res.json({ message: `BMS telah di-${bms.status}`, bms });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: suspend / unsuspend ───────────────────────────────
// Toggle antara "active" <-> "suspended". Tidak berlaku untuk status
// pending_verification/rejected — itu wajib lewat /verify dulu.
router.patch("/:bmsId/suspend", protect, isAdmin, async (req, res, next) => {
  try {
    const bms = await Bms.findOne({ bms_id: req.params.bmsId });
    if (!bms) return res.status(404).json({ error: "BMS not found" });

    if (!["active", "suspended"].includes(bms.status)) {
      return res.status(400).json({
        error: `BMS berstatus "${bms.status}" — verifikasi dulu sebelum bisa di-suspend/unsuspend`,
      });
    }

    bms.status = bms.status === "suspended" ? "active" : "suspended";
    await bms.save();
    res.json({ message: `BMS telah di-${bms.status}`, bms });
  } catch (err) {
    next(err);
  }
});

// ── Transfer kepemilikan (owner only) ───────────────────────
router.patch(
  "/:bmsId/transfer",
  protect,
  canAccessBms,
  async (req, res, next) => {
    try {
      if (req.accessLevel !== "owner") {
        return res
          .status(403)
          .json({ error: "Hanya owner yang dapat memindahtangankan BMS" });
      }
      const { newOwnerId, note } = req.body;
      const newOwner = await User.findById(newOwnerId);
      if (!newOwner)
        return res.status(404).json({ error: "User penerima tidak ditemukan" });
      const bms = req.bms;
      bms.transfer_history.push({ from: bms.owner, to: newOwnerId, note });
      bms.owner = newOwnerId;
      bms.collaborators = bms.collaborators.filter(
        (c) => !c.user.equals(newOwnerId),
      );
      await bms.save();
      res.json({
        message: `Kepemilikan dipindahkan ke ${newOwner.username}`,
        bms,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── Collaborator management (owner only) ────────────────────
router.post(
  "/:bmsId/collaborators",
  protect,
  canAccessBms,
  async (req, res, next) => {
    try {
      if (req.accessLevel !== "owner") {
        return res
          .status(403)
          .json({ error: "Hanya owner yang dapat menambah collaborator" });
      }
      const { collaboratorId, permission } = req.body;
      if (req.bms.owner.equals(collaboratorId)) {
        return res
          .status(400)
          .json({ error: "Owner tidak perlu jadi collaborator" });
      }
      const collaboratorUser = await User.findById(collaboratorId);
      if (!collaboratorUser)
        return res.status(404).json({ error: "User tidak ditemukan" });
      const existing = req.bms.collaborators.find((c) =>
        c.user.equals(collaboratorId),
      );
      if (existing) {
        existing.permission = permission;
      } else {
        req.bms.collaborators.push({
          user: collaboratorId,
          permission: permission || "view",
        });
      }
      await req.bms.save();
      res.json({
        message: "Collaborator berhasil ditambahkan/diupdate",
        bms: req.bms,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:bmsId/collaborators",
  protect,
  canAccessBms,
  async (req, res, next) => {
    try {
      if (req.accessLevel !== "owner") {
        return res
          .status(403)
          .json({ error: "Hanya owner yang dapat menghapus collaborator" });
      }
      const { collaboratorId } = req.body;
      req.bms.collaborators = req.bms.collaborators.filter(
        (c) => !c.user.equals(collaboratorId),
      );
      await req.bms.save();
      res.json({ message: "Collaborator berhasil dihapus", bms: req.bms });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
