"use strict";
const { Router } = require("express");
const BatteryPack = require("../models/BatteryPack");
const BmsModel = require("../models/BmsModel");
const User = require("../models/UserModel");
const { invalidatePackCache } = require("../services/mqttService");
const { protect, isAdmin, canAccessPack } = require("../middleware/auth");
const router = Router();

// GET /api/packs — scoped ke owner + collaborator, admin lihat semua
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

    const packs = await BatteryPack.find(query)
      .populate("owner", "username email role")
      .lean();
    res.json(packs);
  } catch (err) {
    next(err);
  }
});

// GET /api/packs/presets — tetap public, taruh sebelum /:packId (urutan kamu sudah benar)
router.get("/presets", (_req, res) => {
  // ... tetap sama persis
});

// GET /api/packs/:packId — wajib punya akses (owner/collab/admin)
router.get("/:packId", protect, canAccessPack, async (req, res, next) => {
  try {
    res.json(req.pack); // sudah di-resolve oleh canAccessPack, ga perlu query lagi
  } catch (err) {
    next(err);
  }
});

// POST /api/packs — registrasi mandiri oleh user (poin 3), owner = req.user
router.post("/", protect, async (req, res, next) => {
  try {
    const body = req.body;

    if (body.bms_model_name && !body.bms_model_id) {
      const model = await BmsModel.findOne({ model_name: body.bms_model_name });
      if (model) body.bms_model_id = model._id;
    }

    if (!body.cells || body.cells.length === 0) {
      body.cells = Array.from({ length: body.cell_count || 1 }, (_, i) => ({
        cell_no: i + 1,
      }));
    }

    // admin yang create langsung jadi 'active', user biasa wajib verifikasi
    body.owner = req.user._id;
    body.status = req.user.role === "admin" ? "active" : "pending_verification";
    if (req.user.role === "admin") {
      body.verified_by = req.user._id;
      body.verified_at = new Date();
    }

    const pack = await BatteryPack.create(body);
    res.status(201).json(pack);
  } catch (err) {
    next(err);
  }
});

// PUT /api/packs/:packId — hanya owner/admin yang boleh edit (maintain collaborator boleh juga, opsional)
router.put("/:packId", protect, canAccessPack, async (req, res, next) => {
  try {
    if (!["owner", "admin", "maintain"].includes(req.accessLevel)) {
      return res.status(403).json({ error: "Tidak punya izin edit pack ini" });
    }

    const body = req.body;
    // cegah user mengubah field ownership lewat endpoint ini
    delete body.owner;
    delete body.collaborators;
    delete body.transfer_history;
    delete body.status;

    if (body.bms_model_name && !body.bms_model_id) {
      const model = await BmsModel.findOne({ model_name: body.bms_model_name });
      if (model) body.bms_model_id = model._id;
    }

    if (body.cell_count && req.pack.cell_count !== body.cell_count) {
      body.cells = Array.from({ length: body.cell_count }, (_, i) => ({
        cell_no: i + 1,
      }));
    }

    const pack = await BatteryPack.findOneAndUpdate(
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

// DELETE /api/packs/:packId — hanya owner asli atau admin
router.delete("/:packId", protect, canAccessPack, async (req, res, next) => {
  try {
    if (!["owner", "admin"].includes(req.accessLevel)) {
      return res
        .status(403)
        .json({ error: "Hanya owner atau admin yang dapat menghapus" });
    }
    const { packId } = req.params;
    await BatteryPack.findOneAndDelete({ pack_id: packId });
    invalidatePackCache(packId);
    res.json({
      success: true,
      message: `Pack "${packId}" deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: assign & verify ──────────────────────────────────
router.patch("/:packId/assign", protect, isAdmin, async (req, res, next) => {
  try {
    const { userId } = req.body;
    const targetUser = await User.findById(userId);
    if (!targetUser)
      return res.status(404).json({ error: "User tujuan tidak ditemukan" });

    const pack = await BatteryPack.findOneAndUpdate(
      { pack_id: req.params.packId },
      {
        owner: userId,
        status: "active",
        verified_by: req.user._id,
        verified_at: new Date(),
      },
      { new: true },
    );
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    res.json({ message: `Pack di-assign ke ${targetUser.username}`, pack });
  } catch (err) {
    next(err);
  }
});

router.patch("/:packId/verify", protect, isAdmin, async (req, res, next) => {
  try {
    const { decision } = req.body; // 'approve' | 'reject'
    const pack = await BatteryPack.findOne({ pack_id: req.params.packId });
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    if (pack.status !== "pending_verification") {
      return res
        .status(400)
        .json({ error: "Pack sudah diverifikasi sebelumnya" });
    }
    pack.status = decision === "approve" ? "active" : "rejected";
    pack.verified_by = req.user._id;
    pack.verified_at = new Date();
    await pack.save();
    res.json({ message: `Pack telah di-${pack.status}`, pack });
  } catch (err) {
    next(err);
  }
});

// ── Transfer kepemilikan (owner only) ───────────────────────
router.patch(
  "/:packId/transfer",
  protect,
  canAccessPack,
  async (req, res, next) => {
    try {
      if (req.accessLevel !== "owner") {
        return res
          .status(403)
          .json({ error: "Hanya owner yang dapat memindahtangankan pack" });
      }
      const { newOwnerId, note } = req.body;
      const newOwner = await User.findById(newOwnerId);
      if (!newOwner)
        return res.status(404).json({ error: "User penerima tidak ditemukan" });

      const pack = req.pack;
      pack.transfer_history.push({ from: pack.owner, to: newOwnerId, note });
      pack.owner = newOwnerId;
      pack.collaborators = pack.collaborators.filter(
        (c) => !c.user.equals(newOwnerId),
      );
      await pack.save();

      res.json({
        message: `Kepemilikan dipindahkan ke ${newOwner.username}`,
        pack,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── Collaborator management (owner only) ────────────────────
router.post(
  "/:packId/collaborators",
  protect,
  canAccessPack,
  async (req, res, next) => {
    try {
      if (req.accessLevel !== "owner") {
        return res
          .status(403)
          .json({ error: "Hanya owner yang dapat menambah collaborator" });
      }
      const { collaboratorId, permission } = req.body;
      if (req.pack.owner.equals(collaboratorId)) {
        return res
          .status(400)
          .json({ error: "Owner tidak perlu jadi collaborator" });
      }
      const collaboratorUser = await User.findById(collaboratorId);
      if (!collaboratorUser)
        return res.status(404).json({ error: "User tidak ditemukan" });

      const existing = req.pack.collaborators.find((c) =>
        c.user.equals(collaboratorId),
      );
      if (existing) {
        existing.permission = permission;
      } else {
        req.pack.collaborators.push({
          user: collaboratorId,
          permission: permission || "view",
        });
      }
      await req.pack.save();
      res.json({
        message: "Collaborator berhasil ditambahkan/diupdate",
        pack: req.pack,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:packId/collaborators",
  protect,
  canAccessPack,
  async (req, res, next) => {
    try {
      if (req.accessLevel !== "owner") {
        return res
          .status(403)
          .json({ error: "Hanya owner yang dapat menghapus collaborator" });
      }
      const { collaboratorId } = req.body;
      req.pack.collaborators = req.pack.collaborators.filter(
        (c) => !c.user.equals(collaboratorId),
      );
      await req.pack.save();
      res.json({ message: "Collaborator berhasil dihapus", pack: req.pack });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
