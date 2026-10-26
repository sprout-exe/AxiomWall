// src/components/TelemetryStrip.jsx
// Six measurement chips: Voltage, Current, Temperature, SoC, Power, Speed.
// Each chip: white rounded-2xl card, colour status dot, big Sora-font number.

import useStore from '../store/useStore.js'

const CHIPS = [
  {
    key:   'V',
    label: 'Voltage',
    unit:  'V',
    fixed: 2,
    dot:   (v) => v > 46 && v < 60 ? 'bg-allow' : 'bg-block',
  },
  {
    key:   'I',
    label: 'Current',
    unit:  'A',
    fixed: 1,
    dot:   () => 'bg-allow',
  },
  {
    key:   'T',
    label: 'Temperature',
    unit:  '°C',
    fixed: 1,
    dot:   (v) => v < 40 ? 'bg-allow' : v < 50 ? 'bg-warn' : 'bg-block',
  },
  {
    key:   'SoC',
    label: 'SoC',
    unit:  '%',
    fixed: 1,
    dot:   (v) => v > 20 ? 'bg-allow' : v > 10 ? 'bg-warn' : 'bg-block',
  },
  {
    key:   'P',
    label: 'Power',
    unit:  'kW',
    fixed: 2,
    dot:   () => 'bg-allow',
  },
  {
    key:   'speed',
    label: 'Speed',
    unit:  'km/h',
    fixed: 1,
    dot:   () => 'bg-allow',
  },
]

function Chip({ config, sample }) {
  const raw   = sample?.[config.key]
  const value = raw != null ? raw.toFixed(config.fixed) : '—'
  const dotCls = raw != null ? config.dot(raw) : 'bg-gray-300'

  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white px-5 py-4 shadow-sm min-w-[130px]">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
          {config.label}
        </span>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotCls}`} />
      </div>

      {/* Big number */}
      <div className="flex items-baseline gap-1">
        <span
          className="text-3xl font-semibold leading-none text-ink"
          style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
        >
          {value}
        </span>
        <span className="text-sm text-gray-400">{config.unit}</span>
      </div>
    </div>
  )
}

export default function TelemetryStrip() {
  const sample = useStore((s) => s.sample)

  return (
    <div className="flex flex-wrap gap-3">
      {CHIPS.map((cfg) => (
        <Chip key={cfg.key} config={cfg} sample={sample} />
      ))}
    </div>
  )
}
