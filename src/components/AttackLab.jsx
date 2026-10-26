// src/components/AttackLab.jsx
// Attack Lab — toggle-based panel for 7 named attacks.
// Font Orbitron for attack buttons with icons and neon gradient borders.
// Electricity glitch effect, circuit-grid pattern, roaming cyber-bugs,
// and realistic temperature freeze with true 100 A load override.

import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore.js'

const ATTACKS = [
  {
    id: 'freeze_T',
    label: 'Temperature Freeze',
    desc: 'Pins reported T at initial value while forcing TRUE pack current to 100 A (speed 30 km/h). Real temperature rises, twin catches deviation.',
    hasIntensity: true,
    mode: 'drive',
    injectedSignals: ['T'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
      </svg>
    ),
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
    injectedSignals: ['T', 'V'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
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
    injectedSignals: ['SoC'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="16" height="10" rx="2" />
        <line x1="20" y1="11" x2="20" y2="13" />
        <line x1="7" y1="12" x2="13" y2="12" />
        <polyline points="10 9 13 12 10 15" />
      </svg>
    ),
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
    injectedSignals: ['I', 'V'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M4 20L21 3" />
        <path d="M21 16v5h-5" />
        <path d="M15 15l6 6" />
        <path d="M4 4l5 5" />
      </svg>
    ),
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
    injectedSignals: ['I'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
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
    injectedSignals: ['speed', 'I'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
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
    injectedSignals: [],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    build() {
      return null;
    },
  },
];

export default function AttackLab({ onActiveChange }) {
  const [activeId,  setActiveId]  = useState(null);
  const [intensity, setIntensity] = useState(0.75);

  const setAttackTransform  = useStore((s) => s.setAttackTransform);
  const setMode             = useStore((s) => s.setMode);
  const running             = useStore((s) => s.running);
  const start               = useStore((s) => s.start);
  const setTelemetryOverride = useStore((s) => s.setTelemetryOverride);
  const setInjectedSignals   = useStore((s) => s.setInjectedSignals);

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

    // Switch mode if needed
    if (attack.mode) {
      setMode(attack.mode);
    }

    // Force TRUE pack current to 100 A drive load if freeze_T
    if (attack.id === 'freeze_T') {
      setTelemetryOverride({ I: 100, speed: 30 });
    } else {
      setTelemetryOverride(null);
    }

    // Mark injected signals in store
    setInjectedSignals(attack.injectedSignals || []);

    const transform = attack.build(intensity);
    setAttackTransform(transform ?? null);
  }

  function stopAttack() {
    setAttackTransform(null);
    setTelemetryOverride(null);
    setInjectedSignals([]);
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
    <div
      className="p-6 relative overflow-hidden rounded-3xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 247, 251, 0.93) 100%)',
        boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.2), 0 0 24px rgba(34, 197, 94, 0.12), 0 12px 36px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* ── Faint circuit-grid pattern ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(34, 211, 238, 0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          opacity: 0.7,
        }}
      />

      {/* ── Roaming cyber-bug & EV icons (6 total) drifting at low opacity ── */}
      <div aria-hidden="true" className="roaming-icon bug-1" style={{ position: 'absolute', top: '12%', left: '8%', opacity: 0.14, pointerEvents: 'none' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.6">
          <rect x="6" y="9" width="12" height="11" rx="4" />
          <path d="M12 9V5" />
          <circle cx="12" cy="4" r="1.5" />
          <line x1="3" y1="13" x2="6" y2="13" />
          <line x1="18" y1="13" x2="21" y2="13" />
        </svg>
      </div>
      <div aria-hidden="true" className="roaming-icon bug-2" style={{ position: 'absolute', top: '22%', right: '10%', opacity: 0.12, pointerEvents: 'none' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.6">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <div aria-hidden="true" className="roaming-icon bug-3" style={{ position: 'absolute', bottom: '15%', left: '16%', opacity: 0.13, pointerEvents: 'none' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="1.6">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
        </svg>
      </div>
      <div aria-hidden="true" className="roaming-icon bug-4" style={{ position: 'absolute', bottom: '25%', right: '6%', opacity: 0.12, pointerEvents: 'none' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8F03C" strokeWidth="1.6">
          <path d="M12 2L4 7v9c0 6.6 5.1 12.8 12 14 6.9-1.2 12-7.4 12-14V7L12 2z" />
          <line x1="9" y1="10" x2="15" y2="16" />
        </svg>
      </div>
      <div aria-hidden="true" className="roaming-icon bug-5" style={{ position: 'absolute', top: '65%', left: '50%', opacity: 0.10, pointerEvents: 'none' }}>
        <svg width="30" height="18" viewBox="0 0 30 18" fill="none" stroke="#22C55E" strokeWidth="1.6">
          <rect x="2" y="5" width="26" height="9" rx="3" />
          <circle cx="7" cy="14" r="2.5" />
          <circle cx="23" cy="14" r="2.5" />
        </svg>
      </div>

      {/* ── Top Electricity Glitch Border Line ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div className="attack-electric-line" />
      </div>

      {/* Twinkle sparkle dots */}
      <div aria-hidden="true" className="attack-sparkle spk-1" style={{ top: '2px', left: '25%' }} />
      <div aria-hidden="true" className="attack-sparkle spk-2" style={{ top: '2px', right: '35%' }} />

      {/* ── Header ── */}
      <div className="pb-4 flex items-center justify-between flex-wrap gap-2 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-sm">⚔</span>
            <p
              className="text-xs uppercase tracking-wider font-bold m-0 attack-glitch-text"
              style={{ fontFamily: "'Russo One', 'Teko', sans-serif", color: '#DC2626' }}
            >
              Attack Lab
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-600 m-0 font-medium">
            Attacks falsify only the reported stream. True simulation runs unaffected.
          </p>
        </div>

        {activeId && (
          <button
            type="button"
            onClick={stopAttack}
            className="rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md cursor-pointer hover:opacity-90 active:scale-95"
            style={{
              background: '#EF4444',
              color: '#fff',
              boxShadow: '0 0 16px rgba(239,68,68,0.45)',
            }}
          >
            Stop Attack
          </button>
        )}
      </div>

      {/* ── Intensity slider ── */}
      {activeId && ATTACKS.find(a => a.id === activeId)?.hasIntensity && (
        <div className="pb-4 flex items-center gap-4 bg-slate-50/90 p-3 rounded-xl border border-slate-200 mb-3 relative z-10 shadow-sm">
          <span className="text-xs font-semibold text-slate-600 w-20 shrink-0 font-mono">Intensity</span>
          <input
            type="range"
            min="0.25"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1 accent-red-600 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-slate-900 w-8 text-right">
            {intensity.toFixed(2)}
          </span>
        </div>
      )}

      {/* ── The 7 Attack Buttons in Orbitron font ── */}
      <div
        className="grid gap-3 relative z-10"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {ATTACKS.map((attack) => {
          const isActive = attack.id === activeId;
          return (
            <button
              key={attack.id}
              type="button"
              onClick={() => activateAttack(attack)}
              className={[
                'rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer',
                isActive ? 'attack-btn-active' : 'attack-btn-idle',
              ].join(' ')}
              style={{
                fontFamily: "'Orbitron', sans-serif",
                background: isActive ? '#FEF2F2' : '#FFFFFF',
                border: isActive ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                boxShadow: isActive
                  ? '0 0 20px rgba(239, 68, 68, 0.35)'
                  : '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 p-1.5 rounded-lg shrink-0 flex items-center justify-center transition-colors"
                  style={{
                    background: isActive ? '#FEE2E2' : '#F1F5F9',
                    color: isActive ? '#DC2626' : '#475569',
                    boxShadow: isActive ? '0 0 10px rgba(239,68,68,0.4)' : 'none',
                  }}
                >
                  {attack.icon}
                </span>

                <div className="min-w-0">
                  <p
                    className="text-[13px] font-bold text-slate-900 leading-tight m-0 uppercase tracking-wide"
                    style={{ letterSpacing: '0.04em' }}
                  >
                    {attack.label}
                    {attack.mode && (
                      <span
                        className="ml-2 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        {attack.mode}
                      </span>
                    )}
                    {attack.id === 'legit_ramp' && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-600 font-mono">✓ ALLOW</span>
                    )}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed m-0 font-sans font-medium">
                    {attack.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .attack-btn-idle:hover {
          transform: translateY(-3px) !important;
          border-color: #22D3EE !important;
          box-shadow: 0 0 14px rgba(34, 211, 238, 0.3), 0 8px 20px rgba(0,0,0,0.06) !important;
        }

        .attack-btn-active {
          animation: attackBorderPulse 1.8s ease-in-out infinite;
        }

        @keyframes attackBorderPulse {
          0%, 100% {
            border-color: #EF4444;
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.3);
          }
          50% {
            border-color: #F87171;
            box-shadow: 0 0 24px rgba(239, 68, 68, 0.55);
          }
        }

        .attack-electric-line {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(90deg, #22D3EE 0px, #22C55E 10px, transparent 10px, transparent 20px);
          animation: electricFlow 2.5s linear infinite;
        }

        @keyframes electricFlow {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(50%); }
        }

        .attack-sparkle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 0 6px #22D3EE;
        }
        .spk-1 { animation: twinkleSpk 2s ease-in-out infinite; }
        .spk-2 { animation: twinkleSpk 2.4s ease-in-out infinite 0.9s; }

        @keyframes twinkleSpk {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50%      { opacity: 1; transform: scale(1.6); }
        }

        /* Roaming icons drift animations */
        @keyframes roam1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33%      { transform: translate(18px, -15px) rotate(6deg); }
          66%      { transform: translate(-12px, 12px) rotate(-4deg); }
        }
        @keyframes roam2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(-20px, 18px) rotate(-8deg); }
        }

        .bug-1 { animation: roam1 22s ease-in-out infinite; }
        .bug-2 { animation: roam2 26s ease-in-out infinite; }
        .bug-3 { animation: roam1 28s ease-in-out infinite reverse; }
        .bug-4 { animation: roam2 24s ease-in-out infinite reverse; }
        .bug-5 { animation: roam1 30s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .attack-btn-idle:hover,
          .attack-btn-active,
          .attack-electric-line,
          .attack-sparkle,
          .roaming-icon {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}