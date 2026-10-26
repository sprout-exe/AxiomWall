// src/components/RiskGauge.jsx
// Speedometer-style dial gauge with dark dial face, 220° 4-segment arc,
// major/minor tick marks, scale numbers, tapered needle with hub, and glowing readout.

import { useMemo } from 'react'

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

/** Build SVG path for an arc from startAngleDeg to endAngleDeg at radius r */
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

  // Map risk to needle rotation angle:
  // Sweep is 220° centered at 12 o'clock (-90° / 270°).
  // At risk=0, angle is -110° relative to 12 o'clock (points to 160°).
  // At risk=50, angle is 0° (points to 270° / straight up).
  // At risk=100, angle is +110° (points to 380° / 20°).
  const needleRotationDeg = -110 + (clampedRisk / 100) * 220

  // Active segment index (0..3)
  const activeSegIndex = Math.min(3, Math.floor(clampedRisk / 25))

  // Normalized response details
  const respKey = (response ?? 'ALLOW').toUpperCase()
  const { label: respLabel, color: respColor } = RESPONSE_MAP[respKey] ?? { label: respKey, color: '#22C55E' }

  // Generate tick marks (values 0, 5, 10, ... 100)
  const ticks = useMemo(() => {
    const list = []
    for (let v = 0; v <= 100; v += 5) {
      const deg = 160 + (v / 100) * 220
      const rad = (deg * Math.PI) / 180
      const isMajor = v % 25 === 0
      const rInner = isMajor ? 101 : 102
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
    <div className="flex flex-col items-center select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        aria-label={`Risk gauge: ${risk}, ${response}`}
        style={{ display: 'block' }}
      >
        <defs>
          {/* Radial gradient: #05070B centre to #0B0F17 edge */}
          <radialGradient id="dialFaceGrad" cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="#05070B" />
            <stop offset="100%" stopColor="#0B0F17" />
          </radialGradient>

          {/* Glow filters for segments */}
          <filter id="glowSubtle" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowActive" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Dark dial face + rounded bezel with thin white/10 ring ── */}
        <circle
          cx={CX}
          cy={CY}
          r={R_BEZEL}
          fill="url(#dialFaceGrad)"
          stroke="rgba(255, 255, 255, 0.10)"
          strokeWidth="1"
        />

        {/* Faint inner shadow */}
        <circle
          cx={CX}
          cy={CY}
          r={R_BEZEL - 1.5}
          fill="none"
          stroke="rgba(0, 0, 0, 0.55)"
          strokeWidth="3"
        />

        {/* ── Four arc segments (220° sweep) ── */}
        {SEGMENTS.map((seg, idx) => {
          const isActive = idx === activeSegIndex
          const pathD = describeArc(CX, CY, R_ARC, seg.startDeg, seg.endDeg)

          return (
            <g key={seg.id}>
              {/* Outer glow pass */}
              <path
                d={pathD}
                fill="none"
                stroke={seg.color}
                strokeWidth={isActive ? 11 : 9}
                strokeLinecap="round"
                opacity={isActive ? 0.45 : 0.18}
                filter={isActive ? 'url(#glowActive)' : 'url(#glowSubtle)'}
              />
              {/* Crisp foreground arc */}
              <path
                d={pathD}
                fill="none"
                stroke={seg.color}
                strokeWidth={isActive ? 8 : 7}
                strokeLinecap="round"
                opacity={isActive ? 1.0 : 0.45}
              />
            </g>
          )
        })}

        {/* ── Tick marks ── */}
        {ticks.map((t) => (
          <line
            key={`tick-${t.val}`}
            x1={t.x1.toFixed(2)}
            y1={t.y1.toFixed(2)}
            x2={t.x2.toFixed(2)}
            y2={t.y2.toFixed(2)}
            stroke={t.isMajor ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.28)'}
            strokeWidth={t.isMajor ? 1.8 : 1.0}
            strokeLinecap="round"
          />
        ))}

        {/* ── Scale numbers around the arc in glowing white (Russo One font) ── */}
        {ticks.map(
          (t) =>
            t.numPos && (
              <text
                key={`num-${t.val}`}
                x={t.numPos.x.toFixed(2)}
                y={t.numPos.y.toFixed(2)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="400"
                fontFamily="'Russo One', 'Teko', sans-serif"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.85))',
                  textShadow: '0 0 6px rgba(255, 255, 255, 0.85)',
                }}
              >
                {t.val}
              </text>
            )
        )}

        {/* ── Needle (thin tapered needle starting at pivot, reaching the arc) ── */}
        <g
          className="gauge-needle"
          style={{
            transform: `rotate(${needleRotationDeg.toFixed(2)}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Tapered needle pointing straight up towards CY - R_ARC */}
          <path
            d={`M ${CX - 1.8} ${CY} L ${CX - 0.4} ${CY - R_ARC} L ${CX + 0.4} ${CY - R_ARC} L ${CX + 1.8} ${CY} L ${CX + 0.6} ${CY + 5} L ${CX - 0.6} ${CY + 5} Z`}
            fill="#FFFFFF"
            style={{
              filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.75))',
            }}
          />
        </g>

        {/* ── Round hub at the pivot with a glowing white centre dot ── */}
        <circle
          cx={CX}
          cy={CY}
          r={10}
          fill="#0B0F17"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.5"
        />
        <circle
          cx={CX}
          cy={CY}
          r={6}
          fill="#141923"
        />
        <circle
          cx={CX}
          cy={CY}
          r={3}
          fill="#FFFFFF"
          style={{
            filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.95))',
          }}
        />

        {/* ── Big risk number in glowing white just below the hub (Russo One font) ── */}
        <text
          x={CX}
          y={162}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontSize={34}
          fontWeight={400}
          fontFamily="'Russo One', 'Teko', sans-serif"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))',
            textShadow: '0 0 14px rgba(255, 255, 255, 0.7)',
          }}
        >
          {Math.round(risk)}
        </text>

        {/* ── "RISK" in small caps under the number ── */}
        <text
          x={CX}
          y={184}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#9CA3AF"
          fontSize={9}
          fontWeight={400}
          fontFamily="'Russo One', 'Teko', sans-serif"
          letterSpacing="0.18em"
        >
          RISK
        </text>

        {/* ── Response label (ALLOW / WARN / LIMIT / BLOCK) coloured by state with a soft glow ── */}
        <text
          x={CX}
          y={206}
          textAnchor="middle"
          dominantBaseline="central"
          fill={respColor}
          fontSize={13}
          fontWeight={400}
          fontFamily="'Russo One', 'Teko', sans-serif"
          letterSpacing="0.14em"
          style={{
            filter: `drop-shadow(0 0 5px ${respColor}aa)`,
            textShadow: `0 0 10px ${respColor}`,
          }}
        >
          {respLabel}
        </text>
      </svg>

      {/* Motion preference style (no continuous pulsing, transition disabled under reduced-motion) */}
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
