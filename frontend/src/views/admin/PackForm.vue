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

        <!-- Form body -->
        <form
          @submit.prevent="handleSubmit"
          class="flex-auto px-4 lg:px-10 py-8"
        >
          <!-- Error banner -->
          <div
            v-if="errorMsg"
            class="mb-6 bg-red-500 text-white text-sm font-bold px-4 py-3 rounded flex items-center gap-2"
          >
            <i class="fas fa-exclamation-triangle"></i>
            {{ errorMsg }}
          </div>

          <!-- Success banner -->
          <div
            v-if="successMsg"
            class="mb-6 bg-emerald-500 text-white text-sm font-bold px-4 py-3 rounded flex items-center gap-2"
          >
            <i class="fas fa-check-circle"></i>
            {{ successMsg }}
          </div>

          <!-- ── Section 1: Identity ───────────────────────── -->
          <div class="flex flex-wrap mb-6">
            <div class="w-full">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full bg-indigo-500"
                ></span>
                Pack Register Identity
              </h6>
            </div>

            <div class="w-full lg:w-6/12 px-2 mb-4">
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
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 disabled:bg-blueGray-100 disabled:text-blueGray-400 font-mono"
              />
              <p v-if="isEditMode" class="text-xs text-blueGray-400 mt-1">
                <i class="fas fa-lock text-xs mr-1"></i>Pack ID tidak bisa
                diubah.
              </p>
            </div>

            <div class="w-full lg:w-6/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Display Name
              </label>
              <input
                v-model="form.name"
                placeholder="e.g. Solar Storage Bank"
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              />
            </div>
          </div>

          <hr class="border-blueGray-200 mb-6" />

          <!-- ── Section 2: Chemistry & Cell Count ────────── -->
          <div class="flex flex-wrap mb-6">
            <div class="w-full">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full bg-emerald-500"
                ></span>
                Battery Chemistry &amp; Series Count
              </h6>
            </div>

            <div class="w-full lg:w-6/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Cell Chemistry Preset *
              </label>
              <select
                v-model="form.chemistry"
                @change="onChemistryChange"
                class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
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
                class="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1"
              >
                <i class="fas fa-check-circle"></i> Thresholds auto-filled from
                preset
              </p>
            </div>

            <div class="w-full lg:w-6/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
              >
                Total Cells in Series (S) *
              </label>
              <input
                v-model.number="form.cell_count"
                type="number"
                min="1"
                max="200"
                required
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 font-mono"
              />
            </div>
          </div>

          <hr class="border-blueGray-200 mb-6" />

          <!-- ── Section 3: Voltage Limits ────────────────── -->
          <div class="flex flex-wrap mb-6">
            <div class="w-full">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
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
              >
                Under-Voltage Min (V) *
              </label>
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
              >
                Nominal Voltage (V)
              </label>
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
              >
                Over-Voltage Max (V) *
              </label>
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

          <!-- ── Section 4: Protection Thresholds ─────────── -->
          <div class="flex flex-wrap mb-8">
            <div class="w-full">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
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
              class="text-blueGray-500 bg-white hover:bg-blueGray-100 font-bold uppercase px-4 py-2 text-xs rounded border border-blueGray-200 transition-colors outline-none focus:outline-none"
            >
              Cancel
            </router-link>
            <button
              type="submit"
              :disabled="saving"
              class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md transition-all outline-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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

// ── Edit mode: deteksi dari query ?edit=PACK_001 ─────────────
const isEditMode = computed(() => !!route.query.edit);

// ── Chemistry presets ────────────────────────────────────────
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

const BLANK = () => ({
  pack_id: "",
  name: "",
  chemistry: "LiFePO4",
  cell_count: 4,
  ...PRESETS["LiFePO4"],
});

const form = reactive(BLANK());
const saving = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

// ── Load existing pack data jika edit mode ───────────────────
onMounted(async () => {
  await bmsStore.fetchPacks();

  if (isEditMode.value) {
    const packId = route.query.edit;
    const existing = bmsStore.packs.find((p) => p.pack_id === packId);
    if (existing) {
      Object.assign(form, {
        pack_id: existing.pack_id,
        name: existing.name ?? "",
        chemistry: existing.chemistry ?? "LiFePO4",
        cell_count: existing.cell_count ?? 4,
        nominal_voltage:
          existing.nominal_voltage ?? PRESETS["LiFePO4"].nominal_voltage,
        min_voltage: existing.min_voltage ?? PRESETS["LiFePO4"].min_voltage,
        max_voltage: existing.max_voltage ?? PRESETS["LiFePO4"].max_voltage,
        max_temp_celsius:
          existing.max_temp_celsius ?? PRESETS["LiFePO4"].max_temp_celsius,
        max_current_amps:
          existing.max_current_amps ?? PRESETS["LiFePO4"].max_current_amps,
      });
    } else {
      errorMsg.value = `Pack "${packId}" tidak ditemukan.`;
    }
  }
});

function onChemistryChange() {
  const preset = PRESETS[form.chemistry];
  if (preset) {
    form.nominal_voltage = preset.nominal_voltage;
    form.min_voltage = preset.min_voltage;
    form.max_voltage = preset.max_voltage;
    form.max_temp_celsius = preset.max_temp_celsius;
    form.max_current_amps = preset.max_current_amps;
  }
}

async function handleSubmit() {
  saving.value = true;
  errorMsg.value = "";
  successMsg.value = "";
  try {
    if (isEditMode.value) {
      await bmsStore.updatePack(form.pack_id, { ...form });
      successMsg.value = "Pack berhasil diupdate!";
    } else {
      await bmsStore.createPack({ ...form });
      successMsg.value = "Pack berhasil dibuat!";
    }
    // Redirect ke list setelah 1 detik
    setTimeout(() => router.push("/admin/config"), 1000);
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.error || err.message || "Gagal menyimpan data.";
  } finally {
    saving.value = false;
  }
}
</script>
