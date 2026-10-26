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
  if (sev <= 0)   return '#22C55E'
  if (sev < 0.5)  return '#F59E0B'
  return '#EF4444'
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
  const raw   = sample?.[config.key]
  const value = raw != null ? raw.toFixed(config.fixed) : '—'
  const sev   = severityForChip(config.key, result)
  const dotColor = raw != null ? dotColorFromSeverity(sev) : '#374151'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        borderRadius: '1rem',
        padding: '1rem 1.25rem',
        minWidth: '130px',
        background: 'rgba(10, 14, 24, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF' }}>
          {config.label}
        </span>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            flexShrink: 0,
            background: dotColor,
            boxShadow: sev > 0 ? `0 0 6px ${dotColor}88` : 'none',
          }}
        />
      </div>

      {/* Big number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span
          style={{
            fontSize: '1.75rem',
            fontWeight: 400,
            lineHeight: 1,
            fontFamily: "'Russo One', 'Teko', sans-serif",
            color: '#F0F2F5',
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{config.unit}</span>
      </div>
    </div>
  )
}

export default function TelemetryStrip() {
  const sample = useStore((s) => s.sample)
  const result = useStore((s) => s.result)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
      {CHIPS.map((cfg) => (
        <Chip key={cfg.key} config={cfg} sample={sample} result={result} />
      ))}
    </div>
  )
}
