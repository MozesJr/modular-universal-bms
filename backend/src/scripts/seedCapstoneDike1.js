// scripts/seedCapstoneDike1.js
//
// Seed satu BMS device khusus untuk demo Capstone DIKE 2026:
//   - Nama tampilan : BMS-Capstone-DIKE-1
//   - bms_id         : BMS_1   (harus sama persis dengan konstanta BMS_ID di firmware ESP32)
//   - pack_id        : PACK_1  (harus sama persis dengan konstanta PACK_ID di firmware ESP32,
//                                 dan ini yang dipakai di topic MQTT bms/PACK_1/cell/{n})
//   - 4 cell (LiFePO4), threshold sesuai firmware: 2.5V - 3.65V, max suhu 55C
//
// Idempotent -- aman dijalankan berkali-kali, tidak akan bikin duplikat.
//
// Jalankan di server (dari dalam container backend):
//   docker compose exec backend node /app/src/scripts/seedCapstoneDike1.js
//
"use strict";
const connectDB = require("../config/db");
const User = require("../models/UserModel");
const Bms = require("../models/Bms");
const Pack = require("../models/Pack");

// ── Konfigurasi -- ganti di sini kalau ada yang mau disesuaikan ─────────────
const BMS_ID = "BMS_1"; // HARUS sama dengan const BMS_ID di firmware ESP32
const BMS_NAME = "BMS-Capstone-DIKE-1";
const PACK_ID = "PACK_1"; // HARUS sama dengan const PACK_ID di firmware ESP32
const PACK_NAME = "Pack Capstone DIKE 1 (4S LiFePO4)";
const CELL_COUNT = 4;
const OWNER_USERNAME = "admin"; // ganti kalau mau di-assign ke user lain

async function findOrCreateBms(data) {
  let bms = await Bms.findOne({ bms_id: data.bms_id });
  if (bms) {
    console.log(`↺ BMS sudah ada: ${bms.bms_id} (${bms.name})`);
    return bms;
  }
  bms = await Bms.create(data);
  console.log(
    `✓ BMS dibuat: ${bms.bms_id} (${bms.name}) -- status: ${bms.status}`,
  );
  return bms;
}

async function findOrCreatePack(data) {
  let pack = await Pack.findOne({ pack_id: data.pack_id });
  if (pack) {
    console.log(`↺ Pack sudah ada: ${pack.pack_id} (bms_id: ${pack.bms_id})`);
    return pack;
  }
  pack = await Pack.create(data);
  console.log(
    `✓ Pack dibuat: ${pack.pack_id} (bms_id: ${data.bms_id}, ${data.cell_count} cell)`,
  );
  return pack;
}

function makeCells(count) {
  return Array.from({ length: count }, (_, i) => ({ cell_no: i + 1 }));
}

async function run() {
  await connectDB();
  console.log("=== Seeding BMS Capstone DIKE 1 ===\n");

  // ── 1. Pastikan owner ada ────────────────────────────────────────────
  const owner = await User.findOne({ username: OWNER_USERNAME });
  if (!owner) {
    console.error(
      `❌ User "${OWNER_USERNAME}" tidak ditemukan. Jalankan seedDummyData.js dulu, ` +
        `atau ganti OWNER_USERNAME di script ini ke username yang sudah ada.`,
    );
    process.exit(1);
  }

  // ── 2. Bms device ────────────────────────────────────────────────────
  const bms = await findOrCreateBms({
    bms_id: BMS_ID,
    name: BMS_NAME,
    bms_sernum: "DIKE2026-CAPSTONE-001",
    owner: owner._id,
    status: "active", // langsung aktif, skip alur verifikasi manual
    verified_by: owner._id,
    verified_at: new Date(),
  });

  // ── 3. Pack (4 cell, threshold sama persis dengan firmware) ─────────
  const pack = await findOrCreatePack({
    pack_id: PACK_ID,
    bms_id: bms.bms_id,
    name: PACK_NAME,
    cell_count: CELL_COUNT,
    chemistry: "LiFePO4",
    cycle_count: 0,
    capacity_ah: 100,
    pack_num: 1,
    cell_series: CELL_COUNT, // 4 cell disusun seri (4S)

    nominal_voltage: 3.2,
    min_voltage: 2.5, // sama dengan cutoff undervoltage di firmware
    max_voltage: 3.65, // sama dengan cutoff overvoltage di firmware
    max_temp_celsius: 55, // sama dengan cutoff "fault" di firmware
    max_current_amps: 20,

    cells: makeCells(CELL_COUNT),
    state: "standby",
  });

  console.log("\n=== Selesai ===");
  console.log(
    `BMS   : ${bms.bms_id} — "${bms.name}" (owner: ${owner.username})`,
  );
  console.log(
    `Pack  : ${pack.pack_id} — ${pack.cell_count} cell (${pack.chemistry})`,
  );
  console.log(`\nKonfigurasi MQTT terkait:`);
  console.log(`  Broker : 72.61.208.150:1885`);
  console.log(
    `  Topic  : bms/${pack.pack_id}/cell/1 ... bms/${pack.pack_id}/cell/${pack.cell_count}`,
  );
  console.log(
    `\nPastikan firmware ESP32 pakai PACK_ID = "${pack.pack_id}" dan topic format ` +
      `"bms/%s/cell/%d" (bukan "bms/%s/pack/%s/cell/%d") supaya data betulan masuk.`,
  );

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Gagal seeding:", err);
  process.exit(1);
});
