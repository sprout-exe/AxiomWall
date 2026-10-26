// src/components/DigitalVsPhysical.jsx
// Truth-Split hero panel inside white glass card.
// LEFT tile: "DIGITAL" — floating white tile with lime/green neon glow border.
// RIGHT tile: "PHYSICS" — floating white tile with state-reactive neon glow border.
// Below: Speedometer-style RiskGauge (dark panel) + WHY panel with high contrast.

import { useRef, useEffect, useState } from 'react'
import useStore from '../store/useStore.js'
import RiskGauge from './RiskGauge.jsx'

const PHYSICS_STATE = {
  ALLOW: {
    label: 'PLAUSIBLE',
    color: '#16A34A',
    glow: 'rgba(34, 197, 94, 0.45)',
    bg: 'rgba(34, 197, 94, 0.08)',
  },
  WARN: {
    label: 'SUSPICIOUS',
    color: '#D97706',
    glow: 'rgba(245, 158, 11, 0.45)',
    bg: 'rgba(245, 158, 11, 0.08)',
  },
  LIMIT: {
    label: 'IMPLAUSIBLE',
    color: '#EA580C',
    glow: 'rgba(249, 115, 22, 0.50)',
    bg: 'rgba(249, 115, 22, 0.08)',
  },
  BLOCK: {
    label: 'IMPLAUSIBLE',
    color: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.55)',
    bg: 'rgba(239, 68, 68, 0.08)',
  },
}

const SEVERITY_COLOR = (s) =>
  s >= 0.75 ? '#DC2626' : s >= 0.4 ? '#D97706' : '#16A34A'

function ReasonCard({ reason }) {
  return (
    <div
      className="rounded-xl p-3 text-xs leading-relaxed transition-all"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${SEVERITY_COLOR(reason.severity)}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: SEVERITY_COLOR(reason.severity) }}
        />
        <span className="font-mono font-bold uppercase tracking-wider text-slate-800">
          {reason.rule}
        </span>
        <span className="ml-auto font-bold" style={{ color: SEVERITY_COLOR(reason.severity) }}>
          {(reason.severity * 100).toFixed(0)} %
        </span>
      </div>
      <p className="text-slate-600 font-medium m-0">{reason.text}</p>
    </div>
  )
}

export default function DigitalVsPhysical() {
  const result   = useStore((s) => s.result)
  const response = result?.response ?? 'ALLOW'
  const risk     = result?.risk ?? 0
  const reasons  = result?.reasons ?? []

  const physics = PHYSICS_STATE[response] ?? PHYSICS_STATE.ALLOW

  // Pulse animation on verdict change
  const prevResponse = useRef(response)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (prevResponse.current !== response) {
      prevResponse.current = response
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 600)
      return () => clearTimeout(t)
    }
  }, [response])

  return (
    <div className="w-full max-w-full overflow-hidden p-6 sm:p-8" style={{ background: 'transparent' }}>
      {/* ── Top split row with Floating White Tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-8">

        {/* LEFT — Digital Floating Tile */}
        <div
          className="digital-tile flex flex-col items-center justify-center gap-3 p-6 sm:p-7 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid rgba(200, 240, 60, 0.85)',
            boxShadow: '0 0 18px rgba(200, 240, 60, 0.35), 0 8px 24px rgba(0,0,0,0.05)',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          }}
        >
          <p
            className="text-xs uppercase tracking-widest text-slate-500 m-0"
            style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
          >
            Digital
          </p>
          {/* Big lime checkmark badge */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(200,240,60,0.20)' }}
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#65A30D" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p
            className="text-2xl m-0"
            style={{
              fontFamily: "'Russo One', 'Teko', sans-serif",
              color: '#4D7C0F',
              letterSpacing: '0.04em',
            }}
          >
            VALID
          </p>
          <p className="text-center text-xs text-slate-500 max-w-[200px] m-0 leading-tight">
            Signed & authenticated<br /><span className="text-slate-400">(simulated)</span>
          </p>
        </div>

        {/* RIGHT — Physics Floating Tile */}
        <div
          className="physics-tile flex flex-col items-center justify-center gap-3 p-6 sm:p-7 rounded-2xl"
          style={{
            background: '#FFFFFF',
            border: `1.5px solid ${physics.color}`,
            boxShadow: `0 0 20px ${physics.glow}, 0 8px 24px rgba(0,0,0,0.05)`,
            transition: 'border 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease',
            animation: pulse ? 'physicsPop 0.5s ease-out' : undefined,
          }}
        >
          <p
            className="text-xs uppercase tracking-widest text-slate-500 m-0"
            style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
          >
            Physics
          </p>
          {/* State icon */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300"
            style={{ background: physics.bg }}
          >
            {response === 'ALLOW' ? (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke={physics.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke={physics.color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            )}
          </div>
          <p
            className="text-2xl m-0 transition-colors duration-300"
            style={{
              fontFamily: "'Russo One', 'Teko', sans-serif",
              color: physics.color,
              letterSpacing: '0.04em',
            }}
          >
            {physics.label}
          </p>
          <p className="text-center text-xs text-slate-500 m-0">
            Firewall verdict: <strong style={{ color: physics.color }}>{response}</strong>
          </p>
        </div>
      </div>

      {/* ── Gauge + WHY row ── */}
      <div
        className="pt-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 w-full max-w-full items-start"
        style={{
          borderTop: '1px solid #E2E8F0',
        }}
      >
        {/* Speedometer Gauge in dark panel */}
        <div className="flex flex-col items-center justify-center mx-auto md:mx-0">
          <RiskGauge risk={risk} response={response} />
        </div>

        {/* WHY panel */}
        <div className="flex flex-col gap-3 min-w-0">
          <p
            className="text-xs uppercase tracking-widest text-slate-500 m-0 font-medium"
            style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
          >
            Why — Rule Violations
          </p>
          {reasons.length === 0 ? (
            <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
              No anomalies detected. Telemetry matches physics digital twin expectations.
            </div>
          ) : (
            reasons.map((r, i) => <ReasonCard key={`${r.rule}-${i}`} reason={r} />)
          )}
        </div>
      </div>

      <style>{`
        /* Gentle float (translateY 0 to -4px, 6s ease-in-out loop) */
        .digital-tile {
          animation: floatTileA 6s ease-in-out infinite;
          will-change: transform;
        }
        .physics-tile {
          animation: floatTileB 6s ease-in-out infinite 0.8s;
          will-change: transform;
        }

        .digital-tile:hover, .physics-tile:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 12px 30px rgba(0,0,0,0.1) !important;
        }

        @keyframes floatTileA {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
        }

        @keyframes floatTileB {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
        }

        @keyframes physicsPop {
          0%   { transform: scale(0.98); }
          50%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .digital-tile, .physics-tile {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}