// scripts/seedRealHardware.js
//
// Seed BMS + Pack untuk hardware BMS beneran (bukan dummy/testing),
// disesuaikan persis dengan identitas yang dikirim firmware ESP32:
//   BMS_ID  = "BMS_1"
//   PACK_ID = "PACK_1"
//   6 cell, LiFePO4
//   threshold voltage (min/max) disamakan dengan determineState() di firmware:
//     undervoltage < 2.5V, overvoltage > 3.65V
//
// Idempotent — aman dijalankan berkali-kali (find-or-create, tidak bikin duplikat).
//
// Jalankan: node scripts/seedRealHardware.js
"use strict";
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/UserModel");
const Bms = require("../models/Bms");
const Pack = require("../models/Pack");

function makeCells(count) {
  return Array.from({ length: count }, (_, i) => ({ cell_no: i + 1 }));
}

async function run() {
  await connectDB();
  console.log("=== Seeding hardware nyata: BMS_1 / PACK_1 (6 cell) ===\n");

  // ── 1. Cari owner: admin ────────────────────────────────────
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error(
      "❌ Tidak ada user dengan role admin. Jalankan scripts/seedDummyData.js dulu (atau buat admin manual) sebelum seed ini.",
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`✓ Owner: ${admin.username} (${admin.email})\n`);

  // ── 2. BMS_1 ─────────────────────────────────────────────────
  let bms = await Bms.findOne({ bms_id: "BMS_1" });
  if (bms) {
    console.log(`↺ BMS sudah ada: ${bms.bms_id} (status: ${bms.status})`);
  } else {
    bms = await Bms.create({
      bms_id: "BMS_1",
      name: "Modular Universal BMS - Prototype",
      owner: admin._id,
      status: "active",
      verified_by: admin._id,
      verified_at: new Date(),
    });
    console.log(`✓ BMS dibuat: ${bms.bms_id} (owner: ${admin.username})`);
  }

  // ── 3. PACK_1 — 6 cell, threshold sama dengan firmware ───────
  let pack = await Pack.findOne({ pack_id: "PACK_1" });
  if (pack) {
    console.log(`↺ Pack sudah ada: ${pack.pack_id} (${pack.cell_count} cell)`);
  } else {
    pack = await Pack.create({
      pack_id: "PACK_1",
      bms_id: bms.bms_id,
      name: "Pack 1 - LiFePO4 6S",
      cell_count: 6,
      chemistry: "LiFePO4",
      capacity_ah: 100, // sesuaikan kalau kapasitas baterai aslinya beda
      nominal_voltage: 3.2,
      min_voltage: 2.5, // samakan dengan determineState() di firmware
      max_voltage: 3.65, // samakan dengan determineState() di firmware
      max_temp_celsius: 60, // default, belum ada sensor suhu di rig 6S ini
      max_current_amps: 20, // default, belum ada sensor arus di rig ini
      cells: makeCells(6),
      state: "standby",
    });
    console.log(
      `✓ Pack dibuat: ${pack.pack_id} (bms_id: ${pack.bms_id}, 6 cell)`,
    );
  }

  console.log("\n=== Selesai ===");
  console.log(
    "Begitu ESP32 publish ke topic bms/BMS_1/pack/PACK_1/cell/1..6, data akan otomatis:",
  );
  console.log("  1. Tersimpan real-time ke CellReading (mqttService.js)");
  console.log("  2. Terhubung ke threshold Pack ini untuk deteksi alert");
  console.log(
    "  3. Ikut teragregasi ke CellReadingBatch tiap jam (batchAggregationService.js)",
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
