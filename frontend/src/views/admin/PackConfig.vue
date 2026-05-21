<template>
  <div class="flex flex-wrap mt-4">
    <div class="w-full mb-12 px-4">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded border border-blueGray-100"
      >
        <div
          class="rounded-t bg-white mb-0 px-6 py-6 border-b border-solid border-blueGray-100"
        >
          <div class="text-center flex justify-between items-center">
            <div>
              <h6 class="text-blueGray-700 text-xl font-bold">
                Pack Configuration
              </h6>
              <p class="text-blueGray-400 text-sm mt-1">
                Cell count · chemistry · voltage limits · thermal thresholds
              </p>
            </div>
            <button
              @click="openCreate"
              class="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center gap-1"
              type="button"
            >
              <i class="fas fa-plus"></i> New Pack
            </button>
          </div>
        </div>

        <div class="flex-auto px-4 lg:px-10 py-10 pt-6 bg-blueGray-50/30">
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
                class="relative flex flex-col min-w-0 break-words bg-white w-full shadow-md rounded-lg border border-blueGray-100 transition-all duration-300 hover:shadow-lg"
              >
                <div
                  class="px-4 py-4 border-b border-blueGray-100 flex items-center justify-between bg-blueGray-50/50 rounded-t-lg"
                >
                  <div>
                    <h3 class="font-bold text-blueGray-700 text-sm">
                      {{ pack.name || "Unnamed Pack" }}
                    </h3>
                    <span class="text-xs font-mono text-blueGray-400">{{
                      pack.pack_id
                    }}</span>
                  </div>
                  <span
                    class="text-[10px] font-extrabold inline-block py-1 px-2.5 rounded-full uppercase last:mr-0 shadow-sm tracking-wide"
                    :class="chemistryBadge(pack.chemistry)"
                  >
                    {{ pack.chemistry }}
                  </span>
                </div>

                <div class="flex-auto px-4 py-4">
                  <div class="flex flex-wrap -mx-2">
                    <div
                      class="w-6/12 px-2 mb-2"
                      v-for="m in packMetrics(pack)"
                      :key="m.label"
                    >
                      <p
                        class="text-[10px] uppercase font-bold text-blueGray-400 mb-0.5"
                      >
                        {{ m.label }}
                      </p>
                      <p class="text-sm font-semibold text-blueGray-600">
                        {{ m.value }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="px-4 pb-4">
                  <button
                    @click="openEdit(pack)"
                    class="w-full bg-blueGray-100 text-blueGray-700 active:bg-blueGray-200 font-bold uppercase text-xs px-4 py-2 rounded shadow-sm hover:shadow outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center justify-center gap-1"
                    type="button"
                  >
                    <i class="fas fa-edit text-xs"></i> Edit Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-center py-16 bg-white rounded-xl border border-dashed border-blueGray-200 shadow-sm my-4"
          >
            <i
              class="fas fa-battery-empty text-4xl text-blueGray-300 mb-4 block animate-pulse"
            ></i>
            <p class="text-blueGray-700 font-bold text-base">
              No Packs Configured Yet
            </p>
            <p class="text-blueGray-400 text-sm mt-1">
              Click
              <strong class="text-emerald-500 font-semibold">+ New Pack</strong>
              to initialize your universal BMS cluster.
            </p>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="#modal-portal">
      <transition name="fade">
        <div
          v-if="modalOpen"
          class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            class="absolute inset-0 cursor-pointer"
            @click="modalOpen = false"
          ></div>

          <!-- Posisikan tag form membungkus seluruh isi modal card -->
          <form
            @submit.prevent="handleSubmit"
            id="packForm"
            class="relative bg-white w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden z-10 border border-blueGray-200 transform scale-100 transition-all duration-300"
          >
            <div
              class="flex items-center justify-between p-5 border-b border-solid border-blueGray-100 bg-blueGray-50"
            >
              <div class="flex items-center gap-2">
                <div
                  class="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm"
                >
                  <i
                    class="fas"
                    :class="isEditMode ? 'fa-sliders-h' : 'fa-cogs'"
                  ></i>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-blueGray-800">
                    {{
                      isEditMode
                        ? "Modify Pack Parameters"
                        : "Initialize New Cluster Pack"
                    }}
                  </h3>
                  <p class="text-[10px] text-blueGray-400 font-medium">
                    BMS Register Target: Sync to MongoDB & MQTT Cache
                  </p>
                </div>
              </div>
              <button
                @click="modalOpen = false"
                class="p-2 ml-auto bg-transparent border-0 text-blueGray-400 float-right text-xl leading-none font-semibold outline-none focus:outline-none hover:text-red-500 transition-colors rounded-full hover:bg-blueGray-100 flex items-center justify-center h-8 w-8"
                type="button"
              >
                <span>×</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
              <div class="flex items-center gap-2 mb-4">
                <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                <h6
                  class="text-blueGray-400 text-xs font-bold uppercase tracking-wider mb-0"
                >
                  Pack Register Identity
                </h6>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-600 text-[10px] font-black mb-1.5 tracking-wide"
                  >
                    Pack Identifier *
                  </label>
                  <input
                    v-model="form.pack_id"
                    :disabled="isEditMode"
                    required
                    placeholder="e.g. PACK_001"
                    class="border border-blueGray-300 px-3 py-2.5 placeholder-blueGray-300 text-blueGray-600 bg-white rounded-lg text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full ease-linear transition-all duration-150 disabled:bg-blueGray-100 disabled:text-blueGray-400 disabled:border-blueGray-200 font-mono"
                  />
                </div>
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-600 text-[10px] font-black mb-1.5 tracking-wide"
                  >
                    Cluster Display Name
                  </label>
                  <input
                    v-model="form.name"
                    placeholder="e.g. Solar Storage Bank"
                    class="border border-blueGray-300 px-3 py-2.5 placeholder-blueGray-300 text-blueGray-600 bg-white rounded-lg text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full ease-linear transition-all duration-150"
                  />
                </div>
              </div>

              <hr class="my-5 border-blueGray-100" />

              <div class="flex items-center gap-2 mb-4">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <h6
                  class="text-blueGray-400 text-xs font-bold uppercase tracking-wider mb-0"
                >
                  Battery Chemistry & S-Count
                </h6>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-600 text-[10px] font-black mb-1.5 tracking-wide"
                  >
                    Cell Chemistry Preset *
                  </label>
                  <select
                    v-model="form.chemistry"
                    @change="onChemistryChange"
                    class="border border-blueGray-300 px-3 py-2.5 text-blueGray-600 bg-white rounded-lg text-sm shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full ease-linear transition-all duration-150 font-medium"
                  >
                    <option
                      v-for="key in Object.keys(PRESETS)"
                      :key="key"
                      :value="key"
                    >
                      {{ key }}
                    </option>
                  </select>
                  <p
                    v-if="form.chemistry !== 'Custom'"
                    class="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1"
                  >
                    <i class="fas fa-check-circle"></i> Thresholds linked to
                    global profile
                  </p>
                </div>
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-600 text-[10px] font-black mb-1.5 tracking-wide"
                  >
                    Total Cells Count (S-Series) *
                  </label>
                  <input
                    v-model.number="form.cell_count"
                    type="number"
                    min="1"
                    max="200"
                    required
                    class="border border-blueGray-300 px-3 py-2.5 placeholder-blueGray-300 text-blueGray-600 bg-white rounded-lg text-sm shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full ease-linear transition-all duration-150 font-mono"
                  />
                </div>
              </div>

              <hr class="my-5 border-blueGray-100" />

              <div class="flex items-center gap-2 mb-4">
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <h6
                  class="text-blueGray-400 text-xs font-bold uppercase tracking-wider mb-0"
                >
                  Voltage Threshold Safety Limits (Per-Cell)
                </h6>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-500 text-[9px] font-black mb-1 tracking-wide"
                    >Under-V (Min) *</label
                  >
                  <input
                    v-model.number="form.min_voltage"
                    type="number"
                    step="0.01"
                    required
                    class="border border-blueGray-300 px-2 py-2 placeholder-blueGray-300 text-blueGray-600 bg-white rounded-md text-sm shadow-sm focus:outline-none focus:border-amber-500 w-full font-mono text-center"
                  />
                </div>
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-500 text-[9px] font-black mb-1 tracking-wide"
                    >Nominal V</label
                  >
                  <input
                    v-model.number="form.nominal_voltage"
                    type="number"
                    step="0.01"
                    class="border border-blueGray-300 px-2 py-2 placeholder-blueGray-300 text-blueGray-600 bg-white rounded-md text-sm shadow-sm focus:outline-none focus:border-amber-500 w-full font-mono text-center"
                  />
                </div>
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-500 text-[9px] font-black mb-1 tracking-wide"
                    >Over-V (Max) *</label
                  >
                  <input
                    v-model.number="form.max_voltage"
                    type="number"
                    step="0.01"
                    required
                    class="border border-blueGray-300 px-2 py-2 placeholder-blueGray-300 text-blueGray-600 bg-white rounded-md text-sm shadow-sm focus:outline-none focus:border-amber-500 w-full font-mono text-center"
                  />
                </div>
              </div>

              <hr class="my-5 border-blueGray-100" />

              <div class="flex items-center gap-2 mb-4">
                <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                <h6
                  class="text-blueGray-400 text-xs font-bold uppercase tracking-wider mb-0"
                >
                  Hardware Protection Operational Thresholds
                </h6>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-600 text-[10px] font-black mb-1.5 tracking-wide"
                  >
                    Thermal Runaway Trip (°C) *
                  </label>
                  <input
                    v-model.number="form.max_temp_celsius"
                    type="number"
                    step="1"
                    required
                    class="border border-blueGray-300 px-3 py-2.5 placeholder-blueGray-300 text-blueGray-600 bg-white rounded-lg text-sm shadow-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 w-full font-mono"
                  />
                </div>
                <div class="relative w-full">
                  <label
                    class="block uppercase text-blueGray-600 text-[10px] font-black mb-1.5 tracking-wide"
                  >
                    Overcurrent Safety Trip (A) *
                  </label>
                  <input
                    v-model.number="form.max_current_amps"
                    type="number"
                    step="0.5"
                    required
                    class="border border-blueGray-300 px-3 py-2.5 placeholder-blueGray-300 text-blueGray-600 bg-white rounded-lg text-sm shadow-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 w-full font-mono"
                  />
                </div>
              </div>

              <div
                v-if="errorMsg"
                class="text-white px-4 py-3 rounded-xl relative mt-4 bg-red-500 border border-red-600 shadow-sm"
                role="alert"
              >
                <span class="text-xs font-bold flex items-center gap-1">
                  <i class="fas fa-exclamation-triangle"></i> Register Failure:
                  {{ errorMsg }}
                </span>
              </div>
            </div>

            <div
              class="flex items-center justify-end p-4 border-t border-solid border-blueGray-100 bg-blueGray-50"
            >
              <button
                @click="modalOpen = false"
                class="text-blueGray-500 bg-transparent hover:bg-blueGray-200 font-bold uppercase px-5 py-2.5 text-xs rounded-lg transition-colors mr-2 outline-none focus:outline-none"
                type="button"
              >
                Abort
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase text-xs px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all outline-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{
                  saving
                    ? "Writing Registers…"
                    : isEditMode
                      ? "Apply Profiles"
                      : "Deploy Cluster"
                }}
              </button>
            </div>
          </form>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useBmsStore } from "@/stores/bmsStore";

