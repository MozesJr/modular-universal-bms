// routes/auth.js
"use strict";
const { Router } = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const { protect } = require("../middleware/auth");
const router = Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// POST /api/auth/register — user daftar mandiri, default role "user"
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, email, dan password wajib diisi" });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      return res
        .status(409)
        .json({ error: "Username atau email sudah terdaftar" });
    }

    const user = await User.create({ username, email, password, role: "user" });
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log("LOGIN ATTEMPT:", { username, password });
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username dan password wajib diisi" });
    }

    // password punya select:false di schema, jadi wajib .select("+password")
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Username atau password salah" });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Akun nonaktif, hubungi admin" });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — verifikasi token & ambil profil saat ini (dipakai frontend saat refresh page)
router.get("/me", protect, async (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;
