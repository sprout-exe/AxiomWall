// src/engine/risk.js
// Points-based scoring + gradual recovery + hysteretic response classification.
//
// instantRisk: strongest-rule scoring (45*s1 + 25*s2 + 15*s3 + 10*s4), clipped 0 to 100.
// displayedRisk = max(instantRisk, previousDisplayed - 4) per second.
// resetRisk(): sets displayedRisk and hysteresis to 0 immediately.
// Thresholds 25 WARN, 50 LIMIT, 75 BLOCK from displayedRisk with 2-sample hysteresis.

const PRECHECK_RULES = new Set(['kinetic_interlock', 'command_limit']);

let _previousDisplayed = 0;
let _committed = 'ALLOW';
let _pending   = 'ALLOW';
let _count     = 0;

export function computeRisk(reasons) {
  // Pre-check: immediate BLOCK if kinetic_interlock or command_limit fires
  const hasPrecheck = reasons.some(r => PRECHECK_RULES.has(r.rule) && r.severity > 0);
  if (hasPrecheck) {
    _committed = 'BLOCK';
    _pending   = 'BLOCK';
    _count     = 99;
    _previousDisplayed = 100;
    return { risk: 100, instantRisk: 100, response: 'BLOCK', precheck: true };
  }

  // Strongest-rule scoring: sort descending
  const sorted = [...reasons].sort((a, b) => b.severity - a.severity);
  const s1 = sorted[0]?.severity ?? 0;
  const s2 = sorted[1]?.severity ?? 0;
  const s3 = sorted[2]?.severity ?? 0;
  const s4 = sorted[3]?.severity ?? 0;

  const raw = 45 * s1 + 25 * s2 + 15 * s3 + 10 * s4;
  const instantRisk = Math.round(Math.max(0, Math.min(100, raw)));

  // Gradual recovery: rises at once, falls 4 points per second
  const displayedRisk = Math.max(instantRisk, _previousDisplayed - 4);
  _previousDisplayed = displayedRisk;

  // Thresholds from displayedRisk
  const candidate =
    displayedRisk >= 75 ? 'BLOCK' :
    displayedRisk >= 50 ? 'LIMIT' :
    displayedRisk >= 25 ? 'WARN'  : 'ALLOW';

  // Two-sample hysteresis
  if (candidate === _pending) {
    _count++;
  } else {
    _pending = candidate;
    _count   = 1;
  }
  if (_count >= 2) {
    _committed = _pending;
  }

  return {
    risk: displayedRisk,
    instantRisk,
    response: _committed,
    precheck: false,
  };
}

/** Reset hysteresis and displayed risk immediately. */
export function resetRisk() {
  _committed = 'ALLOW';
  _pending   = 'ALLOW';
  _count     = 0;
  _previousDisplayed = 0;
}