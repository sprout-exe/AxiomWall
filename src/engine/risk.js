// src/engine/risk.js
// Weighted risk score + hysteretic response classification.
//
// risk = 0.35·residual + 0.25·crossSensor + 0.15·limits + 0.25·impact
//
// Designed so that:
//   • one strong residual violation (severity ≥ 1)  → risk ≥ 35  → WARN
//   • residual + cross-sensor both strong           → risk ≥ 60  → LIMIT
//   • limit or replay at full severity alone        → ALLOW (low weight),
//     but combined with any residual pushes to WARN/LIMIT
//
// Hysteresis: response only changes after 2 consecutive samples agree.

const W = { residual: 0.35, crossSensor: 0.25, limits: 0.15, impact: 0.25 };

const RESIDUAL_RULES = new Set(['twin_v', 'twin_t', 'twin_soc', 'heating_rate']);
const CROSS_RULES    = new Set(['power_consistency']);
const LIMIT_RULES    = new Set([
  'limit_charge_current', 'limit_drive_current', 'limit_voltage',
  'limit_temperature', 'limit_dTdt',
  'soc_conservation', 'kinetic_interlock', 'replay',
]);

// ── Module-level hysteresis state ─────────────────────────────────────────────
let _committed = 'ALLOW';  // last confirmed response
let _pending   = 'ALLOW';  // candidate response being counted
let _count     = 0;        // how many consecutive samples agree with _pending

function maxSev(reasons, set) {
  return reasons.reduce((m, r) => (set.has(r.rule) && r.severity > m ? r.severity : m), 0);
}

export function computeRisk(reasons) {
  const residual    = maxSev(reasons, RESIDUAL_RULES);
  const crossSensor = maxSev(reasons, CROSS_RULES);
  const limits      = maxSev(reasons, LIMIT_RULES);
  const impact      = 0; // placeholder — always 0 until Step 3

  const raw  = W.residual    * residual    * 100
             + W.crossSensor * crossSensor * 100
             + W.limits      * limits      * 100
             + W.impact      * impact;

  const risk = Math.round(Math.max(0, Math.min(100, raw)));

  // Map risk score to candidate response
  const candidate =
    risk >= 75 ? 'BLOCK' :
    risk >= 50 ? 'LIMIT' :
    risk >= 25 ? 'WARN'  : 'ALLOW';

  // Hysteresis: require 2 consecutive samples in agreement before committing
  if (candidate === _pending) {
    _count++;
  } else {
    _pending = candidate;
    _count   = 1;
  }
  if (_count >= 2) _committed = _pending;

  return { risk, response: _committed };
}

/** Reset hysteresis — call from store.reset(). */
export function resetRisk() {
  _committed = 'ALLOW';
  _pending   = 'ALLOW';
  _count     = 0;
}
