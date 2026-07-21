#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ==================== KONFIGURASI SENSOR SUHU ====================
// 2 sensor DS18B20 di satu bus OneWire (GPIO4, power 3V3).
// Karena cuma 2 sensor buat 6 cell, dipakai skema GROUPING:
//   Sensor 1 (index 0) -> mewakili Cell 1, 2, 3
//   Sensor 2 (index 1) -> mewakili Cell 4, 5, 6
// GANTI mapping di bawah (cellTempIndex[]) kalau posisi fisik sensormu beda.
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

float temp1C = 0;
float temp2C = 0;
// index 0 = pakai temp1C, index 1 = pakai temp2C, untuk tiap Cell 1..6
const int cellTempIndex[] = {0, 0, 0, 1, 1, 1};

// ==================== KONFIGURASI WIFI & MQTT ====================
const char* WIFI_SSID     = "Queenf4";
const char* WIFI_PASSWORD = "QH12342210";

const char* MQTT_HOST = "148.230.97.68";
const int   MQTT_PORT = 1885;
const char* MQTT_CLIENT_ID = "esp32-bms1-pack1-voltage";

const char* BMS_ID  = "BMS_1";
const char* PACK_ID = "PACK_1";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 2000;

// ==================== KONFIGURASI PIN ADC (VOLTAGE DIVIDER) ====================
const int CELL_PINS[] = {36, 39, 34, 35, 32, 33};   // GPIO36(VP),39(VN),34,35,32,33(D33)
const int NUM_CELLS = sizeof(CELL_PINS) / sizeof(CELL_PINS[0]);

const float DIVIDER_RATIOS[] = {
    3.695,  // Cell 1 (GPIO36) - dikalibrasi individual vs multimeter (3.1V)
    3.659,  // Cell 2 (GPIO39) - dikalibrasi individual vs multimeter (3.1V)
    3.698,  // Cell 3 (GPIO34) - dikalibrasi individual vs multimeter (3.1V)
    3.974,  // Cell 4 (GPIO35) - dikalibrasi individual vs multimeter (3.1V)
    6.469,  // Cell 5 (GPIO32) - dikalibrasi individual vs multimeter (3.1V)
    6.469   // Cell 6 (GPIO33) - dikalibrasi individual vs multimeter (3.1V)
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
        cellVoltage[i] = cumulativeVoltage[i] - previous;
        previous = cumulativeVoltage[i];
    }
}

void readTemperatures() {
    tempSensors.requestTemperatures();
    temp1C = tempSensors.getTempCByIndex(0);
    temp2C = tempSensors.getTempCByIndex(1);
}

float tempForCell(int cellIndex) {
    return cellTempIndex[cellIndex] == 0 ? temp1C : temp2C;
}

// ==================== WIFI & MQTT ====================
void connectWiFi() {
    Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected, IP: " + WiFi.localIP().toString());
}

void connectMQTT() {
    while (!mqttClient.connected()) {
        Serial.print("Connecting to MQTT broker...");
        if (mqttClient.connect(MQTT_CLIENT_ID)) {
            Serial.println(" connected!");
        } else {
            Serial.printf(" failed, rc=%d, retry in 3s\n", mqttClient.state());
            delay(3000);
        }
    }
}

// State sekarang mempertimbangkan voltage DAN suhu.
const char* determineState(float voltage, float temperature) {
    if (temperature > 55.0) return "fault";
    if (voltage < 2.5) return "undervoltage";
    if (voltage > 3.65) return "overvoltage";
    return "discharging";
}

void publishCell(int cellId, float voltage, float temperature, float packTempMax) {
    const char* state = determineState(voltage, temperature);
    JsonDocument doc;
    doc["voltage"] = round(voltage * 1000) / 1000.0;
    doc["temperature"] = round(temperature * 10) / 10.0;
    doc["pack_temp"] = round(packTempMax * 10) / 10.0;
    doc["state"] = state;

    char payload[160];
    serializeJson(doc, payload);

    char topic[80];
    snprintf(topic, sizeof(topic), "bms/%s/pack/%s/cell/%d", BMS_ID, PACK_ID, cellId);

    mqttClient.publish(topic, payload);
    Serial.printf("[%s] V:%.3f T:%.1f state:%s -> %s\n", topic, voltage, temperature, state, payload);
}

void setup() {
    Serial.begin(115200);

    analogReadResolution(12);
    for (int i = 0; i < NUM_CELLS; i++) {
        analogSetPinAttenuation(CELL_PINS[i], ADC_11db);
    }
    Serial.printf("Battery Monitor %dS - Voltage + Temperature\n", NUM_CELLS);

    tempSensors.begin();

    if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println(F("SSD1306 allocation failed"));
        while (true);
    }
    oled.clearDisplay();
    oled.display();

    connectWiFi();
    mqttClient.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    if (!mqttClient.connected()) connectMQTT();
    mqttClient.loop();

    readAllCellVoltages();
    readTemperatures();
    float packTempMax = max(temp1C, temp2C);

    // Serial log
    Serial.println("--------------------------------");
    for (int i = 0; i < NUM_CELLS; i++) {
        Serial.printf("Cell %d : %.3f V | %.1f C\n", i + 1, cellVoltage[i], tempForCell(i));
    }
    Serial.printf("Total  : %.3f V\n", cumulativeVoltage[NUM_CELLS - 1]);
    Serial.printf("Temp1  : %.1f C | Temp2: %.1f C\n", temp1C, temp2C);

    // OLED (tetap fokus voltage, suhu cukup di Serial+MQTT biar layar nggak sesak)
    oled.clearDisplay();
    oled.setTextSize(1);
    oled.setTextColor(WHITE);
    for (int i = 0; i < NUM_CELLS; i++) {
        oled.setCursor(0, i * 10);
        oled.printf("Cell %d: %.3fV", i + 1, cellVoltage[i]);
    }
    oled.setCursor(0, NUM_CELLS * 10 + 2);
    oled.printf("Total : %.3fV", cumulativeVoltage[NUM_CELLS - 1]);
    oled.display();

    // MQTT publish (tiap PUBLISH_INTERVAL, semua 6 cell)
    unsigned long now = millis();
    if (now - lastPublish >= PUBLISH_INTERVAL) {
        lastPublish = now;
        for (int i = 0; i < NUM_CELLS; i++) {
            publishCell(i + 1, cellVoltage[i], tempForCell(i), packTempMax);
        }
    }

    delay(1000);
}