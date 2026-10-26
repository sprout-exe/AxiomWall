// src/components/TwinChart.jsx
// Recharts line chart of measured vs twin-predicted temperature (or voltage).
// Measured trace in solid green #16A34A with soft gradient area fill.
// Twin prediction in lavender #A78BFA dashed, ±1.5 tolerance band.
// Soft mint-to-white gradient (#ECFDF5 to #F0FDF4) card, thin green border and subtle green glow.

import { useState } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import useStore from '../store/useStore.js'

const BAND_K = 1.5 // ± K / V tolerance band around twin prediction

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

  const span = hi - lo
  if (span < minSpan) {
    const extra = (minSpan - span) / 2
    lo -= extra
    hi += extra
  }

  return [Math.floor(lo), Math.ceil(hi)]
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs space-y-1"
      style={{
        background: '#FFFFFF',
        border: '1px solid #A7F3D0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 0 12px rgba(34, 197, 94, 0.15)',
        color: '#1E293B',
      }}
    >
      <p className="font-semibold text-slate-500 mb-1">t = {label} s</p>
      {payload.map((p) =>
        p.name !== 'band' && p.name !== 'measuredFill' ? (
          <p key={p.name} style={{ color: p.stroke || p.fill, margin: 0, fontWeight: 500 }}>
            {p.name}: <strong className="text-slate-900">{p.value != null ? `${p.value} ${unit}` : '—'}</strong>
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
    <div
      className="p-6 rounded-3xl"
      style={{
        background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
        border: '1px solid rgba(34, 197, 94, 0.28)',
        boxShadow: '0 0 20px rgba(34, 197, 94, 0.12), 0 8px 32px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header + toggle */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2
            className="text-sm uppercase tracking-wider text-slate-900 m-0"
            style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
          >
            Digital Twin Verification — {view === 'voltage' ? 'Voltage' : 'Temperature'}
          </h2>
          <p className="text-xs text-emerald-800 m-0 mt-0.5 font-mono font-medium">
            Thermal time-scale x20 (demo)
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/80 p-1 border border-emerald-200 shadow-sm backdrop-blur">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setView(m.id)}
              className={[
                'rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
                view === m.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-5 rounded" style={{ backgroundColor: '#16A34A' }} />
          Measured (Sensors)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-5 rounded"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #A78BFA 0px, #A78BFA 4px, transparent 4px, transparent 6px)',
            }}
          />
          Twin Expectation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-5 rounded opacity-40" style={{ backgroundColor: '#A78BFA' }} />
          ±{BAND_K} {unit} Tolerance
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -6 }}>
          <defs>
            <linearGradient id="measuredGreenFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" vertical={false} />
          <XAxis
            dataKey="t"
            tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#A7F3D0' }}
            label={{ value: 'time (s)', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#334155' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#A7F3D0' }}
            width={38}
            tickFormatter={(v) => Math.round(v).toString()}
            domain={view === 'voltage' ? yDomain(data, 1.5, 3) : yDomain(data, 2, 8)}
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />

          {/* ±1.5 band shaded area */}
          <Area
            dataKey="bandHi"
            stroke="none"
            fill="#A78BFA"
            fillOpacity={0.16}
            isAnimationActive={false}
            legendType="none"
            name="band"
            dot={false}
            activeDot={false}
          />
          <Area
            dataKey="bandLo"
            stroke="none"
            fill="#ECFDF5"
            fillOpacity={1}
            isAnimationActive={false}
            legendType="none"
            name="band"
            dot={false}
            activeDot={false}
          />

          {/* Soft gradient area fill for measured trace */}
          <Area
            dataKey="measured"
            stroke="none"
            fill="url(#measuredGreenFill)"
            isAnimationActive={false}
            legendType="none"
            name="measuredFill"
            dot={false}
            activeDot={false}
          />

          {/* Twin predicted line in lavender #A78BFA dashed */}
          <Line
            dataKey="twin"
            stroke="#A78BFA"
            strokeWidth={2.2}
            dot={false}
            isAnimationActive={false}
            name="Twin"
            strokeDasharray="5 3"
          />

          {/* Measured line in solid green #16A34A */}
          <Line
            dataKey="measured"
            stroke="#16A34A"
            strokeWidth={2.4}
            dot={false}
            isAnimationActive={false}
            name="Measured"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}