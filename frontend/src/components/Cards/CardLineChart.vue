<template>
  <div
    class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-blueGray-700"
  >
    <div class="rounded-t mb-0 px-4 py-3 bg-transparent">
      <div class="flex flex-wrap items-center">
        <div class="relative w-full max-w-full flex-grow flex-1">
          <h6 class="uppercase text-blueGray-100 mb-1 text-xs font-semibold">
            Real-time
          </h6>
          <h2 class="text-white text-xl font-semibold">
            Cell Voltage History
          </h2>
        </div>
        <div class="text-xs text-blueGray-300">
          {{ bmsStore.selectedPackId || "No pack selected" }}
        </div>
      </div>
    </div>
    <div class="p-4 flex-auto">
      <div class="relative h-350-px">
        <canvas id="line-chart"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js";
import { useBmsStore } from "@/stores/bmsStore";

const COLORS = [
  "#4c51bf", "#ed64a6", "#48bb78", "#f6ad55",
  "#63b3ed", "#fc8181", "#b794f4", "#68d391",
];

export default {
  setup() {
    return { bmsStore: useBmsStore() };
  },
  mounted() {
    this.$nextTick(() => this.initChart());
    this._interval = setInterval(() => this.refreshChart(), 2000);
  },
  beforeUnmount() {
    clearInterval(this._interval);
    if (window._bmsLineChart) {
      window._bmsLineChart.destroy();
      window._bmsLineChart = null;
    }
  },
  methods: {
    buildDatasets() {
      const packId = this.bmsStore.selectedPackId;
      if (!packId) return { labels: [], datasets: [] };

      // Collect up to first 4 cells to keep the chart readable
      const keys = [...this.bmsStore.cellHistory.keys()]
        .filter((k) => k.startsWith(packId + ":"))
        .slice(0, 4);

      const maxLen = keys.reduce((m, k) => {
        const h = this.bmsStore.cellHistory.get(k) || [];
        return Math.max(m, h.length);
      }, 0);

      const labels = Array.from({ length: maxLen }, (_, i) => {
        const ago = (maxLen - 1 - i) * 2;
        return ago === 0 ? "now" : `-${ago}s`;
      });

      const datasets = keys.map((k, idx) => {
        const cellId = k.split(":")[1];
        const history = this.bmsStore.cellHistory.get(k) || [];
        const padded = Array(maxLen - history.length).fill(null)
          .concat(history.map((r) => r.metrics?.voltage ?? null));
        return {
          label: `Cell ${cellId}`,
          backgroundColor: COLORS[idx % COLORS.length],
          borderColor: COLORS[idx % COLORS.length],
          data: padded,
          fill: false,
          borderWidth: 1.5,
          pointRadius: 0,
        };
      });

      return { labels, datasets };
    },
    initChart() {
      const { labels, datasets } = this.buildDatasets();
      const ctx = document.getElementById("line-chart").getContext("2d");
      window._bmsLineChart = new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          animation: { duration: 0 },
          legend: { labels: { fontColor: "white" }, align: "end", position: "bottom" },
          tooltips: { mode: "index", intersect: false },
          scales: {
            xAxes: [{ ticks: { fontColor: "rgba(255,255,255,.7)" }, gridLines: { display: false } }],
            yAxes: [{
              ticks: { fontColor: "rgba(255,255,255,.7)" },
              scaleLabel: { display: true, labelString: "Voltage (V)", fontColor: "white" },
              gridLines: { color: "rgba(255,255,255,.15)", drawBorder: false },
            }],
          },
        },
      });
    },
    refreshChart() {
      if (!window._bmsLineChart) return;
      const { labels, datasets } = this.buildDatasets();
      window._bmsLineChart.data.labels = labels;
      window._bmsLineChart.data.datasets = datasets;
      window._bmsLineChart.update();
    },
  },
};
</script>
