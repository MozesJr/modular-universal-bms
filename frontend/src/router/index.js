// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "LiveMonitor",
    component: () => import("@/views/LiveMonitor.vue"),
  },
  {
    path: "/history",
    name: "History",
    component: () => import("@/views/HistoricalAnalysis.vue"),
  },
  {
    path: "/alerts",
    name: "Alerts",
    component: () => import("@/views/AlertsView.vue"),
  },
  {
    path: "/config",
    name: "Config",
    component: () => import("@/views/PackConfig.vue"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
