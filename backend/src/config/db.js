/**
 * config/db.js — MongoDB connection using Mongoose
 */

"use strict";

const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined in environment");

  await mongoose.connect(uri);
  console.log("✅ MongoDB connected:", mongoose.connection.host);

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected — retrying...");
  });
}

module.exports = connectDB;
