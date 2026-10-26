// src/engine/index.js
// Main evaluate() pipeline — wires rules.js + crossSensor.js + risk.js.

import {
  checkLimits,
  checkTwinResiduals,
  checkHeatingRate,
  checkSoCConservation,
  checkKineticInterlock,
  checkCommandLimit,
  checkReplay,
} from './rules.js';
import { checkPowerConsistency } from './crossSensor.js';
import { computeRisk } from './risk.js';

/**
 * Evaluate a single telemetry sample against all detection rules.
 *
 * @param {object}  sample   – latest enriched sample (with twin_V, twin_T, twin_SoC)
 * @param {Array}   history  – ring buffer of past enriched samples (newest last)
 * @param {string|{type:string,value:number}|null} command
 *   – 'DISCHARGE_OFF' (legacy string), { type:'SET_CURRENT', value } object, or null
 * @returns {{ risk, response, reasons, crossSensor, localization, impact }}
 */
export function evaluate(sample, history, command = null) {
  const reasons = [];

  // Normalise command into separate pieces so rules stay simple
  const commandStr = typeof command === 'string' ? command
    : (command?.type === 'DISCHARGE_OFF' ? 'DISCHARGE_OFF' : null);
  const commandObj = (command && typeof command === 'object' && command.type !== 'DISCHARGE_OFF')
    ? command : null;

  // ── 1. Hard limits ───────────────────────────────────────────────
  reasons.push(...checkLimits(sample, history));

  // ── 2. Twin residuals ────────────────────────────────────────────
  reasons.push(...checkTwinResiduals(sample));

  // ── 3. Heating-rate suppression ──────────────────────────────────
  const heatReason = checkHeatingRate(history);
  if (heatReason) reasons.push(heatReason);

  // ── 4. SoC energy conservation ───────────────────────────────────
  const socReason = checkSoCConservation(sample, history);
  if (socReason) reasons.push(socReason);

  // ── 5. Power consistency (cross-sensor) ──────────────────────────
  const powerReason = checkPowerConsistency(sample);

  // ── 6. Kinetic interlock ─────────────────────────────────────────
  const kineticReason = checkKineticInterlock(sample, commandStr);
  if (kineticReason) reasons.push(kineticReason);

  // ── 7. Command limit ─────────────────────────────────────────────
  const cmdLimitReason = checkCommandLimit(sample, commandObj);
  if (cmdLimitReason) reasons.push(cmdLimitReason);

  // ── 8. Replay detection ──────────────────────────────────────────
  const replayReason = checkReplay(history);
  if (replayReason) reasons.push(replayReason);

  // ── Sort reasons by severity descending ──────────────────────────
  reasons.sort((a, b) => b.severity - a.severity);

  // ── Cross-sensor summary object ──────────────────────────────────
  const crossSensor = powerReason
    ? { power_consistency: powerReason }
    : {};

  // Merge power reason into unified reasons list as well
  if (powerReason) reasons.push(powerReason);
  // Re-sort after adding cross-sensor
  reasons.sort((a, b) => b.severity - a.severity);

  // ── Risk score + hysteretic response ─────────────────────────────
  const { risk, response, precheck } = computeRisk(reasons);

  return {
    risk,
    response,
    precheck: precheck ?? false,
    reasons,
    crossSensor,
    localization: null,
    impact: null,
  };
}