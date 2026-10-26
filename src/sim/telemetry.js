// src/sim/telemetry.js
// Simulated "true" battery telemetry at 1 Hz.
// Uses the same physics as the twin but with small Gaussian noise added.
// Emits: { t, V, I, T, SoC, P, speed, digitalValid: true }

import { ocv } from '../engine/twin.js'

// ── Model constants (mirrored from twin, deliberately NOT imported
//    so the true plant is independent of the twin module) ──────────
const RINT  = 0.03;
const CTH   = 20000;
const RTH   = 0.05;
const TAMB  = 28;
const QNOM  = 100;
const TC    = 20;   // thermal time-scale – applied ONLY to dT/dt

// ── Noise std-deviations ──────────────────────────────────────────
const NOISE = { V: 0.05, I: 0.2, T: 0.05, SoC: 0.02 };

// ── Box-Muller normal sample ──────────────────────────────────────
function randn() {
  let u, v;
  do { u = Math.random(); } while (u === 0);
  do { v = Math.random(); } while (v === 0);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function noise(sigma) { return sigma * randn(); }

// ── Profile generators ────────────────────────────────────────────
// Each returns { I, speed } for the current tick (t in seconds).

function idleProfile() {
  // I ≈ 0  (tiny accessory load, uniform [-0.5, 0.5] A)
  return { I: (Math.random() - 0.5), speed: 0 };
}

function chargeProfile() {
  // Constant CC charge at –30 A
  return { I: -30, speed: 0 };
}

function driveProfile() {
  // Discharge 20–60 A, speed 15–35 km/h – slow random walk
  // Internally stateful via closure variable held by the generator
  const I     = 20 + Math.random() * 40;    // 20–60 A
  const speed = 15 + Math.random() * 20;    // 15–35 km/h
  return { I, speed };
}

function fastChargeRampProfile(t0, now) {
  // Ramps from –20 A to –55 A over 30 s then holds at –55 A
  const elapsed = now - t0;
  const frac = Math.min(elapsed / 30, 1);
  const I = -(20 + frac * 35);              // –20 → –55 A
  return { I, speed: 0 };
}

// ── Telemetry generator factory ───────────────────────────────────
/**
 * Create a live telemetry emitter.
 *
 * @param {object}   opts
 * @param {'idle'|'charge'|'drive'|'fastChargeRamp'} opts.mode
 * @param {function} opts.onSample  – callback(sample) called every second
 * @returns {{ stop: function }} controller
 */
export function createTelemetry({ mode = 'idle', onSample }) {
  // True plant state – starts at T=31, SoC=64 as specified
  let trueState = { T: 31, SoC: 64 };
  let t = 0;
  const t0 = 0;   // ramp reference for fastChargeRamp

  let handle = null;

  function tick() {
    // 1. Determine raw current from profile
    let raw;
    switch (mode) {
      case 'charge':         raw = chargeProfile();            break;
      case 'drive':          raw = driveProfile();             break;
      case 'fastChargeRamp': raw = fastChargeRampProfile(t0, t); break;
      default:               raw = idleProfile();              break;
    }

    const { I: I_true, speed } = raw;

    // 2. Advance true plant state (same equations as twin)
    const { T, SoC } = trueState;
    const V_true  = ocv(SoC) - I_true * RINT;
    const dTdt    = (I_true * I_true * RINT - (T - TAMB) / RTH) / CTH * TC;
    const T_next  = T + dTdt * 1;          // dt = 1 s
    const SoC_next = SoC - (I_true * 1 / (3600 * QNOM)) * 100;
    trueState = {
      T:   T_next,
      SoC: Math.max(0, Math.min(100, SoC_next)),
    };

    // 3. Add measurement noise
    const sample = {
      t,
      V:            V_true            + noise(NOISE.V),
      I:            I_true            + noise(NOISE.I),
      T:            T_next            + noise(NOISE.T),
      SoC:          SoC_next          + noise(NOISE.SoC),
      P:            (V_true * I_true) / 1000,   // kW, no noise on power
      speed,
      digitalValid: true,
    };

    t += 1;
    onSample(sample);
  }

  function start() {
    if (handle !== null) return;
    handle = setInterval(tick, 1000);
    tick();   // emit first sample immediately
  }

  function stop() {
    if (handle !== null) { clearInterval(handle); handle = null; }
  }

  function setMode(newMode) {
    mode = newMode;
    if (newMode === 'fastChargeRamp') { /* t0 already 0, elapsed from t */ }
  }

  return { start, stop, setMode };
}
