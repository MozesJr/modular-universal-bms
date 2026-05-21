<template>
  <div
    class="bg-white border border-blueGray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full overflow-hidden"
  >
    <div
      class="px-4 pt-4 pb-2 flex justify-between items-center bg-blueGray-50/50 border-b border-blueGray-100"
    >
      <div class="flex items-center gap-1.5">
        <i class="fas fa-battery-three-quarters text-emerald-500 text-xs"></i>
        <span class="text-xs font-bold text-blueGray-700"
          >Cell {{ cell.cell_id }}</span
        >
      </div>
      <span
        class="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 uppercase tracking-wide"
      >
        OK
      </span>
    </div>

    <div class="p-4 flex-1 flex flex-col justify-between gap-3">
      <div
        class="grid grid-cols-2 gap-2 border-b border-blueGray-50 pb-2.5 text-center"
      >
        <div>
          <p
            class="text-[10px] font-bold text-blueGray-400 uppercase tracking-tight"
          >
            Voltage
          </p>
          <p class="text-base font-black text-blueGray-700 font-mono mt-0.5">
            {{ cell.voltage ? cell.voltage.toFixed(3) : "0.000"
            }}<span class="text-xs font-normal text-blueGray-400 ml-0.5"
              >V</span
            >
          </p>
        </div>
        <div>
          <p
            class="text-[10px] font-bold text-blueGray-400 uppercase tracking-tight"
          >
            Current
          </p>
          <p class="text-base font-black text-blueGray-700 font-mono mt-0.5">
            {{ cell.current ? cell.current.toFixed(2) : "0.00"
            }}<span class="text-xs font-normal text-blueGray-400 ml-0.5"
              >A</span
            >
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-center">
        <div>
          <p class="text-[9px] font-bold text-blueGray-400 uppercase">Temp</p>
          <p class="text-xs font-bold text-blueGray-600 font-mono mt-0.5">
            {{ cell.temperature ?? 0
            }}<span class="text-[10px] font-normal text-blueGray-400 ml-0.5"
              >°C</span
            >
          </p>
        </div>
        <div>
          <p class="text-[9px] font-bold text-blueGray-400 uppercase">SoC</p>
          <p class="text-xs font-bold text-blueGray-600 font-mono mt-0.5">
            {{ cell.soc ?? 0
            }}<span class="text-[10px] font-normal text-blueGray-400 ml-0.5"
              >%</span
            >
          </p>
        </div>
      </div>
    </div>

    <div
      class="bg-slate-50 border-t border-blueGray-100 p-2 text-center flex flex-col gap-1 justify-center min-h-[50px]"
    >
      <div class="w-full flex items-center justify-center opacity-70 h-5 px-2">
        <svg
          class="w-full h-full stroke-emerald-500 fill-none"
          viewBox="0 0 100 20"
          stroke-width="1.5"
        >
          <polyline points="0,15 15,10 30,18 45,5 60,12 75,15 90,4 100,10" />
        </svg>
      </div>

      <div
        class="flex justify-between items-center px-2 text-[9px] text-blueGray-400 font-mono"
      >
        <span>V1.1 ACTIVE</span>
        <span>0s ago</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CellCard",
  props: {
    cell: {
      type: Object,
      required: true,
    },
    history: {
      type: Array,
      default: () => [],
    },
    packConfig: {
      type: Object,
      default: null,
    },
  },
};
</script>
