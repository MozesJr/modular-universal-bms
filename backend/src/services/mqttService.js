/**
 * services/mqttService.js — updated untuk skema baru
 *
 * Perubahan dari skema lama:
 * - Payload baru mendukung field: state, pack_voltage, pack_current,
 *   pack_soc, pack_soh, pack_temp (dari bms_log)
 * - CellReading menyimpan pack_metrics jika dikirim ESP32
 * - Alert juga digenerate jika state === 'fault'
 *
 * Topic pattern: bms/{pack_id}/cell/{cell_id}
 */
"use strict";

const mqtt = require("mqtt");
const CellReading = require("../models/CellReading");
const BatteryPack = require("../models/BatteryPack");
const AlertLog = require("../models/AlertLog");

const packConfigCache = new Map();
const cellStateCache = new Map();

async function getPackConfig(packId) {
  if (packConfigCache.has(packId)) return packConfigCache.get(packId);
  const pack = await BatteryPack.findOne({ pack_id: packId }).lean();
  if (pack) packConfigCache.set(packId, pack);
  return pack;
}

function getAlertTypes(metrics, state, packConfig) {
  const types = [];

  // Alert dari state enum (cl_state / bmslog_state)
  if (state === "fault") types.push("fault");

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
    const topic = `${topicPrefix}/+/cell/+`;
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) console.error("❌ MQTT subscribe error:", err);
      else console.log(`📡 Subscribed: ${topic}`);
    });
  });

  client.on("message", async (topic, rawPayload) => {
    try {
      // Parse topic: bms/PACK_001/cell/3
      const parts = topic.split("/");
      const pack_id = parts[1];
      const cell_id = parseInt(parts[3], 10);
      if (!pack_id || isNaN(cell_id)) {
        console.warn("⚠️  Malformed MQTT topic:", topic);
        return;
      }

      const payload = JSON.parse(rawPayload.toString());

      // ── Cell-level metrics (cl_* fields) ──────────────────
      const metrics = {
        voltage: parseFloat(payload.voltage) || 0,
        current: parseFloat(payload.current) || 0,
        temperature:
          payload.temperature != null ? parseFloat(payload.temperature) : null,
        soc: payload.soc != null ? parseFloat(payload.soc) : null,
        soh: payload.soh != null ? parseFloat(payload.soh) : null,
      };

      // ── Pack-level metrics (bmslog_* fields) — opsional ───
      const pack_metrics = {
        voltage:
          payload.pack_voltage != null
            ? parseFloat(payload.pack_voltage)
            : null,
        current:
          payload.pack_current != null
            ? parseFloat(payload.pack_current)
            : null,
        temperature:
          payload.pack_temp != null ? parseFloat(payload.pack_temp) : null,
        soc: payload.pack_soc != null ? parseFloat(payload.pack_soc) : null,
        soh: payload.pack_soh != null ? parseFloat(payload.pack_soh) : null,
      };

      // ── State (cl_state enum) ──────────────────────────────
      const state = payload.state || "normal";

      // ── SoC via Coulomb Counting jika tidak dikirim ────────
      const packConfig = await getPackConfig(pack_id);
      const cacheKey = `${pack_id}:${cell_id}`;
      const now = new Date();

      if (
        metrics.soc == null &&
        cellStateCache.has(cacheKey) &&
        typeof metrics.current === "number"
      ) {
        const { timestamp: prevTs, soc: prevSoc } =
          cellStateCache.get(cacheKey);
        const deltaSec = (now - prevTs) / 1000;
        const { estimateSoc } = require("./bmsAlgorithm");
        const capacityAh = (packConfig && packConfig.capacity_ah) || 100;
        metrics.soc = estimateSoc(
          prevSoc,
          metrics.current,
          deltaSec,
          capacityAh,
        );
      }
      cellStateCache.set(cacheKey, { timestamp: now, soc: metrics.soc });

      // ── Alert evaluation ───────────────────────────────────
      const alertTypes = getAlertTypes(metrics, state, packConfig);

      // ── Persist to MongoDB ─────────────────────────────────
      const reading = await CellReading.create({
        timestamp: now,
        pack_id,
        cell_id,
        metrics,
        pack_metrics,
        state,
        alerts: alertTypes,
        raw: payload,
      });

      // ── Update BatteryPack state ───────────────────────────
      // Update state pack jika berubah (throttle: hanya dari cell_id=1)
      if (cell_id === 1 && packConfig && packConfig.state !== state) {
        await BatteryPack.updateOne({ pack_id }, { state });
        invalidatePackCache(pack_id);
      }

      // ── Emit real-time ke frontend ─────────────────────────
      const event = {
        pack_id,
        cell_id,
        timestamp: reading.timestamp,
        metrics,
        pack_metrics,
        state,
        alerts: alertTypes,
      };
      io.emit("cell:update", event);

      if (alertTypes.length) {
        io.emit("cell:alert", event);
        console.warn(
          `🚨 ALERT — Pack: ${pack_id}, Cell: ${cell_id}`,
          alertTypes,
        );
        for (const type of alertTypes) {
          await AlertLog.create({
            pack_id,
            cell_id,
            type,
            timestamp: reading.timestamp,
          });
        }
      }
    } catch (err) {
      console.error("❌ MQTT message error:", err.message, "Topic:", topic);
    }
  });

  client.on("error", (err) => console.error("❌ MQTT error:", err));
  client.on("reconnect", () => console.log("🔄 MQTT reconnecting..."));
  client.on("offline", () => console.warn("⚠️  MQTT client offline"));

  return client;
}

function invalidatePackCache(packId) {
  packConfigCache.delete(packId);
}

module.exports = { initMQTT, invalidatePackCache };
