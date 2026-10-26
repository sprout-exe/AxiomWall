// src/components/RiskGauge.jsx
// Semi-circle gauge with four coloured arcs and a needle.

import { useMemo } from 'react'

const SEGMENTS = [
  { id: 'allow', color: '#22C55E', from:   0, to:  25 },
  { id: 'warn',  color: '#F59E0B', from:  25, to:  50 },
  { id: 'limit', color: '#F97316', from:  50, to:  75 },
  { id: 'block', color: '#EF4444', from:  75, to: 100 },
]

const RESPONSE_LABEL = {
  ALLOW: { label: 'ALLOW',     color: '#22C55E' },
  WARN:  { label: 'SUSPICIOUS',color: '#F59E0B' },
  LIMIT: { label: 'IMPLAUSIBLE', color: '#F97316' },
  BLOCK: { label: 'BLOCKED',   color: '#EF4444' },
}

const W = 260, H = 150, CX = W / 2, CY = 135, R_OUT = 120, R_IN = 80, GAP = 2

/** Convert a risk value (0–100) to an angle in radians.
 *  0 → left  (π),  100 → right  (0),  mid → top (π/2).
 */
function riskToAngle(risk) {
  // Maps 0 → 180° → π  and  100 → 0° → 0
  return Math.PI - (risk / 100) * Math.PI
}

/** Polar → Cartesian given a centre (cx, cy), radius, and angle from +x axis. */
function polar(cx, cy, r, angleRad) {
  return [cx + r * Math.cos(angleRad), cy - r * Math.sin(angleRad)]
}

/** Build an SVG arc path for a donut segment. */
function arcPath(cx, cy, rOut, rIn, startDeg, endDeg, gapDeg = GAP) {
  const s = ((startDeg + gapDeg / 2) / 100) * Math.PI
  const e = ((endDeg   - gapDeg / 2) / 100) * Math.PI
  const aS = Math.PI - s
  const aE = Math.PI - e

  const [ox1, oy1] = polar(cx, cy, rOut, aS)
  const [ox2, oy2] = polar(cx, cy, rOut, aE)
  const [ix1, iy1] = polar(cx, cy, rIn,  aE)
  const [ix2, iy2] = polar(cx, cy, rIn,  aS)

  const large = (endDeg - startDeg) > 50 ? 1 : 0

  return [
    `M ${ox1.toFixed(2)} ${oy1.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${large} 0 ${ox2.toFixed(2)} ${oy2.toFixed(2)}`,
    `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${large} 1 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
    'Z',
  ].join(' ')
}

export default function RiskGauge({ risk = 0, response = 'ALLOW' }) {
  const needleAngle = riskToAngle(risk)

  const { label, color } = RESPONSE_LABEL[response] ?? RESPONSE_LABEL.ALLOW

  const needleTip = useMemo(() => polar(CX, CY, R_OUT - 8, needleAngle), [needleAngle])
  const needleL   = useMemo(() => polar(CX, CY, R_IN  + 6, needleAngle + 0.18), [needleAngle])
  const needleR   = useMemo(() => polar(CX, CY, R_IN  + 6, needleAngle - 0.18), [needleAngle])

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-label={`Risk gauge: ${risk}, ${response}`}>
        {/* Arcs */}
        {SEGMENTS.map((seg) => (
          <path
            key={seg.id}
            d={arcPath(CX, CY, R_OUT, R_IN, seg.from, seg.to)}
            fill={seg.color}
            opacity={response.toLowerCase() === seg.id ? 1 : 0.35}
          />
        ))}

        {/* Needle */}
        <polygon
          points={`${needleTip[0].toFixed(2)},${needleTip[1].toFixed(2)} ${needleL[0].toFixed(2)},${needleL[1].toFixed(2)} ${needleR[0].toFixed(2)},${needleR[1].toFixed(2)}`}
          fill="white"
          opacity={0.95}
        />
        {/* Pivot */}
        <circle cx={CX} cy={CY} r={7} fill="white" opacity={0.9} />

        {/* Risk number */}
        <text
          x={CX} y={CY - R_IN + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={28}
          fontWeight={700}
          fontFamily="'Sora', 'Inter', sans-serif"
        >
          {risk}
        </text>
      </svg>

      {/* Response label below */}
      <span
        className="text-sm font-bold tracking-widest uppercase"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  )
}
