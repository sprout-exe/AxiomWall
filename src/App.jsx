// src/App.jsx
// AxiomWall — main shell.
// Layout (top-to-bottom):
//   1. BackgroundScene (fixed, z=0)
//   2. FallingCars (fixed, z=0, pointer-events none)
//   3. Header (shield+bolt logomark, running indicator)
//   4. DigitalVsPhysical (Truth Split hero — glossy white glass card)
//   5. Debug strip (glossy white glass)
//   6. AttackLab (glossy white glass card)
//   7. TwinChart (MOVED HERE directly after Attack Lab — glossy white card)
//   8. IncidentFeed (glossy white glass card)
//   9. Profile (mode selector — glossy white buttons)
//  10. Stream controls (Start / Stop / Reset)
//  11. TelemetryStrip (glossy white chips)
//  12. FirewallConsole (sticky/fixed docked at bottom)
//  13. Footer

import { useEffect, useState } from 'react'
import useStore from './store/useStore.js'
import TelemetryStrip    from './components/TelemetryStrip.jsx'
import TwinChart         from './components/TwinChart.jsx'
import DigitalVsPhysical from './components/DigitalVsPhysical.jsx'
import AttackLab         from './components/AttackLab.jsx'
import IncidentFeed      from './components/IncidentFeed.jsx'
import FirewallConsole   from './components/FirewallConsole.jsx'
import BackgroundScene   from './components/BackgroundScene.jsx'
import LoadingScreen     from './components/LoadingScreen.jsx'
import FallingCars       from './components/FallingCars.jsx'

const PROFILES = [
  { id: 'idle',           label: 'Idle' },
  { id: 'charge',         label: 'Charge' },
  { id: 'drive',          label: 'Drive' },
  { id: 'fastChargeRamp', label: 'Fast-charge ramp' },
]

const ATTACK_LABELS = {
  freeze_T:      'Temperature Freeze',
  replay:        'Replay',
  soc_jump:      'SoC Jump',
  coord_spoof:   'Coordinated Spoof',
  malicious_cmd: 'Malicious Command',
  discharge_off: 'DISCHARGE_OFF at Speed',
  legit_ramp:    'Legit Fast-Charge Ramp',
}

// ── Shared glossy white glass card style ──────────────────────────────────────
const WHITE_GLASS = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 247, 251, 0.92) 100%)',
  backdropFilter: 'blur(18px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
  border: '1px solid rgba(255, 255, 255, 0.95)',
  borderRadius: '1.5rem',
  boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.14), 0 0 24px rgba(34, 197, 94, 0.10), 0 12px 36px rgba(0, 0, 0, 0.08)',
}

// ── Shield + bolt SVG logomark ────────────────────────────────────────────────
function ShieldBolt({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14 6.9-1.2 12-7.4 12-14V7L16 2z"
        fill="rgba(200,240,60,0.18)"
        stroke="#C8F03C"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18 8l-6 9h5l-1 7 7-10h-5l1-6z"
        fill="#C8F03C"
      />
    </svg>
  )
}

// ── Debug strip (white glass) ─────────────────────────────────────────────────
function DebugStrip() {
  const mode   = useStore((s) => s.mode)
  const sample = useStore((s) => s.sample)
  const result = useStore((s) => s.result)

  const I     = sample?.I?.toFixed(1)     ?? '—'
  const speed = sample?.speed?.toFixed(1) ?? '—'
  const precheck = result?.precheck ? ' ⚡PRE-CHECK' : ''

  const failingRules = result?.reasons
    ?.map(r => `${r.rule}:${(r.severity * 100).toFixed(0)}%`)
    .join('  ') ?? 'none'

  return (
    <div
      style={{
        ...WHITE_GLASS,
        borderRadius: '0.85rem',
        padding: '0.6rem 1.2rem',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.72rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 1.5rem',
        color: '#475569',
        lineHeight: 1.8,
      }}
    >
      <span><span style={{ color: '#64748B' }}>mode: </span><span style={{ color: '#16A34A', fontWeight: 700 }}>{mode}</span></span>
      <span><span style={{ color: '#64748B' }}>I: </span><span style={{ color: '#101114', fontWeight: 700 }}>{I} A</span></span>
      <span><span style={{ color: '#64748B' }}>speed: </span><span style={{ color: '#101114', fontWeight: 700 }}>{speed} km/h</span></span>
      <span><span style={{ color: '#64748B' }}>risk: </span><span style={{ color: '#101114', fontWeight: 700 }}>{result?.risk ?? 0}</span></span>
      <span>
        <span style={{ color: '#64748B' }}>response: </span>
        <span style={{ color: result?.response === 'ALLOW' ? '#16A34A' : '#DC2626', fontWeight: 800 }}>
          {result?.response ?? 'ALLOW'}{precheck}
        </span>
      </span>
      <span style={{ flexBasis: '100%' }}>
        <span style={{ color: '#64748B' }}>rules: </span>
        <span style={{ color: '#1E293B', fontWeight: 600 }}>{failingRules}</span>
      </span>
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{
      margin: '0 0 0.5rem',
      fontFamily: "'Russo One', 'Teko', sans-serif",
      fontSize: '0.82rem',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.7)',
    }}>
      {children}
    </p>
  )
}

