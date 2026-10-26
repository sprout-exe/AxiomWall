// src/engine/risk.js
// Points-based risk score + hysteretic response classification.
//
// Scoring: reasons are sorted by severity descending.
//   Rank 1 → 45 pts, rank 2 → 25 pts, rank 3 → 15 pts, rank 4+ → 10 pts each
//
// Pre-checks (kinetic_interlock, command_limit): if either fires, risk is
// immediately set to 100 and response to BLOCK, bypassing hysteresis.
//
// Hysteresis: all other responses only commit after 2 consecutive samples agree.

const POINTS = [45, 25, 15, 10];  // rank 0=45, 1=25, 2=15, 3+=10

// Rules that bypass hysteresis and force an immediate BLOCK
const PRECHECK_RULES = new Set(['kinetic_interlock', 'command_limit']);

// ── Module-level hysteresis state ─────────────────────────────────────────────
let _committed = 'ALLOW';  // last confirmed response
let _pending   = 'ALLOW';  // candidate response being counted
let _count     = 0;        // how many consecutive samples agree with _pending

export function computeRisk(reasons) {
  // ── Pre-check: immediate BLOCK if kinetic_interlock or command_limit fires ──
  const hasPrecheck = reasons.some(r => PRECHECK_RULES.has(r.rule) && r.severity > 0);
  if (hasPrecheck) {
    // Bypass hysteresis — commit immediately
    _committed = 'BLOCK';
    _pending   = 'BLOCK';
    _count     = 99;
    return { risk: 100, response: 'BLOCK', precheck: true };
  }

  // ── Points scheme: sort by severity desc, assign rank points ──────────────
  const sorted = [...reasons].sort((a, b) => b.severity - a.severity);
  let raw = 0;
  for (let i = 0; i < sorted.length; i++) {
    const pts = POINTS[Math.min(i, POINTS.length - 1)];
    raw += pts * sorted[i].severity;
  }

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

  return { risk, response: _committed, precheck: false };
}

/** Reset hysteresis — call from store.reset(). */
export function resetRisk() {
  _committed = 'ALLOW';
  _pending   = 'ALLOW';
  _count     = 0;
}
