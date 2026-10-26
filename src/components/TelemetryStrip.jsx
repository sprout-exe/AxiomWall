// src/components/TelemetryStrip.jsx
// Six measurement chips: Voltage, Current, Temperature, SoC, Power, Speed.
// Status dots are coloured by the chip's own residual from the detection result.
// Green  → no residual violation for this channel
// Amber  → residual severity 0–0.5
// Red    → residual severity > 0.5

import useStore from '../store/useStore.js'

// Rule names that map to each chip key
const CHIP_RULES = {
  V:     ['twin_v', 'limit_voltage', 'power_consistency'],
  I:     ['limit_charge_current', 'limit_drive_current', 'kinetic_interlock'],
  T:     ['twin_t', 'heating_rate', 'limit_temperature', 'limit_dTdt', 'replay'],
  SoC:   ['twin_soc', 'soc_conservation'],
  P:     ['power_consistency'],
  speed: ['kinetic_interlock'],
}

function severityForChip(key, result) {
  if (!result || !result.reasons || result.reasons.length === 0) return 0
  const rules = CHIP_RULES[key] ?? []
  return result.reasons.reduce(
    (max, r) => (rules.includes(r.rule) && r.severity > max ? r.severity : max),
    0
  )
}

function dotColorFromSeverity(sev) {
  if (sev <= 0)   return 'bg-allow'
  if (sev < 0.5)  return 'bg-warn'
  return 'bg-block'
}

const CHIPS = [
  { key: 'V',     label: 'Voltage',     unit: 'V',    fixed: 2 },
  { key: 'I',     label: 'Current',     unit: 'A',    fixed: 1 },
  { key: 'T',     label: 'Temperature', unit: '°C',   fixed: 1 },
  { key: 'SoC',   label: 'SoC',         unit: '%',    fixed: 1 },
  { key: 'P',     label: 'Power',       unit: 'kW',   fixed: 2 },
  { key: 'speed', label: 'Speed',       unit: 'km/h', fixed: 1 },
]

function Chip({ config, sample, result }) {
  const raw     = sample?.[config.key]
  const value   = raw != null ? raw.toFixed(config.fixed) : '—'
  const sev     = severityForChip(config.key, result)
  const dotCls  = raw != null ? dotColorFromSeverity(sev) : 'bg-gray-300'

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
  const result = useStore((s) => s.result)

  return (
    <div className="flex flex-wrap gap-3">
      {CHIPS.map((cfg) => (
        <Chip key={cfg.key} config={cfg} sample={sample} result={result} />
      ))}
    </div>
  )
}
