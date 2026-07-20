#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ==================== KONFIGURASI WIFI & MQTT ====================
const char* WIFI_SSID     = "Queenf4";
const char* WIFI_PASSWORD = "QH12342210";

const char* MQTT_HOST = "148.230.97.68";
const int   MQTT_PORT = 1885;
const char* MQTT_CLIENT_ID = "esp32-bms1-pack1-voltage";

// ── Identitas BMS & Pack ─────────────────────────────────────
const char* BMS_ID  = "BMS_1";
const char* PACK_ID = "PACK_1";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 2000;

// ==================== KONFIGURASI PIN ====================
// Urutan pin dari BAWAH (dekat GND) ke ATAS.
// CELL_PINS[i] membaca tegangan KUMULATIF dari GND s/d puncak sel ke-(i+1).
// Semua di bawah ini ADC1 -> aman dipakai bersamaan WiFi/MQTT aktif.
const int CELL_PINS[] = {36, 39, 34, 35, 32, 33};   // GPIO36(VP),39(VN),34,35,32,33(D33)
const int NUM_CELLS = sizeof(CELL_PINS) / sizeof(CELL_PINS[0]);

// ==================== KONFIGURASI DIVIDER ====================
// Cell 1-4  : R1=30k / R2=10k (rasio nominal 4.0)
// Cell 5-6  : R1=60k (30k+30k seri) / R2=10k (rasio nominal 7.0)
//             -> dipakai karena tegangan kumulatif di titik ini sudah tinggi,
//             butuh rasio lebih besar biar pin ADC tetap di bawah batas aman.
// Rasio di bawah tetap dikalibrasi per-channel vs multimeter (lihat komentar).
const float DIVIDER_RATIOS[] = {
    3.7,    // Cell 1 (GPIO36) - dikalibrasi vs multimeter: 3.38V -> 3.1V
    3.7,    // Cell 2 (GPIO39) - pakai rasio Cell 1 dulu, belum dikalibrasi terpisah
    3.7,    // Cell 3 (GPIO34) - pakai rasio Cell 1 dulu, belum dikalibrasi terpisah
    3.96,   // Cell 4 (GPIO35) - dikalibrasi vs multimeter: terbaca 2.28V, asli 3.1V
    6.45,    // Cell 5 (GPIO32) - R1=60k, dikalibrasi vs multimeter
    6.4     // Cell 6 (GPIO33) - R1=60k, rasio nominal. BELUM dikalibrasi ulang vs multimeter!
};

const int SAMPLES = 32;
const int SAMPLE_DELAY_US = 200;

float cumulativeVoltage[16];
float cellVoltage[16];

float readDividedVoltage(int pin, float ratio)
{
    uint32_t total = 0;
    for (int i = 0; i < SAMPLES; i++)
    {
        total += analogReadMilliVolts(pin);
        delayMicroseconds(SAMPLE_DELAY_US);
    }
    float mv = total / (float)SAMPLES;
    return (mv / 1000.0) * ratio;
}

void readAllCellVoltages()
{
    float previous = 0.0;
    for (int i = 0; i < NUM_CELLS; i++)
    {
        cumulativeVoltage[i] = readDividedVoltage(CELL_PINS[i], DIVIDER_RATIOS[i]);
        cellVoltage[i] = cumulativeVoltage[i] - previous;
        previous = cumulativeVoltage[i];
    }
}

// ==================== WIFI & MQTT ====================
void connectWiFi()
{
    Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected, IP: " + WiFi.localIP().toString());
}

void connectMQTT()
{
    while (!mqttClient.connected())
    {
        Serial.print("Connecting to MQTT broker...");
        if (mqttClient.connect(MQTT_CLIENT_ID))
        {
            Serial.println(" connected!");
        }
        else
        {
            Serial.printf(" failed, rc=%d, retry in 3s\n", mqttClient.state());
            delay(3000);
        }
    }
}

// Threshold sederhana berbasis tegangan (LiFePO4), belum ada sensor suhu di sketch ini.
const char* determineState(float voltage)
{
    if (voltage < 2.5) return "undervoltage";
    if (voltage > 3.65) return "overvoltage";
    return "discharging";
}

void publishCell(int cellId, float voltage)
{
    const char* state = determineState(voltage);
    JsonDocument doc;
    doc["voltage"] = round(voltage * 1000) / 1000.0;
    doc["state"] = state;

    char payload[128];
    serializeJson(doc, payload);

    char topic[80];
    snprintf(topic, sizeof(topic), "bms/%s/pack/%s/cell/%d", BMS_ID, PACK_ID, cellId);

    mqttClient.publish(topic, payload);
    Serial.printf("[%s] V:%.3f state:%s -> %s\n", topic, voltage, state, payload);
}

void setup()
{
    Serial.begin(115200);

    analogReadResolution(12);
    for (int i = 0; i < NUM_CELLS; i++)
    {
        analogSetPinAttenuation(CELL_PINS[i], ADC_11db);
    }
    Serial.printf("Battery Monitor %dS - Voltage Divider Mode\n", NUM_CELLS);

    if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    {
        Serial.println(F("SSD1306 allocation failed"));
        while (true);
    }
    oled.clearDisplay();
    oled.display();

    connectWiFi();
    mqttClient.setServer(MQTT_HOST, MQTT_PORT);
}

void loop()
{
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    if (!mqttClient.connected()) connectMQTT();
    mqttClient.loop();

    readAllCellVoltages();

    // Serial log
    Serial.println("--------------------------------");
    for (int i = 0; i < NUM_CELLS; i++)
    {
        Serial.printf("Cell %d : %.3f V\n", i + 1, cellVoltage[i]);
    }
    Serial.printf("Total  : %.3f V\n", cumulativeVoltage[NUM_CELLS - 1]);

    // OLED
    oled.clearDisplay();
    oled.setTextSize(1);
    oled.setTextColor(WHITE);
    for (int i = 0; i < NUM_CELLS; i++)
    {
        oled.setCursor(0, i * 10);
        oled.printf("Cell %d: %.3fV", i + 1, cellVoltage[i]);
    }
    oled.setCursor(0, NUM_CELLS * 10 + 2);
    oled.printf("Total : %.3fV", cumulativeVoltage[NUM_CELLS - 1]);
    oled.display();

    // MQTT publish (tiap PUBLISH_INTERVAL, semua 6 cell)
    unsigned long now = millis();
    if (now - lastPublish >= PUBLISH_INTERVAL)
    {
        lastPublish = now;
        for (int i = 0; i < NUM_CELLS; i++)
        {
            publishCell(i + 1, cellVoltage[i]);
        }
    }

    delay(1000);
}