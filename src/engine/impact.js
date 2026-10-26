// src/engine/impact.js
// Impact Chain Assessment — derives physical degradation propagation and consequence:
// Command -> Current -> Heat -> Cell damage

export function impact(result, sample, mode = 'idle') {
  const reasons = result?.reasons || [];
  const ruleIds = reasons.map((r) => r.rule);
  const has = (id) => ruleIds.includes(id);

  const I = sample?.I != null ? sample.I : 0;
  const T = sample?.T != null ? sample.T : 25;
  const speed = sample?.speed != null ? sample.speed : 0;
  const P = sample?.P != null ? sample.P : 0;

  // 1. Determine Chain Stages: ok / at-risk / hit
  let cmdState = 'ok';
  let currentState = 'ok';
  let heatState = 'ok';
  let cellState = 'ok';

  if (has('command_limit') || has('kinetic_interlock')) {
    cmdState = 'hit';
    currentState = 'at-risk';
    cellState = 'at-risk';
  } else if (has('replay')) {
    cmdState = 'at-risk';
    currentState = 'at-risk';
  }

  if (has('limit_charge_current') || has('limit_drive_current') || Math.abs(I) > 60 || has('power_consistency')) {
    currentState = 'hit';
    heatState = 'at-risk';
  } else if (Math.abs(I) > 20) {
    currentState = has('twin_v') ? 'at-risk' : 'ok';
  }

  if (has('heating_rate') || has('twin_t') || has('limit_temperature') || T > 45) {
    heatState = 'hit';
    cellState = 'at-risk';
  } else if (T > 35 || Math.abs(I) > 50) {
    heatState = 'at-risk';
  }

  if (T >= 60 || has('limit_voltage') || (result?.response === 'BLOCK' && (has('heating_rate') || has('command_limit')))) {
    cellState = 'hit';
  } else if (result?.response === 'BLOCK' || result?.response === 'LIMIT') {
    cellState = 'at-risk';
  }

  const chain = [
    { stage: 'command',     label: 'Command',     state: cmdState },
    { stage: 'current',     label: 'Current',     state: currentState },
    { stage: 'heat',        label: 'Heat',        state: heatState },
    { stage: 'cell_damage', label: 'Cell Damage', state: cellState },
  ];

  // 2. ETA to Damage (in seconds)
  let etaSeconds = null;
  const hasRisk = result?.risk > 0 || result?.response !== 'ALLOW';

  if (hasRisk) {
    if (has('kinetic_interlock')) {
      etaSeconds = 2; // immediate kinetic stall risk
    } else if (has('command_limit')) {
      etaSeconds = 8; // immediate inverter overload risk
    } else {
      // Thermal estimation from Joule heating: TC=20, Cth=20000 J/K, Rint=0.03 Ohm, T_safe=60 C
      const effectiveI = Math.max(Math.abs(I), 60);
      const P_heat = effectiveI * effectiveI * 0.03; // W
      const dTdt = (20 * (P_heat - (T - 28) / 0.05)) / 20000; // K/s
      if (dTdt > 0.05 && T < 60) {
        etaSeconds = Math.round(Math.max(5, (60 - T) / dTdt));
      } else {
        etaSeconds = 45;
      }
    }
  }

  // 3. Consequence plain English explanation
  let consequence = 'Nominal operation; normal battery degradation and operating limits.';

  if (has('kinetic_interlock')) {
    consequence = `Loss of power at ${Math.round(speed || 32)} km/h under ${Math.abs(I || 48).toFixed(0)} A load; stall in traffic`;
  } else if (has('command_limit')) {
    consequence = `Inrush current of ${Math.abs(I || 120).toFixed(0)} A requested; inverter damage and fast thermal breakdown`;
  } else if (has('heating_rate') || has('twin_t')) {
    consequence = `Sensor frozen at ${T.toFixed(1)} °C while pack draws ${Math.abs(I || 100).toFixed(0)} A; undetected overheat leading to cell venting`;
  } else if (has('power_consistency')) {
    consequence = `Coordinated signal deception at ${Math.abs(P).toFixed(2)} kW; masked stress on cell interconnects`;
  } else if (has('soc_conservation') || has('twin_soc')) {
    consequence = `Discontinuous SoC jump; premature deep discharge cutoff and BMS state desynchronization`;
  } else if (has('replay')) {
    consequence = `Stale telemetry loop; delayed safety intervention and unmonitored thermal rise`;
  } else if (hasRisk) {
    consequence = `Physical safety violation detected; stress accumulation on battery cells`;
  }

  return {
    chain,
    etaSeconds,
    consequence,
  };
}
