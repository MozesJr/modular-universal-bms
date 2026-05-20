<template>
  <footer class="block py-4">
    <div class="container mx-auto px-4">
      <hr class="mb-4 border-b-1 border-blueGray-200" />
      <div
        class="flex flex-wrap items-center md:justify-between justify-center"
      >
        <div class="w-full md:w-4/12 px-4">
          <div class="text-sm text-blueGray-500 font-semibold py-1">
            Copyright © {{ date }} BMS Capstone V {{ version }}. by
            <a
              href="https://github.com/MozesJr"
              class="text-black hover:text-blueGray-300 text-sm font-semibold py-1"
            >
              Mozes Sapari
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
<script>
export default {
  data() {
    return {
      date: new Date().getFullYear(),
      version: process.env.VUE_APP_VERSION || "1.0",
    };
  },
};
</script>
