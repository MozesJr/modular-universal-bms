/**
 * app.js — Express application setup (updated skema baru)
 */
"use strict";
const express = require("express");
const cors = require("cors");
const cellRoutes = require("./routes/cells");
const alertRoutes = require("./routes/alerts");
const packRoutes = require("./routes/packs");
const bmsModelRoutes = require("./routes/bmsModels"); // ← BARU
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/cells", cellRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/packs", packRoutes);
app.use("/api/bms-models", bmsModelRoutes); // ← BARU

app.use(errorHandler);

module.exports = app;
