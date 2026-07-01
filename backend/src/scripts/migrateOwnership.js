// scripts/migrateOwnership.js
"use strict";
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/UserModel");
const BatteryPack = require("../models/BatteryPack");

async function run() {
  await connectDB(); // pakai exact koneksi yang sama dengan app.js

  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    admin = await User.create({
      username: "admin",
      email: "admin@bms.local",
      password: "ChangeMe123!",
      role: "admin",
    });
    console.log(
      `Admin baru dibuat: ${admin.email} / password: ChangeMe123! (segera ganti)`,
    );
  } else {
    console.log(`Memakai admin existing: ${admin.username} (${admin.email})`);
  }

  const result = await BatteryPack.updateMany(
    { owner: { $exists: false } },
    {
      $set: {
        owner: admin._id,
        status: "active",
        verified_by: admin._id,
        verified_at: new Date(),
      },
    },
  );

  console.log(
    `${result.modifiedCount} pack berhasil di-assign ke admin "${admin.username}"`,
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migrasi gagal:", err);
  process.exit(1);
});
