<template>
  <div class="flex flex-wrap mt-4">
    <div class="w-full mb-12 px-4">

      <!-- ── Card Shell (Vue Notus standard) ─────────────────── -->
      <div class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">

        <!-- Card Header -->
        <div class="rounded-t bg-white mb-0 px-6 py-6">
          <div class="text-center flex justify-between items-center">
            <div>
              <h6 class="text-blueGray-700 text-xl font-bold">Pack Configuration</h6>
              <p class="text-blueGray-400 text-sm mt-1">
                Cell count · chemistry · voltage limits · thermal thresholds
              </p>
            </div>
            <button
              @click="openCreate"
              class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
              type="button"
            >
              <i class="fas fa-plus mr-1"></i> New Pack
            </button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="flex-auto px-4 lg:px-10 py-10 pt-6">

          <!-- ── Pack Grid ─────────────────────────────────────── -->
          <div v-if="bmsStore.packs.length" class="flex flex-wrap -mx-4">
            <div
              v-for="pack in bmsStore.packs"
              :key="pack.pack_id"
              class="w-full lg:w-6/12 xl:w-4/12 px-4 mb-6"
            >
              <div class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded-lg">

                <!-- Pack header band -->
                <div class="px-4 py-4 border-b border-blueGray-100 flex items-center justify-between">
                  <div>
                    <h3 class="font-bold text-blueGray-700 text-sm">{{ pack.name }}</h3>
                    <span class="text-xs font-mono text-blueGray-400">{{ pack.pack_id }}</span>
                  </div>
                  <span
                    class="text-xs font-semibold inline-block py-1 px-2 rounded-full uppercase last:mr-0 mr-1"
                    :class="chemistryBadge(pack.chemistry)"
                  >
                    {{ pack.chemistry }}
                  </span>
                </div>

                <!-- Metrics grid -->
                <div class="flex-auto px-4 py-4">
                  <div class="flex flex-wrap -mx-2">
                    <div class="w-6/12 px-2 mb-2" v-for="m in packMetrics(pack)" :key="m.label">
                      <p class="text-xs uppercase font-bold text-blueGray-400 mb-0.5">{{ m.label }}</p>
                      <p class="text-sm font-semibold text-blueGray-600">{{ m.value }}</p>
                    </div>
                  </div>
                </div>

                <!-- Edit button -->
                <div class="px-4 pb-4">
                  <button
                    @click="openEdit(pack)"
                    class="w-full bg-blueGray-100 text-blueGray-700 active:bg-blueGray-200 font-bold uppercase text-xs px-4 py-2 rounded shadow-sm hover:shadow outline-none focus:outline-none ease-linear transition-all duration-150"
                    type="button"
                  >
                    <i class="fas fa-edit mr-1"></i> Edit
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-16">
            <i class="fas fa-battery-empty text-4xl text-blueGray-300 mb-4 block"></i>
            <p class="text-blueGray-400 text-sm">
              No packs configured yet. Click <strong>+ New Pack</strong> to get started.
            </p>
          </div>

        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         MODAL — Vue Notus overlay style
         bg-slate-900/50 approximated with blueGray-900 opacity
    ═══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="modalOpen"
          class="overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none flex items-center justify-center"
          @click.self="modalOpen = false"
        >
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-slate-900/50"></div>

          <!-- Dialog -->
          <div class="relative w-auto my-6 mx-auto max-w-lg w-full px-4 z-10">
            <div class="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">

              <!-- Modal Header -->
              <div class="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                <h3 class="text-xl font-semibold text-blueGray-700">
                  {{ isEditMode ? "Edit Pack" : "Create New Pack" }}
                </h3>
                <button
                  @click="modalOpen = false"
                  class="p-1 ml-auto bg-transparent border-0 text-blueGray-400 float-right text-2xl leading-none font-semibold outline-none focus:outline-none"
                  type="button"
                >
                  <span class="text-blueGray-400 h-6 w-6 text-xl block outline-none focus:outline-none">×</span>
                </button>
              </div>

              <!-- Modal Body -->
              <div class="relative px-6 py-4 flex-auto">
                <form @submit.prevent="handleSubmit">

                  <!-- ── Section: Identity ───────────────────── -->
                  <h6 class="text-blueGray-400 text-xs mt-2 mb-4 font-bold uppercase">
                    Pack Identity
                  </h6>
                  <div class="flex flex-wrap -mx-3">
                    <div class="w-full lg:w-6/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Pack ID *
                        </label>
                        <input
                          v-model="form.pack_id"
                          :disabled="isEditMode"
                          required
                          placeholder="e.g. PACK_001"
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 disabled:bg-blueGray-100 disabled:text-blueGray-400"
                        />
                      </div>
                    </div>
                    <div class="w-full lg:w-6/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Display Name
                        </label>
                        <input
                          v-model="form.name"
                          placeholder="e.g. Solar Storage Bank"
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>

                  <hr class="mt-2 mb-4 border-b-1 border-blueGray-200" />

                  <!-- ── Section: Chemistry ──────────────────── -->
                  <h6 class="text-blueGray-400 text-xs mb-4 font-bold uppercase">
                    Battery Chemistry
                  </h6>
                  <div class="flex flex-wrap -mx-3">
                    <div class="w-full lg:w-6/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Chemistry *
                        </label>
                        <select
                          v-model="form.chemistry"
                          @change="onChemistryChange"
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        >
                          <option v-for="key in Object.keys(PRESETS)" :key="key" :value="key">
                            {{ key }}
                          </option>
                        </select>
                        <p v-if="form.chemistry !== 'Custom'" class="text-xs text-emerald-500 mt-1">
                          <i class="fas fa-check-circle mr-1"></i>Thresholds auto-filled from preset
                        </p>
                      </div>
                    </div>
                    <div class="w-full lg:w-6/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Cell Count *
                        </label>
                        <input
                          v-model.number="form.cell_count"
                          type="number"
                          min="1"
                          max="200"
                          required
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>

                  <hr class="mt-2 mb-4 border-b-1 border-blueGray-200" />

                  <!-- ── Section: Voltage Thresholds ─────────── -->
                  <h6 class="text-blueGray-400 text-xs mb-4 font-bold uppercase">
                    Voltage Thresholds (per cell)
                  </h6>
                  <div class="flex flex-wrap -mx-3">
                    <div class="w-full lg:w-4/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">Min (V) *</label>
                        <input
                          v-model.number="form.min_voltage"
                          type="number" step="0.01" required
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        />
                      </div>
                    </div>
                    <div class="w-full lg:w-4/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">Nominal (V)</label>
                        <input
                          v-model.number="form.nominal_voltage"
                          type="number" step="0.01"
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        />
                      </div>
                    </div>
                    <div class="w-full lg:w-4/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">Max (V) *</label>
                        <input
                          v-model.number="form.max_voltage"
                          type="number" step="0.01" required
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>

                  <hr class="mt-2 mb-4 border-b-1 border-blueGray-200" />

                  <!-- ── Section: Protection Limits ─────────── -->
                  <h6 class="text-blueGray-400 text-xs mb-4 font-bold uppercase">
                    Protection Limits
                  </h6>
                  <div class="flex flex-wrap -mx-3">
                    <div class="w-full lg:w-6/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Max Temp (°C) *
                        </label>
                        <input
                          v-model.number="form.max_temp_celsius"
                          type="number" step="1" required
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        />
                      </div>
                    </div>
                    <div class="w-full lg:w-6/12 px-3">
                      <div class="relative w-full mb-3">
                        <label class="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                          Max Current (A) *
                        </label>
                        <input
                          v-model.number="form.max_current_amps"
                          type="number" step="0.5" required
                          class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- ── Error Message ───────────────────────── -->
                  <div
                    v-if="errorMsg"
                    class="text-white px-4 py-3 rounded relative mb-3 bg-red-400 border border-red-500"
                    role="alert"
                  >
                    <span class="text-xs font-bold block">
                      <i class="fas fa-exclamation-circle mr-1"></i>{{ errorMsg }}
                    </span>
                  </div>

                  <!-- Modal Footer inside form for submit scope -->
                  <div class="flex items-center justify-end pt-4 border-t border-solid border-blueGray-200">
                    <button
                      @click="modalOpen = false"
                      class="text-blueGray-500 background-transparent font-bold uppercase px-6 py-2 text-xs outline-none focus:outline-none mr-2 ease-linear transition-all duration-150"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      :disabled="saving"
                      class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i v-if="saving" class="fas fa-spinner fa-spin mr-1"></i>
                      {{ saving ? "Saving…" : isEditMode ? "Save Changes" : "Create Pack" }}
                    </button>
                  </div>

                </form>
              </div>

            </div>
          </div>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useBmsStore } from "@/stores/bmsStore";

