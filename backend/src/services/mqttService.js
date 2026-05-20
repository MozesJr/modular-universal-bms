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
// Cache for previous cell reading (timestamp & SoC) used in Coulomb Counting
const cellStateCache = new Map();

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
// Determine specific alert types based on pack thresholds.
function getAlertTypes(metrics, packConfig) {
  const types = [];
  if (!packConfig) return types;

  const { voltage, current, temperature } = metrics;

  if (voltage > packConfig.max_voltage) types.push("overcharge");
  if (voltage < packConfig.min_voltage) types.push("over_discharge");
  if (temperature !== null && temperature > packConfig.max_temp_celsius)
    types.push("thermal_runaway");
  if (current !== null && Math.abs(current) > packConfig.max_current_amps)
    types.push("over_current");

  return types;
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
        voltage: parseFloat(payload.voltage) || 0,
        current: parseFloat(payload.current) || 0,
        temperature: parseFloat(payload.temperature) || null,
        soc: parseFloat(payload.soc) || null,
        soh: parseFloat(payload.soh) || null,
      };

      // ── Alert evaluation ───────────────────────
      const packConfig = await getPackConfig(pack_id);
      // Compute SoC using Coulomb Counting if prior state exists.
      const cacheKey = `${pack_id}:${cell_id}`;
      const now = new Date();
      let newSoc = metrics.soc;
      if (cellStateCache.has(cacheKey) && typeof metrics.current === "number") {
        const { timestamp: prevTs, soc: prevSoc } =
          cellStateCache.get(cacheKey);
        const deltaSec = (now - prevTs) / 1000;
        const { estimateSoc } = require("./bmsAlgorithm");
        const capacityAh = (packConfig && packConfig.capacity_ah) || 100;
        newSoc = estimateSoc(prevSoc, metrics.current, deltaSec, capacityAh);
      }
      // Update cache with latest SoC
      cellStateCache.set(cacheKey, { timestamp: now, soc: newSoc });
      metrics.soc = newSoc;

      const alertTypes = getAlertTypes(metrics, packConfig);

      // ── Persist to MongoDB ─────────────────────
      const reading = await CellReading.create({
        timestamp: new Date(),
        pack_id,
        cell_id,
        metrics,
        alerts: alertTypes,
        raw: payload,
      });

      // ── Emit real-time event to frontend ───────
      const event = {
        pack_id,
        cell_id,
        timestamp: reading.timestamp,
        metrics,
        alerts: alertTypes,
      };

      io.emit("cell:update", event);

      if (alertTypes && alertTypes.length) {
        io.emit("cell:alert", event);
        console.warn(
          `🚨 ALERT — Pack: ${pack_id}, Cell: ${cell_id}`,
          alertTypes,
        );
      }
    } catch (err) {
      console.error(
        "❌ MQTT message processing error:",
        err.message,
        "Topic:",
        topic,
      );
    }
  });

  client.on("error", (err) => console.error("❌ MQTT error:", err));
  client.on("reconnect", () => console.log("🔄 MQTT reconnecting..."));
  client.on("offline", () => console.warn("⚠️  MQTT client offline"));

  return client;
}

/**
 * Remove a pack from the in-memory config cache.
 * Call this whenever a pack's configuration is updated via the API
 * so the next MQTT message fetches fresh thresholds from MongoDB.
 * @param {string} packId
 */
function invalidatePackCache(packId) {
  packConfigCache.delete(packId);
}

module.exports = { initMQTT, invalidatePackCache };
