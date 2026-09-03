#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <SPI.h>
#include <LoRa.h>
#include <SD.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ==================== MODE KOMUNIKASI (OTOMATIS) ====================
// Tidak lagi hardcoded. Sistem akan mencoba WiFi dulu sebagai mode utama.
// Kalau WiFi gagal konek / putus terlalu lama, otomatis fallback ke LoRa.
// Kalau sedang di LoRa, sistem tetap mencoba reconnect WiFi secara berkala
// di background, dan otomatis kembali ke WiFi kalau berhasil.
enum CommMode { MODE_WIFI, MODE_LORA };
CommMode currentMode = MODE_WIFI; // preferensi awal: WiFi

bool loraAvailable = false;         // true kalau modul LoRa berhasil di-init
unsigned long wifiDownSince = 0;    // kapan WiFi mulai terputus
const unsigned long WIFI_FALLBACK_GRACE_MS = 8000;   // toleransi sebelum fallback ke LoRa
unsigned long lastWifiRetryAttempt = 0;
const unsigned long WIFI_RETRY_INTERVAL_MS = 20000;  // seberapa sering coba balik ke WiFi saat di mode LoRa

const char* modeLabel(CommMode m) {
    return m == MODE_LORA ? "LoRa" : "WiFi";
}

// Retry berkala untuk hardware yang gagal terdeteksi saat boot (SD card & LoRa).
// Tanpa ini, kalau gagal sekali di setup(), device nggak akan pernah coba lagi
// sampai di-restart manual -- padahal masalahnya bisa cuma telat settle pas nyala.
unsigned long lastSDRetry = 0;
const unsigned long SD_RETRY_INTERVAL_MS = 10000;

unsigned long lastLoRaRetry = 0;
const unsigned long LORA_RETRY_INTERVAL_MS = 10000;

// ==================== KONFIGURASI SD CARD (hybrid local storage) ====================
#define SD_CS 13
#define BUFFER_FILE "/buffer.log"
bool sdReady = false;

void initSDCard() {
    if (!SD.begin(SD_CS)) {
        Serial.println("PERINGATAN: SD card tidak terdeteksi -- hybrid storage nonaktif, jalan tanpa buffer.");
        sdReady = false;
        return;
    }
    uint8_t cardType = SD.cardType();
    if (cardType == CARD_NONE) {
        Serial.println("PERINGATAN: Tidak ada SD card terpasang.");
        sdReady = false;
        return;
    }
    uint64_t cardSizeMB = SD.cardSize() / (1024 * 1024);
    Serial.printf("SD card terdeteksi, ukuran: %lluMB\n", cardSizeMB);
    sdReady = true;
}

void bufferToSD(const char* topic, const char* payload) {
    if (!sdReady) return;
    File f = SD.open(BUFFER_FILE, FILE_APPEND);
    if (!f) {
        Serial.println("GAGAL buka file buffer SD buat nulis.");
        return;
    }
    f.print(topic);
    f.print("|");
    f.println(payload);
    f.close();
    Serial.printf("  -> disimpan ke buffer SD (koneksi belum pulih): %s\n", topic);
}

bool hasBufferedData() {
    if (!sdReady) return false;
    if (!SD.exists(BUFFER_FILE)) return false;
    File f = SD.open(BUFFER_FILE, FILE_READ);
    if (!f) return false;
    bool hasData = f.size() > 0;
    f.close();
    return hasData;
}

void flushBufferToMQTT(PubSubClient& client) {
    if (!sdReady || !hasBufferedData()) return;

    File f = SD.open(BUFFER_FILE, FILE_READ);
    if (!f) return;

    Serial.println("=== Mengirim ulang data dari buffer SD ===");
    String remaining = "";
    int sentCount = 0;
    int failCount = 0;

    while (f.available()) {
        String line = f.readStringUntil('\n');
        line.trim();
        if (line.length() == 0) continue;

        int sep = line.indexOf('|');
        if (sep == -1) continue;

        String topic = line.substring(0, sep);
        String payload = line.substring(sep + 1);

        if (failCount == 0 && client.publish(topic.c_str(), payload.c_str())) {
            sentCount++;
        } else {
            failCount++;
            remaining += line + "\n";
        }
    }
    f.close();

    if (remaining.length() == 0) {
        SD.remove(BUFFER_FILE);
        Serial.printf("=== Selesai: %d data terkirim, buffer dikosongkan ===\n", sentCount);
    } else {
        File fw = SD.open(BUFFER_FILE, FILE_WRITE);
        if (fw) {
            fw.print(remaining);
            fw.close();
        }
        Serial.printf("=== %d data terkirim, %d masih tertunda (dicoba lagi nanti) ===\n", sentCount, failCount);
    }
}

