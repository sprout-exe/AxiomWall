// src/engine/crossSensor.js
// Cross-sensor consistency checks.

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

/**
 * Power consistency: |P − V×I/1000| > 5 % of V×I/1000  AND  > 0.1 kW.
 * Returns a reason object or null.
 */
export function checkPowerConsistency(sample) {
  const { V, I, P } = sample;
  const expected = (V * I) / 1000;          // kW
  const diff     = Math.abs(P - expected);
  const refAbs   = Math.abs(expected);
  const pct      = refAbs > 1e-6 ? diff / refAbs : 0;

  if (pct > 0.05 && diff > 0.1) {
    return {
      rule: 'power_consistency',
      severity: clamp01(pct / 0.4),         // severity 1 at 40 % discrepancy
      text: `Reported power ${P.toFixed(2)} kW but V × I = ${expected.toFixed(2)} kW (${(pct * 100).toFixed(1)} % discrepancy, ${diff.toFixed(2)} kW). Tolerance: 5 % and > 0.1 kW.`,
      measured: P,
      expected,
    };
  }
  return null;
}
