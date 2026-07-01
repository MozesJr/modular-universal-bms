// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Unauthorized: token tidak ditemukan" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user || !req.user.isActive) {
      return res
        .status(401)
        .json({ message: "User tidak valid atau nonaktif" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses ditolak: khusus admin" });
  }
  next();
};

// Helper: cek apakah user adalah owner ATAU collaborator dari BMS tertentu
exports.canAccessPack = async (req, res, next) => {
  const BatteryPack = require("../models/BatteryPack"); // bukan BatteryPackModel
  const pack = await BatteryPack.findOne({ pack_id: req.params.packId }); // bukan packId

  if (!pack) return res.status(404).json({ message: "BMS tidak ditemukan" });

  const isOwner = pack.owner.equals(req.user._id);
  const collab = pack.collaborators.find((c) => c.user.equals(req.user._id));
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !collab && !isAdmin) {
    return res
      .status(403)
      .json({ message: "Anda tidak punya akses ke BMS ini" });
  }

  req.pack = pack;
  req.accessLevel = isAdmin ? "admin" : isOwner ? "owner" : collab.permission;
  next();
};

exports.getAccessiblePackIds = async (user) => {
  const BatteryPack = require("../models/BatteryPack");
  if (user.role === "admin") return null; // null = tidak perlu filter, lihat semua
  const packs = await BatteryPack.find({
    $or: [{ owner: user._id }, { "collaborators.user": user._id }],
  })
    .select("pack_id")
    .lean();
  return packs.map((p) => p.pack_id);
};