// ==================== KONFIGURASI SENSOR SUHU ====================
#define ONE_WIRE_BUS 17
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);
#define TEMP_ERROR_CODE -127.0

float temp1C = 0;
float temp2C = 0;
int deviceCount = 0;

// 4 cell dibagi 2:2 ke 2 sensor suhu (cell 1-2 -> sensor 0, cell 3-4 -> sensor 1)
const int cellTempIndex[] = {0, 0, 1, 1};

// ==================== KONFIGURASI WIFI & MQTT ====================
const char* WIFI_SSID     = "403 Forbidden";
const char* WIFI_PASSWORD = "nanonano123";

const char* MQTT_HOST      = "72.61.208.150";
const int   MQTT_PORT      = 1885;
const char* MQTT_CLIENT_ID = "esp32-bms1-pack1-voltage";

const char* BMS_ID  = "BMS_1";
const char* PACK_ID = "PACK_1";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ==================== KONFIGURASI LoRa ====================
#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS    5
#define LORA_RST   4
#define LORA_DIO0  26
#define LORA_FREQUENCY 433E6

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 2000;
const int LORA_INTER_PACKET_DELAY_MS = 150;

// ==================== KONFIGURASI PIN ADC (VOLTAGE DIVIDER) - 4 CELL ====================
const int CELL_PINS[] = {36, 39, 34, 35};
const int NUM_CELLS = sizeof(CELL_PINS) / sizeof(CELL_PINS[0]);

// Rasio divider teoritis per titik pengukuran kumulatif (node 1..4 dari stack).
// Ini titik awal berdasar desain resistor divider kamu.
const float DIVIDER_RATIOS[] = {
    3.695,  // Cell 1 (GPIO36)
    3.659,  // Cell 2 (GPIO39)
    3.698,  // Cell 3 (GPIO34)
    3.695   // Cell 4 (GPIO35)
};

// ---- KALIBRASI PER CELL ----
// Rasio divider di atas itu nilai teoritis/awal. Karena toleransi resistor,
// biasanya hasil pembacaan masih meleset sedikit dari multimeter.
// CALIBRATION_FACTOR adalah faktor koreksi terakhir: factor = V_multimeter / V_hasil_firmware
//
// CARA KALIBRASI:
//   1. Upload firmware ini dulu dengan semua factor = 1.0 (kondisi default di bawah).
//   2. Buka Serial Monitor, catat tegangan tiap cell yang tercetak (V_raw).
//   3. Ukur tegangan tiap cell SATU PER SATU langsung dengan multimeter
//      (colok langsung ke terminal + dan - fisik cell tsb, bukan tegangan total pack).
//   4. Hitung factor per cell = V_multimeter / V_raw
//      Misal: V_raw Cell1 = 3.05V, multimeter menunjukkan 2.95V
//             -> factor Cell1 = 2.95 / 3.05 = 0.967
//   5. Masukkan hasilnya ke array CALIBRATION_FACTOR di bawah, lalu upload ulang.
//   6. Ulangi sekali lagi untuk verifikasi -- biasanya cukup 1-2 iterasi.
const float CALIBRATION_FACTOR[] = {
    1.0,  // Cell 1 -- ganti setelah kalibrasi
    1.0,  // Cell 2 -- ganti setelah kalibrasi
    1.0,  // Cell 3 -- ganti setelah kalibrasi
    1.0   // Cell 4 -- ganti setelah kalibrasi
};

const int SAMPLES = 32;
const int SAMPLE_DELAY_US = 200;

float cumulativeVoltage[16];
float cellVoltage[16];

float readDividedVoltage(int pin, float ratio) {
    uint32_t total = 0;
    for (int i = 0; i < SAMPLES; i++) {
        total += analogReadMilliVolts(pin);
        delayMicroseconds(SAMPLE_DELAY_US);
    }
    float mv = total / (float)SAMPLES;
    return (mv / 1000.0) * ratio;
}

