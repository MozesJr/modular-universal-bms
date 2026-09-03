/*
  ESP32 + LoRa Ra-02 (SX1278) — Gateway sederhana (versi PlatformIO)
  Fungsi: terima paket LoRa dari node (format "topic|payload_json"),
  lalu forward APA ADANYA ke topic MQTT yang sama persis seperti yang
  dituju node -- jadi backend nerima data dengan struktur identik
  seolah-olah node itu connect WiFi/MQTT langsung. Backend TIDAK perlu
  diubah sama sekali.

  Bukan gateway LoRaWAN -- ini cuma relay data mentah (LoRa <-> MQTT).

  Wiring (breadboard: kaki kiri ESP32 kolom A, kaki kanan kolom H):
    LoRa VCC  -> 3V3   (JANGAN ke VIN/5V, Ra-02 cuma tahan 3.3V)
    LoRa GND  -> GND
    LoRa SCK  -> GPIO 18
    LoRa MISO -> GPIO 19
    LoRa MOSI -> GPIO 23
    LoRa NSS  -> GPIO 5
    LoRa RST  -> GPIO 2
    LoRa DIO0 -> GPIO 4

  FORMAT PESAN LORA YANG DIHARAPKAN DARI NODE (penting, lihat catatan
  di bawah file ini soal firmware sisi node):
    "bms/BMS_1/pack/PACK_1/cell/3|{\"voltage\":3.16,\"temperature\":26.1,\"pack_temp\":26.1,\"state\":\"discharging\"}"
  Dipisah dengan karakter '|' -- bagian kiri jadi topic MQTT tujuan,
  bagian kanan (JSON) di-publish apa adanya ke topic itu.
*/

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <PubSubClient.h>

// ==== KONFIGURASI JARINGAN & BROKER (samakan dengan node WiFi/MQTT langsung) ====
const char* WIFI_SSID     = "punyaSiapa";
const char* WIFI_PASSWORD = "113333555555";

const char* MQTT_HOST      = "148.230.97.68";
const int   MQTT_PORT      = 1885;
// PENTING: client ID harus BEDA dari node ESP32 lain yang connect ke broker
// yang sama (mis. "esp32-bms1-pack1-voltage") -- broker MQTT akan nendang
// koneksi lama kalau ada 2 client konek pakai ID yang identik.
const char* MQTT_CLIENT_ID = "esp32-lora-gateway-bms1";

// ==== KONFIGURASI PIN LoRa ====
#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS    5
#define LORA_RST   16
#define LORA_DIO0  4
#define LORA_FREQUENCY 433E6

WiFiClient espClient;
PubSubClient mqttClient(espClient);

void connectWiFi() {
  Serial.print("Menyambungkan ke WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi tersambung, IP: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Menyambungkan ke MQTT broker...");
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println(" berhasil.");
    } else {
      Serial.print(" gagal, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" - coba lagi dalam 3 detik");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  connectWiFi();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("Gagal inisialisasi modul LoRa! Cek wiring.");
    while (1) delay(1000);
  }
  Serial.println("LoRa gateway siap, menunggu paket...");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String raw = "";
    while (LoRa.available()) {
      raw += (char)LoRa.read();
    }
    int rssi = LoRa.packetRssi();
    float snr = LoRa.packetSnr();

    // Pisah "topic|payload_json"
    int sep = raw.indexOf('|');
    if (sep == -1) {
      Serial.print("Paket LoRa TIDAK sesuai format (tidak ada '|'), diabaikan: ");
      Serial.println(raw);
      return;
    }

    String topic = raw.substring(0, sep);
    String payload = raw.substring(sep + 1);

    Serial.printf("Paket diterima | RSSI:%d SNR:%.2f | topic=%s | payload=%s\n",
                   rssi, snr, topic.c_str(), payload.c_str());

    // Forward APA ADANYA ke topic yang sama persis seperti yang dituju node.
    // Backend tidak perlu tahu ini datang lewat LoRa atau WiFi langsung.
    bool ok = mqttClient.publish(topic.c_str(), payload.c_str());
    if (!ok) {
      Serial.println("  -> publish MQTT GAGAL (cek ukuran payload / koneksi broker)");
    }
  }
}