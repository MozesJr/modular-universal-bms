/**
 * services/mqttService.js — updated untuk skema BMS -> Pack -> Cell (dinamis)
 *
 * Topic pattern dari firmware ESP32:
 *   bms/{bms_id}/pack/{pack_id}/cell/{cell_id}
 *   contoh: bms/BMS_1/pack/PACK_1/cell/3
 *
 * SoC estimation: OCV-based (voltage), lihat bmsAlgorithm.js — rig belum
 * punya sensor arus jadi Coulomb counting tidak dipakai dulu.
 *
 * Imbalance tracking: tiap pesan masuk, hitung ulang delta tegangan
 * (max-min) antar SEMUA cell terakhir di pack yang sama. Kalau melebihi
 * Pack.max_imbalance_mv, alert "imbalance" dibuat SEKALI saat transisi
 * dari balanced->imbalanced (dedup pakai packImbalanceState), bukan
 * berulang tiap pesan selama masih imbalance.
 */
"use strict";
const mqtt = require("mqtt");
const CellReading = require("../models/CellReading");
const Pack = require("../models/Pack");
const AlertLog = require("../models/AlertLog");
const { estimateSocFromVoltage } = require("./bmsAlgorithm");

const packConfigCache = new Map();
const cellStateCache = new Map();
const packImbalanceState = new Map(); // pack_id -> boolean (sedang imbalanced?)

async function getPackConfig(packId) {
  if (packConfigCache.has(packId)) return packConfigCache.get(packId);
  const pack = await Pack.findOne({ pack_id: packId }).lean();
  if (pack) packConfigCache.set(packId, pack);
  return pack;
}

function getAlertTypes(metrics, state, packConfig) {
  const types = [];
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

/**
 * Hitung delta tegangan pack (max-min antar cell terakhir), pakai reading
 * TERBARU per cell_id (bukan cuma reading yang baru masuk).
 */
async function computePackImbalance(packId, packConfig) {
  const latestPerCell = await CellReading.aggregate([
    { $match: { pack_id: packId } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: "$cell_id", voltage: { $first: "$metrics.voltage" } } },
  ]);

  if (latestPerCell.length < 2) return { deltaMv: 0, isImbalanced: false };

  const voltages = latestPerCell.map((c) => c.voltage);
  const deltaMv = Math.round(
    (Math.max(...voltages) - Math.min(...voltages)) * 1000,
  );
  const threshold = (packConfig && packConfig.max_imbalance_mv) || 100;
  const isImbalanced = deltaMv > threshold;

  return { deltaMv, isImbalanced };
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
    const topic = `${topicPrefix}/+/pack/+/cell/+`;
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) console.error("❌ MQTT subscribe error:", err);
      else console.log(`📡 Subscribed: ${topic}`);
    });
  });

  client.on("message", async (topic, rawPayload) => {
    try {
      const parts = topic.split("/");
      const bms_id = parts[1];
      const pack_id = parts[3];
      const cell_id = parseInt(parts[5], 10);

      if (!bms_id || !pack_id || isNaN(cell_id)) {
        console.warn("⚠️  Malformed MQTT topic:", topic);
        return;
      }

      const payload = JSON.parse(rawPayload.toString());

      const metrics = {
        voltage: parseFloat(payload.voltage) || 0,
        current: parseFloat(payload.current) || 0,
        temperature:
          payload.temperature != null ? parseFloat(payload.temperature) : null,
        soc: payload.soc != null ? parseFloat(payload.soc) : null,
        soh: payload.soh != null ? parseFloat(payload.soh) : null,
      };

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

      const state = payload.state || "normal";

      const packConfig = await getPackConfig(pack_id);
      const cacheKey = `${pack_id}:${cell_id}`;
      const now = new Date();

      // ── SoC: OCV-based (voltage) ────────────────────────────
      if (metrics.soc == null) {
        const chemistry = (packConfig && packConfig.chemistry) || "LiFePO4";
        const minV = (packConfig && packConfig.min_voltage) ?? 2.5;
        const maxV = (packConfig && packConfig.max_voltage) ?? 3.65;
        metrics.soc = estimateSocFromVoltage(
          metrics.voltage,
          chemistry,
          minV,
          maxV,
        );
      }
      cellStateCache.set(cacheKey, { timestamp: now, soc: metrics.soc });

      const alertTypes = getAlertTypes(metrics, state, packConfig);

      // ── Persist reading ini dulu, biar ikut kehitung di query imbalance ─
      const reading = await CellReading.create({
        timestamp: now,
        pack_id,
        cell_id,
        metrics,
        pack_metrics,
        state,
        alerts: alertTypes,
        raw: { ...payload, bms_id },
      });

      // ── Imbalance tracking (pack-wide, pakai reading terbaru semua cell) ─
      const { deltaMv, isImbalanced } = await computePackImbalance(
        pack_id,
        packConfig,
      );
      const wasImbalanced = packImbalanceState.get(pack_id) || false;

      if (isImbalanced && !wasImbalanced) {
        await AlertLog.create({
          pack_id,
          cell_id: 0, // 0 = alert level pack, bukan cell tertentu
          type: "imbalance",
          timestamp: now,
        });
        console.warn(
          `🚨 ALERT — Pack ${pack_id} imbalance terdeteksi: ${deltaMv}mV (threshold ${(packConfig && packConfig.max_imbalance_mv) || 100}mV)`,
        );
      } else if (!isImbalanced && wasImbalanced) {
        console.log(
          `✅ Pack ${pack_id} kembali balanced (delta: ${deltaMv}mV)`,
        );
      }
      packImbalanceState.set(pack_id, isImbalanced);

      // ── Update Pack: state (throttle cell_id=1) + voltage_delta_mv ────
      const packUpdate = { voltage_delta_mv: deltaMv };
      if (cell_id === 1 && packConfig && packConfig.state !== state) {
        packUpdate.state = state;
      }
      await Pack.updateOne({ pack_id }, packUpdate);
      if (packUpdate.state) invalidatePackCache(pack_id);

      // ── Emit real-time ke frontend ─────────────────────────
      const event = {
        bms_id,
        pack_id,
        cell_id,
        timestamp: reading.timestamp,
        metrics,
        pack_metrics,
        state,
        alerts: alertTypes,
        pack_voltage_delta_mv: deltaMv,
        pack_imbalanced: isImbalanced,
      };
      io.emit("cell:update", event);

      if (alertTypes.length) {
        io.emit("cell:alert", event);
        console.warn(
          `🚨 ALERT — BMS: ${bms_id}, Pack: ${pack_id}, Cell: ${cell_id}`,
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
