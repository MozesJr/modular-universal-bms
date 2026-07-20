/**
 * server.js — Modular Universal BMS Backend
 * Entry point: initializes Express, MongoDB, MQTT, Socket.io, dan batch aggregation
 */
"use strict";
require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initMQTT } = require("./services/mqttService");
const { initSocket } = require("./services/socketService");
const {
  scheduleBatchAggregation,
} = require("./services/batchAggregationService");

const PORT = process.env.PORT || 3000;
const BATCH_INTERVAL_MS =
  parseInt(process.env.BATCH_INTERVAL_MS) || 60 * 60 * 1000; // default 1 jam

// ─── Bootstrap ────────────────────────────────────────────
async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create HTTP server (needed for Socket.io)
    const server = http.createServer(app);

    // 3. Initialize Socket.io (real-time push to frontend)
    const io = initSocket(server);

    // 4. Initialize MQTT subscriber (data in from ESP32) -> real-time ke CellReading
    initMQTT(io);

    // 5. Jadwalkan batch aggregation -> ringkasan periodik ke CellReadingBatch
    scheduleBatchAggregation(BATCH_INTERVAL_MS);

    server.listen(PORT, () => {
      console.log(`✅ BMS Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Bootstrap error:", err);
    process.exit(1);
  }
}
bootstrap();
