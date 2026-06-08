// simulasi_bms.js — Multi-pack simulator (5 packs, skema baru)
// Usage: node simulasi_bms.js [--mode=normal|overcharge|thermal]

const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

const args = process.argv.slice(2);
let mode = "normal";
args.forEach((arg) => {
  const m = arg.match(/^--mode=(.+)$/);
  if (m) mode = m[1];
});

console.log(`\x1b[33m[SIM] Mode: ${mode} | Packs: 5\x1b[0m`);

// ── Konfigurasi 5 pack dengan karakteristik berbeda ──────────
const PACKS = [
  {
    id: "PACK_001",
    name: "LiFePO4 Dev Pack",
    baseVoltage: 3.3,
    baseTemp: 28.0,
    baseSoc: 80,
    baseSoh: 97,
    baseCurrent: 1.5,
    chemistry: "LiFePO4",
  },
  {
    id: "PACK_002",
    name: "Li-ion Bank A",
    baseVoltage: 3.75,
    baseTemp: 31.0,
    baseSoc: 72,
    baseSoh: 94,
    baseCurrent: 2.1,
    chemistry: "Li-ion 18650",
  },
  {
    id: "PACK_003",
    name: "Solar Storage Pack",
    baseVoltage: 3.28,
    baseTemp: 35.0,
    baseSoc: 91,
    baseSoh: 99,
    baseCurrent: 0.8,
    chemistry: "LiFePO4",
  },
  {
    id: "PACK_004",
    name: "EV Prototype Pack",
    baseVoltage: 3.85,
    baseTemp: 38.0,
    baseSoc: 65,
    baseSoh: 89,
    baseCurrent: 3.2,
    chemistry: "NMC",
  },
  {
    id: "PACK_005",
    name: "Backup Power Unit",
    baseVoltage: 3.22,
    baseTemp: 26.0,
    baseSoc: 55,
    baseSoh: 92,
    baseCurrent: 1.2,
    chemistry: "LiFePO4",
  },
];

// ── Inisialisasi state sel untuk setiap pack ─────────────────
const packStates = PACKS.map((pack) => ({
  ...pack,
  cells: Array.from({ length: 4 }, (_, idx) => ({
    id: idx + 1,
    voltage: pack.baseVoltage + (Math.random() * 0.02 - 0.01),
    temperature: pack.baseTemp + (Math.random() * 2.0 - 1.0),
    soc: pack.baseSoc + (Math.random() * 4.0 - 2.0),
    soh: pack.baseSoh,
    current: pack.baseCurrent + (Math.random() * 0.4 - 0.2),
  })),
}));

// ── Helpers ──────────────────────────────────────────────────
function rnd(val, range, decimals) {
  return parseFloat(
    (val + (Math.random() * range * 2 - range)).toFixed(decimals),
  );
}

function getBmsState(cells, pack) {
  if (
    cells.some((c) => c.voltage > (pack.chemistry === "LiFePO4" ? 3.65 : 4.2))
  )
    return "fault";
  if (cells.some((c) => c.temperature > 55)) return "fault";
  if (cells.some((c) => c.voltage < (pack.chemistry === "LiFePO4" ? 2.5 : 3.0)))
    return "fault";
  return "discharging";
}

function updateCell(cell, pack) {
  cell.voltage = rnd(pack.baseVoltage, 0.06, 3);
  cell.temperature = rnd(pack.baseTemp, 1.5, 1);
  cell.soc = rnd(pack.baseSoc, 3.0, 1);
  cell.current = rnd(pack.baseCurrent, 0.3, 2);
  // Pastikan dalam batas wajar
  cell.soc = Math.max(0, Math.min(100, cell.soc));
  cell.voltage = Math.max(2.0, cell.voltage);
}

function applyMode(cell, pack) {
  // Anomali hanya pada PACK_001 Cell 1
  if (pack.id !== "PACK_001" || cell.id !== 1) return;
  if (mode === "overcharge") {
    cell.voltage = parseFloat(
      (cell.voltage + 0.04 + Math.random() * 0.02).toFixed(3),
    );
    cell.temperature = parseFloat((cell.temperature + 0.5).toFixed(1));
  }
  if (mode === "thermal") {
    cell.temperature = parseFloat((cell.temperature * 1.04 + 0.8).toFixed(1));
    cell.voltage = Math.max(2.0, parseFloat((cell.voltage - 0.02).toFixed(3)));
  }
}

// ── Warna per pack untuk logging ─────────────────────────────
const COLORS = ["\x1b[36m", "\x1b[35m", "\x1b[32m", "\x1b[33m", "\x1b[34m"];

client.on("connect", () => {
  console.log("\x1b[32m[SIM] Connected to MQTT broker\x1b[0m\n");

  setInterval(() => {
    packStates.forEach((pack, pIdx) => {
      // Update semua sel
      pack.cells.forEach((cell) => {
        updateCell(cell, pack);
        applyMode(cell, pack);
      });

      // Hitung pack-level metrics
      const packVoltage = parseFloat(
        pack.cells.reduce((s, c) => s + c.voltage, 0).toFixed(3),
      );
      const packCurrent = parseFloat(
        (
          pack.cells.reduce((s, c) => s + c.current, 0) / pack.cells.length
        ).toFixed(2),
      );
      const packTemp = parseFloat(
        Math.max(...pack.cells.map((c) => c.temperature)).toFixed(1),
      );
      const packSoc = parseFloat(
        (pack.cells.reduce((s, c) => s + c.soc, 0) / pack.cells.length).toFixed(
          1,
        ),
      );
      const packSoh = parseFloat(
        (pack.cells.reduce((s, c) => s + c.soh, 0) / pack.cells.length).toFixed(
          1,
        ),
      );
      const bmsState = getBmsState(pack.cells, pack);

      const color = COLORS[pIdx % COLORS.length];

      // Kirim tiap sel
      pack.cells.forEach((cell) => {
        const payload = {
          voltage: cell.voltage,
          current: cell.current,
          temperature: cell.temperature,
          soc: cell.soc,
          soh: cell.soh,
          state: bmsState,
          pack_voltage: packVoltage,
          pack_current: packCurrent,
          pack_temp: packTemp,
          pack_soc: packSoc,
          pack_soh: packSoh,
        };

        const topic = `bms/${pack.id}/cell/${cell.id}`;
        client.publish(topic, JSON.stringify(payload));
        console.log(
          `${color}[${pack.id}] cell/${cell.id} V:${cell.voltage} T:${cell.temperature}°C SoC:${cell.soc}% state:${bmsState}\x1b[0m`,
        );
      });

      console.log(
        `\x1b[90m[${pack.id}] ${pack.name} | Total:${packVoltage}V SoC:${packSoc}% Temp:${packTemp}°C\x1b[0m`,
      );
    });

    console.log("\x1b[90m─────────────────────────────────────────────\x1b[0m");
  }, 2000);
});

client.on("error", (err) => {
  console.error("\x1b[31m[SIM] MQTT error:", err.message, "\x1b[0m");
});
