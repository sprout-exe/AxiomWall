// src/engine/risk.js
// Flat top-N scorer: strongest failing rule contributes 45 pts, 2nd 25, 3rd 15, 4th 10.
// One strong rule → ~45 pts → WARN. Two together → ~70 pts → LIMIT.
// Hysteresis: response changes only after 2 consecutive samples agree.

const POINTS = [45, 25, 15, 10]; // points for 1st, 2nd, 3rd, 4th rule

let _committed = 'ALLOW', _pending = 'ALLOW', _count = 0;

export function computeRisk(reasons) {
  const sev = reasons.map(r => r.severity).sort((a, b) => b - a);
  let raw = 0;
  for (let i = 0; i < POINTS.length; i++) raw += POINTS[i] * (sev[i] ?? 0);
  const risk = Math.round(Math.max(0, Math.min(100, raw)));

  const candidate =
    risk >= 75 ? 'BLOCK' : risk >= 50 ? 'LIMIT' : risk >= 25 ? 'WARN' : 'ALLOW';

  if (candidate === _pending) _count++;
  else { _pending = candidate; _count = 1; }
  if (_count >= 2) _committed = _pending;

  return { risk, response: _committed };
}

export function resetRisk() { _committed = 'ALLOW'; _pending = 'ALLOW'; _count = 0; }
