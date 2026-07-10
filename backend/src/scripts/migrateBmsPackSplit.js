"use strict";
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Bms = require("../models/Bms");
const Pack = require("../models/Pack");

// Baca collection lama 'battery_packs' tanpa gantung ke model BatteryPack.js
// (yang mungkin sudah kamu hapus/rename)
const legacySchema = new mongoose.Schema(
  {},
  { strict: false, versionKey: false },
);
const LegacyBatteryPack = mongoose.model(
  "LegacyBatteryPack",
  legacySchema,
  "battery_packs",
);

async function run() {
  await connectDB();

  const legacyPacks = await LegacyBatteryPack.find().lean();
  console.log(
    `Ditemukan ${legacyPacks.length} pack lama untuk dimigrasikan...`,
  );

  let created = 0,
    skipped = 0;

  for (const old of legacyPacks) {
    const bms_id = old.bms_sernum
      ? `BMS_${old.bms_sernum}`
      : `BMS_${old.pack_id}`;

    let bms = await Bms.findOne({ bms_id });
    if (!bms) {
      bms = await Bms.create({
        bms_id,
        name: old.name || "Unnamed BMS",
        bms_sernum: old.bms_sernum || null,
        bms_model_id: old.bms_model_id || null,
        bms_model_name: old.bms_model_name || null,
        owner: old.owner,
        status: old.status || "pending_verification",
        verified_by: old.verified_by || null,
        verified_at: old.verified_at || null,
        collaborators: old.collaborators || [],
        transfer_history: old.transfer_history || [],
        created_at: old.created_at || new Date(),
      });
    }

    const existingPack = await Pack.findOne({ pack_id: old.pack_id });
    if (existingPack) {
      skipped++;
      continue;
    }

    await Pack.create({
      pack_id: old.pack_id,
      bms_id: bms.bms_id,
      name: old.name || "Unnamed Pack",
      cell_count: old.cell_count,
      chemistry: old.chemistry,
      cycle_count: old.cycle_count,
      capacity_ah: old.capacity_ah,
      pack_num: old.pack_num,
      cell_series: old.cell_series,
      nominal_voltage: old.nominal_voltage,
      min_voltage: old.min_voltage,
      max_voltage: old.max_voltage,
      max_temp_celsius: old.max_temp_celsius,
      max_current_amps: old.max_current_amps,
      cells: old.cells || [],
      state: old.state || "standby",
      created_at: old.created_at || new Date(),
    });
    created++;
  }

  console.log(
    `Migrasi selesai — Bms/Pack baru dibuat: ${created}, dilewati (sudah ada): ${skipped}`,
  );
  console.log(
    `Collection lama 'battery_packs' TIDAK dihapus — hapus manual setelah kamu verifikasi datanya benar.`,
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migrasi gagal:", err);
  process.exit(1);
});
