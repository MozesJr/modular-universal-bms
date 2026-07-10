<template>
  <div class="flex flex-wrap mt-4">
    <div class="w-full mb-12 px-4">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded"
      >
        <div
          class="rounded-t bg-white mb-0 px-6 py-6 border-b border-solid border-blueGray-100"
        >
          <div class="flex justify-between items-center">
            <div>
              <h6 class="text-blueGray-700 text-xl font-bold">BMS Devices</h6>
              <p class="text-blueGray-400 text-sm mt-1">
                Daftar perangkat BMS fisik yang terdaftar
              </p>
            </div>
            <router-link
              to="/admin/bms-form"
              class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center gap-1"
            >
              <i class="fas fa-plus"></i> New BMS
            </router-link>
          </div>
        </div>

        <div class="flex-auto px-4 lg:px-10 py-10 pt-6">
          <div v-if="bmsStore.bmsDevices.length" class="flex flex-wrap -mx-4">
            <div
              v-for="bms in bmsStore.bmsDevices"
              :key="bms.bms_id"
              class="w-full lg:w-6/12 xl:w-4/12 px-4 mb-6"
            >
              <div
                class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-md rounded border border-blueGray-100 hover:shadow-lg transition-all duration-300"
              >
                <div
                  class="px-4 py-4 border-b border-blueGray-100 flex items-center justify-between bg-blueGray-50 rounded-t"
                >
                  <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-blueGray-700 text-sm truncate">
                      {{ bms.name || "Unnamed BMS" }}
                    </h3>
                    <span class="text-xs font-mono text-blueGray-400">{{
                      bms.bms_id
                    }}</span>
                  </div>
                  <span
                    class="ml-2 text-xs font-bold inline-block py-1 px-2 rounded-full uppercase shrink-0"
                    :class="statusBadge(bms.status)"
                  >
                    {{ bms.status }}
                  </span>
                </div>

                <div
                  class="flex-auto px-4 py-4 text-sm text-blueGray-600 space-y-1"
                >
                  <div>
                    Serial:
                    <span class="font-mono">{{ bms.bms_sernum || "-" }}</span>
                  </div>
                  <div>Model: {{ bms.bms_model_name || "-" }}</div>
                  <div>Owner: {{ bms.owner?.username || "-" }}</div>
                </div>

                <div class="px-4 pb-4 flex gap-2">
                  <router-link
                    :to="`/admin/bms-form?edit=${bms.bms_id}`"
                    class="flex-1 bg-blueGray-100 text-blueGray-700 hover:bg-blueGray-200 font-bold uppercase text-xs px-3 py-2 rounded shadow-sm hover:shadow outline-none focus:outline-none flex items-center justify-center gap-1"
                  >
                    <i class="fas fa-edit text-xs"></i> Edit
                  </router-link>
                  <router-link
                    :to="`/admin/pack-form?bmsId=${bms.bms_id}`"
                    class="flex-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold uppercase text-xs px-3 py-2 rounded shadow-sm hover:shadow outline-none focus:outline-none flex items-center justify-center gap-1"
                  >
                    <i class="fas fa-plus text-xs"></i> Pack
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-center py-16 bg-blueGray-50 rounded border border-dashed border-blueGray-200 my-4"
          >
            <i
              class="fas fa-microchip text-4xl text-blueGray-300 mb-4 block"
            ></i>
            <p class="text-blueGray-700 font-bold text-base">
              Belum ada BMS device terdaftar
            </p>
            <p class="text-blueGray-400 text-sm mt-1">
              Klik
              <router-link
                to="/admin/bms-form"
                class="text-emerald-500 font-semibold hover:underline"
                >+ New BMS</router-link
              >
              untuk mendaftarkan device pertama.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useBmsStore } from "@/stores/bmsStore";

const bmsStore = useBmsStore();

onMounted(async () => {
  await bmsStore.fetchBmsDevices();
});

function statusBadge(status) {
  const map = {
    active: "text-emerald-600 bg-emerald-100",
    pending_verification: "text-amber-600 bg-amber-100",
    rejected: "text-red-600 bg-red-100",
    suspended: "text-orange-600 bg-orange-100",
  };
  return map[status] ?? "text-blueGray-600 bg-blueGray-100";
}
</script>
