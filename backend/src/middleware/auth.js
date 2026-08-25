// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

// Verifies a JWT and loads the corresponding active user. Shared by the
// REST `protect` middleware and the Socket.IO auth middleware
// (services/socketService.js) so token verification lives in exactly one
// place instead of being reimplemented per transport.
async function verifyAuthToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return { ok: false, reason: "inactive_user" };
    }
    return { ok: true, user };
  } catch (err) {
    return { ok: false, reason: "invalid_token" };
  }
}

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: token tidak ditemukan" });
  }

  const result = await verifyAuthToken(token);
  if (!result.ok) {
    const message =
      result.reason === "inactive_user"
        ? "User tidak valid atau nonaktif"
        : "Token tidak valid";
    return res.status(401).json({ message });
  }

  req.user = result.user;
  next();
};

exports.verifyAuthToken = verifyAuthToken;

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses ditolak: khusus admin" });
  }
  next();
};

// ── Akses ke Pack — resolve lewat Bms induknya ────────────────
// Shared by the REST `canAccessPack` middleware below and the Socket.IO
// `join:pack` handler (services/socketService.js) so the actual
// owner/collaborator/admin authorization rule lives in exactly one place.
//
// Returns one of:
//   { reason: "pack_not_found" }
//   { reason: "bms_not_found" }
//   { reason: "forbidden", pack, bms }
//   { reason: "ok", pack, bms, accessLevel }
async function resolvePackAccess(user, packId) {
  const Pack = require("../models/Pack");
  const Bms = require("../models/Bms");

  const pack = await Pack.findOne({ pack_id: packId });
  if (!pack) return { reason: "pack_not_found" };

  const bms = await Bms.findOne({ bms_id: pack.bms_id });
  if (!bms) return { reason: "bms_not_found" };

  const isOwner = bms.owner.equals(user._id);
  const collab = bms.collaborators.find((c) => c.user.equals(user._id));
  const isAdmin = user.role === "admin";

  if (!isOwner && !collab && !isAdmin) {
    return { reason: "forbidden", pack, bms };
  }

  const accessLevel = isAdmin ? "admin" : isOwner ? "owner" : collab.permission;
  return { reason: "ok", pack, bms, accessLevel };
}

exports.canAccessPack = async (req, res, next) => {
  const result = await resolvePackAccess(req.user, req.params.packId);

  if (result.reason === "pack_not_found") {
    return res.status(404).json({ message: "Pack tidak ditemukan" });
  }
  if (result.reason === "bms_not_found") {
    return res
      .status(404)
      .json({ message: "BMS induk pack ini tidak ditemukan" });
  }
  if (result.reason === "forbidden") {
    return res
      .status(403)
      .json({ message: "Anda tidak punya akses ke BMS pemilik pack ini" });
  }

  req.pack = result.pack;
  req.bms = result.bms;
  req.accessLevel = result.accessLevel;
  next();
};

exports.resolvePackAccess = resolvePackAccess;

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
