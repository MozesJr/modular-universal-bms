# Migration Audit — Modular BMS Frontend (`frontend` → `new-frontend`)

> Dibuat otomatis via scanning codebase. Murni dokumentasi — belum ada perubahan kode.
> Tanggal audit: 2026-08-24

---

## 1. Backend API Inventory (`backend/`)

**Stack:** Express 4 + Mongoose 8 + JWT (`jsonwebtoken`) + MQTT (`mqtt`) + Socket.IO (`socket.io`) + bcryptjs. Tidak ada folder `controllers` terpisah — handler langsung ada di `backend/src/routes/*.js`.

**Base prefix:** `/api` (kecuali `GET /health` yang tanpa prefix). Mounting ada di `backend/src/app.js:19-31`.

### Auth strategy
- **JWT stateless**, tanpa session. Token di-sign di `routes/auth.js:9-13` (`{ id, role }`, expired 7 hari).
- Divalidasi oleh middleware `protect` — `backend/src/middleware/auth.js:5-24` (cek header `Authorization: Bearer <token>`, load `req.user` dari Mongo).
- `isAdmin` — `middleware/auth.js:26-31` (role check, 403 kalau bukan admin).
- `canAccessBms` — `middleware/auth.js:64-82`: resolve access level (`admin`/`owner`/collaborator `view`|`maintain`) untuk device BMS.
- `canAccessPack` — `middleware/auth.js:34-61`: sama seperti di atas tapi via parent `Bms` dari sebuah `Pack`.
- Password di-hash bcrypt (`UserModel.js:26-30`), field `password` default `select:false`.

### Auth (`/api/auth`) — `routes/auth.js`
| Method | Path | Handler | Fungsi | Auth | Response utama |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | `auth.js:16-47` | Registrasi user baru (role dipaksa `user`) | Public | `{ token, user:{id,username,email,role} }` |
| POST | `/api/auth/login` | `auth.js:50-84` | Login via username/email + password | Public | `{ token, user:{id,username,email,role} }` |
| GET | `/api/auth/me` | `auth.js:87-94` | Ambil profil user yang sedang login | `protect` | `{ id, username, email, role }` |

### Admin — Users (`/api/admin/users`) — `routes/adminUsers.js`
Semua route pakai `router.use(protect, isAdmin)` (`adminUsers.js:10`).
| Method | Path | Handler | Fungsi | Response utama |
|---|---|---|---|---|
| GET | `/api/admin/users` | `adminUsers.js:13-35` | List semua user + `bmsCount` | array `User` + `bmsCount` |
| POST | `/api/admin/users` | `adminUsers.js:38-71` | Admin buat user baru (langsung aktif) | `User` doc |
| PATCH | `/api/admin/users/:id` | `adminUsers.js:74-94` | Edit `role`/`isActive` (blok self-edit) | `User` doc (tanpa password) |
| PATCH | `/api/admin/users/:id/reset-password` | `adminUsers.js:97-113` | Reset password user lain (min 8 char) | `{ message }` |
| DELETE | `/api/admin/users/:id` | `adminUsers.js:116-140` | Hapus user, BMS miliknya dialihkan ke admin penghapus | `{ message }` |

### Users (`/api/users`) — `routes/users.js`
| Method | Path | Handler | Fungsi | Auth | Response utama |
|---|---|---|---|---|---|
| GET | `/api/users?search=` | `users.js:11-31` | Cari user by username/email (untuk tambah collaborator) | `protect` (semua user login) | array `{ username, email }` (maks 20) |

