// src/engine/twin.js
// 16S LFP digital twin — single-RC-free Thevenin equivalent
// Sign convention: I > 0 → discharge / driving, I < 0 → charging

// ── Model parameters ─────────────────────────────────────────────────────────
export const Rint = 0.03;   // Ω     – lumped internal resistance
const Cth  = 20000;  // J/K   – thermal capacity of the pack
const Rth  = 0.05;   // K/W   – thermal resistance pack → ambient
const Tamb = 28;     // °C    – ambient temperature
const Qnom = 100;    // Ah    – nominal capacity
const TC   = 20;     // –     – thermal time-scale factor
//                             Applied ONLY to the temperature ODE so that
//                             thermal dynamics run TC× faster than real time,
//                             making temperature excursions visible in a short demo.
//                             It does NOT affect voltage or SoC equations.

// ── 16S LFP OCV look-up table ────────────────────────────────────────────────
// 16 cells in series.
// ~48 V at 0 %, very flat plateau 20–80 %, rises steeply to ~58 V at 100 %.
// Each row: [SoC_percent, OCV_volts]
const OCV_TABLE = [
  [  0, 48.00],   // 3.000 V/cell – fully depleted
  [  5, 49.60],   // 3.100 V/cell – rapid initial rise
  [ 10, 50.40],   // 3.150 V/cell
  [ 20, 51.20],   // 3.200 V/cell – flat plateau begins
  [ 30, 51.52],   // 3.220 V/cell
  [ 40, 51.84],   // 3.240 V/cell
  [ 50, 52.00],   // 3.250 V/cell – mid-plateau
  [ 60, 52.16],   // 3.260 V/cell
  [ 70, 52.48],   // 3.280 V/cell
  [ 80, 52.80],   // 3.300 V/cell – flat plateau ends
  [ 85, 53.28],   // 3.330 V/cell
  [ 90, 54.08],   // 3.380 V/cell – knee region
  [ 95, 56.00],   // 3.500 V/cell
  [100, 58.00],   // 3.625 V/cell – fully charged
];

// ── OCV interpolation ─────────────────────────────────────────────────────────
/**
 * Return open-circuit voltage for the pack given SoC.
 * Uses piecewise-linear interpolation over OCV_TABLE.
 *
 * @param {number} soc – State of Charge in % [0, 100]
 * @returns {number} OCV in volts
 */
export function ocv(soc) {
  const s = Math.max(0, Math.min(100, soc));

  if (s <= OCV_TABLE[0][0]) return OCV_TABLE[0][1];
  if (s >= OCV_TABLE[OCV_TABLE.length - 1][0]) return OCV_TABLE[OCV_TABLE.length - 1][1];

  for (let i = 0; i < OCV_TABLE.length - 1; i++) {
    const [s0, v0] = OCV_TABLE[i];
    const [s1, v1] = OCV_TABLE[i + 1];
    if (s >= s0 && s <= s1) {
      const frac = (s - s0) / (s1 - s0);
      return v0 + frac * (v1 - v0);
    }
  }

  return OCV_TABLE[OCV_TABLE.length - 1][1]; // fallback
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Predict terminal voltage from SoC and current.
 * V = OCV(SoC) – I · Rint
 *
 * @param {number} soc – SoC in % [0, 100]
 * @param {number} I   – current in A (+ = discharge, – = charge)
 * @returns {number} terminal voltage in V
 */
export function predictVoltage(soc, I) {
  return ocv(soc) - I * Rint;
}

/**
 * Advance the twin by one time step (Euler integration).
 *
 * Equations
 * ─────────
 *   V      = OCV(SoC) – I·Rint
 *
 *   dT/dt  = [ I²·Rint  –  (T – Tamb)/Rth ] / Cth  · TC
 *             └── joule heat ──┘  └── convective loss ──┘
 *             TC applied ONLY here to compress thermal time-scale for demo.
 *
 *   ΔSoC% = –I · dt / (3600 · Qnom) · 100
 *
 * The twin reads ONLY the reported current (I).
 * It must NEVER read measured T or SoC from telemetry.
 *
 * @param {{ T: number, SoC: number }} state – current twin state
 * @param {number} I  – current in A (from reported telemetry only)
 * @param {number} dt – time step in seconds
 * @returns {{ T: number, SoC: number, V: number }} next twin state + predicted voltage
 */
export function stepTwin(state, I, dt) {
  const { T, SoC } = state;

  // Terminal voltage
  const V = predictVoltage(SoC, I);

  // Temperature ODE — TC is the thermal time-scale factor, applied ONLY here
  const dTdt = (I * I * Rint - (T - Tamb) / Rth) / Cth * TC;
  const T_next = T + dTdt * dt;

  // Coulomb counting — no TC factor; SoC tracks real charge flow
  const SoC_next = SoC - (I * dt / (3600 * Qnom)) * 100;

  return {
    T:   T_next,
    SoC: Math.max(0, Math.min(100, SoC_next)),
    V,
  };
}