// Chemistry presets
const PRESETS = {
  LiFePO4: {
    nominal_voltage: 3.2,
    min_voltage: 2.5,
    max_voltage: 3.65,
    max_temp_celsius: 55,
    max_current_amps: 20,
  },
  "Li-ion 18650": {
    nominal_voltage: 3.6,
    min_voltage: 3.0,
    max_voltage: 4.2,
    max_temp_celsius: 60,
    max_current_amps: 20,
  },
  Custom: {
    nominal_voltage: 0,
    min_voltage: 0,
    max_voltage: 0,
    max_temp_celsius: 0,
    max_current_amps: 0,
  },
};

const bmsStore = useBmsStore();
const modalOpen = ref(false);
const isEditMode = ref(false);
const saving = ref(false);
const errorMsg = ref("");

const BLANK = () => ({
  pack_id: "",
  name: "",
  chemistry: "LiFePO4",
  cell_count: 4,
  ...PRESETS["LiFePO4"],
});

const form = reactive(BLANK());

onMounted(async () => {
  try {
    await bmsStore.fetchPacks();
  } catch (err) {
    console.error("Failed to load initial clusters:", err);
  }
});

// ── Helpers ──
function chemistryBadge(chemistry) {
  const map = {
    LiFePO4: "text-emerald-600 bg-emerald-100 border border-emerald-200",
    "Li-ion 18650": "text-blue-600 bg-blue-100 border border-blue-200", // Ganti lightBlue ke blue standar tailwind jika warna hilang
    Custom: "text-slate-600 bg-slate-100 border border-slate-200",
  };
  return map[chemistry] ?? "text-slate-600 bg-slate-100";
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

// ── Modal Operations ──
function openCreate() {
  isEditMode.value = false;
  errorMsg.value = "";
  Object.assign(form, BLANK());
  modalOpen.value = true;
}

function openEdit(pack) {
  isEditMode.value = true;
  errorMsg.value = "";
  Object.assign(form, {
    pack_id: pack.pack_id,
    name: pack.name,
    chemistry: pack.chemistry,
    cell_count: pack.cell_count,
    nominal_voltage: pack.nominal_voltage,
    min_voltage: pack.min_voltage,
    max_voltage: pack.max_voltage,
    max_temp_celsius: pack.max_temp_celsius,
    max_current_amps: pack.max_current_amps,
  });
  modalOpen.value = true;
}

function onChemistryChange() {
  const preset = PRESETS[form.chemistry];
  if (preset) {
    // Agar input text / count tidak ikut ter-reset saat ganti preset
    form.nominal_voltage = preset.nominal_voltage;
    form.min_voltage = preset.min_voltage;
    form.max_voltage = preset.max_voltage;
    form.max_temp_celsius = preset.max_temp_celsius;
    form.max_current_amps = preset.max_current_amps;
  }
}

// ── Form Action Handlers ──
async function handleSubmit() {
  saving.value = true;
  errorMsg.value = "";
  try {
    if (isEditMode.value) {
      await bmsStore.updatePack(form.pack_id, { ...form });
    } else {
      await bmsStore.createPack({ ...form });
    }
    modalOpen.value = false;
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.error || err.message || "Request validation failed.";
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
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
</style>
