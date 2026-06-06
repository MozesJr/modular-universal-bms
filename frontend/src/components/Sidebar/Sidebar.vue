<template>
  <nav
    class="md:left-0 md:block md:fixed md:top-0 md:bottom-0 md:overflow-y-auto md:flex-row md:flex-nowrap md:overflow-hidden shadow-xl bg-white flex flex-wrap items-center justify-between relative md:w-64 z-10 py-4 px-6"
  >
    <div
      class="md:flex-col md:items-stretch md:min-h-full md:flex-nowrap px-0 flex flex-wrap items-center justify-between w-full mx-auto"
    >
      <!-- Mobile toggler -->
      <button
        class="cursor-pointer text-black opacity-50 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
        type="button"
        v-on:click="toggleCollapseShow('bg-white m-2 py-3 px-6')"
      >
        <i class="fas fa-bars"></i>
      </button>

      <!-- Brand -->
      <router-link
        class="md:block text-left md:pb-2 text-blueGray-600 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0"
        to="/admin/dashboard"
      >
        <i class="fas fa-battery-three-quarters text-emerald-500 mr-1"></i>
        BMS Dashboard
      </router-link>

      <!-- Mobile user icons -->
      <ul class="md:hidden items-center flex flex-wrap list-none">
        <li class="inline-block relative">
          <notification-dropdown />
        </li>
        <li class="inline-block relative">
          <user-dropdown />
        </li>
      </ul>

      <!-- Collapsible body -->
      <div
        class="md:flex md:flex-col md:items-stretch md:opacity-100 md:relative md:mt-4 md:shadow-none shadow absolute top-0 left-0 right-0 z-40 overflow-y-auto overflow-x-hidden h-auto items-center flex-1 rounded"
        v-bind:class="collapseShow"
      >
        <!-- Mobile collapse header -->
        <div
          class="md:min-w-full md:hidden block pb-4 mb-4 border-b border-solid border-blueGray-200"
        >
          <div class="flex flex-wrap">
            <div class="w-6/12">
              <router-link
                class="md:block text-left md:pb-2 text-blueGray-600 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0"
                to="/admin/dashboard"
              >
                BMS Dashboard
              </router-link>
            </div>
            <div class="w-6/12 flex justify-end">
              <button
                type="button"
                class="cursor-pointer text-black opacity-50 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
                v-on:click="toggleCollapseShow('hidden')"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <hr class="my-4 md:min-w-full" />

        <!-- Section heading -->
        <h6
          class="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline"
        >
          BMS
        </h6>

        <!-- Nav links -->
        <ul class="md:flex-col md:min-w-full flex flex-col list-none">
          <!-- Dashboard -->
          <li class="items-center">
            <router-link
              to="/admin/dashboard"
              v-slot="{ href, navigate, isActive }"
            >
              <a
                :href="href"
                @click="navigate"
                class="text-xs uppercase py-3 font-bold block"
                :class="[
                  isActive
                    ? 'text-emerald-500 hover:text-emerald-600'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-tv mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                Dashboard
              </a>
            </router-link>
          </li>

          <!-- Pack Detail (Drill-down BMS) — MENU BARU -->
          <li class="items-center">
            <router-link
              to="/admin/pack-detail"
              v-slot="{ href, navigate, isActive }"
            >
              <a
                :href="href"
                @click="navigate"
                class="text-xs uppercase py-3 font-bold flex items-center"
                :class="[
                  isActive
                    ? 'text-emerald-500 hover:text-emerald-600'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-bolt mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                Pack Detail
                <!-- Alert badge -->
                <span
                  v-if="alertCount > 0"
                  class="ml-2 bg-red-500 text-white text-[9px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
                >
                  {{ alertCount }}
                </span>
              </a>
            </router-link>
          </li>

          <!-- Alerts -->
          <li class="items-center">
            <router-link
              to="/admin/alerts"
              v-slot="{ href, navigate, isActive }"
            >
              <a
                :href="href"
                @click="navigate"
                class="text-xs uppercase py-3 font-bold block"
                :class="[
                  isActive
                    ? 'text-emerald-500 hover:text-emerald-600'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-exclamation-triangle mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                Alerts
                <span
                  v-if="alertCount > 0"
                  class="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5"
                >
                  {{ alertCount }}
                </span>
              </a>
            </router-link>
          </li>

          <!-- Pack Config -->
          <li class="items-center">
            <router-link
              to="/admin/config"
              v-slot="{ href, navigate, isActive }"
            >
              <a
                :href="href"
                @click="navigate"
                class="text-xs uppercase py-3 font-bold block"
                :class="[
                  isActive
                    ? 'text-emerald-500 hover:text-emerald-600'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-battery-full mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                Pack Config
              </a>
            </router-link>
          </li>
        </ul>

        <!-- Divider + Logout -->
        <hr class="my-4 md:min-w-full" />

        <ul class="md:flex-col md:min-w-full flex flex-col list-none">
          <li class="items-center">
            <button
              @click="handleLogout"
              class="text-xs uppercase py-3 font-bold block text-left w-full text-red-400 hover:text-red-600"
            >
              <i class="fas fa-sign-out-alt mr-2 text-sm text-red-300"></i>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import NotificationDropdown from "@/components/Dropdowns/NotificationDropdown.vue";
import UserDropdown from "@/components/Dropdowns/UserDropdown.vue";
import { useAuthStore } from "@/stores/authStore";
import { useBmsStore } from "@/stores/bmsStore";
import { computed } from "vue";

export default {
  components: { NotificationDropdown, UserDropdown },
  setup() {
    const bmsStore = useBmsStore();
    const alertCount = computed(() => bmsStore.alerts.length);
    return { alertCount, bmsStore };
  },
  data() {
    return { collapseShow: "hidden" };
  },
  methods: {
    toggleCollapseShow(classes) {
      this.collapseShow = classes;
    },
    handleLogout() {
      const auth = useAuthStore();
      auth.logout();
      this.$router.push("/");
    },
  },
};
</script>