### BMS Devices (`/api/bms`) — `routes/bms.js`
| Method | Path | Handler | Fungsi | Auth | Response utama |
|---|---|---|---|---|---|
| GET | `/api/bms` | `bms.js:11-29` | List device milik/akses caller (admin lihat semua) | `protect` | array `Bms` (owner populated) |
| GET | `/api/bms/:bmsId` | `bms.js:32-38` | Detail 1 device | `protect`+`canAccessBms` | `Bms` doc |
| GET | `/api/bms/:bmsId/packs` | `bms.js:41-48` | List `Pack` milik device | `protect`+`canAccessBms` | array `Pack` |
| POST | `/api/bms` | `bms.js:51-69` | Registrasi device baru (status `pending_verification` kalau bukan admin) | `protect` | `Bms` doc (201) |
| PUT | `/api/bms/:bmsId` | `bms.js:72-94` | Edit info device | `protect`+`canAccessBms`, level `owner/admin/maintain` | `Bms` doc |
| DELETE | `/api/bms/:bmsId` | `bms.js:97-118` | Hapus device (gagal kalau masih punya Pack) | `protect`+`canAccessBms`, level `owner/admin` | `{ success, message }` |
| PATCH | `/api/bms/:bmsId/assign` | `bms.js:121-142` | Admin assign owner baru + set `active` | `protect`+`isAdmin` | `{ message, bms }` |
| PATCH | `/api/bms/:bmsId/verify` | `bms.js:144-162` | Admin approve/reject device pending | `protect`+`isAdmin` | `{ message, bms }` |
| PATCH | `/api/bms/:bmsId/suspend` | `bms.js:167-184` | Toggle `active`↔`suspended` | `protect`+`isAdmin` | `{ message, bms }` |
| PATCH | `/api/bms/:bmsId/transfer` | `bms.js:187-217` | Transfer ownership ke user lain | `protect`+`canAccessBms`, level `owner` | `{ message, bms }` |
| POST | `/api/bms/:bmsId/collaborators` | `bms.js:220-260` | Tambah/update permission collaborator | `protect`+`canAccessBms`, level `owner` | `{ message, bms }` |
| DELETE | `/api/bms/:bmsId/collaborators` | `bms.js:262-283` | Hapus collaborator | `protect`+`canAccessBms`, level `owner` | `{ message, bms }` |

### Packs (`/api/packs`) — `routes/packs.js`
| Method | Path | Handler | Fungsi | Auth | Response utama |
|---|---|---|---|---|---|
| GET | `/api/packs` | `packs.js:11-27` | List pack yang bisa diakses caller | `protect` | array `Pack` |
| GET | `/api/packs/presets` | `packs.js:30-32` | ⚠️ **STUB KOSONG — tidak pernah `res.send`, request akan hang/timeout** | none | — |
| GET | `/api/packs/:packId` | `packs.js:35-41` | Detail 1 pack | `protect`+`canAccessPack` | `Pack` doc lengkap (cells, thresholds, dll) |
| POST | `/api/packs` | `packs.js:44-81` | Buat pack baru di bawah `bms_id` | `protect` (cek inline ownership) | `Pack` doc (201) |
| PUT | `/api/packs/:packId` | `packs.js:84-109` | Update config pack; regenerasi `cells[]` kalau `cell_count` berubah | `protect`+`canAccessPack`, level `owner/admin/maintain` | `Pack` doc |
| DELETE | `/api/packs/:packId` | `packs.js:112-129` | Hapus pack | `protect`+`canAccessPack`, level `owner/admin` | `{ success, message }` |

### Cells / Telemetry (`/api/cells`) — `routes/cells.js`
`router.use("/:packId", protect, canAccessPack)` berlaku untuk semua route di bawah (`cells.js:10`).
| Method | Path | Handler | Fungsi | Response utama |
|---|---|---|---|---|
| GET | `/api/cells/:packId` | `cells.js:13-27` | Reading terakhir tiap cell dalam pack | `{ pack_id, cells:[...] }` |
| GET | `/api/cells/:packId/pack-log` | `cells.js:30-44` | Agregat pack-level terbaru | `{ pack_id, pack_log }` |
| GET | `/api/cells/:packId/:cellId/history` | `cells.js:47-74` | Raw reading historis (default 1 jam, limit 2000) | `{ pack_id, cell_id, from, to, data:[...] }` |
| GET | `/api/cells/:packId/:cellId/batches` | `cells.js:77-103` | Agregat per-jam jangka panjang (default 30 hari) | `{ pack_id, cell_id, from, to, data:[...] }` |
| GET | `/api/cells/:packId/:cellId/stats` | `cells.js:106-151` | Min/max/avg statistik (default 24 jam) | `{ pack_id, cell_id, from, to, stats:{...} }` |

### Alerts (`/api/alerts`) — `routes/alerts.js`
| Method | Path | Handler | Fungsi | Auth | Response utama |
|---|---|---|---|---|---|
| GET | `/api/alerts?packId=&limit=` | `alerts.js:9-47` | List alert (filter per pack atau semua yang bisa diakses) | `protect` | array `AlertLog` |
| PUT | `/api/alerts/:id/acknowledge` | `alerts.js:49-83` | Tandai alert selesai (`resolved:true`) | `protect`, level `owner/admin/maintain` | `AlertLog` doc |

