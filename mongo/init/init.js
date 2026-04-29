// =============================================
// MongoDB Initialization Script
// Runs once when the container is first created
// =============================================

db = db.getSiblingDB("bms_db");

// Create a dedicated app user (least privilege)
db.createUser({
  user: "bms_app",
  pwd: "bms_app_password",
  roles: [{ role: "readWrite", db: "bms_db" }],
});

// ─── Collection: cell_readings ─────────────
// Time-series data from each battery cell
db.createCollection("cell_readings", {
  timeseries: {
    timeField: "timestamp",
    metaField: "meta",       // { pack_id, cell_id }
    granularity: "seconds",
  },
  expireAfterSeconds: 60 * 60 * 24 * 90, // Auto-delete after 90 days
});

// Compound index for fast per-cell historical queries
db.cell_readings.createIndex(
  { "meta.pack_id": 1, "meta.cell_id": 1, timestamp: -1 },
  { background: true }
);

// ─── Collection: alerts ────────────────────
db.createCollection("alerts");
db.alerts.createIndex({ timestamp: -1 });
db.alerts.createIndex({ pack_id: 1, cell_id: 1, resolved: 1 });

// ─── Collection: battery_packs ─────────────
// Configuration metadata for each battery pack
db.createCollection("battery_packs");

// Seed a default pack for development
db.battery_packs.insertOne({
  pack_id: "PACK_001",
  name: "LiFePO4 Dev Pack",
  cell_count: 4,
  chemistry: "LiFePO4",
  nominal_voltage: 3.2,
  max_voltage: 3.65,
  min_voltage: 2.5,
  max_temp_celsius: 60,
  max_current_amps: 20,
  created_at: new Date(),
});

print("✅ BMS Database initialized successfully.");
