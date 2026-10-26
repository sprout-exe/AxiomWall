// src/components/DigitalVsPhysical.jsx
// Truth-Split hero panel.
// LEFT  half: "DIGITAL" — always VALID (signed & authenticated, simulated)
// RIGHT half: "PHYSICS" — PLAUSIBLE / SUSPICIOUS / IMPLAUSIBLE driven by response
// Below: RiskGauge + WHY panel listing reasons by severity.
// The right half pulses once when the physics verdict changes.

import { useRef, useEffect, useState } from 'react'
import useStore from '../store/useStore.js'
import RiskGauge from './RiskGauge.jsx'

const PHYSICS_STATE = {
  ALLOW: { label: 'PLAUSIBLE',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
  WARN:  { label: 'SUSPICIOUS',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  LIMIT: { label: 'IMPLAUSIBLE',  color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  BLOCK: { label: 'IMPLAUSIBLE',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
}

const SEVERITY_COLOR = (s) =>
  s >= 0.75 ? '#EF4444' : s >= 0.4 ? '#F59E0B' : '#22C55E'

function ReasonCard({ reason }) {
  return (
    <div
      className="rounded-xl p-3 text-xs leading-relaxed"
      style={{ background: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${SEVERITY_COLOR(reason.severity)}` }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: SEVERITY_COLOR(reason.severity) }}
        />
        <span className="font-mono font-semibold uppercase tracking-widest text-gray-400">
          {reason.rule}
        </span>
        <span className="ml-auto font-semibold" style={{ color: SEVERITY_COLOR(reason.severity) }}>
          {(reason.severity * 100).toFixed(0)} %
        </span>
      </div>
      <p className="text-gray-200">{reason.text}</p>
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
    <div className="w-full max-w-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* ── Top split row ── */}
      <div className="grid grid-cols-2 w-full">

        {/* LEFT — Digital */}
        <div
          className="flex flex-col items-center justify-center gap-3 px-6 sm:px-8 py-8 sm:py-10"
          style={{ borderRight: '1px solid rgba(255,255,255,0.10)' }}
        >
          <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}>
            Digital
          </p>
          {/* Big lime checkmark badge */}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(200,240,60,0.12)' }}
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="#C8F03C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-xl" style={{ fontFamily: "'Russo One', 'Teko', sans-serif", color: '#C8F03C', letterSpacing: '0.05em' }}>
            VALID
          </p>
          <p className="text-center text-xs text-gray-500 max-w-[180px]">
            Signed and authenticated<br />(simulated)
          </p>
        </div>

        {/* RIGHT — Physics (pulses on change) */}
        <div
          className="flex flex-col items-center justify-center gap-3 px-6 sm:px-8 py-8 sm:py-10 transition-colors duration-500"
          style={{
            background: pulse ? physics.bg : 'transparent',
            animation: pulse ? 'physicsPulse 0.6s ease-out' : 'none',
            borderRight: 'none',
          }}
        >
          <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}>
            Physics
          </p>
          {/* State icon */}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: physics.bg }}
          >
            {response === 'ALLOW' ? (
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke={physics.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke={physics.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            )}
          </div>
          <p className="text-xl" style={{ fontFamily: "'Russo One', 'Teko', sans-serif", color: physics.color, letterSpacing: '0.05em' }}>
            {physics.label}
          </p>
          <p className="text-center text-xs text-gray-500">
            Response: {response}
          </p>
        </div>
      </div>

      {/* ── Gauge + WHY row ── */}
      <div
        className="px-4 sm:px-8 py-8 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 w-full max-w-full"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        {/* Gauge */}
        <div className="flex flex-col items-center justify-center">
          <RiskGauge risk={risk} response={response} />
        </div>

        {/* WHY panel */}
        <div className="flex flex-col gap-3 min-w-0">
          <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}>
            Why
          </p>
          {reasons.length === 0 ? (
            <p className="text-xs text-gray-600 italic">No anomalies detected.</p>
          ) : (
            reasons.map((r, i) => <ReasonCard key={`${r.rule}-${i}`} reason={r} />)
          )}
        </div>
      </div>

      <style>{`
        @keyframes physicsPulse {
          0%   { opacity: 1; }
          30%  { opacity: 0.5; }
          60%  { opacity: 0.9; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