### BMS Models (`/api/bms-models`) — `routes/bmsModels.js`
⚠️ **Tidak ada middleware auth sama sekali di semua route ini — full public CRUD**, tidak konsisten dengan modul lain.
| Method | Path | Handler | Fungsi | Response utama |
|---|---|---|---|---|
| GET | `/api/bms-models` | `bmsModels.js:16-23` | List tipe model BMS | array `{ _id, model_name }` |
| POST | `/api/bms-models` | `bmsModels.js:26-33` | Buat model baru | `BmsModel` doc (201) |
| PUT | `/api/bms-models/:id` | `bmsModels.js:36-54` | Rename model (sinkron ke `BatteryPack`) | `BmsModel` doc |
| DELETE | `/api/bms-models/:id` | `bmsModels.js:57-74` | Hapus model | `{ success, message }` |

### Lainnya
- **GET `/health`** — `app.js:19`, tanpa auth, `{ status: "ok" }`.
- `backend/src/models/BatteryPack.js` kemungkinan model lama/legacy (skema gabungan BMS+Pack+cells dengan field ownership sendiri) — tidak punya route file sendiri, hanya disentuh via `bmsModels.js` untuk sinkron nama. Perlu konfirmasi apakah masih dipakai.

### Real-time channels (bukan HTTP biasa)

**Socket.IO** — `backend/src/services/socketService.js`
| Event | Arah | Payload / fungsi |
|---|---|---|
| `join:pack` | client→server | `{ packId }` — join room `pack:${packId}` (catatan: room ini tidak dipakai untuk scoping emit — server emit global via `io.emit`, jadi room-join saat ini tidak berefek). |
| `cell:update` | server→client | Reading real-time per cell: `{ bms_id, pack_id, cell_id, timestamp, metrics, pack_metrics, state, alerts[], pack_voltage_delta_mv, pack_imbalanced }` |
| `cell:alert` | server→client | Payload sama seperti `cell:update`, dikirim khusus saat ada alert/imbalance. |

**MQTT** — `backend/src/services/mqttService.js`
- Subscribe topic `bms/+/pack/+/cell/+` (prefix dari `MQTT_TOPIC_PREFIX`, default `bms`).
- Ingest-only (tidak publish balik ke device). Setiap pesan: hitung SoC (OCV), simpan `CellReading`, evaluasi alert, update `Pack.voltage_delta_mv`/`state`, lalu re-broadcast via Socket.IO (`cell:update`/`cell:alert`).

---

## 2. Frontend Lama Inventory (`frontend/`)

**Stack:** Vue 3 (Composition + Options API), template dasar **Vue Notus (Creative Tim)** + Tailwind CSS 2. Router: `vue-router` v4 (config di `src/main.js`, bukan file terpisah). State: **Pinia** (`authStore`, `bmsStore`). HTTP: Axios instance tunggal di `src/services/api.js`. Real-time: `socket.io-client` via `src/composables/useSocket.js`. Build tool: **Vue CLI (webpack)**, bukan Vite.

⚠️ **Bug ditemukan:** `api.js` dan `useSocket.js` pakai `import.meta.env.VITE_*`, padahal project pakai Vue CLI/webpack (konvensi `process.env.VUE_APP_*`, sesuai `.env`). Akibatnya base URL selalu resolve ke path relatif `"" + "/api"` — hanya jalan karena `vue.config.js` proxy `/api` ke `localhost:3000` di dev server. Di production non-dev-server ini berpotensi rusak.

### Halaman / Route

**Public**
| Path | Component | Deskripsi |
|---|---|---|
| `/` | `src/views/Index.vue` | Landing page publik (konten template Notus + deskripsi project) |
| `/:pathMatch(.*)*` | — | Catch-all, redirect ke `/` |

**Auth layout** (`src/layouts/Auth.vue`)
| Path | Component | Deskripsi |
|---|---|---|
| `/auth/login` | `views/auth/Login.vue` | Form login |
| `/auth/register` | `views/auth/Register.vue` | Registrasi self-service, auto-login |

