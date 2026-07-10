// routes/adminUsers.js
"use strict";
const { Router } = require("express");
const User = require("../models/UserModel");
const Bms = require("../models/Bms");
const { protect, isAdmin } = require("../middleware/auth");
const router = Router();

// semua route di sini wajib admin
router.use(protect, isAdmin);

// GET /api/admin/users — list semua user
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    // hitung jumlah BMS device per user (ganti dari pack count)
    const bmsCounts = await Bms.aggregate([
      { $group: { _id: "$owner", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(
      bmsCounts.map((b) => [b._id.toString(), b.count]),
    );
    const result = users.map((u) => ({
      ...u,
      bmsCount: countMap[u._id.toString()] || 0,
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users — buat user baru (langsung active, tanpa verifikasi)
router.post("/", async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, email, dan password wajib diisi" });
    }
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      return res
        .status(409)
        .json({ error: "Username atau email sudah digunakan" });
    }
    const user = await User.create({
      username,
      email,
      password,
      role: role || "user",
      isActive: true,
    });
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      bmsCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id — edit role dan/atau status aktif
router.patch("/:id", async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "Tidak bisa mengubah akun sendiri" });
    }
    const update = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select("-password -__v");
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/reset-password
router.patch("/:id/reset-password", async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password baru minimal 8 karakter" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    user.password = newPassword;
    await user.save();
    res.json({ message: `Password user "${user.username}" berhasil direset` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id — hapus user, re-assign BMS device-nya ke admin yang hapus
router.delete("/:id", async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "Tidak bisa menghapus akun sendiri" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    // re-assign semua BMS device milik user ini ke admin yang hapus
    await Bms.updateMany({ owner: user._id }, { owner: req.user._id });
    // hapus dari collaborator list di semua BMS
    await Bms.updateMany(
      { "collaborators.user": user._id },
      { $pull: { collaborators: { user: user._id } } },
    );
    await User.findByIdAndDelete(req.params.id);
    res.json({
      message: `User "${user.username}" berhasil dihapus, BMS device-nya dipindahkan ke admin`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
