// src/composables/useSocket.js
import { ref } from "vue";
import { io } from "socket.io-client";
import { useBmsStore } from "@/stores/bmsStore";

const socket = ref(null);
const connected = ref(false);

export function useSocket() {
  const bmsStore = useBmsStore();

  function connect() {
    if (socket.value?.connected) return;

    const url = import.meta.env.VITE_SOCKET_URL || "";
    socket.value = io(url, { transports: ["websocket", "polling"] });

    socket.value.on("connect", () => {
      connected.value = true;
      console.log("🔌 Socket connected:", socket.value.id);
    });

    // Main data feed — new reading for a cell
    socket.value.on("cell:update", (reading) => {
      bmsStore.applyReading(reading);
    });

    // Alert feed
    socket.value.on("cell:alert", (reading) => {
      console.warn("🚨 Alert:", reading);
    });

    socket.value.on("disconnect", () => {
      connected.value = false;
      console.warn("⚠️  Socket disconnected");
    });
  }

  function joinPack(packId) {
    socket.value?.emit("join:pack", packId);
  }

  return { socket, connected, connect, joinPack };
}
