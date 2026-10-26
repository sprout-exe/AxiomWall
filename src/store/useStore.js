// src/store/useStore.js
// Zustand store: sample ring-buffer (120 s), twin state, mode, running flag,
// detection result, and TEMPORARY fault-injection flags for the dev panel.
// The twin reads ONLY the reported current (I) — never measured T or SoC.

import { create } from 'zustand'
import { createTelemetry } from '../sim/telemetry.js'
import { stepTwin } from '../engine/twin.js'
import { evaluate } from '../engine/index.js'
import { resetRisk } from '../engine/risk.js'

const MAX_HISTORY = 120;

// One telemetry controller shared across the store lifetime
let telemetry = null;

// Fault-injection mutable flags (mutated synchronously before set())
let faults = {
  freezeT:    false,  // clamp T at 25 °C
  addT:       false,  // add +6 K to T
  jumpSoC:    false,  // one-shot: add +10 % to SoC, then clear
  breakP:     false,  // multiply P by 2× (power inconsistency)
};

// Active command for kinetic interlock
let _command = null;

const useStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────
  sample:  null,           // latest raw sample
  history: [],             // last 120 enriched samples (measured + twin)
  twin:    { T: 31, SoC: 64 },  // twin internal state – initialised to plant start
  mode:    'idle',
  running: false,
  result:  null,           // latest evaluate() output
  faults:  { freezeT: false, addT: false, jumpSoC: false, breakP: false },
  command: null,

  // ── Actions ─────────────────────────────────────────────────────

  /** Called by telemetry on every new 1 Hz sample. */
  _onSample(rawSample) {
    const state = get();

    // --- Apply fault injections BEFORE evaluate ---
    let sample = { ...rawSample };

    if (faults.freezeT) sample.T = 25;
    if (faults.addT)    sample.T = sample.T + 6;
    if (faults.jumpSoC) {
      sample.SoC = Math.min(100, sample.SoC + 10);
      faults.jumpSoC = false; // one-shot
    }
    if (faults.breakP) sample.P = sample.P * 2;

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

    // Run detection engine
    const result = evaluate(enriched, history, _command);
    // Clear one-shot command
    if (_command) _command = null;

    set({
      sample: enriched,
      history,
      twin:   { T: twinNext.T, SoC: twinNext.SoC },
      result,
      faults: { ...faults },
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
    faults = { freezeT: false, addT: false, jumpSoC: false, breakP: false };
    _command = null;
    resetRisk();
    set({
      sample:  null,
      history: [],
      twin:    { T: 31, SoC: 64 },
      running: false,
      result:  null,
      faults:  { freezeT: false, addT: false, jumpSoC: false, breakP: false },
      command: null,
    });
  },

  /** Switch profile mid-stream. */
  setMode(newMode) {
    if (telemetry) telemetry.setMode(newMode);
    set({ mode: newMode });
  },

  // ── Fault injection (dev panel) ──────────────────────────────────

  toggleFault(name) {
    if (name === 'jumpSoC') {
      faults.jumpSoC = true; // always one-shot
    } else {
      faults[name] = !faults[name];
    }
    set({ faults: { ...faults } });
  },

  sendCommand(cmd) {
    _command = cmd;
    set({ command: cmd });
  },
}));

export default useStore;
