<template>
  <nav
    class="absolute top-0 left-0 w-full z-10 bg-transparent md:flex-row md:flex-nowrap md:justify-start flex items-center p-4"
  >
    <div
      class="w-full mx-auto items-center flex justify-between md:flex-nowrap flex-wrap md:px-10 px-4"
    >
      <!-- Page title (ikut route) -->
      <span
        class="text-white text-sm uppercase hidden lg:inline-block font-semibold"
      >
        {{ pageTitle }}
      </span>

      <!-- Search -->
      <form
        class="md:flex hidden flex-row flex-wrap items-center lg:ml-auto mr-3"
      >
        <div class="relative flex w-full flex-wrap items-stretch">
          <span
            class="z-10 h-full leading-snug font-normal absolute text-center text-blueGray-300 bg-transparent rounded text-base items-center justify-center w-8 pl-3 py-3"
          >
            <i class="fas fa-search"></i>
          </span>
          <input
            type="text"
            placeholder="Search here..."
            class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow outline-none focus:outline-none focus:ring w-full pl-10"
          />
        </div>
      </form>

      <!-- User dropdown -->
      <ul class="flex-col md:flex-row list-none items-center hidden md:flex">
        <user-dropdown />
      </ul>
    </div>
  </nav>
</template>

<script>
import UserDropdown from "@/components/Dropdowns/UserDropdown.vue";

const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/alerts": "Alerts",
  "/admin/config": "Pack Config",
  "/admin/pack-detail": "Pack Detail",
  "/admin/pack-form": "Pack Form",
  "/admin/users": "User Management",
  "/admin/user-form": "User Form",
  "/admin/user-reset-password": "Reset Password",
  "/admin/assign-pack": "Assign Pack",
  "/admin/assign-pack-form": "Assign Pack",
  "/admin/collaborators": "Collaborators",
};

export default {
  components: { UserDropdown },
  computed: {
    pageTitle() {
      return PAGE_TITLES[this.$route.path] || "BMS Dashboard";
    },
  },
};
</script>