**Admin layout** (`src/layouts/Admin.vue`, `requiresAuth`)
| Path | Component | Deskripsi |
|---|---|---|
| `/admin/dashboard` | `views/admin/Dashboard.vue` | Overview fleet: mini stats + grid `PackCard` |
| `/admin/alerts` | `views/admin/Alerts.vue` | Log alert (filter All/Active/Resolved) + acknowledge |
| `/admin/config` | `views/admin/PackConfig.vue` | List/manage config Pack, delete-with-confirm |
| `/admin/pack-form` | `views/admin/PackForm.vue` | Create/Edit Pack (query `?edit=`, `?bmsId=`) |
| `/admin/pack-detail` | `views/admin/PackDetail.vue` | Layar monitoring real-time utama (~1160 baris): live per-cell cards, alert log, export CSV/JSON, join socket room |
| `/admin/settings` | `views/admin/Settings.vue` | Demo template Notus, **tidak terhubung backend** |
| `/admin/tables` | `views/admin/Tables.vue` | Demo template Notus, **tidak terhubung backend** |
| `/admin/maps` | `views/admin/Maps.vue` | Demo template Notus (Google Maps embed), **tidak terhubung backend** |
| `/admin/bms-config` | `views/admin/BmsConfig.vue` | List device BMS terdaftar |
| `/admin/bms-form` | `views/admin/BmsForm.vue` | Create/Edit device BMS (`?edit=`) |
| `/admin/users` (`requiresAdmin`) | `views/admin/UserManagement.vue` | Tabel user + modal create/edit/reset-password/delete |
| `/admin/user-form` (`requiresAdmin`) | `views/admin/UserForm.vue` | Form create/edit user (`?id=`) |
| `/admin/user-reset-password` (`requiresAdmin`) | `views/admin/UserResetPassword.vue` | Form reset password user (`?id=&username=`) |
| `/admin/assign-bms` (`requiresAdmin`) | `views/admin/AssignBms.vue` | Antrean verifikasi device pending: approve/reject/suspend |
| `/admin/assign-bms-form` (`requiresAdmin`) | `views/admin/AssignBmsForm.vue` | Assign/reassign device ke user (`?bmsId=&ownerId=`) |
| `/admin/collaborators` (`requiresAuth`) | `views/admin/Collaborators.vue` | Kelola collaborator device (add/update/remove) |

**File view orphan (ada tapi tidak dipakai router):** `views/Landing.vue`, `views/Profile.vue` — sisa scaffold template, unreachable.

**Route rusak ditemukan:** `AssignBms.vue`/`AssignBmsForm.vue` masih navigasi ke path lama `/admin/assign-pack*` (harusnya `/admin/assign-bms*`) — link mati.

### Endpoint backend yang dipanggil per halaman
Ringkasan lengkap ada di tabel gabungan §4. Sentralisasi call ada di 2 tempat:
- `src/stores/authStore.js` — login, register, fetchProfile (fetchProfile tidak pernah dipanggil / dead code)
- `src/stores/bmsStore.js` — semua CRUD BMS/Pack/Alerts + cell history (beberapa fungsi dead code: `createBmsModel`, `deleteBms`, `fetchPacksForBms`, `fetchCellHistory`)
- Beberapa halaman admin (Users, Collaborators, AssignBms/Form) panggil `api` langsung, tidak lewat store.

### Komponen reusable utama
| Komponen | Deskripsi |
|---|---|
| `components/BMS/PackCard.vue` | Card ringkasan Pack (dipakai di Dashboard) |
| `components/BMS/CellCard.vue` | Card metrik per-cell — **tidak dipakai** (PackDetail render manual inline) |
| `components/BMS/MetricBadge.vue`, `SummaryCard.vue`, `VoltageSparkline.vue` | Widget kecil — **semua tidak dipakai** di codebase saat ini |
| `components/Cards/CardStats.vue` | Stat tile generik — dipakai aktif (HeaderStats, Dashboard, PackDetail) |
| `components/Cards/CardBarChart.vue` (Chart.js, SoC) | Terhubung ke `bmsStore` tapi **tidak diimport di mana pun** — orphan |
| `components/Cards/CardLineChart.vue` (Chart.js, voltage history) | Sama, **orphan**, tersambung ke store |
| `components/Cards/CardPageVisits.vue` | Tabel "Recent Alerts" dari `bmsStore.alerts` — **orphan** |
| `components/Cards/CardTable.vue`, `CardSocialTraffic.vue`, `CardSettings.vue`, `CardProfile.vue` | Demo template Notus, statis |
| `components/Headers/HeaderStats.vue` | Header hijau 4 stat tile, muncul di semua halaman admin, juga trigger fetch/connect socket |
| `components/Sidebar/Sidebar.vue` | Nav utama admin, badge jumlah alert |
| `components/Navbars/*`, `components/Footers/*` | Chrome layout |
| `components/Dropdowns/UserDropdown.vue`, `NotificationDropdown.vue`, `PagesDropdown.vue`, `TableDropdown.vue`, `IndexDropdown.vue` | Dropdown UI kecil (beberapa link ke route orphan `Landing`/`Profile`) |
| `components/Maps/MapExample.vue` | Embed Google Maps statis |
| `composables/useSocket.js` | Singleton koneksi Socket.IO + `connect()`/`joinPack()` |

