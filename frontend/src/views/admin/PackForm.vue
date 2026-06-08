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
          <div class="flex items-center gap-4">
            <router-link
              to="/admin/config"
              class="h-8 w-8 rounded bg-blueGray-100 hover:bg-blueGray-200 flex items-center justify-center transition-colors"
            >
              <i class="fas fa-arrow-left text-blueGray-600 text-xs"></i>
            </router-link>
            <div>
              <h6 class="text-blueGray-700 text-xl font-bold">
                {{ isEditMode ? "Edit Pack Configuration" : "Create New Pack" }}
              </h6>
              <p class="text-blueGray-400 text-sm mt-0.5">
                {{
                  isEditMode
                    ? `Editing: ${route.query.edit}`
                    : "Initialize new BMS cluster"
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form
          @submit.prevent="handleSubmit"
          class="flex-auto px-4 lg:px-10 py-8"
        >
          <!-- Banner error/success -->
          <div
            v-if="errorMsg"
            class="mb-6 bg-red-500 text-white text-sm font-bold px-4 py-3 rounded flex items-center gap-2"
          >
            <i class="fas fa-exclamation-triangle"></i> {{ errorMsg }}
          </div>
          <div
            v-if="successMsg"
            class="mb-6 bg-emerald-500 text-white text-sm font-bold px-4 py-3 rounded flex items-center gap-2"
          >
            <i class="fas fa-check-circle"></i> {{ successMsg }}
          </div>

          <!-- ── Section 1: Identitas Pack ──────────────────── -->
          <div class="flex flex-wrap mb-6">
            <div class="w-full mb-4">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full bg-indigo-500"
                ></span>
                Pack Register Identity
              </h6>
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Pack Identifier *
              </label>
              <input
                v-model="form.pack_id"
                :disabled="isEditMode"
                required
                placeholder="e.g. PACK_001"
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full disabled:bg-blueGray-100 disabled:text-blueGray-400 font-mono"
              />
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Display Name
              </label>
              <input
                v-model="form.name"
                placeholder="e.g. Solar Storage Bank"
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
              />
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Serial Number BMS
              </label>
              <input
                v-model="form.bms_sernum"
                placeholder="e.g. BMS-SN-20260001"
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono"
              />
            </div>
          </div>

          <hr class="border-blueGray-200 mb-6" />

          <!-- ── Section 2: BMS Model & Hardware Info ───────── -->
          <div class="flex flex-wrap mb-6">
            <div class="w-full mb-4">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full bg-purple-500"
                ></span>
                BMS Hardware Info
              </h6>
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Model BMS
              </label>
              <select
                v-model="form.bms_model_name"
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
              >
                <option value="">— Pilih model (opsional) —</option>
                <option
                  v-for="m in bmsStore.bmsModels"
                  :key="m._id"
                  :value="m.model_name"
                >
                  {{ m.model_name }}
                </option>
              </select>
              <p class="text-xs text-blueGray-400 mt-1">
                Kelola model di
                <router-link
                  to="/admin/config"
                  class="text-indigo-500 hover:underline"
                  >Pack Config</router-link
                >
              </p>
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Cycle Count
              </label>
              <input
                v-model.number="form.cycle_count"
                type="number"
                min="0"
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono"
              />
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Status / State
              </label>
              <select
                v-model="form.state"
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
              >
                <option value="standby">Standby</option>
                <option value="normal">Normal</option>
                <option value="charging">Charging</option>
                <option value="discharging">Discharging</option>
                <option value="fault">Fault</option>
              </select>
            </div>
          </div>

          <hr class="border-blueGray-200 mb-6" />

          <!-- ── Section 3: Chemistry & Cell Count ──────────── -->
          <div class="flex flex-wrap mb-6">
            <div class="w-full mb-4">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full bg-emerald-500"
                ></span>
                Battery Chemistry &amp; Configuration
              </h6>
            </div>

            <div class="w-full lg:w-3/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Chemistry Preset *
              </label>
              <select
                v-model="form.chemistry"
                @change="onChemistryChange"
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
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
                class="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1"
              >
                <i class="fas fa-check-circle"></i> Threshold auto-filled
              </p>
            </div>

            <div class="w-full lg:w-3/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Total Cells (S-Series) *
              </label>
              <input
                v-model.number="form.cell_count"
                type="number"
                min="1"
                max="200"
                required
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono"
              />
            </div>

            <div class="w-full lg:w-3/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Kapasitas (Ah) *
              </label>
              <input
                v-model.number="form.capacity_ah"
                type="number"
                min="1"
                step="0.1"
                required
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono"
              />
            </div>

            <div class="w-full lg:w-3/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Jumlah Pack Paralel
              </label>
              <input
                v-model.number="form.pack_num"
                type="number"
                min="1"
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono"
              />
            </div>
          </div>

          <hr class="border-blueGray-200 mb-6" />

          <!-- ── Section 4: Voltage Limits ──────────────────── -->
          <div class="flex flex-wrap mb-6">
            <div class="w-full mb-4">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full bg-amber-500"
                ></span>
                Voltage Safety Limits (Per-Cell)
              </h6>
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
                >Under-Voltage Min (V) *</label
              >
              <input
                v-model.number="form.min_voltage"
                type="number"
                step="0.01"
                required
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono text-center"
              />
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
                >Nominal Voltage (V)</label
              >
              <input
                v-model.number="form.nominal_voltage"
                type="number"
                step="0.01"
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono text-center"
              />
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
                >Over-Voltage Max (V) *</label
              >
              <input
                v-model.number="form.max_voltage"
                type="number"
                step="0.01"
                required
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono text-center"
              />
            </div>
          </div>

          <hr class="border-blueGray-200 mb-6" />

          <!-- ── Section 5: Protection Thresholds ───────────── -->
          <div class="flex flex-wrap mb-8">
            <div class="w-full mb-4">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full bg-red-500"
                ></span>
                Hardware Protection Thresholds
              </h6>
            </div>

            <div class="w-full lg:w-6/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Thermal Runaway Trip (°C) *
              </label>
              <input
                v-model.number="form.max_temp_celsius"
                type="number"
                step="1"
                required
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono"
              />
            </div>

            <div class="w-full lg:w-6/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Overcurrent Safety Trip (A) *
              </label>
              <input
                v-model.number="form.max_current_amps"
                type="number"
                step="0.5"
                required
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono"
              />
            </div>
          </div>

          <!-- ── Form Actions ───────────────────────────────── -->
          <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-blueGray-100"
          >
            <router-link
              to="/admin/config"
              class="text-blueGray-500 bg-white hover:bg-blueGray-100 font-bold uppercase px-5 py-2.5 text-xs rounded border border-blueGray-200 transition-colors outline-none focus:outline-none"
            >
              Cancel
            </router-link>
            <button
              type="submit"
              :disabled="saving"
              class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase text-xs px-6 py-2.5 rounded shadow hover:shadow-md transition-all outline-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{
                saving
                  ? "Saving…"
                  : isEditMode
                  ? "Save Changes"
                  : "Deploy Cluster"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBmsStore } from "@/stores/bmsStore";

const route = useRoute();
const router = useRouter();
const bmsStore = useBmsStore();

const isEditMode = computed(() => !!route.query.edit);

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
  NMC: {
    nominal_voltage: 3.7,
    min_voltage: 3.0,
    max_voltage: 4.2,
    max_temp_celsius: 55,
    max_current_amps: 25,
  },
  LCO: {
    nominal_voltage: 3.7,
    min_voltage: 3.0,
    max_voltage: 4.2,
    max_temp_celsius: 50,
    max_current_amps: 15,
  },
  Custom: {
    nominal_voltage: 0,
    min_voltage: 0,
    max_voltage: 0,
    max_temp_celsius: 0,
    max_current_amps: 0,
  },
};

const BLANK = () => ({
  pack_id: "",
  name: "",
  bms_sernum: "",
  bms_model_name: "",
  chemistry: "LiFePO4",
  cell_count: 4,
  capacity_ah: 100,
  pack_num: 1,
  cell_series: 1,
  cycle_count: 0,
  state: "standby",
  ...PRESETS["LiFePO4"],
});

const form = reactive(BLANK());
const saving = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

onMounted(async () => {
  await bmsStore.fetchPacks();
  await bmsStore.fetchBmsModels();

  if (isEditMode.value) {
    const packId = route.query.edit;
    const existing = bmsStore.packs.find((p) => p.pack_id === packId);
    if (existing) {
      Object.assign(form, {
        pack_id: existing.pack_id,
        name: existing.name ?? "",
        bms_sernum: existing.bms_sernum ?? "",
        bms_model_name: existing.bms_model_name ?? "",
        chemistry: existing.chemistry ?? "LiFePO4",
        cell_count: existing.cell_count ?? 4,
        capacity_ah: existing.capacity_ah ?? 100,
        pack_num: existing.pack_num ?? 1,
        cell_series: existing.cell_series ?? 1,
        cycle_count: existing.cycle_count ?? 0,
        state: existing.state ?? "standby",
        nominal_voltage: existing.nominal_voltage ?? 3.2,
        min_voltage: existing.min_voltage ?? 2.5,
        max_voltage: existing.max_voltage ?? 3.65,
        max_temp_celsius: existing.max_temp_celsius ?? 55,
        max_current_amps: existing.max_current_amps ?? 20,
      });
    } else {
      errorMsg.value = `Pack "${packId}" tidak ditemukan.`;
    }
  }
});

function onChemistryChange() {
  const preset = PRESETS[form.chemistry];
  if (preset) Object.assign(form, preset);
}

async function handleSubmit() {
  saving.value = true;
  errorMsg.value = "";
  successMsg.value = "";
  try {
    const payload = { ...form };
    // Hapus field kosong agar tidak override existing
    if (!payload.bms_sernum) delete payload.bms_sernum;
    if (!payload.bms_model_name) delete payload.bms_model_name;

    if (isEditMode.value) {
      await bmsStore.updatePack(form.pack_id, payload);
      successMsg.value = "Pack berhasil diupdate!";
    } else {
      await bmsStore.createPack(payload);
      successMsg.value = "Pack berhasil dibuat!";
    }
    setTimeout(() => router.push("/admin/config"), 1000);
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.error || err.message || "Gagal menyimpan data.";
  } finally {
    saving.value = false;
  }
}
</script>
