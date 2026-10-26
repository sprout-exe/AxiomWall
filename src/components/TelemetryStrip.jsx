// src/components/TelemetryStrip.jsx
// Six measurement chips: Voltage, Current, Temperature, SoC, Power, Speed.
// White glossy glass card style: #FFFFFF at ~92% with subtle gradient to #F4F7FB,
// 1px white border, soft shadow with faint neon glow, dark ink numbers #101114,
// secondary text #475569. Status dots colored by residual severity.

import useStore from '../store/useStore.js'

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
  if (sev <= 0)  return '#16A34A'
  if (sev < 0.5) return '#F59E0B'
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
  const dotColor = raw != null ? dotColorFromSeverity(sev) : '#94A3B8'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        borderRadius: '1.25rem',
        padding: '1rem 1.25rem',
        minWidth: '135px',
        flex: '1 1 140px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 247, 251, 0.92) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.12), 0 0 16px rgba(34, 197, 94, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>
          {config.label}
        </span>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            flexShrink: 0,
            background: dotColor,
            boxShadow: sev > 0 ? `0 0 8px ${dotColor}` : 'none',
          }}
        />
      </div>

      {/* Big number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span
          style={{
            fontSize: '1.85rem',
            fontWeight: 400,
            lineHeight: 1,
            fontFamily: "'Russo One', 'Teko', sans-serif",
            color: '#101114',
            letterSpacing: '0.02em',
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{config.unit}</span>
      </div>
    </div>
  )
}

export default function TelemetryStrip() {
  const sample = useStore((s) => s.sample)
  const result = useStore((s) => s.result)

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}
    >
      {CHIPS.map((config) => (
        <Chip
          key={config.key}
          config={config}
          sample={sample}
          result={result}
        />
      ))}
    </div>
  )
}