---

## 3. New-Frontend Inventory (`new-frontend/`)

**Template:** **Dabang** (ThemeWagon admin dashboard template, `package.json` name: `"dabang"`) — dashboard sales generik, **belum ada satu pun konten BMS**.

| Layer | Pilihan |
|---|---|
| Framework | React 18 + TypeScript 5.4 |
| Build tool | Vite 5 (`vite-tsconfig-paths`, `vite-plugin-checker`) |
| UI library | **MUI (Material UI) v5** + Emotion + Iconify |
| Charts | Apache ECharts (`echarts` + `echarts-for-react`) |
| Router | `react-router-dom` v6 (`createBrowserRouter`, lazy routes), `basename: '/dabang'` — **perlu diganti** |
| Deployment | GitHub Pages (`gh-pages`) — kemungkinan tidak relevan untuk project ini |

⚠️ Ada `package-lock.json` **dan** `pnpm-lock.yaml` sekaligus — perlu dipilih salah satu sebelum migrasi.

### Struktur folder `src/`
| Folder | Fungsi |
|---|---|
| `components/base/` | Primitive: `IconifyIcon`, `Image`, `ReactEhart` (wrapper ECharts) |
| `components/common/` | Widget shared: pagination, search field, password field |
| `components/sections/dashboard/` | Widget dashboard (1 subfolder per card), masing-masing pasangan komponen + `*Chart.tsx` |
| `data/` | **Data dummy hardcoded**, dikonsumsi langsung oleh widget dashboard (tidak ada API call) |
| `layouts/` | `main-layout/` (topbar+sidebar+footer), `auth-layout/` |
| `pages/` | `dashboard/`, `authentication/`, `errors/` |
| `providers/` | Hanya `BreakpointsProvider.tsx` (helper breakpoint MUI, bukan state domain) |
| `routes/` | `paths.ts`, `router.tsx`, `sitemap.ts` (menu sidebar) |
| `theme/` | Kustomisasi tema MUI |

**Tidak ada** folder `hooks/`, `services/`, `api/`, atau `store/` — semua ini harus dibuat baru saat migrasi.

### Halaman yang sudah ada
| Route | File | Status |
|---|---|---|
| `/` | `pages/dashboard/Dashboard.vue`→`Dashboard.tsx` | **(b) Placeholder** — grid 9 widget lengkap secara struktur, tapi semua data dari `src/data/*.ts` (dummy sales/e-commerce), tidak ada API wiring |
| `/authentication/sign-in` | `pages/authentication/SignIn.tsx` | **(b) Placeholder** — form ada, submit cuma `navigate()`, tidak ada validasi/API call |
| `/authentication/sign-up` | `pages/authentication/SignUp.tsx` | **(b) Placeholder** — sama seperti sign-in |
| `*` (404) | `pages/errors/Page404.tsx` | **(a) Selesai** (halaman utilitas, masih branding template) |
| (menu sidebar tanpa route nyata) | `routes/sitemap.ts` — Leaderboard, Order, Products, Sales Report, Messages, Settings, Sign Out | **(c) Stub** — semua `path:'#!'`, tidak ada page/route file |

### Pola state management & data-fetching
**Belum ada sama sekali** — tidak ada Redux/Zustand/Context untuk domain state, tidak ada axios/fetch/React Query/SWR, tidak ada base URL/interceptor config. Satu-satunya Context (`BreakpointsProvider`) murni untuk breakpoint UI.

