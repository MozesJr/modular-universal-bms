<template>
  <!--
    PackCard.vue — BMS Pack summary card untuk Dashboard overview
    Mengikuti pola Vue Notus: shadow-lg rounded, blueGray palette
    Klik seluruh kartu → navigasi ke Pack Detail
  -->
  <div
    class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded cursor-pointer hover:shadow-xl transition-shadow duration-300"
    @click="$emit('click')"
  >
    <!-- Accent bar atas (warna berdasarkan status) -->
    <div class="h-1 w-full rounded-t" :class="accentBar"></div>

    <!-- Card Header -->
    <div class="px-4 py-4 border-b border-blueGray-100">
      <div class="flex justify-between items-start">
        <!-- Kiri: Pack info -->
        <div class="flex-1 min-w-0 mr-3">
          <span
            class="inline-block text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mb-1"
          >
            {{ pack.pack_id }}
          </span>
          <h3 class="text-sm font-bold text-blueGray-700 truncate">
            {{ pack.name || "Unnamed Pack" }}
          </h3>
          <p class="text-xs text-blueGray-400 mt-0.5">
            {{ pack.chemistry || "LiFePO4" }} ·
            {{ pack.cell_count || cells.length }}S
          </p>
        </div>

        <!-- Kanan: Status + alert -->
        <div class="flex flex-col items-end gap-1 shrink-0">
          <!-- ESP32 status -->
          <span
            class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
            :class="
              isStreaming
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-blueGray-100 text-blueGray-400'
            "
          >
            <span class="relative flex h-1.5 w-1.5">
              <span
                v-if="isStreaming"
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-1.5 w-1.5"
                :class="isStreaming ? 'bg-emerald-500' : 'bg-blueGray-300'"
              ></span>
            </span>
            {{ isStreaming ? "ESP32 Live" : "Offline" }}
          </span>
          <!-- Alert badge -->
          <span
            v-if="alerts.length > 0"
            class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200"
          >
            <i class="fas fa-exclamation-triangle text-xs"></i>
            {{ alerts.length }} Alert
          </span>
        </div>
      </div>
    </div>

    <!-- Card Body: 3-column metrics -->
    <div class="flex divide-x divide-blueGray-100">
      <!-- Avg SoC -->
      <div class="flex-1 px-4 py-4 text-center">
        <p
          class="text-xs font-bold text-blueGray-400 uppercase tracking-wider mb-1"
        >
          Avg SoC
        </p>
        <p
          class="text-xl font-bold font-mono"
          :class="
            avgSoC > 60
              ? 'text-emerald-500'
              : avgSoC > 30
              ? 'text-amber-500'
              : 'text-red-500'
          "
        >
          {{ avgSoC.toFixed(0)
          }}<span class="text-xs font-normal text-blueGray-400">%</span>
        </p>
        <!-- SoC bar -->
        <div
          class="w-full h-1 bg-blueGray-100 rounded-full overflow-hidden mt-2"
        >
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="
              avgSoC > 60
                ? 'bg-emerald-400'
                : avgSoC > 30
                ? 'bg-amber-400'
                : 'bg-red-400'
            "
            :style="{ width: Math.min(avgSoC, 100) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Max Temp -->
      <div class="flex-1 px-4 py-4 text-center">
        <p
          class="text-xs font-bold text-blueGray-400 uppercase tracking-wider mb-1"
        >
          Max Temp
        </p>
        <p
          class="text-xl font-bold font-mono"
          :class="
            maxTemp > 45
              ? 'text-red-500'
              : maxTemp > 35
              ? 'text-amber-500'
              : 'text-blueGray-700'
          "
        >
          {{ maxTemp.toFixed(1)
          }}<span class="text-xs font-normal text-blueGray-400">°C</span>
        </p>
        <i
          class="fas fa-thermometer-half text-sm mt-2"
          :class="
            maxTemp > 45
              ? 'text-red-400'
              : maxTemp > 35
              ? 'text-amber-400'
              : 'text-blueGray-200'
          "
        ></i>
      </div>

      <!-- Δ Voltage -->
      <div class="flex-1 px-4 py-4 text-center">
        <p
          class="text-xs font-bold text-blueGray-400 uppercase tracking-wider mb-1"
        >
          Δ Volt
        </p>
        <p
          class="text-xl font-bold font-mono"
          :class="
            deltaV > 0.1
              ? 'text-red-500'
              : deltaV > 0.05
              ? 'text-amber-500'
              : 'text-emerald-500'
          "
        >
          {{ deltaV.toFixed(3)
          }}<span class="text-xs font-normal text-blueGray-400">V</span>
        </p>
        <p
          class="text-xs font-bold mt-1"
          :class="
            deltaV > 0.1
              ? 'text-red-400'
              : deltaV > 0.05
              ? 'text-amber-400'
              : 'text-emerald-400'
          "
        >
          {{
            deltaV > 0.1 ? "⚠ Imbalance" : deltaV > 0.05 ? "Watch" : "Balanced"
          }}
        </p>
      </div>
    </div>

    <!-- Card Footer: cell count + voltage range -->
    <div
      class="px-4 py-2 bg-blueGray-50 rounded-b border-t border-blueGray-100 flex items-center justify-between"
    >
      <span class="text-xs text-blueGray-400 font-mono">
        <i class="fas fa-microchip mr-1"></i>
        {{ cells.length }} / {{ pack.cell_count || "?" }} sel aktif
      </span>
      <span
        v-if="cells.length"
        class="text-xs font-mono flex items-center gap-2"
      >
        <span class="text-emerald-500 font-bold">↑ {{ maxV.toFixed(3) }}V</span>
        <span class="text-blue-400 font-bold">↓ {{ minV.toFixed(3) }}V</span>
      </span>
      <!-- Hover hint -->
      <span
        class="text-xs text-indigo-400 font-bold hidden group-hover:inline-flex items-center gap-1"
      >
        Detail <i class="fas fa-chevron-right text-xs"></i>
      </span>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";

