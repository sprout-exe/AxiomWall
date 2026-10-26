// src/components/RiskGauge.jsx
// Deep ink dial face (#0B0D14) with metallic bezel ring, thick neon arcs,
// fine tick marks, bold numerals, white needle with glowing tip & dark hub,
// 600ms ease-out transitions, and big white risk number in Sora font.

import { useMemo, useState, useEffect, useRef } from 'react'

const SEGMENTS = [
  { id: 'allow', color: '#22C55E', from: 0,   to: 25,  startDeg: 161.25, endDeg: 213.75 },
  { id: 'warn',  color: '#F59E0B', from: 25,  to: 50,  startDeg: 216.25, endDeg: 268.75 },
  { id: 'limit', color: '#F97316', from: 50,  to: 75,  startDeg: 271.25, endDeg: 323.75 },
  { id: 'block', color: '#EF4444', from: 75,  to: 100, startDeg: 326.25, endDeg: 378.75 },
]

const RESPONSE_MAP = {
  ALLOW: { label: 'ALLOW', color: '#22C55E' },
  WARN:  { label: 'WARN',  color: '#F59E0B' },
  LIMIT: { label: 'LIMIT', color: '#F97316' },
  BLOCK: { label: 'BLOCK', color: '#EF4444' },
}

const W = 280
const H = 252
const CX = W / 2      // 140
const CY = 125
const R_BEZEL = 118
const R_ARC = 92

