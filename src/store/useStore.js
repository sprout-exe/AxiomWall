// src/store/useStore.js
// Zustand store: sample ring-buffer (120 s), twin state, mode, running flag,
// detection result, stress accumulation, and attack-lab injection.

import { create } from 'zustand'
import { createTelemetry } from '../sim/telemetry.js'
import { stepTwin } from '../engine/twin.js'
import { evaluate } from '../engine/index.js'
import { resetRisk } from '../engine/risk.js'
import { connectWokwi, DEFAULT_TOPIC } from '../sim/wokwiLink.js'
import { signSample, verifySamplePacket } from '../security/signing.js'
import useDigital from '../security/useDigital.js'

const MAX_HISTORY = 120;

let telemetry = null;
let _attackTransform = null;
let _command = null;
let _telemetryOverride = null;
let wokwi = null;      // live link to the Wokwi ESP32 (when source === 'wokwi')
let _lastWokwiT = null; // last ESP32 time stamp, to detect an ESP32 reset

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

  // ── Wokwi hardware-in-the-loop ──────────────────────────────────
  source:      'sim',               // 'sim' = built-in simulator, 'wokwi' = live ESP32
  wokwiStatus: 'off',               // 'off' | 'connecting' | 'waiting' | 'live' | 'error'
  wokwiTopic:  DEFAULT_TOPIC,
  wokwiGuard:  null,                // the ESP32's own on-board verdict (display only)

  // ── Actions ─────────────────────────────────────────────────────

  _onSample(rawSample) {
    const state = get();

    let sample = { ...rawSample };
    let cmd = _command;
    let tamperAfterSign = null;

    if (_attackTransform) {
      const out = _attackTransform(sample, state.history);
      sample = out.sample ?? sample;
      if (out.command !== undefined) cmd = out.command;
      if (out.tamperAfterSign) tamperAfterSign = out.tamperAfterSign;
    }

    let packet = signSample(sample);
    if (tamperAfterSign) {
      packet = tamperAfterSign(packet);
    }

    const auth = verifySamplePacket(packet);
    useDigital.getState().recordVerification({
      valid: auth.valid,
      reason: auth.reason,
      sig: packet.sig,
      seq: packet.seq,
    });

    if (!auth.valid) {
      const syntheticResult = {
        risk: 100,
        response: 'BLOCK',
        precheck: true,
        reasons: [{
          rule: 'auth_failed',
          severity: 1,
          text: `Packet signature invalid (${auth.reason}); rejected before physics.`,
        }],
        localization: { node: 'comms', confidence: 0.9, evidence: ['auth_failed'] },
        impact: null,
      };
      set({
        sample: { ...sample, digitalValid: false },
        result: syntheticResult,
      });
      return;
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

  // A sample arriving from the Wokwi ESP32.
  _onWokwiSample(sample, command) {
    // (Re)calibrate the twin on the first sample and whenever the ESP32 restarts
    // (its clock goes backwards). The twin then evolves from reported current only.
    if (_lastWokwiT === null || sample.t < _lastWokwiT) {
      resetRisk();
      set({ twin: { T: sample.T, SoC: sample.SoC }, history: [], stress: 0 });
    }
    _lastWokwiT = sample.t;
    if (command) get().sendCommand(command);
    get()._onSample(sample);
  },

  setSource(src) {
    if (src === get().source) return;
    const wasRunning = get().running;
    get().reset();
    set({ source: src });
    if (wasRunning) get().start();
  },

  setWokwiTopic(topic) {
    set({ wokwiTopic: (topic || '').trim() || DEFAULT_TOPIC });
  },

  start() {
    if (get().running) return;

    if (get().source === 'wokwi') {
      _lastWokwiT = null;
      wokwi = connectWokwi({
        topic:    get().wokwiTopic,
        onStatus: (wokwiStatus) => set({ wokwiStatus }),
        onGuard:  (wokwiGuard, m) => set(m ? { wokwiGuard, mode: m } : { wokwiGuard }),
        onSample: (sample, command) => get()._onWokwiSample(sample, command),
      });
      set({ running: true });
      return;
    }

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
    if (wokwi) { wokwi.close(); wokwi = null; }
    set({ running: false, wokwiStatus: 'off' });
  },

  reset() {
    if (telemetry) { telemetry.stop(); telemetry = null; }
    if (wokwi) { wokwi.close(); wokwi = null; }
    _lastWokwiT = null;
    _command = null;
    _telemetryOverride = null;
    resetRisk();
    useDigital.getState().reset();
    set({
      sample:          null,
      history:         [],
      twin:            { T: 31, SoC: 64 },
      running:         false,
      result:          null,
      command:         null,
      stress:          0,
      injectedSignals: [],
      wokwiStatus:     'off',
      wokwiGuard:      null,
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