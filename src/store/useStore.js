// src/store/useStore.js
// Zustand store: sample ring-buffer (120 s), twin state, mode, running flag,
// detection result, stress accumulation, and attack-lab injection.

import { create } from 'zustand'
import { createTelemetry } from '../sim/telemetry.js'
import { stepTwin } from '../engine/twin.js'
import { evaluate } from '../engine/index.js'
import { resetRisk } from '../engine/risk.js'

const MAX_HISTORY = 120;

let telemetry = null;
let _attackTransform = null;
let _command = null;
let _telemetryOverride = null;

const useStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────
  sample:          null,
  history:         [],
  twin:            { T: 31, SoC: 64 },
  mode:            'idle',
  running:         false,
  result:          null,
  command:         null,
  stress:          0,       // Cell stress 0–100 (model estimate)
  injectedSignals: [],      // array of signal keys currently injected e.g. ['T']

  // ── Actions ─────────────────────────────────────────────────────

  _onSample(rawSample) {
    const state = get();

    let sample = { ...rawSample };
    let cmd = _command;

    if (_attackTransform) {
      const out = _attackTransform(sample, state.history);
      sample = out.sample ?? sample;
      if (out.command !== undefined) cmd = out.command;
    }

    // Advance twin using reported current
    const twinNext = stepTwin(state.twin, sample.I, 1);

    const enriched = {
      ...sample,
      twin_T:   twinNext.T,
      twin_SoC: twinNext.SoC,
      twin_V:   twinNext.V,
    };

    const history = [...state.history, enriched];
    if (history.length > MAX_HISTORY) history.shift();

    const result = evaluate(enriched, history, cmd);
    if (_command) _command = null;

    // Cell stress accumulation:
    // each second stress += (instantRisk/100)*2 while instantRisk >= 25, else stress -= 0.5; clamp 0–100
    const instantRisk = result?.instantRisk ?? result?.risk ?? 0;
    let nextStress = state.stress;
    if (instantRisk >= 25) {
      nextStress += (instantRisk / 100) * 2;
    } else {
      nextStress -= 0.5;
    }
    nextStress = Math.max(0, Math.min(100, nextStress));

    set({
      sample: enriched,
      history,
      twin:   { T: twinNext.T, SoC: twinNext.SoC },
      result,
      stress: nextStress,
    });
  },

  start() {
    if (get().running) return;
    const { mode } = get();

    telemetry = createTelemetry({
      mode,
      onSample: (s) => get()._onSample(s),
    });
    if (_telemetryOverride) {
      telemetry.setOverride(_telemetryOverride);
    }
    telemetry.start();
    set({ running: true });
  },

  stop() {
    if (telemetry) { telemetry.stop(); telemetry = null; }
    set({ running: false });
  },

  reset() {
    if (telemetry) { telemetry.stop(); telemetry = null; }
    _command = null;
    _telemetryOverride = null;
    resetRisk();
    set({
      sample:          null,
      history:         [],
      twin:            { T: 31, SoC: 64 },
      running:         false,
      result:          null,
      command:         null,
      stress:          0,
      injectedSignals: [],
    });
  },

  setMode(newMode) {
    if (telemetry) telemetry.setMode(newMode);
    set({ mode: newMode });
  },

  setTelemetryOverride(ov) {
    _telemetryOverride = ov;
    if (telemetry) telemetry.setOverride(ov);
  },

  setInjectedSignals(signals) {
    set({ injectedSignals: signals || [] });
  },

  setAttackTransform(fn) {
    _attackTransform = fn;
  },

  sendCommand(cmd) {
    _command = cmd;
    set({ command: cmd });
  },
}));

export default useStore;