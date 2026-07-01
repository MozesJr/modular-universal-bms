import { createApp } from "vue";
import { createPinia } from "pinia";
import { createWebHistory, createRouter } from "vue-router";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "@/assets/styles/tailwind.css";

import App from "@/App.vue";

// layouts
import Admin from "@/layouts/Admin.vue";
import Auth from "@/layouts/Auth.vue";

// admin views
import Dashboard from "@/views/admin/Dashboard.vue";
import Settings from "@/views/admin/Settings.vue";
import Tables from "@/views/admin/Tables.vue";
import Maps from "@/views/admin/Maps.vue";
import Alerts from "@/views/admin/Alerts.vue";
import PackConfig from "@/views/admin/PackConfig.vue";
import PackDetail from "@/views/admin/PackDetail.vue";
import PackForm from "@/views/admin/PackForm.vue";
import UserManagement from "@/views/admin/UserManagement.vue";
import UserForm from "@/views/admin/UserForm.vue";
import UserResetPassword from "@/views/admin/UserResetPassword.vue";

import AssignPack from "@/views/admin/AssignPack.vue";
import AssignPackForm from "@/views/admin/AssignPackForm.vue";
import Collaborators from "@/views/admin/Collaborators.vue";

// auth views
import Login from "@/views/auth/Login.vue";
import Register from "@/views/auth/Register.vue";

// public views
import Index from "@/views/Index.vue";

const routes = [
  {
    path: "/admin",
    redirect: "/admin/dashboard",
    component: Admin,
    meta: { requiresAuth: true },
    children: [
      { path: "/admin/dashboard", component: Dashboard },
      { path: "/admin/alerts", component: Alerts },
      { path: "/admin/config", component: PackConfig },
      { path: "/admin/pack-form", component: PackForm },
      { path: "/admin/pack-detail", component: PackDetail },
      { path: "/admin/settings", component: Settings },
      { path: "/admin/tables", component: Tables },
      { path: "/admin/maps", component: Maps },
      {
        path: "/admin/users",
        component: UserManagement,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "/admin/user-form",
        component: UserForm,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "/admin/user-reset-password",
        component: UserResetPassword,
        meta: { requiresAuth: true, requiresAdmin: true },
      },

      //collab
      {
        path: "/admin/assign-pack",
        component: AssignPack,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "/admin/assign-pack-form",
        component: AssignPackForm,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "/admin/collaborators",
        component: Collaborators,
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: "/auth",
    redirect: "/auth/login",
    component: Auth,
    children: [
      { path: "/auth/login", component: Login },
      { path: "/auth/register", component: Register },
    ],
  },
  { path: "/", component: Index },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({ history: createWebHistory(), routes });

// ── Nav guard ──────────────────────────────────────────────
router.beforeEach((to) => {
  const token = localStorage.getItem("bms_token"); // ← ganti dari bms_authed
  const user = JSON.parse(localStorage.getItem("bms_user") || "null");
  const authed = !!token;

  if (to.meta.requiresAuth && !authed) return "/auth/login"; // ← redirect ke login, bukan "/"
  if (to.meta.requiresAdmin && user?.role !== "admin")
    return "/admin/dashboard";
  if ((to.path === "/auth/login" || to.path === "/auth/register") && authed) {
    return "/admin/dashboard";
  }
});

const pinia = createPinia();
createApp(App).use(pinia).use(router).mount("#app");
