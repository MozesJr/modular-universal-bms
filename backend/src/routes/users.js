// routes/users.js
"use strict";
const { Router } = require("express");
const User = require("../models/UserModel");
const { protect } = require("../middleware/auth");
const router = Router();

// GET /api/users?search=budi
// Dipakai buat cari user saat nambah collaborator — bisa diakses semua user login,
// TIDAK exclusive admin. Field dibatasi, jangan expose isActive/role sensitif dll.
router.get("/", protect, async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("username email")
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
