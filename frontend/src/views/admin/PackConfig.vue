<template>
  <div class="flex flex-wrap mt-4">
    <div class="w-full mb-12 px-4">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded"
      >
        <!-- Header -->
        <div
          class="rounded-t bg-white mb-0 px-6 py-6 border-b border-solid border-blueGray-100"
        >
          <div class="flex justify-between items-center">
            <div>
              <h6 class="text-blueGray-700 text-xl font-bold">
                Pack Configuration
              </h6>
              <p class="text-blueGray-400 text-sm mt-1">
                Cell count · chemistry · voltage limits · thermal thresholds
              </p>
            </div>
            <router-link
              to="/admin/pack-form"
              class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center gap-1"
            >
              <i class="fas fa-plus"></i> New Pack
            </router-link>
          </div>
        </div>

        <!-- Pack Cards Grid -->
        <div class="flex-auto px-4 lg:px-10 py-10 pt-6">
          <div
            v-if="bmsStore.packs && bmsStore.packs.length"
            class="flex flex-wrap -mx-4"
          >
            <div
              v-for="pack in bmsStore.packs"
              :key="pack.pack_id"
              class="w-full lg:w-6/12 xl:w-4/12 px-4 mb-6"
            >
              <div
                class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-md rounded border border-blueGray-100 hover:shadow-lg transition-all duration-300"
              >
                <!-- Card header -->
                <div
                  class="px-4 py-4 border-b border-blueGray-100 flex items-center justify-between bg-blueGray-50 rounded-t"
                >
                  <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-blueGray-700 text-sm truncate">
                      {{ pack.name || "Unnamed Pack" }}
                    </h3>
                    <span class="text-xs font-mono text-blueGray-400">{{
                      pack.pack_id
                    }}</span>
                  </div>
                  <span
                    class="ml-2 text-xs font-bold inline-block py-1 px-2 rounded-full uppercase shrink-0"
                    :class="chemistryBadge(pack.chemistry)"
                  >
                    {{ pack.chemistry }}
                  </span>
                </div>

                <!-- Metrics -->
                <div class="flex-auto px-4 py-4">
                  <div class="flex flex-wrap -mx-2">
                    <div
                      v-for="m in packMetrics(pack)"
                      :key="m.label"
                      class="w-6/12 px-2 mb-3"
                    >
                      <p
                        class="text-xs uppercase font-bold text-blueGray-400 mb-0.5"
                      >
                        {{ m.label }}
                      </p>
                      <p
                        class="text-sm font-semibold text-blueGray-600 font-mono"
                      >
                        {{ m.value }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="px-4 pb-4 flex gap-2">
                  <router-link
                    :to="`/admin/pack-form?edit=${pack.pack_id}`"
                    class="flex-1 bg-blueGray-100 text-blueGray-700 hover:bg-blueGray-200 font-bold uppercase text-xs px-3 py-2 rounded shadow-sm hover:shadow outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center justify-center gap-1"
                  >
                    <i class="fas fa-edit text-xs"></i> Edit
                  </router-link>
                  <button
                    @click="confirmDelete(pack)"
                    class="bg-red-100 text-red-500 hover:bg-red-200 font-bold uppercase text-xs px-3 py-2 rounded shadow-sm hover:shadow outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center justify-center gap-1"
                    type="button"
                  >
                    <i class="fas fa-trash text-xs"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else
            class="text-center py-16 bg-blueGray-50 rounded border border-dashed border-blueGray-200 my-4"
          >
            <i
              class="fas fa-battery-empty text-4xl text-blueGray-300 mb-4 block"
            ></i>
            <p class="text-blueGray-700 font-bold text-base">
              No Packs Configured Yet
            </p>
            <p class="text-blueGray-400 text-sm mt-1">
              Click
              <router-link
                to="/admin/pack-form"
                class="text-emerald-500 font-semibold hover:underline"
              >
                + New Pack
              </router-link>
              to initialize your universal BMS cluster.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Delete Confirmation (inline, no modal) ── -->
    <div
      v-if="deleteTarget"
      class="fixed inset-0 flex items-center justify-center p-4"
      style="z-index: 9999; background: rgba(15, 23, 42, 0.55)"
    >
      <div
        class="bg-white rounded shadow-2xl w-full max-w-sm border border-blueGray-200"
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-blueGray-100 flex items-center gap-3"
        >
          <div
            class="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"
          >
            <i class="fas fa-trash text-red-500"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-blueGray-800">Delete Pack</h3>
            <p class="text-xs text-blueGray-400 mt-0.5">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-5">
          <p class="text-sm text-blueGray-600">
            Yakin ingin menghapus pack
            <strong class="font-mono text-blueGray-800">{{
              deleteTarget.pack_id
            }}</strong>
            —
            <strong class="text-blueGray-800">{{
              deleteTarget.name || "Unnamed Pack"
            }}</strong
            >?
          </p>
          <p class="text-xs text-red-500 mt-3 flex items-center gap-1">
            <i class="fas fa-exclamation-triangle"></i>
            Semua data real-time pack ini akan dihapus dari cache.
          </p>
          <div
            v-if="deleteError"
            class="mt-3 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-1"
          >
            <i class="fas fa-exclamation-circle"></i> {{ deleteError }}
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 bg-blueGray-50 border-t border-blueGray-100 flex justify-end gap-2"
        >
          <button
            @click="
              deleteTarget = null;
              deleteError = '';
            "
            type="button"
            class="text-blueGray-500 bg-white hover:bg-blueGray-100 font-bold uppercase px-4 py-2 text-xs rounded border border-blueGray-200 transition-colors outline-none focus:outline-none"
          >
            Cancel
          </button>
          <button
            @click="handleDelete"
            :disabled="deleting"
            type="button"
            class="bg-red-500 hover:bg-red-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md transition-all outline-none focus:outline-none disabled:opacity-50 flex items-center gap-1.5"
          >
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            {{ deleting ? "Deleting…" : "Yes, Delete" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useBmsStore } from "@/stores/bmsStore";

const bmsStore = useBmsStore();

// ── Delete state ─────────────────────────────────────────────
const deleteTarget = ref(null);
const deleting = ref(false);
const deleteError = ref("");

onMounted(async () => {
  await bmsStore.fetchPacks();
});

function chemistryBadge(chemistry) {
  const map = {
    LiFePO4: "text-emerald-600 bg-emerald-100",
    "Li-ion 18650": "text-blue-600 bg-blue-100",
    Custom: "text-blueGray-600 bg-blueGray-100",
  };
  return map[chemistry] ?? "text-blueGray-600 bg-blueGray-100";
}

function packMetrics(pack) {
  return [
    { label: "Cells Count", value: pack.cell_count },
    { label: "Chemistry", value: pack.chemistry },
    { label: "Min Voltage", value: `${pack.min_voltage} V` },
    { label: "Max Voltage", value: `${pack.max_voltage} V` },
    { label: "Max Temp", value: `${pack.max_temp_celsius} °C` },
    { label: "Max Current", value: `${pack.max_current_amps} A` },
  ];
}

function confirmDelete(pack) {
  deleteError.value = "";
  deleteTarget.value = pack;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  deleteError.value = "";
  try {
    await bmsStore.deletePack(deleteTarget.value.pack_id);
    deleteTarget.value = null;
  } catch (err) {
    deleteError.value =
      err?.response?.data?.error || err.message || "Delete failed.";
  } finally {
    deleting.value = false;
  }
}
</script>
