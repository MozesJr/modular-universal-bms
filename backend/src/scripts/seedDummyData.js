// scripts/seedDummyData.js
"use strict";
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/UserModel");
const Bms = require("../models/Bms");
const Pack = require("../models/Pack");

async function findOrCreateUser({ username, email, password, role }) {
  let user = await User.findOne({ $or: [{ username }, { email }] });
  if (user) {
    console.log(`↺ User sudah ada: ${user.username} (${user.role})`);
    return user;
  }
  user = await User.create({ username, email, password, role, isActive: true });
  console.log(`✓ User dibuat: ${user.username} / ${password} (${user.role})`);
  return user;
}

async function findOrCreateBms(data) {
  let bms = await Bms.findOne({ bms_id: data.bms_id });
  if (bms) {
    console.log(`↺ BMS sudah ada: ${bms.bms_id}`);
    return bms;
  }
  bms = await Bms.create(data);
  console.log(
    `✓ BMS dibuat: ${bms.bms_id} (owner: ${data.owner}, status: ${bms.status})`,
  );
  return bms;
}

async function findOrCreatePack(data) {
  let pack = await Pack.findOne({ pack_id: data.pack_id });
  if (pack) {
    console.log(`↺ Pack sudah ada: ${pack.pack_id}`);
    return pack;
  }
  pack = await Pack.create(data);
  console.log(`✓ Pack dibuat: ${pack.pack_id} (bms_id: ${data.bms_id})`);
  return pack;
}

function makeCells(count) {
  return Array.from({ length: count }, (_, i) => ({ cell_no: i + 1 }));
}

async function run() {
  await connectDB();
  console.log("=== Seeding dummy data ===\n");

  // ── 1. Users ──────────────────────────────────────────────
  const admin = await findOrCreateUser({
    username: "admin",
    email: "admin@bms.local",
    password: "Admin123!",
    role: "admin",
  });

  const budi = await findOrCreateUser({
    username: "budi",
    email: "budi@bms.local",
    password: "User123!",
    role: "user",
  });

  const sari = await findOrCreateUser({
    username: "sari",
    email: "sari@bms.local",
    password: "User123!",
    role: "user",
  });

  console.log("");

  // ── 2. BMS Devices ────────────────────────────────────────
  // BMS_001: milik budi, sudah aktif+terverifikasi, punya 2 Pack (test 1 BMS banyak Pack)
  const bms001 = await findOrCreateBms({
    bms_id: "BMS_001",
    name: "Solar Storage Rumah Budi",
    bms_sernum: "BMS-SN-20260001",
    owner: budi._id,
    status: "active",
    verified_by: admin._id,
    verified_at: new Date(),
    collaborators: [{ user: sari._id, permission: "view" }], // test collaborator
  });

  // BMS_002: milik sari, masih pending_verification (test alur verify admin)
  const bms002 = await findOrCreateBms({
    bms_id: "BMS_002",
    name: "EV Conversion Unit",
    bms_sernum: "BMS-SN-20260002",
    owner: sari._id,
    status: "pending_verification",
  });

  // BMS_003: milik budi, aktif, tanpa collaborator (test assign ke user lain)
  const bms003 = await findOrCreateBms({
    bms_id: "BMS_003",
    name: "Backup Power Warehouse",
    bms_sernum: "BMS-SN-20260003",
    owner: budi._id,
    status: "active",
    verified_by: admin._id,
    verified_at: new Date(),
  });

  console.log("");

  // ── 3. Packs ──────────────────────────────────────────────
  await findOrCreatePack({
    pack_id: "PACK_001",
    bms_id: bms001.bms_id,
    name: "Cluster A - LiFePO4 4S",
    cell_count: 4,
    chemistry: "LiFePO4",
    capacity_ah: 100,
    nominal_voltage: 3.2,
    min_voltage: 2.5,
    max_voltage: 3.65,
    max_temp_celsius: 55,
    max_current_amps: 20,
    cells: makeCells(4),
    state: "standby",
  });

  await findOrCreatePack({
    pack_id: "PACK_002",
    bms_id: bms001.bms_id, // ← masih di bawah BMS_001, test multi-pack per device
    name: "Cluster B - LiFePO4 8S",
    cell_count: 8,
    chemistry: "LiFePO4",
    capacity_ah: 150,
    nominal_voltage: 3.2,
    min_voltage: 2.5,
    max_voltage: 3.65,
    max_temp_celsius: 55,
    max_current_amps: 25,
    cells: makeCells(8),
    state: "standby",
  });

  await findOrCreatePack({
    pack_id: "PACK_003",
    bms_id: bms003.bms_id,
    name: "Warehouse Backup 6S",
    cell_count: 6,
    chemistry: "Li-ion 18650",
    capacity_ah: 80,
    nominal_voltage: 3.6,
    min_voltage: 3.0,
    max_voltage: 4.2,
    max_temp_celsius: 60,
    max_current_amps: 20,
    cells: makeCells(6),
    state: "standby",
  });

  // Catatan: BMS_002 sengaja belum punya Pack — untuk test bahwa
  // device pending_verification biasanya belum operasional.

  console.log("\n=== Selesai ===");
  console.log("Login credentials:");
  console.log("  admin / Admin123!  (role: admin)");
  console.log("  budi  / User123!   (role: user, owns BMS_001 + BMS_003)");
  console.log(
    "  sari  / User123!   (role: user, owns BMS_002 [pending], collaborator di BMS_001)",
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
