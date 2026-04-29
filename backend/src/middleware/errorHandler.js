/**
 * middleware/errorHandler.js
 * Global error handler — keeps controller code clean.
 */
"use strict";

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (status >= 500) console.error("❌ Server error:", err);

  res.status(status).json({ error: message });
};
