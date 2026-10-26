// src/components/TwinChart.jsx
// Recharts line chart of measured vs twin-predicted temperature (or voltage).
// Measured line: ink (#101114), twin line: #A78BFA, ±1.5 K shaded band.
// isAnimationActive={false} on all series for smooth 1 Hz updates.

import { useState } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import useStore from '../store/useStore.js'

const BAND_K = 1.5   // ± K / V tolerance band around twin prediction

const MODES = [
  { id: 'temperature', label: 'Temperature (°C)' },
  { id: 'voltage',     label: 'Voltage (V)' },
]

function buildChartData(history, view) {
  return history.map((s) => {
    if (view === 'voltage') {
      const twinV = s.twin_V ?? null
      return {
        t:        s.t,
        measured: parseFloat(s.V.toFixed(3)),
        twin:     twinV != null ? parseFloat(twinV.toFixed(3)) : null,
        bandLo:   twinV != null ? parseFloat((twinV - BAND_K).toFixed(3)) : null,
        bandHi:   twinV != null ? parseFloat((twinV + BAND_K).toFixed(3)) : null,
      }
    }
    // default: temperature
    const twinT = s.twin_T ?? null
    return {
      t:        s.t,
      measured: parseFloat(s.T.toFixed(3)),
      twin:     twinT != null ? parseFloat(twinT.toFixed(3)) : null,
      bandLo:   twinT != null ? parseFloat((twinT - BAND_K).toFixed(3)) : null,
      bandHi:   twinT != null ? parseFloat((twinT + BAND_K).toFixed(3)) : null,
    }
  })
}

/**
 * Compute a tight Y-axis domain from the chart data.
 * - Pads `pad` units above and below the full data range (measures + band).
 * - Enforces `minSpan` so a tiny drift doesn't fill the whole chart height.
 * Returns a [lo, hi] tuple suitable for Recharts `domain` prop.
 */
function yDomain(data, pad, minSpan) {
  if (!data.length) return ['auto', 'auto']

  let lo = Infinity, hi = -Infinity
  for (const d of data) {
    for (const key of ['measured', 'twin', 'bandLo', 'bandHi']) {
      const v = d[key]
      if (v != null && isFinite(v)) {
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
  }
  if (!isFinite(lo)) return ['auto', 'auto']

  lo -= pad
  hi += pad

  // Enforce minimum visible span, expanding symmetrically
  const span = hi - lo
  if (span < minSpan) {
    const extra = (minSpan - span) / 2
    lo -= extra
    hi += extra
  }

  // Round outward to whole numbers for clean grid lines
  return [Math.floor(lo), Math.ceil(hi)]
}

const CustomTooltip = ({ active, payload, label, unit }) => {

  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-lg text-xs space-y-0.5 border border-gray-100">
      <p className="text-gray-400 mb-1">t = {label} s</p>
      {payload.map((p) =>
        p.name !== 'band' ? (
          <p key={p.name} style={{ color: p.stroke || p.fill }}>
            {p.name}: <strong>{p.value != null ? `${p.value} ${unit}` : '—'}</strong>
          </p>
        ) : null
      )}
    </div>
  )
}

export default function TwinChart() {
  const history = useStore((s) => s.history)
  const [view, setView] = useState('temperature')

  const unit = view === 'voltage' ? 'V' : '°C'
  const data = buildChartData(history, view)

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      {/* Header + toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}>
          Digital Twin — {view === 'voltage' ? 'Voltage' : 'Temperature'}
        </h2>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setView(m.id)}
              className={[
                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                view === m.id
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-ink rounded" />
          Measured
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded" style={{ backgroundColor: '#A78BFA' }} />
          Twin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded opacity-30" style={{ backgroundColor: '#A78BFA' }} />
          ±{BAND_K} {unit}
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="t"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'seconds', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={38}
            tickFormatter={(v) => Math.round(v).toString()}
            domain={view === 'voltage'
              ? yDomain(data, 1.5, 3)
              : yDomain(data, 2,   8)}
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />

          {/* ±1.5 band shaded area around twin */}
          <Area
            dataKey="bandHi"
            stroke="none"
            fill="#A78BFA"
            fillOpacity={0.12}
            isAnimationActive={false}
            legendType="none"
            name="band"
            dot={false}
            activeDot={false}
          />
          <Area
            dataKey="bandLo"
            stroke="none"
            fill="#ffffff"
            fillOpacity={1}
            isAnimationActive={false}
            legendType="none"
            name="band"
            dot={false}
            activeDot={false}
          />

          {/* Twin predicted line */}
          <Line
            dataKey="twin"
            stroke="#A78BFA"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Twin"
            strokeDasharray="5 3"
          />

          {/* Measured line */}
          <Line
            dataKey="measured"
            stroke="#101114"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            name="Measured"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
