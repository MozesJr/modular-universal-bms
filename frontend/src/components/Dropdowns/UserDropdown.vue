<template>
  <div style="position: relative">
    <button
      ref="btnDropdownRef"
      @click.prevent="toggleDropdown"
      style="
        background: rgba(255, 255, 255, 0.15);
        border: none;
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      "
    >
      <div
        :style="`width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; flex-shrink:0;`"
      >
        <i
          class="fas text-white text-sm"
          :class="isAdmin ? 'fa-shield-alt' : 'fa-user-circle'"
        ></i>
      </div>
      <div class="hidden lg:block text-left">
        <div
          style="
            font-size: 13px;
            font-weight: 500;
            color: white;
            line-height: 1.2;
          "
        >
          {{ username }}
        </div>
        <div
          style="
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.2;
          "
        >
          {{ isAdmin ? "Administrator" : "User" }}
        </div>
      </div>
      <i
        class="fas fa-chevron-down hidden lg:block"
        style="font-size: 11px; color: rgba(255, 255, 255, 0.7)"
      ></i>
    </button>

    <div
      ref="popoverDropdownRef"
      :class="dropdownPopoverShow ? 'block' : 'hidden'"
      style="
        position: absolute;
        right: 0;
        top: calc(100% + 6px);
        background: white;
        border-radius: 12px;
        min-width: 220px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        z-index: 9999;
        border: 0.5px solid #e5e7eb;
      "
    >
      <!-- Header info -->
      <div
        style="
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 10px;
        "
      >
        <div
          :style="`width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:${
            isAdmin ? '#ede9fe' : '#d1fae5'
          };`"
        >
          <i
            class="fas"
            :class="isAdmin ? 'fa-shield-alt' : 'fa-user-circle'"
            :style="`font-size:18px; color:${isAdmin ? '#7c3aed' : '#059669'};`"
          ></i>
        </div>
        <div>
          <div style="font-size: 13px; font-weight: 600; color: #1e293b">
            {{ username }}
          </div>
          <div style="font-size: 11px; color: #94a3b8">{{ email }}</div>
          <span
            :style="`display:inline-block; margin-top:3px; font-size:10px; font-weight:600; padding:1px 8px; border-radius:20px; background:${
              isAdmin ? '#ede9fe' : '#d1fae5'
            }; color:${isAdmin ? '#7c3aed' : '#059669'};`"
          >
            {{ isAdmin ? "Administrator" : "User" }}
          </span>
        </div>
      </div>

      <!-- Logout -->
      <button
        @click="handleLogout"
        style="
          width: 100%;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #ef4444;
          font-size: 13px;
          text-align: left;
        "
        onmouseover="this.style.background='#fef2f2'"
        onmouseout="this.style.background='transparent'"
      >
        <i class="fas fa-sign-out-alt" style="font-size: 14px"></i>
        Logout
      </button>
    </div>
  </div>
</template>

<script>
import { createPopper } from "@popperjs/core";
import { useAuthStore } from "@/stores/authStore";
import { computed } from "vue";

export default {
  setup() {
    const auth = useAuthStore();
    return {
      username: computed(() => auth.user?.username || "User"),
      email: computed(() => auth.user?.email || ""),
      isAdmin: computed(() => auth.isAdmin),
    };
  },
  data() {
    return { dropdownPopoverShow: false };
  },
  methods: {
    toggleDropdown() {
      this.dropdownPopoverShow = !this.dropdownPopoverShow;
      if (this.dropdownPopoverShow) {
        createPopper(this.$refs.btnDropdownRef, this.$refs.popoverDropdownRef, {
          placement: "bottom-end",
        });
      }
    },
    handleLogout() {
      const auth = useAuthStore();
      auth.logout();
      this.$router.push("/auth/login");
    },
  },
};
</script>
