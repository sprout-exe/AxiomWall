// src/engine/rules.js
// Detection rules.  Each rule returns null (pass) or:
//   { rule: string, severity: 0–1, text: string, measured, expected }
// Text must include the actual numbers so the WHY panel is self-explanatory.

import { Rint } from './twin.js';

const QNOM = 100; // Ah — matches twin.js

// ── helpers ───────────────────────────────────────────────────────────────────
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function f1(v) { return v != null ? v.toFixed(1) : '—'; }
function f2(v) { return v != null ? v.toFixed(2) : '—'; }
function f3(v) { return v != null ? v.toFixed(3) : '—'; }

// ── 1. Hard limits ────────────────────────────────────────────────────────────
export function checkLimits(sample, history) {
  const reasons = [];
  const { V, I, T } = sample;

  // Charge current |I| > 60 A (I < 0 means charging)
  if (I < 0 && Math.abs(I) > 60) {
    const excess = Math.abs(I) - 60;
    reasons.push({
      rule: 'limit_charge_current',
      severity: clamp01(0.6 + excess / 60),
      text: `Charge current ${f1(Math.abs(I))} A exceeds 60 A limit (excess ${f1(excess)} A).`,
      measured: Math.abs(I), expected: 60,
    });
  }

  // Drive current I > 120 A (I > 0 means discharging)
  if (I > 120) {
    const excess = I - 120;
    reasons.push({
      rule: 'limit_drive_current',
      severity: clamp01(0.6 + excess / 120),
      text: `Drive current ${f1(I)} A exceeds 120 A limit (excess ${f1(excess)} A).`,
      measured: I, expected: 120,
    });
  }

  // Voltage outside 44–60 V
  if (V < 44 || V > 60) {
    const dev = V < 44 ? 44 - V : V - 60;
    reasons.push({
      rule: 'limit_voltage',
      severity: clamp01(0.6 + dev / 8),
      text: `Voltage ${f2(V)} V is outside safe range 44–60 V (deviation ${f2(dev)} V).`,
      measured: V, expected: '44–60',
    });
  }

  // Temperature > 60 °C
  if (T > 60) {
    const excess = T - 60;
    reasons.push({
      rule: 'limit_temperature',
      severity: clamp01(0.6 + excess / 20),
      text: `Temperature ${f1(T)} °C exceeds 60 °C limit (excess ${f1(excess)} °C).`,
      measured: T, expected: 60,
    });
  }

  // Reported dT/dt > 0.5 K/s (from last 2 history entries)
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const dt = sample.t - prev.t;
    if (dt > 0) {
      const dTdt = (T - prev.T) / dt;
      if (dTdt > 0.5) {
        const excess = dTdt - 0.5;
        reasons.push({
          rule: 'limit_dTdt',
          severity: clamp01(0.6 + excess / 1.0),
          text: `Reported heating rate ${f2(dTdt)} K/s exceeds 0.5 K/s limit (excess ${f2(excess)} K/s).`,
          measured: dTdt, expected: 0.5,
        });
      }
    }
  }

  return reasons;
}

// ── 2. Twin residuals ─────────────────────────────────────────────────────────
export function checkTwinResiduals(sample) {
  const reasons = [];
  const { V, T, SoC, I, twin_V, twin_T, twin_SoC } = sample;

  // Voltage residual — threshold 0.5 V, ratio = |diff| / 0.5
  if (twin_V != null) {
    const diff = Math.abs(V - twin_V);
    const ratio = diff / 0.5;
    if (ratio > 1) {
      reasons.push({
        rule: 'twin_v',
        severity: clamp01(ratio / 2),
        text: `Voltage ${f2(V)} V but twin expects ${f2(twin_V)} V at ${f1(I)} A (Rint loss ${f3(Math.abs(I) * Rint)} V). Residual ${f2(diff)} V, tolerance 0.5 V.`,
        measured: V, expected: twin_V,
      });
    }
  }

  // Temperature residual — threshold 1.5 K
  if (twin_T != null) {
    const diff = Math.abs(T - twin_T);
    const ratio = diff / 1.5;
    if (ratio > 1) {
      const heatW = (I * I * Rint).toFixed(0);
      reasons.push({
        rule: 'twin_t',
        severity: clamp01(ratio / 2),
        text: `Reported temperature ${f1(T)} °C but the twin expects ${f1(twin_T)} °C at ${f1(Math.abs(I))} A (heating ${heatW} W). Residual ${f1(diff)} K, tolerance 1.5 K.`,
        measured: T, expected: twin_T,
      });
    }
  }

  // SoC residual — threshold 1.5 %
  if (twin_SoC != null) {
    const diff = Math.abs(SoC - twin_SoC);
    const ratio = diff / 1.5;
    if (ratio > 1) {
      reasons.push({
        rule: 'twin_soc',
        severity: clamp01(ratio / 2),
        text: `Reported SoC ${f1(SoC)} % but twin expects ${f1(twin_SoC)} %. Residual ${f1(diff)} %, tolerance 1.5 %.`,
        measured: SoC, expected: twin_SoC,
      });
    }
  }

  return reasons;
}