function describeArc(cx, cy, r, startAngleDeg, endAngleDeg) {
  const startRad = (startAngleDeg * Math.PI) / 180
  const endRad = (endAngleDeg * Math.PI) / 180
  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export default function RiskGauge({ risk = 0, response = 'ALLOW' }) {
  const clampedRisk = Math.max(0, Math.min(100, risk))

  // 600ms animated number transition
  const [animatedRisk, setAnimatedRisk] = useState(clampedRisk)
  const animRef = useRef(null)

  useEffect(() => {
    const startVal = animatedRisk
    const endVal = clampedRisk
    if (startVal === endVal) return

    const startTime = performance.now()
    const DURATION = 600

    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / DURATION)
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (endVal - startVal) * ease)
      setAnimatedRisk(current)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(update)
      }
    }

    animRef.current = requestAnimationFrame(update)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [clampedRisk]) // eslint-disable-line react-hooks/exhaustive-deps

  // Map risk to needle rotation angle (220° sweep)
  const needleRotationDeg = -110 + (clampedRisk / 100) * 220
  const activeSegIndex = Math.min(3, Math.floor(clampedRisk / 25))

  const respKey = (response ?? 'ALLOW').toUpperCase()
  const { label: respLabel, color: respColor } = RESPONSE_MAP[respKey] ?? { label: respKey, color: '#22C55E' }

  // Generate tick marks (0, 5, 10, ... 100)
  const ticks = useMemo(() => {
    const list = []
    for (let v = 0; v <= 100; v += 5) {
      const deg = 160 + (v / 100) * 220
      const rad = (deg * Math.PI) / 180
      const isMajor = v % 25 === 0
      const rInner = isMajor ? 100 : 102
      const rOuter = isMajor ? 108 : 106
      const x1 = CX + rInner * Math.cos(rad)
      const y1 = CY + rInner * Math.sin(rad)
      const x2 = CX + rOuter * Math.cos(rad)
      const y2 = CY + rOuter * Math.sin(rad)

      let numPos = null
      if (isMajor) {
        const rNum = 117
        numPos = {
          x: CX + rNum * Math.cos(rad),
          y: CY + rNum * Math.sin(rad),
          val: v,
        }
      }

      list.push({ val: v, isMajor, x1, y1, x2, y2, numPos })
    }
    return list
  }, [])

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{
        filter: 'drop-shadow(0 12px 28px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 16px rgba(34, 197, 94, 0.15))',
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        aria-label={`Risk gauge: ${risk}, ${response}`}
        style={{ display: 'block' }}
      >
        <defs>
          {/* Deep ink dial face: #0B0D14 with faint radial highlight */}
          <radialGradient id="deepInkDialGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#141824" />
            <stop offset="70%" stopColor="#0B0D14" />
            <stop offset="100%" stopColor="#05070A" />
          </radialGradient>

          {/* Thin metallic bezel gradient */}
          <linearGradient id="metallicBezel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="25%" stopColor="#475569" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="75%" stopColor="#334155" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Neon glow filters */}
          <filter id="neonGlowSubtle" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="neonGlowActive" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Deep ink dial face (#0B0D14) ── */}
        <circle
          cx={CX}
          cy={CY}
          r={R_BEZEL}
          fill="url(#deepInkDialGrad)"
          stroke="url(#metallicBezel)"
          strokeWidth="2"
        />

        {/* Inner shadow / depth ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R_BEZEL - 2}
          fill="none"
          stroke="rgba(0, 0, 0, 0.75)"
          strokeWidth="2.5"
        />

        {/* ── Thick crisp neon segment arcs (220° sweep) ── */}
        {SEGMENTS.map((seg, idx) => {
          const isActive = idx === activeSegIndex
          const pathD = describeArc(CX, CY, R_ARC, seg.startDeg, seg.endDeg)

          return (
            <g key={seg.id}>
              {/* Outer neon bloom pass */}
              <path
                d={pathD}
                fill="none"
                stroke={seg.color}
                strokeWidth={isActive ? 13 : 9}
                strokeLinecap="round"
                opacity={isActive ? 0.6 : 0.22}
                filter={isActive ? 'url(#neonGlowActive)' : 'url(#neonGlowSubtle)'}
              />
              {/* Foreground thick crisp arc */}
              <path
                d={pathD}
                fill="none"
                stroke={seg.color}
                strokeWidth={isActive ? 9 : 7.5}
                strokeLinecap="round"
                opacity={isActive ? 1.0 : 0.55}
              />
            </g>
          )
        })}

        {/* ── Fine tick marks ── */}
        {ticks.map((t) => (
          <line
            key={`tick-${t.val}`}
            x1={t.x1.toFixed(2)}
            y1={t.y1.toFixed(2)}
            x2={t.x2.toFixed(2)}
            y2={t.y2.toFixed(2)}
            stroke={t.isMajor ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'}
            strokeWidth={t.isMajor ? 2.0 : 1.0}
            strokeLinecap="round"
          />
        ))}

        {/* ── Bold white numerals around arc in Russo One ── */}
        {ticks.map((t) =>
          t.numPos ? (
            <text
              key={`num-${t.val}`}
              x={t.numPos.x.toFixed(2)}
              y={(t.numPos.y + 4).toFixed(2)}
              textAnchor="middle"
              fontFamily="'Russo One', sans-serif"
              fontSize="11"
              fontWeight="bold"
              fill="#FFFFFF"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.7))',
              }}
            >
              {t.numPos.val}
            </text>
          ) : null
        )}

        {/* ── Scale label at top center ── */}
        <text
          x={CX}
          y={CY - 48}
          textAnchor="middle"
          fontFamily="'Russo One', 'Teko', sans-serif"
          fontSize="10"
          letterSpacing="0.1em"
          fill="rgba(255, 255, 255, 0.45)"
          textTransform="uppercase"
        >
          RISK SCORE
        </text>

        {/* ── Needle group with 600ms ease-out transform transition ── */}
        <g
          className="gauge-needle"
          style={{
            transform: `rotate(${needleRotationDeg}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {/* Needle shadow */}
          <path
            d={`M ${CX - 2.5} ${CY} L ${CX} ${CY - 86} L ${CX + 2.5} ${CY} Z`}
            fill="rgba(0, 0, 0, 0.6)"
            transform="translate(2, 3)"
          />
          {/* White tapered needle body */}
          <path
            d={`M ${CX - 2.5} ${CY} L ${CX} ${CY - 88} L ${CX + 2.5} ${CY} Z`}
            fill="#FFFFFF"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="0.8"
          />
          {/* Glowing tip */}
          <circle
            cx={CX}
            cy={CY - 88}
            r="3"
            fill={respColor}
            style={{ filter: `drop-shadow(0 0 6px ${respColor})` }}
          />
        </g>

        {/* ── Needle Center Hub (dark hub with metallic ring) ── */}
        <circle cx={CX} cy={CY} r="12" fill="#05070A" stroke="#64748B" strokeWidth="2" />
        <circle cx={CX} cy={CY} r="6" fill="#1E293B" />
        <circle cx={CX} cy={CY} r="2" fill="#FFFFFF" />

        {/* ── Big white risk number in Sora ── */}
        <text
          x={CX}
          y={CY + 44}
          textAnchor="middle"
          fontFamily="'Sora', sans-serif"
          fontSize="36"
          fontWeight="800"
          fill="#FFFFFF"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.65)) drop-shadow(0 2px 8px rgba(0,0,0,0.8))',
            letterSpacing: '-0.02em',
          }}
        >
          {animatedRisk}
        </text>

        {/* ── Response badge at bottom ── */}
        <g transform={`translate(${CX - 40}, ${CY + 56})`}>
          <rect
            width="80"
            height="22"
            rx="11"
            fill="rgba(5, 7, 10, 0.85)"
            stroke={respColor}
            strokeWidth="1.5"
            style={{ filter: `drop-shadow(0 0 8px ${respColor}88)` }}
          />
          <text
            x="40"
            y="15"
            textAnchor="middle"
            fontFamily="'Russo One', 'Teko', sans-serif"
            fontSize="11"
            fontWeight="bold"
            letterSpacing="0.06em"
            fill={respColor}
          >
            {respLabel}
          </text>
        </g>
      </svg>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .gauge-needle {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}