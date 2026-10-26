// src/engine/localize.js
// Fault Localization — maps failing physical rules and telemetry to system architectural nodes:
// 'sensor' | 'comms' | 'controller' | 'actuator' | 'none'

export function localize(reasons = [], sample = null, mode = 'idle') {
  if (!reasons || reasons.length === 0) {
    return {
      node: 'none',
      confidence: 0,
      evidence: [],
    };
  }

  const ruleIds = reasons.map((r) => r.rule);
  const has = (id) => ruleIds.includes(id);

  let node = 'none';
  let agreeingRules = [];

  // 1. Actuator: unsafe command or implausible physical actuation
  if (has('command_limit') || has('kinetic_interlock')) {
    node = 'actuator';
    agreeingRules = ruleIds.filter((r) => r === 'command_limit' || r === 'kinetic_interlock');
  }
  // 2. Comms: data replay or communication corruption (or power_consistency when replay is present)
  else if (has('replay')) {
    node = 'comms';
    agreeingRules = ruleIds.filter((r) => r === 'replay' || r === 'power_consistency');
  }
  // 3. Controller: coordinated multi-sensor/power equation inconsistency
  else if (has('power_consistency')) {
    node = 'controller';
    agreeingRules = ruleIds.filter((r) => r === 'power_consistency' || r === 'twin_v');
  }
  // 4. Sensor: single channel telemetry divergence from physical twin equations
  else if (
    has('twin_t') ||
    has('heating_rate') ||
    has('soc_conservation') ||
    has('twin_soc') ||
    has('twin_v') ||
    has('limit_temperature') ||
    has('limit_voltage') ||
    has('limit_dTdt')
  ) {
    node = 'sensor';
    agreeingRules = ruleIds.filter((r) =>
      [
        'twin_t',
        'heating_rate',
        'soc_conservation',
        'twin_soc',
        'twin_v',
        'limit_temperature',
        'limit_voltage',
        'limit_dTdt',
      ].includes(r)
    );
  }

  if (node === 'none') {
    return {
      node: 'none',
      confidence: 0,
      evidence: ruleIds,
    };
  }

  // Calculate confidence from top severity and number of agreeing rules
  const topSeverity = reasons[0]?.severity ?? 0.8;
  const count = agreeingRules.length;
  const confidence = Math.min(
    1,
    Math.max(0.65, topSeverity * 0.85 + Math.min(0.15, (count - 1) * 0.08))
  );

  return {
    node,
    confidence: parseFloat(confidence.toFixed(2)),
    evidence: agreeingRules.length > 0 ? agreeingRules : ruleIds,
  };
}
