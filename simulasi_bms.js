const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  console.log("Terhubung ke MQTT Broker");

  setInterval(() => {
    for (let i = 1; i <= 4; i++) {
      const data = {
        voltage: (3.2 + Math.random() * 0.4).toFixed(3),
        current: (1.5 + Math.random()).toFixed(2),
        temperature: (25 + Math.random() * 5).toFixed(1),
        soc: (80 + Math.random() * 10).toFixed(1),
        soh: 97.0,
      };

      const topic = `bms/PACK_001/cell/${i}`;
      client.publish(topic, JSON.stringify(data));
      console.log(`Sent to ${topic}`);
    }
  }, 2000); // Kirim setiap 2000ms (2 detik)
});
