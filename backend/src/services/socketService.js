/**
 * services/socketService.js
 * Configures Socket.io server for real-time BMS updates.
 *
 * Events emitted to frontend:
 *   "cell:update"  — New sensor reading for a cell
 *   "cell:alert"   — Reading that breached a safety threshold
 */

"use strict";

const { Server } = require("socket.io");

/**
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Restrict to frontend origin in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Frontend connected: ${socket.id}`);

    // Client can subscribe to a specific pack
    socket.on("join:pack", (packId) => {
      socket.join(`pack:${packId}`);
      console.log(`  → ${socket.id} joined pack room: ${packId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Frontend disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
}

module.exports = { initSocket };
