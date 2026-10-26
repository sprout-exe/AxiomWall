// src/sim/telemetry.js
// Simulated "true" battery telemetry at 1 Hz.
// Uses the same physics as the twin but with small Gaussian noise added.
// Emits: { t, V, I, T, SoC, P, speed, digitalValid: true }

import { ocv } from '../engine/twin.js'

// ── Model constants (mirrored from twin) ──────────────────────────
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
function idleProfile() {
  return { I: (Math.random() - 0.5), speed: 0 };
}

function chargeProfile() {
  return { I: -30, speed: 0 };
}

function driveProfile() {
  const I     = 20 + Math.random() * 40;    // 20–60 A
  const speed = 15 + Math.random() * 20;    // 15–35 km/h
  return { I, speed };
}

function fastChargeRampProfile(t0, now) {
  const elapsed = now - t0;
  const frac = Math.min(elapsed / 30, 1);
  const I = -(20 + frac * 35);              // –20 → –55 A
  return { I, speed: 0 };
}

// ── Telemetry generator factory ───────────────────────────────────
export function createTelemetry({ mode = 'idle', onSample }) {
  let trueState = { T: 31, SoC: 64 };
  let t = 0;
  const t0 = 0;
  let handle = null;
  let override = null;

  function tick() {
    let raw;
    if (override) {
      raw = typeof override === 'function' ? override(t) : override;
    } else {
      switch (mode) {
        case 'charge':         raw = chargeProfile();            break;
        case 'drive':          raw = driveProfile();             break;
        case 'fastChargeRamp': raw = fastChargeRampProfile(t0, t); break;
        default:               raw = idleProfile();              break;
      }
    }

    const { I: I_true, speed } = raw;

    // Advance true plant state
    const { T, SoC } = trueState;
    const V_true   = ocv(SoC) - I_true * RINT;
    const dTdt     = (I_true * I_true * RINT - (T - TAMB) / RTH) / CTH * TC;
    const T_next   = T + dTdt * 1;
    const SoC_next = SoC - (I_true * 1 / (3600 * QNOM)) * 100;
    trueState = {
      T:   T_next,
      SoC: Math.max(0, Math.min(100, SoC_next)),
    };

    // Add measurement noise
    const sample = {
      t,
      V:            V_true            + noise(NOISE.V),
      I:            I_true            + noise(NOISE.I),
      T:            T_next            + noise(NOISE.T),
      SoC:          SoC_next          + noise(NOISE.SoC),
      P:            (V_true * I_true) / 1000,
      speed,
      digitalValid: true,
    };

    t += 1;
    onSample(sample);
  }

  function start() {
    if (handle !== null) return;
    handle = setInterval(tick, 1000);
    tick();
  }

  function stop() {
    if (handle !== null) { clearInterval(handle); handle = null; }
  }

  function setMode(newMode) {
    mode = newMode;
  }

  function setOverride(newOverride) {
    override = newOverride;
  }

  return { start, stop, setMode, setOverride };
}