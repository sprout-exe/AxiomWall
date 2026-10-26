// src/components/AttackLab.jsx
// Attack Lab — toggle-based panel for 7 named attacks.
// Each attack falsifies only the REPORTED sample before evaluate().
// The true simulation runs unaffected. Switching attacks never resets the battery.
// Each attack forces the mode it needs when started.

import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore.js'

// ── Attack definitions ────────────────────────────────────────────────────────
// Each attack has:
//   id           – stable key
//   label        – short display name
//   desc         – one-line description shown in the card
//   hasIntensity – whether the 0.25–1 slider applies
//   mode         – which profile to force on start (null = don't change)
//   build(intensity) → transform(rawSample, history) → { sample?, command? }
//                 or → null (no per-tick transform needed, mode change only)

const ATTACKS = [
  {
    id: 'freeze_T',
    label: 'Temperature Freeze',
    desc: 'Drive ~100 A. Pins the reported T at its value when started. Detected by heating_rate / twin_t.',
    hasIntensity: true,
    mode: 'drive',
    build(intensity) {
      let frozenT = null;
      return (sample) => {
        if (frozenT === null) frozenT = sample.T;
        // intensity=1 → exact freeze; intensity=0.25 → slight drift allowed
        const target = frozenT - (1 - intensity) * 2;
        return { sample: { ...sample, T: target } };
      };
    },
  },
  {
    id: 'replay',
    label: 'Replay',
    desc: 'Charge 30 A. Records last 10 samples then loops them verbatim. Detected by replay rule (N=10, lag 10-60).',
    hasIntensity: false,
    mode: 'charge',
    build() {
      let buffer = null;
      let ptr = 0;
      return (sample, history) => {
        if (buffer === null) {
          const tail = history.slice(-10);
          if (tail.length < 10) return { sample }; // wait until we have 10
          buffer = tail.map(h => ({ ...h }));
          ptr = 0;
        }
        const replayed = { ...buffer[ptr % buffer.length] };
        ptr++;
        return { sample: replayed };
      };
    },
  },
  {
    id: 'soc_jump',
    label: 'SoC Jump',
    desc: 'Drive. Adds +20 × intensity % to reported SoC continuously. Detected by twin_soc and soc_conservation.',
    hasIntensity: true,
    mode: 'drive',
    build(intensity) {
      const jump = 20 * intensity;
      return (sample) => ({
        sample: { ...sample, SoC: Math.min(100, sample.SoC + jump) },
      });
    },
  },
  {
    id: 'coord_spoof',
    label: 'Coordinated Spoof',
    desc: 'Charge 30 A. Reported I × 0.25, V − 1.2 V; P untouched. Detected by power_consistency and twin_v.',
    hasIntensity: true,
    mode: 'charge',
    build(intensity) {
      return (sample) => {
        const spoofI = sample.I * (1 - 0.75 * intensity);  // →0.25×I at full
        const spoofV = sample.V - 1.2 * intensity;
        return {
          sample: { ...sample, I: spoofI, V: spoofV },
          // P intentionally NOT changed → V×I ≠ P
        };
      };
    },
  },
  {
    id: 'malicious_cmd',
    label: 'Malicious Command',
    desc: 'Charge. Issues SET_CURRENT 120 A while charging (limit 60 A). Pre-check fires → BLOCK immediately.',
    hasIntensity: false,
    mode: 'charge',
    build() {
      return (sample) => ({
        sample,
        command: { type: 'SET_CURRENT', value: 120 },
      });
    },
  },
  {
    id: 'discharge_off',
    label: 'DISCHARGE_OFF at Speed',
    desc: 'Drive 32 km/h. Sends DISCHARGE_OFF every tick while moving. Pre-check fires → BLOCK immediately.',
    hasIntensity: false,
    mode: 'drive',
    build() {
      return (sample) => {
        // Ensure sample looks like discharging at speed so interlock fires
        const fakeSample = {
          ...sample,
          speed: Math.max(sample.speed ?? 0, 32),
          I: Math.max(sample.I, 10),   // ensure positive (discharging)
        };
        // Command held every tick — pre-check bypasses hysteresis so 1 sample is enough
        return { sample: fakeSample, command: 'DISCHARGE_OFF' };
      };
    },
  },
  {
    id: 'legit_ramp',
    label: 'Legit Fast-Charge Ramp',
    desc: 'No data falsified — switches to fastChargeRamp profile. Consistent physics. Must stay ALLOW.',
    hasIntensity: false,
    mode: 'fastChargeRamp',
    build() {
      return null; // no per-tick transform
    },
  },
];

