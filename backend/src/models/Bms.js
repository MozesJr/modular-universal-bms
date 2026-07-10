/**
 * models/Bms.js
 * Device fisik BMS (hardware). Satu Bms bisa punya banyak Pack.
 * Field ownership/verifikasi/collaborator pindah kesini dari BatteryPack lama.
 */
"use strict";
const mongoose = require("mongoose");

const bmsSchema = new mongoose.Schema(
  {
    bms_id: { type: String, required: true, unique: true }, // e.g. BMS_001
    name: { type: String, default: "Unnamed BMS" },
    bms_sernum: { type: String, default: null },
    bms_model_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BmsModel",
      default: null,
    },
    bms_model_name: { type: String, default: null },

    // ── Ownership & Access Control ─────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_verification", "active", "rejected", "suspended"],
      default: "pending_verification",
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verified_at: { type: Date, default: null },

    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        permission: {
          type: String,
          enum: ["view", "maintain"],
          default: "view",
        },
        added_at: { type: Date, default: Date.now },
      },
    ],

    transfer_history: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        transferred_at: { type: Date, default: Date.now },
        note: String,
      },
    ],

    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

bmsSchema.index({ owner: 1 });
bmsSchema.index({ "collaborators.user": 1 });

module.exports = mongoose.model("Bms", bmsSchema, "bms_devices");