// Chemistry presets — duplicated here for instant auto-fill UX.
// Also exposed at GET /api/packs/presets for external tooling.
const PRESETS = {
  LiFePO4: {
    nominal_voltage:  3.2,
    min_voltage:      2.5,
    max_voltage:      3.65,
    max_temp_celsius: 55,
    max_current_amps: 20,
  },
  "Li-ion 18650": {
    nominal_voltage:  3.6,
    min_voltage:      3.0,
    max_voltage:      4.2,
    max_temp_celsius: 60,
    max_current_amps: 20,
  },
  Custom: null,
};

const bmsStore   = useBmsStore();
const modalOpen  = ref(false);
const isEditMode = ref(false);
const saving     = ref(false);
const errorMsg   = ref("");

const BLANK = () => ({
  pack_id:          "",
  name:             "",
  chemistry:        "LiFePO4",
  cell_count:       4,
  ...PRESETS["LiFePO4"],
});

const form = reactive(BLANK());

// ── Helpers ────────────────────────────────────────────────────
function chemistryBadge(chemistry) {
  const map = {
    "LiFePO4":      "text-emerald-600 bg-emerald-200",
    "Li-ion 18650": "text-lightBlue-600 bg-lightBlue-200",
    "Custom":       "text-blueGray-600 bg-blueGray-200",
  };
  return map[chemistry] ?? "text-blueGray-600 bg-blueGray-200";
}

