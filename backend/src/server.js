/**
 * server.js — Modular Universal BMS Backend
 * Entry point: initializes Express, MongoDB, MQTT, and Socket.io
 */

"use strict";

require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initMQTT } = require("./services/mqttService");
const { initSocket } = require("./services/socketService");

const PORT = process.env.PORT || 3000;

// ─── Bootstrap ────────────────────────────────────────────
async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create HTTP server (needed for Socket.io)
    const server = http.createServer(app);

    // 3. Initialize Socket.io (real-time push to frontend)
    const io = initSocket(server);

    // 4. Initialize MQTT subscriber (data in from ESP32)
    initMQTT(io);

    server.listen(PORT, () => {
      console.log(`✅ BMS Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Bootstrap error:", err);
    process.exit(1);
  }
}

bootstrap();