void readAllCellVoltages() {
    float previous = 0.0;
    for (int i = 0; i < NUM_CELLS; i++) {
        cumulativeVoltage[i] = readDividedVoltage(CELL_PINS[i], DIVIDER_RATIOS[i]);
        float newCellVoltage = cumulativeVoltage[i] - previous;

        // Validasi kewajaran: satu sel LiFePO4 realistisnya 0V (habis total)
        // s/d ~4.2V (margin aman di atas 3.65V). Di luar itu -> kemungkinan
        // besar wiring/kontak longgar (pin floating), BUKAN data asli.
        // Pertahankan nilai valid terakhir daripada kirim sampah ke dashboard.
        if (newCellVoltage >= -0.05 && newCellVoltage <= 4.2) {
            // Terapkan faktor kalibrasi supaya cocok dengan hasil multimeter
            cellVoltage[i] = newCellVoltage * CALIBRATION_FACTOR[i];
        } else {
            Serial.printf("PERINGATAN: Cell %d reading %.3fV di luar rentang wajar -- dipertahankan nilai lama %.3fV. Cek wiring!\n",
                          i + 1, newCellVoltage, cellVoltage[i]);
        }
        previous = cumulativeVoltage[i];
    }
}

float estimateSocSimple(float voltage) {
    const float minV = 2.5;
    const float maxV = 3.65;
    float pct = (voltage - minV) / (maxV - minV) * 100.0;
    if (pct > 100) pct = 100;
    if (pct < 0) pct = 0;
    return pct;
}

void printDeviceAddress(int index) {
    DeviceAddress addr;
    if (tempSensors.getAddress(addr, index)) {
        Serial.printf("  Sensor %d address: ", index);
        for (uint8_t i = 0; i < 8; i++) {
            if (addr[i] < 16) Serial.print("0");
            Serial.print(addr[i], HEX);
        }
        Serial.println();
    } else {
        Serial.printf("  Sensor %d: gagal ambil address (device tidak stabil)\n", index);
    }
}

void readTemperatures() {
    tempSensors.requestTemperatures();
    float t1 = tempSensors.getTempCByIndex(0);
    float t2 = tempSensors.getTempCByIndex(1);
    if (t1 != TEMP_ERROR_CODE) {
        temp1C = t1;
    } else {
        Serial.println("PERINGATAN: Sensor 1 gagal baca (-127) - cek wiring/pull-up!");
    }
    if (t2 != TEMP_ERROR_CODE) {
        temp2C = t2;
    } else {
        Serial.println("PERINGATAN: Sensor 2 gagal baca (-127) - cek wiring/pull-up!");
    }
}

float tempForCell(int cellIndex) {
    return cellTempIndex[cellIndex] == 0 ? temp1C : temp2C;
}

// ==================== WIFI & MQTT ====================
bool connectMQTT() {
    if (mqttClient.connected()) return true;
    Serial.print("Connecting to MQTT broker...");
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
        Serial.println(" connected!");
        flushBufferToMQTT(mqttClient);
        return true;
    } else {
        Serial.printf(" failed, rc=%d\n", mqttClient.state());
        return false;
    }
}

// Coba konek WiFi dengan timeout. Dipakai baik saat boot maupun saat retry
// berkala ketika sedang berada di mode LoRa.
bool attemptWiFiConnect(unsigned long timeoutMs) {
    Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
        delay(300);
        Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected, IP: " + WiFi.localIP().toString());
        mqttClient.setServer(MQTT_HOST, MQTT_PORT);
        connectMQTT();
        return true;
    }
    Serial.println("\nWiFi belum konek.");
    return false;
}

// Dipanggil terus-menerus di loop() untuk menjaga mode komunikasi tetap
// optimal: pakai WiFi kalau bisa, otomatis pindah ke LoRa kalau tidak bisa,
// dan otomatis balik ke WiFi begitu sinyalnya ada lagi.
void manageCommMode() {
    unsigned long now = millis();

    if (currentMode == MODE_WIFI) {
        if (WiFi.status() == WL_CONNECTED) {
            wifiDownSince = 0; // reset penanda putus
            if (!mqttClient.connected()) connectMQTT();
            mqttClient.loop();
        } else {
            if (wifiDownSince == 0) wifiDownSince = now;

            // beri toleransi sebentar sebelum benar-benar fallback,
            // supaya tidak lompat-lompat mode saat WiFi cuma sekejap putus
            if (now - wifiDownSince > WIFI_FALLBACK_GRACE_MS) {
                if (loraAvailable) {
                    Serial.println("=== WiFi tidak tersedia > grace period, FALLBACK ke LoRa ===");
                    currentMode = MODE_LORA;
                    lastWifiRetryAttempt = now;
                } else {
                    // tidak ada LoRa sebagai cadangan, tetap coba WiFi lagi
                    WiFi.disconnect();
                    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
                    wifiDownSince = now;
                }
            }
        }
    } else { // currentMode == MODE_LORA
        // Sambil kirim data lewat LoRa, coba diam-diam reconnect WiFi
        // secara berkala. Kalau berhasil, pindah balik ke WiFi.
        if (now - lastWifiRetryAttempt > WIFI_RETRY_INTERVAL_MS) {
            lastWifiRetryAttempt = now;
            Serial.println("=== Mencoba reconnect WiFi di background... ===");
            if (attemptWiFiConnect(4000)) {
                Serial.println("=== WiFi kembali tersedia, BALIK ke mode WiFi ===");
                currentMode = MODE_WIFI;
                wifiDownSince = 0;
            } else {
                WiFi.disconnect(true); // hemat daya, lanjut full di LoRa
            }
        }
    }
}

