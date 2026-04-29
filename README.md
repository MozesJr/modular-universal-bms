# ⚡ Modular Universal BMS — Dashboard

> **Capstone Project** · Universitas Gadjah Mada · DIKE 2026  
> Individual Cell Monitoring dengan Arsitektur Hybrid IoT

---

## 🗺️ Arsitektur Sistem

```
ESP32 ──MQTT──► Mosquitto ──► Node.js Backend ──Socket.io──► Vue.js Dashboard
                                     │
                               MongoDB (time-series)
```

**MQTT Topic:** `bms/{pack_id}/cell/{cell_id}`  
**Payload JSON dari ESP32:**
```json
{ "voltage": 3.27, "current": 1.50, "temperature": 28.4, "soc": 82.5, "soh": 97.0 }
```

---

## 📁 Struktur Folder

```
modular-universal-bms/
├── docker-compose.yml          ← Orchestrasi semua service
├── .env.example                ← Salin ke .env sebelum pertama kali run
├── .gitignore
│
├── backend/                    ← Node.js + Express
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js           ← Entry point
│       ├── app.js              ← Express setup
│       ├── config/db.js        ← Koneksi MongoDB
│       ├── models/
│       │   ├── CellReading.js  ← Skema time-series data sel
│       │   └── BatteryPack.js  ← Konfigurasi pack baterai
│       ├── routes/
│       │   ├── cells.js        ← GET history, stats, latest
│       │   ├── packs.js        ← CRUD konfigurasi pack
│       │   └── alerts.js       ← Query alert history
│       ├── services/
│       │   ├── mqttService.js  ← MQTT subscriber + alert logic
│       │   └── socketService.js← Socket.io real-time push
│       └── middleware/
│           └── errorHandler.js
│
├── frontend/                   ← Vue 3 + Vite + Tailwind
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/index.js
│       ├── stores/bmsStore.js  ← Pinia state (real-time cell data)
│       ├── composables/useSocket.js
│       ├── services/api.js
│       ├── views/
│       │   ├── LiveMonitor.vue
│       │   ├── HistoricalAnalysis.vue
│       │   ├── AlertsView.vue
│       │   └── PackConfig.vue
│       └── components/
│           ├── CellCard.vue
│           ├── MetricBadge.vue
│           ├── VoltageSparkline.vue
│           └── SummaryCard.vue
│
├── mosquitto/
│   └── config/mosquitto.conf   ← MQTT broker config
│
└── mongo/
    └── init/init.js            ← DB init (collections + seed data)
```

---

## 🚀 Setup Awal (Local Development)

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/modular-universal-bms.git
cd modular-universal-bms
```

### 2. Buat File `.env`

```bash
cp .env.example .env
# Edit .env sesuai kebutuhan (password MongoDB, dll)
```

### 3. Pastikan Docker & Docker Compose Terinstall

```bash
docker --version          # Docker 24+
docker compose version    # Compose v2+
```

### 4. Jalankan Semua Service

```bash
docker compose up --build
```

> Build pertama membutuhkan ~3–5 menit (download images + install npm packages).

### 5. Akses Aplikasi

| Service       | URL                        |
|---------------|----------------------------|
| Dashboard     | http://localhost:8080       |
| Backend API   | http://localhost:3000       |
| Health check  | http://localhost:3000/health|
| MQTT Broker   | mqtt://localhost:1883       |
| MongoDB       | mongodb://localhost:27017   |

---

## 🧪 Test Kirim Data dari Komputer (Simulasi ESP32)

Install `mosquitto-clients`:
```bash
# Ubuntu/Debian
sudo apt install mosquitto-clients

# macOS
brew install mosquitto
```

Kirim payload simulasi:
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "bms/PACK_001/cell/1" \
  -m '{"voltage":3.27,"current":1.50,"temperature":28.4,"soc":82.5,"soh":97.0}'
```

Kirim untuk semua 4 sel sekaligus (copy-paste ke terminal):
```bash
for i in 1 2 3 4; do
  mosquitto_pub -h localhost -p 1883 \
    -t "bms/PACK_001/cell/$i" \
    -m "{\"voltage\":$(echo "3.2 + $RANDOM % 10 * 0.005" | bc),\"current\":1.5,\"temperature\":28,\"soc\":80,\"soh\":97}"
done
```

---

## 🔌 Konfigurasi ESP32 (Arduino / PlatformIO)

Topic format yang harus dikirim ESP32:
```
bms/PACK_001/cell/1
bms/PACK_001/cell/2
... dst
```

MQTT broker address: IP server/komputer yang menjalankan Docker.

---

## 📡 REST API Endpoints

```
GET  /health                                    — Status backend
GET  /api/packs                                 — Daftar semua pack
POST /api/packs                                 — Tambah pack baru
GET  /api/packs/:packId                         — Detail pack

GET  /api/cells/:packId                         — Latest reading semua sel
GET  /api/cells/:packId/:cellId/history         — Histori (query: from, to, limit)
GET  /api/cells/:packId/:cellId/stats           — Statistik (min/max/avg)

GET  /api/alerts?packId=PACK_001&limit=50       — Alert history
```

---

## 🛑 Stop & Cleanup

```bash
# Stop containers
docker compose down

# Stop + hapus volumes (RESET DATA)
docker compose down -v
```

---

## 🔐 Catatan Produksi

- Aktifkan autentikasi Mosquitto (`password_file` di `mosquitto.conf`)
- Ganti CORS `origin: "*"` dengan domain frontend yang spesifik
- Gunakan `NODE_ENV=production` pada `.env`
- Pertimbangkan HTTPS (Nginx reverse proxy + Let's Encrypt)