export default {
  name: "PackCard",
  emits: ["click"],
  props: {
    pack: { type: Object, required: true },
    cells: { type: Array, default: () => [] },
    alerts: { type: Array, default: () => [] },
  },
  setup(props) {
    const isStreaming = computed(() => props.cells.length > 0);

    const voltages = computed(() =>
      props.cells
        .map((c) => c.voltage ?? c.metrics?.voltage ?? 0)
        .filter(Boolean),
    );
    const temps = computed(() =>
      props.cells
        .map((c) => c.temperature ?? c.metrics?.temperature ?? 0)
        .filter(Boolean),
    );
    const socs = computed(() =>
      props.cells.map((c) => c.soc ?? c.metrics?.soc ?? 0),
    );

    const avgSoC = computed(() =>
      socs.value.length
        ? socs.value.reduce((a, b) => a + b, 0) / socs.value.length
        : 0,
    );
    const maxTemp = computed(() =>
      temps.value.length ? Math.max(...temps.value) : 0,
    );
    const maxV = computed(() =>
      voltages.value.length ? Math.max(...voltages.value) : 0,
    );
    const minV = computed(() =>
      voltages.value.length ? Math.min(...voltages.value) : 0,
    );
    const deltaV = computed(() => maxV.value - minV.value);

    const overallStatus = computed(() => {
      if (props.alerts.length > 0) return "FAULT";
      if (maxTemp.value > 45 || deltaV.value > 0.1) return "WARN";
      if (isStreaming.value) return "OK";
      return "OFFLINE";
    });

    const accentBar = computed(
      () =>
        ({
          FAULT: "bg-red-400",
          WARN: "bg-amber-400",
          OK: "bg-emerald-400",
          OFFLINE: "bg-blueGray-200",
        }[overallStatus.value]),
    );

    return { isStreaming, avgSoC, maxTemp, maxV, minV, deltaV, accentBar };
  },
};
</script>