// Dipanggil terus di loop() untuk retry deteksi SD card & LoRa secara berkala
// kalau sebelumnya gagal (misal belum settle saat boot, kontak kurang pas, dst).
// Begitu terdeteksi, status langsung dipakai (SD siap dipakai buffer, LoRa siap
// jadi fallback) tanpa perlu restart device.
void manageHardwareDetection() {
    unsigned long now = millis();

    if (!sdReady && now - lastSDRetry > SD_RETRY_INTERVAL_MS) {
        lastSDRetry = now;
        Serial.println("=== Retry deteksi SD card... ===");
        initSDCard();
        if (sdReady) Serial.println("=== SD card berhasil terdeteksi ===");
    }

    if (!loraAvailable && now - lastLoRaRetry > LORA_RETRY_INTERVAL_MS) {
        lastLoRaRetry = now;
        Serial.println("=== Retry deteksi modul LoRa... ===");
        LoRa.end(); // bersihkan state lama sebelum coba lagi
        LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
        if (LoRa.begin(LORA_FREQUENCY)) {
            loraAvailable = true;
            Serial.println("=== Modul LoRa berhasil terdeteksi ===");
        } else {
            Serial.println("=== LoRa masih belum terdeteksi -- cek wiring/power modul ===");
        }
    }
}

const char* determineState(float voltage, float temperature) {
    if (temperature > 55.0) return "fault";
    if (voltage < 2.5) return "undervoltage";
    if (voltage > 3.65) return "overvoltage";
    return "discharging";
}

void sendCellData(const char* topic, const char* payload) {
    if (currentMode == MODE_LORA) {
        if (!loraAvailable) {
            // LoRa tidak tersedia sama sekali -> simpan ke buffer SD saja
            bufferToSD(topic, payload);
            return;
        }
        LoRa.beginPacket();
        LoRa.print(topic);
        LoRa.print("|");
        LoRa.print(payload);
        LoRa.endPacket();
        return;
    }

    if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) {
        bool ok = mqttClient.publish(topic, payload);
        if (!ok) {
            Serial.println("  -> publish MQTT gagal walau connected, simpan ke buffer SD.");
            bufferToSD(topic, payload);
        }
    } else {
        bufferToSD(topic, payload);
    }
}

void publishCell(int cellId, float voltage, float temperature, float packTempMax) {
    const char* state = determineState(voltage, temperature);
    JsonDocument doc;
    doc["voltage"] = round(voltage * 1000) / 1000.0;
    doc["temperature"] = round(temperature * 10) / 10.0;
    doc["pack_temp"] = round(packTempMax * 10) / 10.0;
    doc["state"] = state;
    doc["channel"] = modeLabel(currentMode);

    char payload[160];
    serializeJson(doc, payload);

    char topic[80];
    snprintf(topic, sizeof(topic), "bms/%s/pack/%s/cell/%d", BMS_ID, PACK_ID, cellId);

    sendCellData(topic, payload);
    Serial.printf("[%s via %s] V:%.3f T:%.1f state:%s -> %s\n",
                  topic, modeLabel(currentMode), voltage, temperature, state, payload);
}

