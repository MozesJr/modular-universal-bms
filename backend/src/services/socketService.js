/**
 * services/socketService.js
 * Configures Socket.io server for real-time BMS updates.
 *
 * Events emitted to frontend:
 *   "cell:update"  — New sensor reading for a cell
 *   "cell:alert"   — Reading that breached a safety threshold
 *
 * Auth: every connection must present a valid JWT (same token used for the
 * REST API) via `socket.handshake.auth.token`. Room membership is further
 * gated per-pack on "join:pack" using the same owner/collaborator/admin
 * rule as the REST pack endpoints (see middleware/auth.js#resolvePackAccess)
 * — a client can only join rooms for packs it's actually allowed to see.
 */

"use strict";

const { Server } = require("socket.io");
const { verifyAuthToken, resolvePackAccess } = require("../middleware/auth");

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

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized: token tidak ditemukan"));
    }

    const result = await verifyAuthToken(token);
    if (!result.ok) {
      const message =
        result.reason === "inactive_user"
          ? "User tidak valid atau nonaktif"
          : "Token tidak valid";
      return next(new Error(message));
    }

    socket.userId = result.user._id.toString();
    socket.user = result.user;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Frontend connected: ${socket.id} (user: ${socket.userId})`);

    // Client can subscribe to a specific pack — only if it actually has
    // access to it (owner, collaborator, or admin), mirroring the REST
    // GET /api/cells/:packId family of endpoints.
    socket.on("join:pack", async (packId) => {
      try {
        const result = await resolvePackAccess(socket.user, packId);

        if (result.reason !== "ok") {
          const message =
            result.reason === "pack_not_found"
              ? "Pack tidak ditemukan"
              : result.reason === "bms_not_found"
                ? "BMS induk pack ini tidak ditemukan"
                : "Anda tidak punya akses ke pack ini";
          console.warn(
            `  ⛔ ${socket.id} (user ${socket.userId}) ditolak join pack room "${packId}": ${result.reason}`,
          );
          socket.emit("join:pack:error", { packId, message });
          return;
        }

        socket.join(`pack:${packId}`);
        console.log(`  → ${socket.id} joined pack room: ${packId}`);
      } catch (err) {
        console.error("❌ join:pack error:", err.message);
        socket.emit("join:pack:error", {
          packId,
          message: "Terjadi kesalahan saat join pack.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Frontend disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
}

module.exports = { initSocket };
