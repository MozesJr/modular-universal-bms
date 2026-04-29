/**
 * app.js — Express application setup
 */

"use strict";

const express = require("express");
const cors = require("cors");
const cellRoutes = require("./routes/cells");
const alertRoutes = require("./routes/alerts");
const packRoutes = require("./routes/packs");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors({ origin: "*" })); // Restrict in production
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/cells", cellRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/packs", packRoutes);

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
