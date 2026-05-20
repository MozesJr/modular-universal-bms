// backend/src/services/bmsAlgorithm.js
// Simple Coulomb Counting based State‑of‑Charge (SoC) estimator.
// Usage:
//   const newSoc = estimateSoc(prevSoc, currentAmps, deltaTimeSec, capacityAh)
// Returns a percentage (0‑100) rounded to one decimal place.

/**
 * Estimate new State of Charge.
 * @param {number} prevSoc - Previous SoC in percent (0‑100).
 * @param {number} current - Measured current in Amps (positive for discharge, negative for charge).
 * @param {number} deltaSec - Time elapsed since last measurement in seconds.
 * @param {number} capacityAh - Nominal pack capacity in Ah.
 * @returns {number} New SoC percent (clamped 0‑100).
 */
function estimateSoc(prevSoc, current, deltaSec, capacityAh) {
  if (capacityAh <= 0) return prevSoc; // safeguard

  // Coulomb counting: ΔSoC = (I * Δt) / (Capacity) * 100
  // I in A, Δt in hours => convert seconds to hours.
  const deltaHours = deltaSec / 3600;
  const deltaSoc = (current * deltaHours) / capacityAh * 100;

  let newSoc = prevSoc - deltaSoc; // discharge reduces SoC, charge (negative I) increases it.
  if (newSoc > 100) newSoc = 100;
  if (newSoc < 0) newSoc = 0;
  return Math.round(newSoc * 10) / 10; // one decimal place
}

module.exports = { estimateSoc };
