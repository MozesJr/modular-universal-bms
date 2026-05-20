<template>
  <div
    class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded"
  >
    <div class="rounded-t mb-0 px-4 py-3 bg-transparent">
      <div class="relative w-full max-w-full flex-grow flex-1">
        <h6 class="uppercase text-blueGray-400 mb-1 text-xs font-semibold">Pack Status</h6>
        <h2 class="text-blueGray-700 text-xl font-semibold">State of Charge (%)</h2>
      </div>
    </div>
    <div class="p-4 flex-auto">
      <div class="relative h-350-px">
        <canvas id="bar-chart"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js";
import { useBmsStore } from "@/stores/bmsStore";

export default {
  setup() {
    return { bmsStore: useBmsStore() };
  },
  mounted() {
    this.$nextTick(() => this.initChart());
    this._interval = setInterval(() => this.refreshChart(), 3000);
  },
  beforeUnmount() {
    clearInterval(this._interval);
    if (window._bmsBarChart) {
      window._bmsBarChart.destroy();
      window._bmsBarChart = null;
    }
  },
  methods: {
    buildData() {
      const cells = this.bmsStore.cellsForPack;
      if (!cells.length) {
        return { labels: [], data: [], colors: [] };
      }
      const avg = cells.reduce((sum, c) => sum + (c.metrics?.soc ?? 0), 0) / cells.length;
      const color = (() => {
        if (avg > 60) return "#48bb78";
        if (avg > 30) return "#f6ad55";
        return "#fc8181";
      })();
      return {
        labels: ["Average"],
        data: [Math.round(avg * 10) / 10],
        colors: [color],
      };
    },
    initChart() {
      const { labels, data, colors } = this.buildData();
      const ctx = document.getElementById("bar-chart").getContext("2d");
      window._bmsBarChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "SoC (%)",
            backgroundColor: colors,
            borderColor: colors,
            data,
            fill: false,
            barThickness: 12,
          }],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          animation: { duration: 0 },
          legend: { display: false },
          scales: {
            xAxes: [{ gridLines: { display: false } }],
            yAxes: [{
              ticks: { min: 0, max: 100, fontColor: "rgba(0,0,0,.4)" },
              scaleLabel: { display: true, labelString: "%" },
              gridLines: { color: "rgba(33,37,41,.1)", drawBorder: false },
            }],
          },
        },
      });
    },
    refreshChart() {
      if (!window._bmsBarChart) return;
      const { labels, data, colors } = this.buildData();
      window._bmsBarChart.data.labels = labels;
      window._bmsBarChart.data.datasets[0].data = data;
      window._bmsBarChart.data.datasets[0].backgroundColor = colors;
      window._bmsBarChart.update();
    },
  },
};
</script>