// ── Glass section wrapper ─────────────────────────────────────────────────────
function GlassCard({ children, style }) {
  return (
    <div
      style={{
        ...WHITE_GLASS,
        ...style,
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow =
          '0 0 0 1px rgba(34, 211, 238, 0.25), 0 0 28px rgba(34, 197, 94, 0.16), 0 16px 44px rgba(0, 0, 0, 0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = WHITE_GLASS.boxShadow
      }}
    >
      {children}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const mode    = useStore((s) => s.mode)
  const running = useStore((s) => s.running)
  const start   = useStore((s) => s.start)
  const stop    = useStore((s) => s.stop)
  const reset   = useStore((s) => s.reset)
  const setMode = useStore((s) => s.setMode)

  const [activeAttackId, setActiveAttackId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { start() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMode(id) {
    setMode(id)
    if (!running) start()
  }

  const activeAttackLabel = activeAttackId ? (ATTACK_LABELS[activeAttackId] ?? activeAttackId) : null

  return (
    <>
      {/* ── Loading Screen (shown once on page load) ── */}
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}

      {/* ── Fixed background ── */}
      <BackgroundScene />

      {/* ── Falling F1 Cars ── */}
      <FallingCars />

      {/* ── Scroll container with ample bottom padding for docked console ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        padding: '2rem 1rem 8rem',
        overflowX: 'hidden',
      }}>
        <div style={{
          maxWidth: '64rem',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>

          {/* ── Header ── */}
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            {/* Logomark + wordmark + taglines */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldBolt size={42} />
              <div>
                <h1 style={{
                  fontFamily: "'Russo One', 'Teko', sans-serif",
                  fontSize: 'clamp(2.5rem, 5vw, 3.6rem)',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  margin: 0,
                  lineHeight: 1.05,
                  display: 'inline-block',
                  transform: 'skewX(-8deg)',
                  textShadow:
                    '0 0 12px rgba(255,255,255,0.85), 0 0 24px rgba(34,211,238,0.5), 0 0 38px rgba(34,197,94,0.35)',
                }}>
                  AXIOMWALL
                </h1>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#E2E8F0', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  Physics checks what passwords can't.
                </p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: '#CBD5E1', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  Simulated data · Thermal time-scale ×20
                </p>
              </div>
            </div>

            {/* Running indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexShrink: 0,
                background: 'rgba(5,7,11,0.65)',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{
                width: '9px', height: '9px', borderRadius: '50%',
                background: running ? '#22C55E' : '#94A3B8',
                boxShadow: running ? '0 0 10px #22C55E' : 'none',
                transition: 'background 0.3s, box-shadow 0.3s',
              }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: running ? '#F1F5F9' : '#94A3B8' }}>
                {running ? 'Streaming' : 'Stopped'}
              </span>
            </div>
          </header>

          {/* ── Truth Split Hero — glossy white glass card ── */}
          <GlassCard>
            <DigitalVsPhysical />
          </GlassCard>

          {/* ── Debug strip ── */}
          <DebugStrip />

          {/* ── Attack Lab ── */}
          <GlassCard>
            <AttackLab onActiveChange={setActiveAttackId} />
          </GlassCard>

          {/* ── Twin chart (sitting DIRECTLY after Attack Lab) ── */}
          <GlassCard>
            <TwinChart />
          </GlassCard>

          {/* ── Incident Feed ── */}
          <GlassCard>
            <IncidentFeed activeAttackLabel={activeAttackLabel} />
          </GlassCard>

          {/* ── Profile (mode selector) ── */}
          <section>
            <SectionLabel>Profile</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {PROFILES.map((p) => {
                const active = mode === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleMode(p.id)}
                    style={{
                      borderRadius: '0.85rem',
                      padding: '0.55rem 1.15rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      border: active
                        ? '1.5px solid #16A34A'
                        : '1px solid rgba(255,255,255,0.7)',
                      background: active
                        ? '#F0FDF4'
                        : 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      color: active ? '#15803D' : '#1E293B',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: active
                        ? '0 0 16px rgba(34,197,94,0.3), 0 2px 6px rgba(0,0,0,0.06)'
                        : '0 2px 6px rgba(0,0,0,0.05)',
                    }}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Stream controls ── */}
          <section style={{ display: 'flex', gap: '0.6rem' }}>
            {running ? (
              <button type="button" onClick={stop} style={{
                borderRadius: '0.85rem', padding: '0.55rem 1.4rem',
                fontSize: '0.875rem', fontWeight: 700,
                background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 0 16px rgba(239,68,68,0.45)',
              }}>Stop</button>
            ) : (
              <button type="button" onClick={start} style={{
                borderRadius: '0.85rem', padding: '0.55rem 1.4rem',
                fontSize: '0.875rem', fontWeight: 700,
                background: '#16A34A', color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 0 16px rgba(22,163,74,0.45)',
              }}>Start</button>
            )}
            <button type="button" onClick={reset} style={{
              borderRadius: '0.85rem', padding: '0.55rem 1.4rem',
              fontSize: '0.875rem', fontWeight: 700,
              background: 'rgba(255,255,255,0.92)', color: '#1E293B',
              border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>Reset</button>
          </section>

          {/* ── Telemetry chips ── */}
          <section>
            <SectionLabel>Live Telemetry</SectionLabel>
            <TelemetryStrip />
          </section>

          {/* ── Sticky / Docked Firewall Console ── */}
          <FirewallConsole />

          {/* ── Footer ── */}
          <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#CBD5E1', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              Background imagery: stock photo, for demonstration only.
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#E2E8F0', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              AxiomWall — Battery Physics Firewall Demo
            </p>
          </footer>

        </div>
      </div>
    </>
  )
}