void setup() {
    Serial.begin(115200);

    analogReadResolution(12);
    for (int i = 0; i < NUM_CELLS; i++) {
        analogSetPinAttenuation(CELL_PINS[i], ADC_11db);
    }
    Serial.printf("Battery Monitor %dS - mode komunikasi otomatis (WiFi utama, LoRa cadangan)\n", NUM_CELLS);

    tempSensors.begin();
    deviceCount = tempSensors.getDeviceCount();
    Serial.printf("=== OneWire bus (GPIO%d): %d device terdeteksi ===\n", ONE_WIRE_BUS, deviceCount);
    if (deviceCount < 2) {
        Serial.println("PERINGATAN: seharusnya 2 sensor, tapi yang kedeteksi kurang dari itu!");
    }
    for (int i = 0; i < deviceCount; i++) {
        printDeviceAddress(i);
    }
    readTemperatures();

    if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println(F("SSD1306 allocation failed"));
        while (true);
    }
    oled.clearDisplay();
    oled.display();

    SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
    initSDCard();

    // LoRa SELALU diinisialisasi di awal supaya siap jadi jalur cadangan
    // kapan saja, tanpa perlu reboot device.
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
    if (!LoRa.begin(LORA_FREQUENCY)) {
        Serial.println("PERINGATAN: Modul LoRa gagal init! Fallback LoRa TIDAK akan tersedia -- cek wiring modul LoRa.");
        loraAvailable = false;
    } else {
        loraAvailable = true;
        Serial.println("LoRa siap sebagai jalur komunikasi cadangan.");
    }

    // Coba WiFi dulu sebagai mode utama. Kalau gagal, langsung fallback ke LoRa.
    if (attemptWiFiConnect(15000)) {
        currentMode = MODE_WIFI;
    } else if (loraAvailable) {
        Serial.println("=== WiFi gagal saat boot, langsung mulai di mode LoRa ===");
        currentMode = MODE_LORA;
        lastWifiRetryAttempt = millis();
    } else {
        Serial.println("=== WiFi gagal dan LoRa tidak tersedia -- data akan dibuffer ke SD sampai salah satu jalur siap ===");
        currentMode = MODE_WIFI; // tetap set WiFi, manageCommMode() akan terus retry
        wifiDownSince = millis();
    }
}

void loop() {
    manageCommMode();
    manageHardwareDetection();

    readAllCellVoltages();
    readTemperatures();
    float packTempMax = max(temp1C, temp2C);

    float socSum = 0;
    for (int i = 0; i < NUM_CELLS; i++) socSum += estimateSocSimple(cellVoltage[i]);
    float socAvg = socSum / NUM_CELLS;

    Serial.println("--------------------------------");
    for (int i = 0; i < NUM_CELLS; i++) {
        Serial.printf("Cell %d : %.3f V | %.1f C\n", i + 1, cellVoltage[i], tempForCell(i));
    }
    Serial.printf("Total  : %.3f V | SoC rata-rata: %.0f%%\n", cumulativeVoltage[NUM_CELLS - 1], socAvg);
    Serial.printf("Mode: %s | WiFi: %s | LoRa: %s | SD: %s | Buffer: %s\n",
                  modeLabel(currentMode),
                  WiFi.status() == WL_CONNECTED ? "OK" : "-",
                  loraAvailable ? "OK" : "-",
                  sdReady ? "OK" : "-",
                  hasBufferedData() ? "ADA" : "kosong");

    oled.clearDisplay();
    oled.setTextSize(1);
    oled.setTextColor(WHITE);

    // Baris 1: mode aktif + status koneksi WiFi
    oled.setCursor(0, 0);
    oled.printf("Mode:%s WiFi:%s", modeLabel(currentMode),
                WiFi.status() == WL_CONNECTED ? "OK" : "-");

    // Baris 2: status hardware cadangan -- LoRa & SD card + tanda buffer pending
    oled.setCursor(0, 9);
    oled.printf("LoRa:%s SD:%s%s",
                loraAvailable ? "OK" : "-",
                sdReady ? "OK" : "-",
                hasBufferedData() ? "*" : "");

    // Baris 3: kapasitas & tegangan total pack
    oled.setCursor(0, 20);
    oled.printf("Cap:%.0f%% Tot:%.2fV", socAvg, cumulativeVoltage[NUM_CELLS - 1]);

    // Baris 4-5: tegangan tiap cell
    oled.setCursor(0, 31);
    oled.printf("C1:%.2f  C2:%.2f", cellVoltage[0], cellVoltage[1]);
    oled.setCursor(0, 42);
    oled.printf("C3:%.2f  C4:%.2f", cellVoltage[2], cellVoltage[3]);

    // Baris 6: suhu dari kedua sensor DS18B20
    oled.setCursor(0, 53);
    oled.printf("T1:%.1fC  T2:%.1fC", temp1C, temp2C);

    oled.display();

    unsigned long now = millis();
    if (now - lastPublish >= PUBLISH_INTERVAL) {
        lastPublish = now;
        for (int i = 0; i < NUM_CELLS; i++) {
            publishCell(i + 1, cellVoltage[i], tempForCell(i), packTempMax);
            if (currentMode == MODE_LORA) {
                delay(LORA_INTER_PACKET_DELAY_MS);
            }
        }
    }

    delay(1000);
}