// ── colour helpers ────────────────────────────────────────────────────────────
const ATTACK_ACTIVE_BG  = 'rgba(239,68,68,0.15)';
const ATTACK_ACTIVE_BDR = '#EF4444';
const ATTACK_IDLE_BG    = 'rgba(255,255,255,0.04)';
const ATTACK_IDLE_BDR   = 'rgba(255,255,255,0.10)';

// ── Component ─────────────────────────────────────────────────────────────────
export default function AttackLab({ onActiveChange }) {
  const [activeId,  setActiveId]  = useState(null);
  const [intensity, setIntensity] = useState(0.75);

  const setAttackTransform = useStore((s) => s.setAttackTransform);
  const setMode            = useStore((s) => s.setMode);
  const running            = useStore((s) => s.running);
  const start              = useStore((s) => s.start);

  // Remember the mode that was active before the attack so we can restore it
  const prevModeRef = useRef('idle');
  const modeFromStore = useStore((s) => s.mode);

  // Notify parent whenever active attack changes
  useEffect(() => {
    if (onActiveChange) onActiveChange(activeId);
  }, [activeId, onActiveChange]);

  function activateAttack(attack) {
    // Ensure streaming
    if (!running) start();

    // Toggle off if already active
    if (attack.id === activeId) {
      stopAttack();
      return;
    }

    // Tear down any previous attack transform
    setAttackTransform(null);

    // Save current mode before switching
    prevModeRef.current = modeFromStore;

    // Switch to the mode this attack requires
    if (attack.mode) {
      setMode(attack.mode);
    }

    // Install the per-tick transform (may be null for legit_ramp)
    const transform = attack.build(intensity);
    setAttackTransform(transform ?? null);

    setActiveId(attack.id);
  }

  function stopAttack() {
    setAttackTransform(null);
    // Restore the mode that was active before the attack
    setMode(prevModeRef.current ?? 'idle');
    setActiveId(null);
  }

  // When intensity changes, rebuild the active attack's transform
  useEffect(() => {
    if (!activeId) return;
    const attack = ATTACKS.find(a => a.id === activeId);
    if (!attack || !attack.hasIntensity) return;
    const transform = attack.build(intensity);
    setAttackTransform(transform ?? null);
  }, [intensity, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-xl"
      style={{ background: '#0d0e10', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#EF4444' }}>
            ⚔ Attack Lab
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Attacks falsify only the reported stream. True simulation runs unaffected.
          </p>
        </div>

        {activeId && (
          <button
            type="button"
            onClick={stopAttack}
            className="rounded-xl px-4 py-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#EF4444', color: '#fff' }}
          >
            Stop attack
          </button>
        )}
      </div>

      {/* ── Intensity slider ── */}
      {activeId && ATTACKS.find(a => a.id === activeId)?.hasIntensity && (
        <div className="px-6 pb-4 flex items-center gap-4">
          <span className="text-xs text-gray-500 w-24 shrink-0">Intensity</span>
          <input
            type="range"
            min="0.25"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1 accent-red-400"
          />
          <span className="text-xs font-mono text-gray-300 w-8 text-right">
            {intensity.toFixed(2)}
          </span>
        </div>
      )}

      {/* ── Attack grid ── */}
      <div
        className="px-6 pb-6 grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {ATTACKS.map((attack) => {
          const isActive = attack.id === activeId;
          return (
            <button
              key={attack.id}
              type="button"
              onClick={() => activateAttack(attack)}
              className="rounded-2xl p-4 text-left transition-all duration-200 hover:opacity-90"
              style={{
                background: isActive ? ATTACK_ACTIVE_BG  : ATTACK_IDLE_BG,
                border:     `1px solid ${isActive ? ATTACK_ACTIVE_BDR : ATTACK_IDLE_BDR}`,
                boxShadow:  isActive ? '0 0 0 1px rgba(239,68,68,0.3)' : 'none',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 h-2.5 w-2.5 rounded-full shrink-0"
                  style={{
                    background: isActive ? '#EF4444' : 'rgba(255,255,255,0.15)',
                    boxShadow:  isActive ? '0 0 6px #EF4444' : 'none',
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">
                    {attack.label}
                    {attack.mode && (
                      <span
                        className="ml-2 text-xs font-mono font-normal"
                        style={{ color: '#6B7280' }}
                      >
                        [{attack.mode}]
                      </span>
                    )}
                    {attack.id === 'legit_ramp' && (
                      <span className="ml-1 text-xs font-normal" style={{ color: '#22C55E' }}>✓ ALLOW</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {attack.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