Pola data saat ini: widget import array/object statis dari `src/data/*.ts` dan render langsung sebagai props (lihat contoh `Sales.tsx` + `data/sales.ts`). Alias import pakai path bare tanpa prefix (`components/...`, `data/...`) via `vite-tsconfig-paths` — konvensi ini sebaiknya diikuti untuk folder `hooks/`/`services/`/`store/` baru.

**Rekomendasi saat migrasi:** perlu dibuat dari nol — `src/services/` (axios instance + interceptor Bearer token, mengikuti pola `frontend/src/services/api.js` yang lama tapi fix bug env var), `src/hooks/` (data-fetching hooks), dan state global untuk auth/session (Context atau Zustand, karena template belum commit ke satu library tertentu).

---

## 4. Tabel Ringkasan Migrasi

| Endpoint Backend | Dipakai di Halaman FE Lama | Sudah ada di new-frontend? | Catatan |
|---|---|---|---|
| `POST /api/auth/register` | Register.vue | Belum | — |
| `POST /api/auth/login` | Login.vue | Belum | SignIn.tsx baru placeholder UI, belum wired |
| `GET /api/auth/me` | — (dead code, `fetchProfile` tak pernah dipanggil) | Belum | Perlu dipakai ulang untuk validasi token saat refresh |
| `GET /api/admin/users` | UserManagement.vue, UserForm.vue, AssignBmsForm.vue | Belum | — |
| `POST /api/admin/users` | UserManagement.vue, UserForm.vue | Belum | — |
| `PATCH /api/admin/users/:id` | UserManagement.vue, UserForm.vue | Belum | — |
| `PATCH /api/admin/users/:id/reset-password` | UserManagement.vue, UserResetPassword.vue | Belum | — |
| `DELETE /api/admin/users/:id` | UserManagement.vue | Belum | — |
| `GET /api/users?search=` | Collaborators.vue | Belum | — |
| `GET /api/bms` | BmsConfig.vue, BmsForm.vue, PackForm.vue, AssignBms.vue, Collaborators.vue | Belum | — |
| `GET /api/bms/:bmsId` | Collaborators.vue | Belum | — |
| `GET /api/bms/:bmsId/packs` | — (dead code) | Belum | — |
| `POST /api/bms` | BmsForm.vue | Belum | — |
| `PUT /api/bms/:bmsId` | BmsForm.vue | Belum | — |
| `DELETE /api/bms/:bmsId` | — (dead code) | Belum | — |
| `PATCH /api/bms/:bmsId/assign` | AssignBmsForm.vue | Belum | — |
| `PATCH /api/bms/:bmsId/verify` | AssignBms.vue | Belum | — |
| `PATCH /api/bms/:bmsId/suspend` | AssignBms.vue | Belum | — |
| `PATCH /api/bms/:bmsId/transfer` | — (tidak dipakai FE lama sama sekali) | Belum | Fitur backend ada, FE lama belum implementasi UI-nya |
| `POST /api/bms/:bmsId/collaborators` | Collaborators.vue | Belum | — |
| `DELETE /api/bms/:bmsId/collaborators` | Collaborators.vue | Belum | — |
| `GET /api/packs` | Dashboard.vue, PackConfig.vue, PackDetail.vue, PackForm.vue, HeaderStats.vue | Belum | — |
| `GET /api/packs/presets` | — (tidak dipakai FE lama) | Belum | ⚠️ **Backend stub kosong/broken**, jangan diintegrasikan sebelum diperbaiki |
| `GET /api/packs/:packId` | — (tidak dipanggil langsung; FE lama pakai `GET /packs` + filter) | Belum | Pertimbangkan dipakai langsung di new-frontend untuk halaman detail |
| `POST /api/packs` | PackForm.vue | Belum | — |
| `PUT /api/packs/:packId` | PackForm.vue | Belum | — |
| `DELETE /api/packs/:packId` | PackConfig.vue | Belum | — |
| `GET /api/cells/:packId` | — (tidak dipanggil; PackDetail hanya pakai data socket) | Belum | — |
| `GET /api/cells/:packId/pack-log` | — (tidak dipanggil) | Belum | — |
| `GET /api/cells/:packId/:cellId/history` | — (dead code, `fetchCellHistory` tak pernah dipanggil) | Belum | **Gap fungsional di FE lama** — history hilang saat refresh karena hanya andalkan socket buffer. Rekomendasi: new-frontend pakai endpoint ini |
| `GET /api/cells/:packId/:cellId/batches` | — (tidak dipakai FE lama) | Belum | Berguna untuk grafik jangka panjang di new-frontend |
| `GET /api/cells/:packId/:cellId/stats` | — (tidak dipakai FE lama) | Belum | Berguna untuk kartu ringkasan statistik |
| `GET /api/alerts` | Alerts.vue | Belum | — |
| `PUT /api/alerts/:id/acknowledge` | Alerts.vue | Belum | — |
| `GET /api/bms-models` | BmsForm.vue, PackForm.vue | Belum | ⚠️ Endpoint tanpa auth sama sekali di backend |
| `POST /api/bms-models` | — (dead code) | Belum | ⚠️ Endpoint tanpa auth sama sekali di backend |
| `PUT /api/bms-models/:id` | — (tidak dipakai FE lama) | Belum | ⚠️ Endpoint tanpa auth sama sekali di backend |
| `DELETE /api/bms-models/:id` | — (tidak dipakai FE lama) | Belum | ⚠️ Endpoint tanpa auth sama sekali di backend |
| `GET /health` | — (tidak dipakai FE) | Belum | Bisa dipakai untuk health-check monitoring |
| Socket.IO `cell:update` | Dashboard.vue, PackDetail.vue, HeaderStats.vue | Belum | Real-time core feature, wajib di-porting |
| Socket.IO `cell:alert` | useSocket.js (cuma console.log, tidak surfaced ke UI) | Belum | Peluang perbaikan UX di new-frontend |
| Socket.IO `join:pack` | PackDetail.vue | Belum | Catatan: saat ini server emit global (`io.emit`), room join belum benar-benar men-scope data di backend |