function packMetrics(pack) {
  return [
    { label: "Cells",       value: pack.cell_count },
    { label: "Chemistry",   value: pack.chemistry },
    { label: "Min V",       value: `${pack.min_voltage} V` },
    { label: "Max V",       value: `${pack.max_voltage} V` },
    { label: "Max Temp",    value: `${pack.max_temp_celsius} °C` },
    { label: "Max Current", value: `${pack.max_current_amps} A` },
  ];
}

// ── Modal open/close ───────────────────────────────────────────
function openCreate() {
  isEditMode.value = false;
  errorMsg.value   = "";
  Object.assign(form, BLANK());
  modalOpen.value  = true;
}

function openEdit(pack) {
  isEditMode.value = true;
  errorMsg.value   = "";
  Object.assign(form, {
    pack_id:          pack.pack_id,
    name:             pack.name,
    chemistry:        pack.chemistry,
    cell_count:       pack.cell_count,
    nominal_voltage:  pack.nominal_voltage,
    min_voltage:      pack.min_voltage,
    max_voltage:      pack.max_voltage,
    max_temp_celsius: pack.max_temp_celsius,
    max_current_amps: pack.max_current_amps,
  });
  modalOpen.value = true;
}

function onChemistryChange() {
  const preset = PRESETS[form.chemistry];
  if (preset) Object.assign(form, preset);
}

// ── Submit ─────────────────────────────────────────────────────
async function handleSubmit() {
  saving.value   = true;
  errorMsg.value = "";
  try {
    if (isEditMode.value) {
      await bmsStore.updatePack(form.pack_id, { ...form });
    } else {
      await bmsStore.createPack({ ...form });
    }
    modalOpen.value = false;
  } catch (err) {
    errorMsg.value = err?.response?.data?.error || err.message || "Request failed.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
