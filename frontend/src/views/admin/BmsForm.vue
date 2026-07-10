<template>
  <div class="flex flex-wrap mt-4">
    <div class="w-full mb-12 px-4">
      <div
        class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded"
      >
        <div
          class="rounded-t bg-white mb-0 px-6 py-6 border-b border-solid border-blueGray-100"
        >
          <div class="flex items-center gap-4">
            <router-link
              to="/admin/bms-config"
              class="h-8 w-8 rounded bg-blueGray-100 hover:bg-blueGray-200 flex items-center justify-center transition-colors"
            >
              <i class="fas fa-arrow-left text-blueGray-600 text-xs"></i>
            </router-link>
            <div>
              <h6 class="text-blueGray-700 text-xl font-bold">
                {{ isEditMode ? "Edit BMS Device" : "Register New BMS Device" }}
              </h6>
              <p class="text-blueGray-400 text-sm mt-0.5">
                {{
                  isEditMode
                    ? `Editing: ${route.query.edit}`
                    : "Daftarkan perangkat BMS fisik baru"
                }}
              </p>
            </div>
          </div>
        </div>

        <form
          @submit.prevent="handleSubmit"
          class="flex-auto px-4 lg:px-10 py-8"
        >
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

          <div class="flex flex-wrap mb-6">
            <div class="w-full mb-4">
              <h6
                class="text-blueGray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <span
                  class="inline-block h-2 w-2 rounded-full bg-indigo-500"
                ></span>
                BMS Device Identity
              </h6>
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
                >BMS Identifier *</label
              >
              <input
                v-model="form.bms_id"
                :disabled="isEditMode"
                required
                placeholder="e.g. BMS_001"
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full disabled:bg-blueGray-100 disabled:text-blueGray-400 font-mono"
              />
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
                >Display Name</label
              >
              <input
                v-model="form.name"
                placeholder="e.g. Rumah Solar Panel Unit A"
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
              />
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
                >Serial Number</label
              >
              <input
                v-model="form.bms_sernum"
                placeholder="e.g. BMS-SN-20260001"
                class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full font-mono"
              />
            </div>

            <div class="w-full lg:w-4/12 px-2 mb-4">
              <label
                class="block uppercase text-blueGray-500 text-xs font-bold mb-2"
                >Model BMS</label
              >
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
            </div>
          </div>

          <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-blueGray-100"
          >
            <router-link
              to="/admin/bms-config"
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
                  : "Register Device"
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

const BLANK = () => ({
  bms_id: "",
  name: "",
  bms_sernum: "",
  bms_model_name: "",
});
const form = reactive(BLANK());
const saving = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

onMounted(async () => {
  await bmsStore.fetchBmsDevices();
  await bmsStore.fetchBmsModels();

  if (isEditMode.value) {
    const bmsId = route.query.edit;
    const existing = bmsStore.bmsDevices.find((b) => b.bms_id === bmsId);
    if (existing) {
      Object.assign(form, {
        bms_id: existing.bms_id,
        name: existing.name ?? "",
        bms_sernum: existing.bms_sernum ?? "",
        bms_model_name: existing.bms_model_name ?? "",
      });
    } else {
      errorMsg.value = `BMS "${bmsId}" tidak ditemukan.`;
    }
  }
});

async function handleSubmit() {
  saving.value = true;
  errorMsg.value = "";
  successMsg.value = "";
  try {
    const payload = { ...form };
    if (!payload.bms_sernum) delete payload.bms_sernum;
    if (!payload.bms_model_name) delete payload.bms_model_name;

    if (isEditMode.value) {
      await bmsStore.updateBms(form.bms_id, payload);
      successMsg.value = "BMS berhasil diupdate!";
    } else {
      await bmsStore.createBms(payload);
      successMsg.value = "BMS berhasil didaftarkan! Menunggu verifikasi admin.";
    }
    setTimeout(() => router.push("/admin/bms-config"), 1000);
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.error || err.message || "Gagal menyimpan data.";
  } finally {
    saving.value = false;
  }
}
</script>
