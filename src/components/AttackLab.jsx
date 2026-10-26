// src/components/AttackLab.jsx
// Attack Lab — toggle-based panel for 7 named attacks.
// White glossy glass card style: #FFFFFF at ~92% with subtle gradient to #F4F7FB,
// 1px white border, rounded-3xl, soft layered shadow with faint neon green/cyan glow.
// Text in dark ink (#101114 headings, #475569 secondary).

import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore.js'

// ── Attack definitions ────────────────────────────────────────────────────────
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
          if (tail.length < 10) return { sample };
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
        const spoofI = sample.I * (1 - 0.75 * intensity);
        const spoofV = sample.V - 1.2 * intensity;
        return {
          sample: { ...sample, I: spoofI, V: spoofV },
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
    desc: 'Drive ~32 km/h. Commands DISCHARGE_OFF while moving. Pre-check fires kinetic_interlock → BLOCK immediately.',
    hasIntensity: false,
    mode: 'drive',
    build() {
      return (sample) => ({
        sample,
        command: 'DISCHARGE_OFF',
      });
    },
  },
  {
    id: 'legit_ramp',
    label: 'Legit Fast-Charge Ramp',
    desc: 'Switches to fast-charge ramp. Current ramps legitimately: all rules pass (ALLOW).',
    hasIntensity: false,
    mode: 'fastChargeRamp',
    build() {
      return null;
    },
  },
];

const ATTACK_ACTIVE_BG  = '#FEF2F2';
const ATTACK_ACTIVE_BDR = '#EF4444';
const ATTACK_IDLE_BG    = '#FFFFFF';
const ATTACK_IDLE_BDR   = '#E2E8F0';

export default function AttackLab({ onActiveChange }) {
  const [activeId,  setActiveId]  = useState(null);
  const [intensity, setIntensity] = useState(0.75);

  const setAttackTransform = useStore((s) => s.setAttackTransform);
  const setMode            = useStore((s) => s.setMode);
  const running            = useStore((s) => s.running);
  const start              = useStore((s) => s.start);

  const prevModeRef = useRef('idle');
  const modeFromStore = useStore((s) => s.mode);

  useEffect(() => {
    if (onActiveChange) onActiveChange(activeId);
  }, [activeId, onActiveChange]);

  function activateAttack(attack) {
    if (!running) start();

    if (attack.id === activeId) {
      stopAttack();
      return;
    }

    if (!activeId) {
      prevModeRef.current = modeFromStore;
    }

    setActiveId(attack.id);

    if (attack.mode) {
      setMode(attack.mode);
    }

    const transform = attack.build(intensity);
    setAttackTransform(transform ?? null);
  }

  function stopAttack() {
    setAttackTransform(null);
    if (prevModeRef.current) {
      setMode(prevModeRef.current);
    }
    setActiveId(null);
  }

  useEffect(() => {
    if (!activeId) return;
    const attack = ATTACKS.find(a => a.id === activeId);
    if (!attack || !attack.hasIntensity) return;
    const transform = attack.build(intensity);
    setAttackTransform(transform ?? null);
  }, [intensity, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6">
      {/* ── Header ── */}
      <div className="pb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p
            className="text-xs uppercase tracking-wider font-bold m-0"
            style={{ fontFamily: "'Russo One', 'Teko', sans-serif", color: '#DC2626' }}
          >
            ⚔ Attack Lab
          </p>
          <p className="mt-1 text-xs text-slate-600 m-0 font-medium">
            Attacks falsify only the reported stream. True simulation runs unaffected.
          </p>
        </div>

        {activeId && (
          <button
            type="button"
            onClick={stopAttack}
            className="rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md cursor-pointer hover:opacity-90"
            style={{ background: '#EF4444', color: '#fff', boxShadow: '0 0 12px rgba(239,68,68,0.35)' }}
          >
            Stop Attack
          </button>
        )}
      </div>

      {/* ── Intensity slider ── */}
      {activeId && ATTACKS.find(a => a.id === activeId)?.hasIntensity && (
        <div className="pb-4 flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
          <span className="text-xs font-semibold text-slate-600 w-20 shrink-0">Intensity</span>
          <input
            type="range"
            min="0.25"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1 accent-red-600 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-slate-800 w-8 text-right">
            {intensity.toFixed(2)}
          </span>
        </div>
      )}

      {/* ── Attack grid ── */}
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {ATTACKS.map((attack) => {
          const isActive = attack.id === activeId;
          return (
            <button
              key={attack.id}
              type="button"
              onClick={() => activateAttack(attack)}
              className="rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer hover:shadow-md"
              style={{
                background: isActive ? ATTACK_ACTIVE_BG  : ATTACK_IDLE_BG,
                border:     `1.5px solid ${isActive ? ATTACK_ACTIVE_BDR : ATTACK_IDLE_BDR}`,
                boxShadow:  isActive ? '0 0 16px rgba(239,68,68,0.22)' : '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 h-3 w-3 rounded-full shrink-0"
                  style={{
                    background: isActive ? '#EF4444' : '#CBD5E1',
                    boxShadow:  isActive ? '0 0 8px #EF4444' : 'none',
                    transition: 'background 0.2s',
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 leading-tight m-0">
                    {attack.label}
                    {attack.mode && (
                      <span
                        className="ml-2 text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        {attack.mode}
                      </span>
                    )}
                    {attack.id === 'legit_ramp' && (
                      <span className="ml-2 text-xs font-bold text-emerald-600">✓ ALLOW</span>
                    )}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed m-0 font-medium">
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