---

## Catatan Risiko Migrasi (ringkasan lintas bagian)

1. **`GET /api/packs/presets`** di backend adalah stub kosong — akan hang/timeout. Perbaiki backend dulu sebelum dipakai FE baru.
2. **`/api/bms-models` CRUD** sama sekali tanpa proteksi auth — tidak konsisten dengan modul lain, sebaiknya ditambahkan `protect`/`isAdmin` sebelum atau saat migrasi.
3. **`backend/src/models/BatteryPack.js`** kemungkinan model legacy — konfirmasi apakah masih dipakai sebelum ikut di-porting logikanya.
4. **Bug env var di FE lama** (`import.meta.env.VITE_*` vs `VUE_APP_*` punya Vue CLI) — pastikan new-frontend (Vite, jadi `import.meta.env.VITE_*` justru benar secara konvensi) dikonfigurasi eksplisit dan didokumentasikan, jangan diwarisi bug yang sama.
5. **Gap fungsional**: histori cell di FE lama hanya dari socket buffer (hilang saat refresh) — endpoint `history`/`batches`/`stats` sudah ada di backend tapi tidak dipakai. New-frontend sebaiknya memanfaatkan endpoint ini untuk chart histori yang persist.
6. **Route rusak** di FE lama: `AssignBms.vue`/`AssignBmsForm.vue` mengarah ke path `/admin/assign-pack*` yang sudah tidak ada (harusnya `/admin/assign-bms*`) — jangan ikut disalin polanya.
7. **Komponen chart yang sudah lengkap tapi orphan** di FE lama (`CardBarChart.vue`, `CardLineChart.vue`, `CardPageVisits.vue`) — sudah wired ke `bmsStore`, kemungkinan berguna sebagai referensi desain chart SoC/voltage untuk new-frontend meskipun tidak pernah dipasang di UI lama.
8. **New-frontend belum punya lapisan data sama sekali** (tidak ada services/hooks/store) — ini harus dibangun dari nol; tidak ada pola existing yang harus "diikuti", jadi keputusan arsitektur (axios vs fetch, Context vs Zustand, dsb) bebas ditentukan di awal migrasi.
9. Socket.IO room `pack:${packId}` di-join client tapi server saat ini emit global (`io.emit`, bukan `io.to(room).emit`) — scoping per-pack belum benar-benar berfungsi di backend, perlu diperbaiki kalau ingin true room-scoped real-time di new-frontend.
