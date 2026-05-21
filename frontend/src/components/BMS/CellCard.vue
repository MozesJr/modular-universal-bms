<template>
  <div
    class="bg-white border border-blueGray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden"
  >
    <!-- Header -->
    <div
      class="px-4 pt-3 pb-2.5 flex justify-between items-center border-b border-blueGray-100"
      :class="statusBg"
    >
      <div class="flex items-center gap-1.5">
        <i :class="batteryIcon" class="text-xs"></i>
        <span class="text-xs font-extrabold text-blueGray-700 tracking-tight">
          Cell {{ cell.cell_id }}
        </span>
      </div>
      <span
        class="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide"
        :class="statusBadge"
      >
        {{ statusLabel }}
      </span>
    </div>

    <!-- Metrics grid -->
    <div class="p-4 flex-1 flex flex-col gap-3">
      <!-- Voltage + Current -->
      <div class="grid grid-cols-2 gap-3 pb-3 border-b border-blueGray-50">
        <div class="text-center">
          <p
            class="text-[10px] font-bold text-blueGray-400 uppercase tracking-tight"
          >
            Voltage
          </p>
          <p
            class="text-base font-black text-blueGray-800 font-mono leading-tight mt-0.5"
          >
            {{ fmtV(cell.voltage)
            }}<span class="text-[11px] font-normal text-blueGray-400 ml-0.5"
              >V</span
            >
          </p>
        </div>
        <div class="text-center">
          <p
            class="text-[10px] font-bold text-blueGray-400 uppercase tracking-tight"
          >
            Current
          </p>
          <p
            class="text-base font-black text-blueGray-800 font-mono leading-tight mt-0.5"
          >
            {{ fmtA(cell.current)
            }}<span class="text-[11px] font-normal text-blueGray-400 ml-0.5"
              >A</span
            >
          </p>
        </div>
      </div>

      <!-- Temp + SoC -->
      <div class="grid grid-cols-2 gap-3">
        <div class="text-center">
          <p
            class="text-[9px] font-bold text-blueGray-400 uppercase tracking-tight"
          >
            Temp
          </p>
          <p
            class="text-sm font-bold font-mono leading-tight mt-0.5"
            :class="
              cell.temperature > 45 ? 'text-red-500' : 'text-blueGray-700'
            "
          >
            {{ cell.temperature ?? 0
            }}<span class="text-[10px] font-normal text-blueGray-400 ml-0.5"
              >°C</span
            >
          </p>
        </div>
        <div class="text-center">
          <p
            class="text-[9px] font-bold text-blueGray-400 uppercase tracking-tight"
          >
            SoC
          </p>
          <!-- SoC bar -->
          <div class="mt-1 flex items-center gap-1 justify-center">
            <div
              class="h-1.5 w-16 bg-blueGray-100 rounded-full overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="socBarColor"
                :style="{ width: `${Math.min(cell.soc ?? 0, 100)}%` }"
              ></div>
            </div>
            <span class="text-[10px] font-bold font-mono text-blueGray-600">
              {{ cell.soc ?? 0 }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sparkline footer -->
    <div class="bg-slate-50/80 border-t border-blueGray-100 px-3 py-2">
      <svg
        class="w-full overflow-visible"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        style="height: 28px"
      >
        <!-- Gradient fill under line -->
        <defs>
          <linearGradient
            :id="`sg-${cell.cell_id}`"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path
          v-if="sparkFill"
          :d="sparkFill"
          :fill="`url(#sg-${cell.cell_id})`"
        />
        <polyline
          v-if="sparkPoints"
          :points="sparkPoints"
          fill="none"
          stroke="#6366f1"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- No data fallback -->
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
        class="flex justify-between mt-0.5 text-[9px] text-blueGray-300 font-mono"
      >
        <span>{{
          history.length ? `-${(history.length - 1) * 2}s` : "–"
        }}</span>
        <span>now</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";

export default {
  name: "CellCard",
  props: {
    cell: { type: Object, required: true },
    history: { type: Array, default: () => [] },
    packConfig: { type: Object, default: null },
  },
  setup(props) {
    // ── Status helpers ─────────────────────────────────────────
    const statusLabel = computed(() => {
      const v = props.cell.voltage || 0;
      const t = props.cell.temperature || 0;
      if (v > 4.2 || v < 2.5) return "FAULT";
      if (t > 50) return "HOT";
      if (v > 4.1 || t > 45) return "WARN";
      return "OK";
    });

    const statusBg = computed(
      () =>
        ({
          OK: "bg-emerald-50/60",
          WARN: "bg-amber-50/60",
          HOT: "bg-orange-50/60",
          FAULT: "bg-red-50/60",
        })[statusLabel.value],
    );

    const statusBadge = computed(
      () =>
        ({
          OK: "bg-emerald-100 text-emerald-600",
          WARN: "bg-amber-100  text-amber-600",
          HOT: "bg-orange-100 text-orange-600",
          FAULT: "bg-red-100    text-red-600",
        })[statusLabel.value],
    );

    const batteryIcon = computed(() => {
      const soc = props.cell.soc ?? 0;
      if (soc > 75) return "fas fa-battery-full text-emerald-500";
      if (soc > 50) return "fas fa-battery-three-quarters text-emerald-400";
      if (soc > 25) return "fas fa-battery-half text-amber-400";
      return "fas fa-battery-quarter text-red-400";
    });

    const socBarColor = computed(() => {
      const s = props.cell.soc ?? 0;
      if (s > 60) return "bg-emerald-400";
      if (s > 30) return "bg-amber-400";
      return "bg-red-400";
    });

    // ── Sparkline dari history ─────────────────────────────────
    const sparkPoints = computed(() => {
      const raw = props.history;
      if (!raw || raw.length < 2) return null;

      const vals = raw
        .map((r) => r.metrics?.voltage ?? r.voltage ?? 0)
        .filter(Boolean);
      if (vals.length < 2) return null;

      const mn = Math.min(...vals);
      const mx = Math.max(...vals);
      const rng = mx - mn || 0.001;
      const W = 100;
      const H = 20;
      const pad = 2;

      return vals
        .map((v, i) => {
          const x = (i / (vals.length - 1)) * W;
          const y = H - pad - ((v - mn) / rng) * (H - pad * 2);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    });

    const sparkFill = computed(() => {
      if (!sparkPoints.value) return null;
      const pts = sparkPoints.value.split(" ");
      const first = pts[0].split(",");
      const last = pts[pts.length - 1].split(",");
      return `M${first[0]},${first[1]} L${sparkPoints.value.replace(/ /g, " L")} L${last[0]},22 L${first[0]},22 Z`;
    });

    // ── Format helpers ─────────────────────────────────────────
    const fmtV = (v) => (v ? v.toFixed(3) : "0.000");
    const fmtA = (a) => (a ? a.toFixed(2) : "0.00");

    return {
      statusLabel,
      statusBg,
      statusBadge,
      batteryIcon,
      socBarColor,
      sparkPoints,
      sparkFill,
      fmtV,
      fmtA,
    };
  },
};
</script>
