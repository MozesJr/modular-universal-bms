/**
 * mongo-init.js
 * Fresh start script — drop semua collection lama, buat collection baru
 * dengan schema indexes yang benar.
 *
 * Cara pakai:
 *   docker compose exec mongodb mongosh bms_db --file /scripts/mongo-init.js
 *
 * ATAU jika tidak pakai Docker:
 *   mongosh "mongodb://bms_admin:supersecretpassword@localhost:27017/bms_db?authSource=admin" --file mongo-init.js
 */

// ── Drop semua collection lama ───────────────────────────────
print("🗑️  Dropping old collections...");
db.battery_packs.drop();
db.cell_readings.drop();
db.alert_logs.drop();
db.bms_models.drop(); // collection baru, drop kalau ada sisa
print("✅ Old collections dropped.");

// ══════════════════════════════════════════════════════════════
// 1. bms_models (baru — mapping tabel bms_model)
// ══════════════════════════════════════════════════════════════
db.createCollection("bms_models");
db.bms_models.createIndex({ model_name: 1 }, { unique: true });
print("✅ bms_models collection created.");

// Seed beberapa model default
db.bms_models.insertMany([
  { model_name: "ESP32-BMS-V1" },
  { model_name: "ESP32-BMS-V2" },
  { model_name: "Custom-PCB-V1" },
]);
print("✅ bms_models seeded (3 default models).");

// ══════════════════════════════════════════════════════════════
// 2. battery_packs (update — mapping bms + cell_pack + cell)
// ══════════════════════════════════════════════════════════════
db.createCollection("battery_packs");
db.battery_packs.createIndex({ pack_id: 1 }, { unique: true });
db.battery_packs.createIndex({ state: 1 });
print("✅ battery_packs collection created.");

// ══════════════════════════════════════════════════════════════
// 3. cell_readings (update — mapping bms_log + cell_log)
// ══════════════════════════════════════════════════════════════
db.createCollection("cell_readings", {
  // Time-series hint: TTL index hapus data > 30 hari otomatis
  // Sesuaikan expireAfterSeconds sesuai kebutuhan penyimpanan
});

// Compound index untuk query histori per sel (paling sering dipakai)
db.cell_readings.createIndex(
  { pack_id: 1, cell_id: 1, timestamp: -1 },
  { name: "pack_cell_time_desc" },
);

// Index untuk query alert history
db.cell_readings.createIndex(
  { pack_id: 1, "alerts.0": 1, timestamp: -1 },
  { sparse: true, name: "pack_alerts_time" },
);

// TTL index: otomatis hapus readings > 30 hari (opsional, comment jika tidak mau)
db.cell_readings.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30, name: "ttl_30days" },
);

print("✅ cell_readings collection created with indexes.");

// ══════════════════════════════════════════════════════════════
// 4. alert_logs (tidak berubah)
// ══════════════════════════════════════════════════════════════
db.createCollection("alert_logs");
db.alert_logs.createIndex({ pack_id: 1, timestamp: -1 });
db.alert_logs.createIndex({ resolved: 1, timestamp: -1 });
print("✅ alert_logs collection created.");

// ── Summary ──────────────────────────────────────────────────
print("\n📊 Collections in bms_db:");
db.getCollectionNames().forEach((name) => {
  const count = db[name].countDocuments();
  print(`   - ${name}: ${count} documents`);
});

print("\n✅ BMS Database initialized successfully!");
print("   Next: restart backend service to apply new models.");
