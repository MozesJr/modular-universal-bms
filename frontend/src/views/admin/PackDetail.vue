<template>
  <div class="flex flex-wrap mt-4">
    <!-- ══ SECTION 1 — Pack Selector Bar ══ -->
    <div class="w-full px-4 mb-6">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded"
      >
        <div
          class="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div class="flex items-center gap-4">
            <div
              class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm shrink-0"
            >
              <i class="fas fa-bolt text-indigo-500 text-lg"></i>
            </div>
            <div>
              <h3 class="font-bold text-blueGray-800 text-lg leading-tight">
                {{
                  bmsStore.selectedPack
                    ? bmsStore.selectedPack.name || bmsStore.selectedPackId
                    : "Select a Pack"
                }}
              </h3>
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                  :class="
                    bmsStore.cellsForPack.length
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blueGray-100 text-blueGray-400'
                  "
                >
                  <span class="relative flex h-1.5 w-1.5">
                    <span
                      v-if="bmsStore.cellsForPack.length"
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full h-1.5 w-1.5"
                      :class="
                        bmsStore.cellsForPack.length
                          ? 'bg-emerald-500'
                          : 'bg-blueGray-300'
                      "
                    ></span>
                  </span>
                  {{
                    bmsStore.cellsForPack.length ? "ESP32 Streaming" : "Standby"
                  }}
                </span>
                <span
                  v-if="bmsStore.selectedPack"
                  class="text-xs text-blueGray-400 font-mono"
                >
                  {{ bmsStore.selectedPackId }} ·
                  {{ bmsStore.selectedPack.chemistry || "LiFePO4" }} ·
                  {{ bmsStore.selectedPack.cell_count }}S
                </span>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative">
              <select
                v-model="bmsStore.selectedPackId"
                @change="handlePackChange"
                class="appearance-none bg-white border border-blueGray-300 text-blueGray-700 text-sm font-semibold rounded pl-3 pr-8 py-2 shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option v-if="!bmsStore.packs.length" disabled value="">
                  Loading…
                </option>
                <option
                  v-for="p in bmsStore.packs"
                  :key="p.pack_id"
                  :value="p.pack_id"
                >
                  📦 {{ p.name || "Unnamed" }} [{{ p.cell_count }}S]
                </option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blueGray-400"
              >
                <i class="fas fa-chevron-down text-xs"></i>
              </div>
            </div>
            <button
              @click="exportData('csv')"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blueGray-600 bg-white border border-blueGray-200 rounded shadow-sm hover:bg-blueGray-50 transition-colors"
            >
              <i class="fas fa-download"></i> CSV
            </button>
            <button
              @click="exportData('json')"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded shadow-sm hover:bg-indigo-100 transition-colors"
            >
              <i class="fas fa-code"></i> JSON
            </button>
          </div>
        </div>
        <div
          v-if="bmsStore.selectedPack"
          class="border-t border-blueGray-100 px-6 py-3 bg-blueGray-50 rounded-b flex flex-wrap gap-6"
        >
          <div v-for="info in packInfo" :key="info.label" class="flex flex-col">
            <span
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider"
              >{{ info.label }}</span
            >
            <span
              class="text-sm font-bold font-mono text-blueGray-700 mt-0.5"
              >{{ info.value }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- ══ SECTION 2 — Quick Stats ══ -->
    <template v-if="bmsStore.cellsForPack.length">
      <div class="w-full lg:w-3/12 xl:w-3/12 px-4 mb-6">
        <card-stats
          statSubtitle="Highest Cell"
          :statTitle="quickStats.maxV + ' V'"
          statArrow="up"
          statPercent=""
          statPercentColor="text-red-500"
          :statDescription="'Cell ' + quickStats.maxVIdx"
          statIconName="fas fa-arrow-up"
          statIconColor="bg-red-400"
        />
      </div>
      <div class="w-full lg:w-3/12 xl:w-3/12 px-4 mb-6">
        <card-stats
          statSubtitle="Lowest Cell"
          :statTitle="quickStats.minV + ' V'"
          statArrow="down"
          statPercent=""
          statPercentColor="text-blue-500"
          :statDescription="'Cell ' + quickStats.minVIdx"
          statIconName="fas fa-arrow-down"
          statIconColor="bg-blue-400"
        />
      </div>
      <div class="w-full lg:w-3/12 xl:w-3/12 px-4 mb-6">
        <card-stats
          statSubtitle="Delta / Imbalance"
          :statTitle="quickStats.delta + ' V'"
          statArrow=""
          statPercent=""
          :statPercentColor="quickStats.deltaColor"
          :statDescription="quickStats.deltaLabel"
          statIconName="fas fa-balance-scale"
          :statIconColor="
            parseFloat(quickStats.delta) > 0.1 ? 'bg-red-400' : 'bg-emerald-400'
          "
        />
      </div>
      <div class="w-full lg:w-3/12 xl:w-3/12 px-4 mb-6">
        <card-stats
          statSubtitle="Max Temp"
          :statTitle="quickStats.maxTemp + ' °C'"
          statArrow=""
          statPercent=""
          statPercentColor="text-orange-500"
          :statDescription="'Avg SoC ' + quickStats.avgSoC + '%'"
          statIconName="fas fa-thermometer-half"
          statIconColor="bg-orange-400"
        />
      </div>
    </template>

    <!-- ══ SECTION 3 — Charts ══ -->
    <div class="w-full xl:w-8/12 px-4 mb-6">
      <div
        class="relative flex flex-col min-w-0 break-words bg-blueGray-700 w-full shadow-lg rounded"
      >
        <div class="rounded-t mb-0 px-4 py-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h6
                class="uppercase text-blueGray-100 mb-0.5 text-xs font-semibold"
              >
                Real-time
              </h6>
              <h2 class="text-white text-xl font-semibold">
                Cell Voltage History
              </h2>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="cell in bmsStore.cellsForPack.slice(0, 8)"
                :key="cell.cell_id"
                @click="toggleCell(cell.cell_id)"
                class="text-xs font-bold px-2 py-1 rounded border transition-all"
                :class="
                  selectedCells.includes(cell.cell_id)
                    ? 'bg-white text-blueGray-700 border-white'
                    : 'bg-transparent text-blueGray-300 border-blueGray-500 hover:border-blueGray-300'
                "
              >
                C{{ cell.cell_id }}
              </button>
            </div>
          </div>
        </div>
        <div class="p-4 flex-auto">
          <div class="relative h-350-px">
            <canvas id="detail-line-chart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full xl:w-4/12 px-4 mb-6">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded"
      >
        <div class="rounded-t mb-0 px-4 py-3 bg-transparent">
          <h6 class="uppercase text-blueGray-400 mb-0.5 text-xs font-semibold">
            Pack Status
          </h6>
          <h2 class="text-blueGray-700 text-xl font-semibold">
            State of Charge (%)
          </h2>
        </div>
        <div class="p-4 flex-auto">
          <div class="relative h-350-px">
            <canvas id="detail-bar-chart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ SECTION 4 — Alert Log ══ -->
    <div class="w-full px-4 mb-6">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded"
      >
        <div
          class="rounded-t mb-0 px-4 py-3 border-0 flex items-center justify-between"
        >
          <h3
            class="font-semibold text-base text-blueGray-700 flex items-center gap-2"
          >
            <i class="fas fa-bell text-red-400"></i>
            Alert Log — {{ bmsStore.selectedPackId || "—" }}
          </h3>
          <span class="text-xs font-mono text-blueGray-400">
            {{ packAlerts.length }} event{{
              packAlerts.length !== 1 ? "s" : ""
            }}
          </span>
        </div>
        <div class="block w-full overflow-x-auto">
          <table class="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th
                  v-for="h in [
                    'Cell',
                    'Voltage',
                    'Current',
                    'Temp',
                    'SoC',
                    'Time',
                  ]"
                  :key="h"
                  class="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left"
                >
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!packAlerts.length">
                <td
                  colspan="6"
                  class="px-6 py-8 text-center text-blueGray-400 text-sm"
                >
                  No active alerts untuk pack ini
                </td>
              </tr>
              <tr v-for="(alert, i) in packAlerts.slice(0, 10)" :key="i">
                <th
                  class="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left text-red-500 font-bold"
                >
                  Cell {{ alert.cell_id }}
                </th>
                <td
                  class="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 font-mono"
                >
                  {{
                    (alert.metrics?.voltage ?? alert.voltage ?? 0).toFixed(3)
                  }}
                  V
                </td>
                <td
                  class="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 font-mono"
                >
                  {{
                    (alert.metrics?.current ?? alert.current ?? 0).toFixed(2)
                  }}
                  A
                </td>
                <td
                  class="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 font-mono"
                  :class="
                    (alert.metrics?.temperature ?? 0) > 45
                      ? 'text-red-500 font-bold'
                      : ''
                  "
                >
                  {{
                    (
                      alert.metrics?.temperature ??
                      alert.temperature ??
                      0
                    ).toFixed(1)
                  }}
                  °C
                </td>
                <td
                  class="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 font-mono"
                >
                  {{ alert.metrics?.soc ?? alert.soc ?? 0 }}%
                </td>
                <td
                  class="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-400 font-mono"
                >
                  {{ new Date(alert.timestamp).toLocaleString("id-ID") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══ SECTION 5 — Cell Balancing Matrix ══ -->
    <div class="w-full px-4 mb-12">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded mb-4"
      >
        <div class="px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="h-8 w-8 rounded bg-emerald-100 flex items-center justify-center"
            >
              <i class="fas fa-th-large text-emerald-500 text-sm"></i>
            </div>
            <div>
              <h3 class="font-bold text-blueGray-800 text-base">
                Symmetric Cell Balancing Matrix
              </h3>
              <p class="text-xs text-blueGray-400 mt-0.5">
                Individual cell monitoring — real-time per sensor
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span
              v-if="bmsStore.cellsForPack.length"
              class="text-xs bg-blueGray-100 text-blueGray-500 font-mono px-2 py-1 rounded font-bold"
            >
              {{ bmsStore.cellsForPack.length }} cells
            </span>
            <span
              class="text-xs bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono px-2 py-1 rounded font-bold"
            >
              {{ bmsStore.selectedPackId || "NO_CLUSTER" }}
            </span>
          </div>
        </div>
        <div
          v-if="bmsStore.cellsForPack.length"
          class="border-t border-blueGray-100 px-6 py-3 bg-blueGray-50 rounded-b grid grid-cols-4 gap-4"
        >
          <div class="text-center">
            <p
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider"
            >
              Avg Voltage
            </p>
            <p class="text-base font-bold font-mono text-blueGray-700 mt-0.5">
              {{ avgVoltage }} V
            </p>
          </div>
          <div class="text-center">
            <p
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider"
            >
              Avg SoC
            </p>
            <p
              class="text-base font-bold font-mono mt-0.5"
              :class="
                parseFloat(quickStats.avgSoC) > 60
                  ? 'text-emerald-500'
                  : parseFloat(quickStats.avgSoC) > 30
                  ? 'text-amber-500'
                  : 'text-red-500'
              "
            >
              {{ quickStats.avgSoC }}%
            </p>
          </div>
          <div class="text-center">
            <p
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider"
            >
              Max Temp
            </p>
            <p
              class="text-base font-bold font-mono mt-0.5"
              :class="
                parseFloat(quickStats.maxTemp) > 45
                  ? 'text-red-500'
                  : 'text-blueGray-700'
              "
            >
              {{ quickStats.maxTemp }} °C
            </p>
          </div>
          <div class="text-center">
            <p
              class="text-xs font-bold text-blueGray-400 uppercase tracking-wider"
            >
              Balance Status
            </p>
            <p
              class="text-base font-bold font-mono mt-0.5"
              :class="
                parseFloat(quickStats.delta) > 0.1
                  ? 'text-red-500'
                  : parseFloat(quickStats.delta) > 0.05
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              "
            >
              {{
                parseFloat(quickStats.delta) > 0.1
                  ? "⚠ Imbalanced"
                  : parseFloat(quickStats.delta) > 0.05
                  ? "Watch"
                  : "✓ Balanced"
              }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="bmsStore.cellsForPack.length" class="flex flex-wrap -mx-3">
        <div
          v-for="cell in bmsStore.cellsForPack"
          :key="`${cell.pack_id}:${cell.cell_id}`"
          class="w-full sm:w-6/12 lg:w-3/12 px-3 mb-6"
        >
          <div
            class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-md rounded border border-blueGray-100 hover:shadow-lg transition-all duration-300"
          >
            <div
              class="h-1 w-full rounded-t"
              :class="
                getCellStatus(cell) === 'FAULT'
                  ? 'bg-red-400'
                  : getCellStatus(cell) === 'WARN'
                  ? 'bg-amber-400'
                  : getCellStatus(cell) === 'HOT'
                  ? 'bg-orange-400'
                  : 'bg-emerald-400'
              "
            ></div>
            <div
              class="px-4 py-3 border-b border-blueGray-100 flex items-center justify-between"
              :class="
                getCellStatus(cell) === 'FAULT'
                  ? 'bg-red-50'
                  : getCellStatus(cell) === 'WARN'
                  ? 'bg-amber-50'
                  : getCellStatus(cell) === 'HOT'
                  ? 'bg-orange-50'
                  : 'bg-emerald-50'
              "
            >
              <div class="flex items-center gap-2">
                <i :class="getBatteryIcon(cell)" class="text-sm"></i>
                <span class="text-sm font-extrabold text-blueGray-700"
                  >Cell {{ cell.cell_id }}</span
                >
              </div>
              <span
                class="text-xs font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide"
                :class="
                  getCellStatus(cell) === 'FAULT'
                    ? 'bg-red-100 text-red-600'
                    : getCellStatus(cell) === 'WARN'
                    ? 'bg-amber-100 text-amber-600'
                    : getCellStatus(cell) === 'HOT'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-emerald-100 text-emerald-600'
                "
              >
                {{ getCellStatus(cell) }}
              </span>
            </div>
            <div
              class="grid grid-cols-2 divide-x divide-blueGray-100 border-b border-blueGray-100"
            >
              <div class="px-4 py-3 text-center">
                <p
                  class="text-xs font-bold text-blueGray-400 uppercase tracking-wide mb-1"
                >
                  Voltage
                </p>
                <p
                  class="text-lg font-black font-mono text-blueGray-800 leading-tight"
                >
                  {{ fmtV(cell.voltage ?? cell.metrics?.voltage)
                  }}<span class="text-xs font-normal text-blueGray-400">V</span>
                </p>
              </div>
              <div class="px-4 py-3 text-center">
                <p
                  class="text-xs font-bold text-blueGray-400 uppercase tracking-wide mb-1"
                >
                  Current
                </p>
                <p
                  class="text-lg font-black font-mono text-blueGray-800 leading-tight"
                >
                  {{ fmtA(cell.current ?? cell.metrics?.current)
                  }}<span class="text-xs font-normal text-blueGray-400">A</span>
                </p>
              </div>
            </div>
            <div
              class="grid grid-cols-2 divide-x divide-blueGray-100 border-b border-blueGray-100"
            >
              <div class="px-4 py-3 text-center">
                <p
                  class="text-xs font-bold text-blueGray-400 uppercase tracking-wide mb-1"
                >
                  Temp
                </p>
                <p
                  class="text-base font-bold font-mono leading-tight"
                  :class="
                    (cell.temperature ?? cell.metrics?.temperature ?? 0) > 45
                      ? 'text-red-500'
                      : 'text-blueGray-700'
                  "
                >
                  {{ cell.temperature ?? cell.metrics?.temperature ?? 0
                  }}<span class="text-xs font-normal text-blueGray-400"
                    >°C</span
                  >
                </p>
              </div>
              <div class="px-4 py-3 text-center">
                <p
                  class="text-xs font-bold text-blueGray-400 uppercase tracking-wide mb-1"
                >
                  SoC
                </p>
                <div class="flex flex-col items-center gap-1">
                  <p
                    class="text-base font-bold font-mono leading-tight"
                    :class="
                      (cell.soc ?? cell.metrics?.soc ?? 0) > 60
                        ? 'text-emerald-500'
                        : (cell.soc ?? cell.metrics?.soc ?? 0) > 30
                        ? 'text-amber-500'
                        : 'text-red-500'
                    "
                  >
                    {{ cell.soc ?? cell.metrics?.soc ?? 0
                    }}<span class="text-xs font-normal text-blueGray-400"
                      >%</span
                    >
                  </p>
                  <div
                    class="w-full h-1 bg-blueGray-100 rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="
                        (cell.soc ?? cell.metrics?.soc ?? 0) > 60
                          ? 'bg-emerald-400'
                          : (cell.soc ?? cell.metrics?.soc ?? 0) > 30
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      "
                      :style="{
                        width:
                          Math.min(cell.soc ?? cell.metrics?.soc ?? 0, 100) +
                          '%',
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="px-4 py-2 border-b border-blueGray-100 flex items-center gap-2"
            >
              <span
                class="text-xs font-bold text-blueGray-400 uppercase tracking-wide shrink-0"
                >SoH</span
              >
              <div
                class="flex-1 h-1.5 bg-blueGray-100 rounded-full overflow-hidden"
              >
                <div
                  class="h-full rounded-full bg-indigo-400 transition-all duration-500"
                  :style="{
                    width:
                      Math.min(cell.soh ?? cell.metrics?.soh ?? 100, 100) + '%',
                  }"
                ></div>
              </div>
              <span
                class="text-xs font-bold font-mono text-blueGray-600 shrink-0"
              >
                {{ cell.soh ?? cell.metrics?.soh ?? 100 }}%
              </span>
            </div>
            <div class="px-3 py-2 bg-blueGray-50 rounded-b">
              <svg
                class="w-full overflow-visible"
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
                style="height: 32px"
              >
                <defs>
                  <linearGradient
                    :id="`sg-${cell.cell_id}`"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path
                  v-if="getSparkFill(cell)"
                  :d="getSparkFill(cell)"
                  :fill="`url(#sg-${cell.cell_id})`"
                />
                <polyline
                  v-if="getSparkPoints(cell)"
                  :points="getSparkPoints(cell)"
                  fill="none"
                  stroke="#6366f1"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  v-else
                  x1="0"
                  y1="12"
                  x2="100"
                  y2="12"
                  stroke="#cbd5e1"
                  stroke-width="1"
                  stroke-dasharray="3,3"
                />
              </svg>
              <div
                class="flex justify-between text-xs text-blueGray-300 font-mono mt-0.5"
              >
                <span>{{
                  getHistoryLen(cell)
                    ? `-${(getHistoryLen(cell) - 1) * 2}s`
                    : "–"
                }}</span>
                <span>now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded"
      >
        <div
          class="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
          <div
            class="h-16 w-16 flex items-center justify-center rounded-full bg-blueGray-50 border border-blueGray-100 mb-4"
          >
            <i class="fas fa-satellite-dish text-2xl text-blueGray-300"></i>
          </div>
          <h4 class="text-blueGray-600 font-bold text-base mb-2">
            Awaiting Cluster Pipeline Stream
          </h4>
          <p class="text-xs text-blueGray-400 max-w-sm leading-relaxed">
            Pilih pack di dropdown atas, atau tunggu ESP32 mengirim data
            pertama.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { useRoute } from "vue-router";
import Chart from "chart.js";
import CardStats from "@/components/Cards/CardStats.vue";
import { useBmsStore } from "@/stores/bmsStore";
import { useSocket } from "@/composables/useSocket";

const CELL_COLORS = [
  "#4c51bf",
  "#ed64a6",
  "#48bb78",
  "#f6ad55",
  "#63b3ed",
  "#fc8181",
  "#b794f4",
  "#68d391",
];

export default {
  name: "pack-detail-page",
  components: { CardStats },
  setup() {
    const bmsStore = useBmsStore();
    const route = useRoute();
    const { connect, joinPack } = useSocket();

    const selectedCells = ref([]);
    let _lineInterval = null;
    let _barInterval = null;

    onMounted(async () => {
      connect();
      await bmsStore.fetchPacks();
      const queryPack = route.query.pack;
      if (queryPack) bmsStore.selectedPackId = queryPack;
      if (bmsStore.selectedPackId) {
        joinPack(bmsStore.selectedPackId);
        selectedCells.value = bmsStore.cellsForPack
          .slice(0, 4)
          .map((c) => c.cell_id);
      }
      await nextTick();
      initLineChart();
      initBarChart();
      _lineInterval = setInterval(refreshLineChart, 2000);
      _barInterval = setInterval(refreshBarChart, 3000);
    });

    onBeforeUnmount(() => {
      clearInterval(_lineInterval);
      clearInterval(_barInterval);
      destroyCharts();
    });

    async function handlePackChange() {
      if (bmsStore.selectedPackId) {
        joinPack(bmsStore.selectedPackId);
        selectedCells.value = bmsStore.cellsForPack
          .slice(0, 4)
          .map((c) => c.cell_id);
        await nextTick();
        destroyCharts();
        initLineChart();
        initBarChart();
      }
    }

    function toggleCell(cellId) {
      const idx = selectedCells.value.indexOf(cellId);
      if (idx === -1) {
        if (selectedCells.value.length < 8) selectedCells.value.push(cellId);
      } else selectedCells.value.splice(idx, 1);
    }

    const packInfo = computed(() => {
      const p = bmsStore.selectedPack;
      if (!p) return [];
      return [
        { label: "Pack ID", value: p.pack_id },
        { label: "Chemistry", value: p.chemistry || "LiFePO4" },
        { label: "Sel Total", value: `${p.cell_count || "?"}S` },
        { label: "V Min", value: `${p.min_voltage ?? "2.50"} V` },
        { label: "V Max", value: `${p.max_voltage ?? "3.65"} V` },
        { label: "T Max", value: `${p.max_temp_celsius ?? "60"} °C` },
        { label: "I Max", value: `${p.max_current_amps ?? "20"} A` },
      ];
    });

    const quickStats = computed(() => {
      const cells = bmsStore.cellsForPack;
      if (!cells.length)
        return {
          maxV: "—",
          minV: "—",
          delta: "0.000",
          maxVIdx: "—",
          minVIdx: "—",
          maxTemp: "0.0",
          avgSoC: "0",
          deltaColor: "text-emerald-500",
          deltaLabel: "No data",
        };
      const voltages = cells.map((c) => c.voltage ?? c.metrics?.voltage ?? 0);
      const temps = cells.map(
        (c) => c.temperature ?? c.metrics?.temperature ?? 0,
      );
      const socs = cells.map((c) => c.soc ?? c.metrics?.soc ?? 0);
      const maxV = Math.max(...voltages),
        minV = Math.min(...voltages);
      const delta = maxV - minV;
      return {
        maxV: maxV.toFixed(3),
        minV: minV.toFixed(3),
        delta: delta.toFixed(3),
        maxVIdx: voltages.indexOf(maxV) + 1,
        minVIdx: voltages.indexOf(minV) + 1,
        maxTemp: Math.max(...temps).toFixed(1),
        avgSoC: (socs.reduce((a, b) => a + b, 0) / socs.length).toFixed(0),
        deltaColor:
          delta > 0.1
            ? "text-red-500"
            : delta > 0.05
            ? "text-amber-500"
            : "text-emerald-500",
        deltaLabel:
          delta > 0.1
            ? "⚠ High imbalance"
            : delta > 0.05
            ? "Watch"
            : "Balanced",
      };
    });

    const avgVoltage = computed(() => {
      const cells = bmsStore.cellsForPack;
      if (!cells.length) return "—";
      const vs = cells.map((c) => c.voltage ?? c.metrics?.voltage ?? 0);
      return (vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(3);
    });

    const packAlerts = computed(() =>
      bmsStore.alerts.filter((a) => a.pack_id === bmsStore.selectedPackId),
    );

    function getCellStatus(cell) {
      const v = cell.voltage ?? cell.metrics?.voltage ?? 0;
      const t = cell.temperature ?? cell.metrics?.temperature ?? 0;
      if (v > 4.2 || v < 2.5) return "FAULT";
      if (t > 50) return "HOT";
      if (v > 4.1 || t > 45) return "WARN";
      return "OK";
    }

    function getBatteryIcon(cell) {
      const soc = cell.soc ?? cell.metrics?.soc ?? 0;
      if (soc > 75) return "fas fa-battery-full text-emerald-500";
      if (soc > 50) return "fas fa-battery-three-quarters text-emerald-400";
      if (soc > 25) return "fas fa-battery-half text-amber-400";
      return "fas fa-battery-quarter text-red-400";
    }

    const fmtV = (v) => (v != null ? Number(v).toFixed(3) : "0.000");
    const fmtA = (a) => (a != null ? Number(a).toFixed(2) : "0.00");

    function getSparkPoints(cell) {
      const raw = bmsStore.getCellHistory(cell.pack_id, cell.cell_id);
      if (!raw || raw.length < 2) return null;
      const vals = raw
        .map((r) => r.metrics?.voltage ?? r.voltage ?? 0)
        .filter(Boolean);
      if (vals.length < 2) return null;
      const mn = Math.min(...vals),
        mx = Math.max(...vals),
        rng = mx - mn || 0.001;
      return vals
        .map((v, i) => {
          const x = (i / (vals.length - 1)) * 100;
          const y = 20 - 2 - ((v - mn) / rng) * (20 - 4);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    }

    function getSparkFill(cell) {
      const pts = getSparkPoints(cell);
      if (!pts) return null;
      const arr = pts.split(" ");
      const first = arr[0].split(","),
        last = arr[arr.length - 1].split(",");
      return `M${first[0]},${first[1]} L${pts.replace(/ /g, " L")} L${
        last[0]
      },22 L${first[0]},22 Z`;
    }

    function getHistoryLen(cell) {
      return bmsStore.getCellHistory(cell.pack_id, cell.cell_id).length;
    }

    function exportData(format = "csv") {
      const cells = bmsStore.cellsForPack;
      if (!cells.length) return alert("Tidak ada data untuk di-export.");
      if (format === "json") {
        triggerDownload(
          new Blob([JSON.stringify(cells, null, 2)], {
            type: "application/json",
          }),
          `bms_${bmsStore.selectedPackId}_${Date.now()}.json`,
        );
      } else {
        const header =
          "pack_id,cell_id,voltage,current,temperature,soc,soh,timestamp\n";
        const rows = cells
          .map((c) =>
            [
              c.pack_id,
              c.cell_id,
              c.voltage ?? c.metrics?.voltage ?? 0,
              c.current ?? c.metrics?.current ?? 0,
              c.temperature ?? c.metrics?.temperature ?? 0,
              c.soc ?? c.metrics?.soc ?? 0,
              c.soh ?? c.metrics?.soh ?? 0,
              c.timestamp ?? "",
            ].join(","),
          )
          .join("\n");
        triggerDownload(
          new Blob([header + rows], { type: "text/csv" }),
          `bms_${bmsStore.selectedPackId}_${Date.now()}.csv`,
        );
      }
    }

    function triggerDownload(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    // ── FIX: Charts — ganti Map API ke plain object ───────────
    function buildLineDatasets() {
      const packId = bmsStore.selectedPackId;
      if (!packId) return { labels: [], datasets: [] };

      // FIX: Object.keys bukan [...bmsStore.cellHistory.keys()]
      const keys = Object.keys(bmsStore.cellHistory).filter(
        (k) =>
          k.startsWith(packId + ":") &&
          selectedCells.value.includes(Number(k.split(":")[1])),
      );

      const maxLen = keys.reduce((m, k) => {
        // FIX: bmsStore.cellHistory[k] bukan bmsStore.cellHistory.get(k)
        return Math.max(m, (bmsStore.cellHistory[k] || []).length);
      }, 0);

      const labels = Array.from({ length: maxLen }, (_, i) => {
        const ago = (maxLen - 1 - i) * 2;
        return ago === 0 ? "now" : `-${ago}s`;
      });

      const datasets = keys.map((k, idx) => {
        const cellId = k.split(":")[1];
        // FIX: plain object access
        const history = bmsStore.cellHistory[k] || [];
        const padded = Array(maxLen - history.length)
          .fill(null)
          .concat(history.map((r) => r.metrics?.voltage ?? r.voltage ?? null));
        return {
          label: `Cell ${cellId}`,
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0,
          backgroundColor: CELL_COLORS[idx % CELL_COLORS.length],
          borderColor: CELL_COLORS[idx % CELL_COLORS.length],
          data: padded,
        };
      });

      return { labels, datasets };
    }

    function initLineChart() {
      const el = document.getElementById("detail-line-chart");
      if (!el) return;
      const { labels, datasets } = buildLineDatasets();
      window._detailLineChart = new Chart(el.getContext("2d"), {
        type: "line",
        data: { labels, datasets },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          animation: { duration: 0 },
          legend: {
            labels: { fontColor: "white" },
            align: "end",
            position: "bottom",
          },
          tooltips: { mode: "index", intersect: false },
          scales: {
            xAxes: [
              {
                ticks: { fontColor: "rgba(255,255,255,.7)" },
                gridLines: { display: false },
              },
            ],
            yAxes: [
              {
                ticks: {
                  fontColor: "rgba(255,255,255,.7)",
                  suggestedMin: 2.0,
                  suggestedMax: 4.5,
                },
                scaleLabel: {
                  display: true,
                  labelString: "Voltage (V)",
                  fontColor: "white",
                },
                gridLines: {
                  color: "rgba(255,255,255,.15)",
                  drawBorder: false,
                },
              },
            ],
          },
        },
      });
    }

    function refreshLineChart() {
      if (!window._detailLineChart) return;
      const { labels, datasets } = buildLineDatasets();
      window._detailLineChart.data.labels = labels;
      window._detailLineChart.data.datasets = datasets;
      window._detailLineChart.update();
    }

    function buildBarData() {
      const cells = bmsStore.cellsForPack;
      if (!cells.length) return { labels: [], data: [], colors: [] };
      return {
        labels: cells.map((c) => `C${c.cell_id}`),
        data: cells.map((c) => c.soc ?? c.metrics?.soc ?? 0),
        colors: cells.map((c) => {
          const s = c.soc ?? c.metrics?.soc ?? 0;
          return s > 60 ? "#48bb78" : s > 30 ? "#f6ad55" : "#fc8181";
        }),
      };
    }

    function initBarChart() {
      const el = document.getElementById("detail-bar-chart");
      if (!el) return;
      const { labels, data, colors } = buildBarData();
      window._detailBarChart = new Chart(el.getContext("2d"), {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "SoC (%)",
              backgroundColor: colors,
              borderColor: colors,
              data,
              barThickness: 12,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          animation: { duration: 0 },
          legend: { display: false },
          scales: {
            xAxes: [
              {
                ticks: { fontColor: "rgba(0,0,0,.4)" },
                gridLines: { display: false },
              },
            ],
            yAxes: [
              {
                ticks: { min: 0, max: 100, fontColor: "rgba(0,0,0,.4)" },
                scaleLabel: {
                  display: true,
                  labelString: "%",
                  fontColor: "#718096",
                },
                gridLines: { color: "rgba(0,0,0,.05)", drawBorder: false },
              },
            ],
          },
        },
      });
    }

    function refreshBarChart() {
      if (!window._detailBarChart) return;
      const { labels, data, colors } = buildBarData();
      window._detailBarChart.data.labels = labels;
      window._detailBarChart.data.datasets[0].data = data;
      window._detailBarChart.data.datasets[0].backgroundColor = colors;
      window._detailBarChart.update();
    }

    function destroyCharts() {
      if (window._detailLineChart) {
        window._detailLineChart.destroy();
        window._detailLineChart = null;
      }
      if (window._detailBarChart) {
        window._detailBarChart.destroy();
        window._detailBarChart = null;
      }
    }

    watch(selectedCells, () => refreshLineChart(), { deep: true });

    return {
      bmsStore,
      selectedCells,
      packInfo,
      quickStats,
      avgVoltage,
      packAlerts,
      handlePackChange,
      toggleCell,
      exportData,
      getCellStatus,
      getBatteryIcon,
      fmtV,
      fmtA,
      getSparkPoints,
      getSparkFill,
      getHistoryLen,
    };
  },
};
</script>
