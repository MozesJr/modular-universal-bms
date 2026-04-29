/**
 * services/mqttService.js
 *
 * Subscribes to Mosquitto broker and:
 *  1. Parses JSON payload from ESP32
 *  2. Validates & checks alert thresholds
 *  3. Persists data to MongoDB
 *  4. Emits real-time update via Socket.io
 *
 * Topic pattern: bms/{pack_id}/cell/{cell_id}
 * Example:       bms/PACK_001/cell/1
 */

"use strict";

const mqtt = require("mqtt");
const CellReading = require("../models/CellReading");
const BatteryPack = require("../models/BatteryPack");

// In-memory cache of pack configurations to avoid repeated DB lookups
const packConfigCache = new Map();

/**
 * Fetch (and cache) battery pack config for threshold checking.
 */
async function getPackConfig(packId) {
  if (packConfigCache.has(packId)) return packConfigCache.get(packId);

  const pack = await BatteryPack.findOne({ pack_id: packId }).lean();
  if (pack) packConfigCache.set(packId, pack);
  return pack;
}

/**
 * Evaluate whether any metric breaches safety thresholds.
 * Returns true if an alert should be raised.
 */
function evaluateAlerts(metrics, packConfig) {
  if (!packConfig) return false;

  const { voltage, current, temperature } = metrics;

  if (voltage > packConfig.max_voltage) return true;
  if (voltage < packConfig.min_voltage) return true;
  if (temperature !== null && temperature > packConfig.max_temp_celsius) return true;
  if (current !== null && Math.abs(current) > packConfig.max_current_amps) return true;

  return false;
}

/**
 * Initialize MQTT client and subscribe to all cell topics.
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
function initMQTT(io) {
  const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://mosquitto:1883";
  const topicPrefix = process.env.MQTT_TOPIC_PREFIX || "bms";

  const client = mqtt.connect(brokerUrl, {
    clientId: `bms_backend_${Date.now()}`,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  });

  client.on("connect", () => {
    console.log(`✅ MQTT connected to ${brokerUrl}`);

    // Subscribe to all cell topics for all packs
    const topic = `${topicPrefix}/+/cell/+`;
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) console.error("❌ MQTT subscribe error:", err);
      else console.log(`📡 Subscribed to MQTT topic: ${topic}`);
    });
  });

  client.on("message", async (topic, rawPayload) => {
    try {
      // ── Parse topic ────────────────────────────
      // e.g. "bms/PACK_001/cell/3"
      const parts = topic.split("/");
      const pack_id = parts[1];
      const cell_id = parseInt(parts[3], 10);

      if (!pack_id || isNaN(cell_id)) {
        console.warn("⚠️  Malformed MQTT topic:", topic);
        return;
      }

      // ── Parse payload ──────────────────────────
      const payload = JSON.parse(rawPayload.toString());
      const metrics = {
        voltage:     parseFloat(payload.voltage)     || 0,
        current:     parseFloat(payload.current)     || 0,
        temperature: parseFloat(payload.temperature) || null,
        soc:         parseFloat(payload.soc)         || null,
        soh:         parseFloat(payload.soh)         || null,
      };

      // ── Alert evaluation ───────────────────────
      const packConfig = await getPackConfig(pack_id);
      const alerts = evaluateAlerts(metrics, packConfig);

      // ── Persist to MongoDB ─────────────────────
      const reading = await CellReading.create({
        timestamp: new Date(),
        pack_id,
        cell_id,
        metrics,
        alerts,
        raw: payload,
      });

      // ── Emit real-time event to frontend ───────
      const event = {
        pack_id,
        cell_id,
        timestamp: reading.timestamp,
        metrics,
        alerts,
      };

      io.emit("cell:update", event);

      if (alerts) {
        io.emit("cell:alert", event);
        console.warn(`🚨 ALERT — Pack: ${pack_id}, Cell: ${cell_id}`, metrics);
      }
    } catch (err) {
      console.error("❌ MQTT message processing error:", err.message, "Topic:", topic);
    }
  });

  client.on("error", (err) => console.error("❌ MQTT error:", err));
  client.on("reconnect", () => console.log("🔄 MQTT reconnecting..."));
  client.on("offline", () => console.warn("⚠️  MQTT client offline"));

  return client;
}

module.exports = { initMQTT };
