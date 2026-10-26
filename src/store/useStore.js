// src/store/useStore.js
// Zustand store: sample ring-buffer (120 s), twin state, mode, running flag.
// The twin reads ONLY the reported current (I) — never measured T or SoC.

import { create } from 'zustand'
import { createTelemetry } from '../sim/telemetry.js'
import { stepTwin } from '../engine/twin.js'

const MAX_HISTORY = 120;

// One telemetry controller shared across the store lifetime
let telemetry = null;

const useStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────
  sample:  null,           // latest raw sample
  history: [],             // last 120 enriched samples (measured + twin)
  twin:    { T: 31, SoC: 64 },  // twin internal state – initialised to plant start
  mode:    'idle',
  running: false,

  // ── Actions ─────────────────────────────────────────────────────

  /** Called by telemetry on every new 1 Hz sample. */
  _onSample(sample) {
    const state = get();

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

    set({ sample, history, twin: { T: twinNext.T, SoC: twinNext.SoC } });
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
    set({
      sample:  null,
      history: [],
      twin:    { T: 31, SoC: 64 },
      running: false,
    });
  },

  /** Switch profile mid-stream. */
  setMode(newMode) {
    if (telemetry) telemetry.setMode(newMode);
    set({ mode: newMode });
  },
}));

export default useStore;
