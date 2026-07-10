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

// ── Akses ke Pack — resolve lewat Bms induknya ────────────────
exports.canAccessPack = async (req, res, next) => {
  const Pack = require("../models/Pack");
  const Bms = require("../models/Bms");

  const pack = await Pack.findOne({ pack_id: req.params.packId });
  if (!pack) return res.status(404).json({ message: "Pack tidak ditemukan" });

  const bms = await Bms.findOne({ bms_id: pack.bms_id });
  if (!bms)
    return res
      .status(404)
      .json({ message: "BMS induk pack ini tidak ditemukan" });

  const isOwner = bms.owner.equals(req.user._id);
  const collab = bms.collaborators.find((c) => c.user.equals(req.user._id));
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !collab && !isAdmin) {
    return res
      .status(403)
      .json({ message: "Anda tidak punya akses ke BMS pemilik pack ini" });
  }

  req.pack = pack;
  req.bms = bms;
  req.accessLevel = isAdmin ? "admin" : isOwner ? "owner" : collab.permission;
  next();
};

// ── Akses langsung ke Bms (buat routes/bms.js) ────────────────
exports.canAccessBms = async (req, res, next) => {
  const Bms = require("../models/Bms");
  const bms = await Bms.findOne({ bms_id: req.params.bmsId });
  if (!bms) return res.status(404).json({ message: "BMS tidak ditemukan" });

  const isOwner = bms.owner.equals(req.user._id);
  const collab = bms.collaborators.find((c) => c.user.equals(req.user._id));
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !collab && !isAdmin) {
    return res
      .status(403)
      .json({ message: "Anda tidak punya akses ke BMS ini" });
  }

  req.bms = bms;
  req.accessLevel = isAdmin ? "admin" : isOwner ? "owner" : collab.permission;
  next();
};

exports.getAccessiblePackIds = async (user) => {
  const Bms = require("../models/Bms");
  const Pack = require("../models/Pack");
  if (user.role === "admin") return null;

  const bmsList = await Bms.find({
    $or: [{ owner: user._id }, { "collaborators.user": user._id }],
  })
    .select("bms_id")
    .lean();

  const bmsIds = bmsList.map((b) => b.bms_id);
  const packs = await Pack.find({ bms_id: { $in: bmsIds } })
    .select("pack_id")
    .lean();
  return packs.map((p) => p.pack_id);
};
