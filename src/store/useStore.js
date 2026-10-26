// src/store/useStore.js
// Zustand store: sample ring-buffer (120 s), twin state, mode, running flag,
// detection result, and attack-lab injection.
// The twin reads ONLY the reported current (I) — never measured T or SoC.

import { create } from 'zustand'
import { createTelemetry } from '../sim/telemetry.js'
import { stepTwin } from '../engine/twin.js'
import { evaluate } from '../engine/index.js'
import { resetRisk } from '../engine/risk.js'

const MAX_HISTORY = 120;

// One telemetry controller shared across the store lifetime
let telemetry = null;

// ── Attack-lab transform hook ─────────────────────────────────────────────────
// AttackLab registers this to falsify the REPORTED sample before evaluate().
// The TRUE simulation (trueState inside telemetry) keeps running unaffected.
// Returns { reportedSample, command }
let _attackTransform = null;  // null = no active attack

// ── Active command for kinetic interlock / command rules ─────────────────────
let _command = null;

const useStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────
  sample:  null,           // latest reported sample (may be falsified)
  history: [],             // last 120 enriched samples (reported + twin)
  twin:    { T: 31, SoC: 64 },  // twin internal state – initialised to plant start
  mode:    'idle',
  running: false,
  result:  null,           // latest evaluate() output
  command: null,           // last command echoed to UI

  // ── Actions ─────────────────────────────────────────────────────

  /** Called by telemetry on every new 1 Hz sample. */
  _onSample(rawSample) {
    const state = get();

    // --- Apply attack transform BEFORE evaluate ---
    let sample = { ...rawSample };
    let cmd = _command;

    if (_attackTransform) {
      const out = _attackTransform(sample, state.history);
      sample = out.sample ?? sample;
      if (out.command !== undefined) cmd = out.command;
    }

    // Advance twin using ONLY the reported current
    const twinNext = stepTwin(state.twin, sample.I, 1);

    // Enrich sample with twin predictions
    const enriched = {
      ...sample,
      twin_T:   twinNext.T,
      twin_SoC: twinNext.SoC,
      twin_V:   twinNext.V,
    };

    // Append to ring-buffer, keep last 120
    const history = [...state.history, enriched];
    if (history.length > MAX_HISTORY) history.shift();

    // Run detection engine (command may be object or string)
    const result = evaluate(enriched, history, cmd);
    // Clear one-shot command
    if (_command) _command = null;

    set({
      sample: enriched,
      history,
      twin:   { T: twinNext.T, SoC: twinNext.SoC },
      result,
    });
  },

  /** Start streaming (or restart after reset). */
  start() {
    if (get().running) return;
    const { mode } = get();

    telemetry = createTelemetry({
      mode,
      onSample: (s) => get()._onSample(s),
    });
    telemetry.start();
    set({ running: true });
  },

  /** Pause the stream without resetting history. */
  stop() {
    if (telemetry) { telemetry.stop(); telemetry = null; }
    set({ running: false });
  },

  /** Full reset – clears history and reinitialises twin state. */
  reset() {
    if (telemetry) { telemetry.stop(); telemetry = null; }
    _command = null;
    resetRisk();
    set({
      sample:  null,
      history: [],
      twin:    { T: 31, SoC: 64 },
      running: false,
      result:  null,
      command: null,
    });
  },

  /** Switch profile mid-stream. */
  setMode(newMode) {
    if (telemetry) telemetry.setMode(newMode);
    set({ mode: newMode });
  },

  // ── Attack-lab API ────────────────────────────────────────────────

  /**
   * Register a transform that runs before evaluate() every tick.
   * fn: (rawSample, history) => { sample?, command? }
   * Pass null to remove.
   */
  setAttackTransform(fn) {
    _attackTransform = fn;
  },

  /** Send a one-shot command (object or string). */
  sendCommand(cmd) {
    _command = cmd;
    set({ command: cmd });
  },
}));

export default useStore;
