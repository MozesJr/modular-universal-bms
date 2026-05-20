// simulasi_bms.js – Enhanced simulator with mode flags (Flat/Stable Baseline)
// Usage: node simulasi_bms.js [--mode=normal|overcharge|thermal]

const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

// Parse CLI flag
const args = process.argv.slice(2);
let mode = "normal";
args.forEach((arg) => {
  const m = arg.match(/^--mode=(.+)$/);
  if (m) mode = m[1];
});

console.log(`\x1b[33m[SIM] Mode: ${mode}\x1b[0m`);

// State awal dibuat flat/stabil (Baseline LiFePO4 sehat)
const cells = Array.from({ length: 4 }, (_, idx) => ({
  id: idx + 1,
  soc: 80.0, // SoC tertahan di 80% (tidak drop drastis)
  voltage: 3.3, // Tegangan nominal aman untuk LiFePO4
  temperature: 28.0, // Suhu ruang operasional normal
  current: 1.5, // Arus beban stabil
  soh: 97.0,
}));

function updateCell(cell) {
  // Mode Normal: Noise diperbesar agar grafik Chart.js naik-turun dengan kontras yang hidup
  if (mode === "normal") {
    // SoC fluktuatif di kisaran 78% - 82%
    cell.soc = parseFloat((80.0 + (Math.random() * 4.0 - 2.0)).toFixed(1));

    // Voltage dibuat acak di kisaran 3.200V - 3.400V (kontras visual tinggi di chart)
    cell.voltage = parseFloat((3.3 + (Math.random() * 0.2 - 0.1)).toFixed(3));

    // Suhu dibuat fluktuatif naik-turun di kisaran 27°C - 30°C
    cell.temperature = parseFloat(
      (28.5 + (Math.random() * 3.0 - 1.5)).toFixed(1),
    );

    // Arus dibuat dinamis di kisaran 1.2A - 1.8A
    cell.current = parseFloat((1.5 + (Math.random() * 0.6 - 0.3)).toFixed(2));
  } else {
    // Jika masuk mode anomali, sel lain yang sehat tetap bergejolak normal (tidak mati)
    cell.soc = parseFloat((80.0 + (Math.random() * 4.0 - 2.0)).toFixed(1));
    cell.current = parseFloat((1.5 + (Math.random() * 0.6 - 0.3)).toFixed(2));

    if (cell.id !== 1) {
      cell.voltage = parseFloat((3.3 + (Math.random() * 0.2 - 0.1)).toFixed(3));
      cell.temperature = parseFloat(
        (28.5 + (Math.random() * 3.0 - 1.5)).toFixed(1),
      );
    }
  }
}

function applyMode(cell) {
  // Pemicu skenario kritis hanya diinjeksikan pada Cell 1
  if (cell.id === 1) {
    if (mode === "overcharge") {
      // Tegangan merayap naik secara konsisten melampaui batas aman LiFePO4 (3.65V)
      cell.voltage = parseFloat(
        (cell.voltage + 0.04 + Math.random() * 0.02).toFixed(3),
      );
      // Suhu ikut naik sedikit sebagai dampak fisis dari overcharging
      cell.temperature = parseFloat((cell.temperature + 0.5).toFixed(1));
    }
    if (mode === "thermal") {
      // Kenaikan suhu eksponensial tiruan untuk memicu alarm Thermal Runaway (>55°C)
      cell.temperature = parseFloat((cell.temperature * 1.04 + 0.8).toFixed(1));
      // Tegangan drop perlahan akibat kerusakan internal struktur sel saat panas ekstrem
      cell.voltage = Math.max(
        2.0,
        parseFloat((cell.voltage - 0.02).toFixed(3)),
      );
    }
  }
}

client.on("connect", () => {
  console.log("\x1b[32m[SIM] Connected to MQTT broker\x1b[0m");

  setInterval(() => {
    cells.forEach((cell) => {
      updateCell(cell);
      applyMode(cell);

      const payload = {
        voltage: cell.voltage,
        current: cell.current,
        temperature: cell.temperature,
        soc: cell.soc,
        soh: cell.soh,
      };

      const topic = `bms/PACK_001/cell/${cell.id}`;
      client.publish(topic, JSON.stringify(payload));
      console.log(
        `\x1b[36m[SIM] Sent to ${topic}: ${JSON.stringify(payload)}\x1b[0m`,
      );
    });
  }, 2000); // Eksekusi pengiriman data setiap 2 detik
});