// ── 3. Heating-rate suppression ───────────────────────────────────────────────
// Fires when twin expects clear heating (> 0.05 K/s) but reported rate < 20%.
// Uses last 5 history entries (including current sample).
export function checkHeatingRate(history) {
  if (history.length < 5) return null;
  const w = history.slice(-5);
  const span = w[4].t - w[0].t;
  if (span <= 0) return null;

  const reportedDTdt = (w[4].T - w[0].T) / span;
  const twinDTdt = (w[4].twin_T - w[0].twin_T) / span;

  if (twinDTdt > 0.05 && reportedDTdt < 0.2 * twinDTdt) {
    const pct = reportedDTdt / twinDTdt;
    return {
      rule: 'heating_rate',
      severity: clamp01(1 - pct / 0.2),
      text: `Twin predicts heating at ${f3(twinDTdt)} K/s but reported rate is only ${f3(reportedDTdt)} K/s (${(pct * 100).toFixed(0)} % of expected). Possible sensor freeze or substitution.`,
      measured: reportedDTdt, expected: twinDTdt,
    };
  }
  return null;
}

// ── 4. SoC energy conservation ────────────────────────────────────────────────
// Fires when reported ΔSoC/s > 3× Coulomb-counting expectation + 0.3 %.
export function checkSoCConservation(sample, history) {
  if (history.length < 2) return null;
  const prev = history[history.length - 2];
  const dt = sample.t - prev.t;
  if (dt <= 0) return null;

  const reported = Math.abs(sample.SoC - prev.SoC);
  const implied  = Math.abs(sample.I * dt / (3600 * QNOM) * 100);
  const threshold = 3 * implied + 0.3;

  if (reported > threshold) {
    const excess = reported - threshold;
    return {
      rule: 'soc_conservation',
      severity: clamp01(0.6 + excess / threshold),
      text: `SoC changed ${f2(reported)} % in ${f1(dt)} s but ${f1(sample.I)} A implies only ${f2(implied)} %. Threshold (3× + 0.3 %) = ${f2(threshold)} %, excess ${f2(excess)} %.`,
      measured: reported, expected: threshold,
    };
  }
  return null;
}

// ── 5. Kinetic interlock ──────────────────────────────────────────────────────
export function checkKineticInterlock(sample, commandStr) {
  if (commandStr !== 'DISCHARGE_OFF') return null;
  const { speed, I } = sample;
  if (speed > 0 && Math.abs(I) > 10) {
    return {
      rule: 'kinetic_interlock',
      severity: 1.0,
      text: `DISCHARGE_OFF commanded but vehicle moving at ${f1(speed)} km/h with ${f1(I)} A discharge current.`,
      measured: I, expected: 0,
    };
  }
  return null;
}

// ── 6. Command limit ──────────────────────────────────────────────────────────
// Fires when a SET_CURRENT command value is unsafe.
// Charging (value < 0): |value| > 60 A → severity 1.0
// Driving  (value > 0): value > 120 A  → severity 1.0
export function checkCommandLimit(sample, commandObj) {
  if (!commandObj || commandObj.type !== 'SET_CURRENT') return null;
  const val = commandObj.value;
  const isCharging = sample.I < 0 || val < 0;  // mode hint from current sign

  if (isCharging && Math.abs(val) > 60) {
    return {
      rule: 'command_limit',
      severity: 1.0,
      text: `SET_CURRENT ${f1(val)} A requested while charging (limit 60 A, |value| = ${f1(Math.abs(val))} A).`,
      measured: Math.abs(val), expected: 60,
    };
  }
  if (!isCharging && val > 120) {
    return {
      rule: 'command_limit',
      severity: 1.0,
      text: `SET_CURRENT ${f1(val)} A requested while driving (limit 120 A, excess ${f1(val - 120)} A).`,
      measured: val, expected: 120,
    };
  }
  return null;
}

// ── 7. Replay detection ───────────────────────────────────────────────────────
// Window N=10, lag range 10-60 s — catches a looped replay faster.
export function checkReplay(history) {
  const N = 10, lagMin = 10, lagMax = 60;
  if (history.length < N + lagMin) return null;

  const recent = history.slice(-N);

  for (let lag = lagMin; lag <= lagMax; lag++) {
    const start = history.length - N - lag;
    if (start < 0) break;
    const older = history.slice(start, start + N);
    if (older.length < N) break;

    let maxT = 0, maxV = 0;
    for (let i = 0; i < N; i++) {
      maxT = Math.max(maxT, Math.abs(recent[i].T - older[i].T));
      maxV = Math.max(maxV, Math.abs(recent[i].V - older[i].V));
    }

    if (maxT < 1e-6 && maxV < 1e-6) {
      return {
        rule: 'replay',
        severity: 1.0,
        text: `Last ${N} T and V samples are exact copies of samples from ${lag} s ago (max |ΔT| = ${maxT.toExponential(1)}, max |ΔV| = ${maxV.toExponential(1)}). Possible data-replay attack.`,
        measured: lag, expected: null,
      };
    }
  }
  return null;
}
