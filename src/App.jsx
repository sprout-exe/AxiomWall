// src/App.jsx
// AxiomWall — main shell.
// Layout (top-to-bottom):
//   1. BackgroundScene (fixed, z=0)
//   2. Header (shield+bolt logomark, running indicator)
//   3. DigitalVsPhysical (Truth Split hero — glass card)
//   4. Debug strip
//   5. AttackLab (glass card)
//   6. FirewallConsole (glass card)
//   7. IncidentFeed (glass card)
//   8. Profile (mode selector) + stream controls
//   9. TelemetryStrip
//  10. TwinChart
//  11. Footer

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

// ── Shared glass card style ───────────────────────────────────────────────────
// white at ~5 % alpha, backdrop-blur, 1px white/10 border, green glow, hover lift
const GLASS = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(16px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '1.5rem',
  boxShadow: '0 0 0 1px rgba(34,197,94,0.06), 0 8px 32px rgba(0,0,0,0.45)',
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
      {/* Shield */}
      <path
        d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14 6.9-1.2 12-7.4 12-14V7L16 2z"
        fill="rgba(200,240,60,0.15)"
        stroke="#C8F03C"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Bolt */}
      <path
        d="M18 8l-6 9h5l-1 7 7-10h-5l1-6z"
        fill="#C8F03C"
      />
    </svg>
  )
}

// ── Debug strip ───────────────────────────────────────────────────────────────
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
        ...GLASS,
        borderRadius: '0.75rem',
        padding: '0.5rem 1rem',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.7rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 1.5rem',
        color: '#9CA3AF',
        lineHeight: 1.8,
      }}
    >
      <span><span style={{ color: '#6B7280' }}>mode: </span><span style={{ color: '#C8F03C', fontWeight: 700 }}>{mode}</span></span>
      <span><span style={{ color: '#6B7280' }}>I: </span><span style={{ color: '#E5E7EB' }}>{I} A</span></span>
      <span><span style={{ color: '#6B7280' }}>speed: </span><span style={{ color: '#E5E7EB' }}>{speed} km/h</span></span>
      <span><span style={{ color: '#6B7280' }}>risk: </span><span style={{ color: '#E5E7EB' }}>{result?.risk ?? 0}</span></span>
      <span>
        <span style={{ color: '#6B7280' }}>response: </span>
        <span style={{ color: result?.response === 'ALLOW' ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
          {result?.response ?? 'ALLOW'}{precheck}
        </span>
      </span>
      <span style={{ flexBasis: '100%' }}>
        <span style={{ color: '#6B7280' }}>rules: </span>
        <span style={{ color: '#D1D5DB' }}>{failingRules}</span>
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
      fontSize: '0.8rem',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#9CA3AF',
    }}>
      {children}
    </p>
  )
}

// ── Glass section wrapper — wraps child component in a glass card ──────────────
function GlassCard({ children, style }) {
  return (
    <div
      style={{ ...GLASS, ...style, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(34,197,94,0.12), 0 12px 40px rgba(0,0,0,0.55)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = GLASS.boxShadow
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

  useEffect(() => { start() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleMode(id) {
    setMode(id)
    if (!running) start()
  }

  const activeAttackLabel = activeAttackId ? (ATTACK_LABELS[activeAttackId] ?? activeAttackId) : null

  return (
    <>
      {/* ── Loading Screen (shown once on page load) ── */}
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}

      {/* ── Fixed background (z=0, no layout impact) ── */}
      <BackgroundScene />

      {/* ── Scroll container ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        padding: '2rem 1rem 5rem',
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
              <ShieldBolt size={40} />
              <div>
                <h1 style={{
                  fontFamily: "'Russo One', 'Teko', sans-serif",
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  margin: 0,
                  lineHeight: 1.05,
                  display: 'inline-block',
                  transform: 'skewX(-8deg)',
                  textShadow:
                    '0 0 10px rgba(255,255,255,0.85), 0 0 20px rgba(34,211,238,0.5), 0 0 35px rgba(34,197,94,0.35)',
                }}>
                  AXIOMWALL
                </h1>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#9CA3AF', lineHeight: 1.3 }}>
                  Physics checks what passwords can't.
                </p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', color: '#4B5563' }}>
                  Simulated data · Thermal time-scale ×20
                </p>
              </div>
            </div>

            {/* Running indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <span style={{
                width: '9px', height: '9px', borderRadius: '50%',
                background: running ? '#22C55E' : '#374151',
                boxShadow: running ? '0 0 8px #22C55E' : 'none',
                transition: 'background 0.3s, box-shadow 0.3s',
              }} />
              <span style={{ fontSize: '0.8rem', color: running ? '#9CA3AF' : '#4B5563' }}>
                {running ? 'Streaming' : 'Stopped'}
              </span>
            </div>
          </header>

          {/* ── Truth Split Hero — glass card with higher opacity for readability ── */}
          <GlassCard style={{
            background: 'rgba(7,11,18,0.90)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}>
            <DigitalVsPhysical />
          </GlassCard>

          {/* ── Debug strip ── */}
          <DebugStrip />

          {/* ── Attack Lab ── */}
          <GlassCard>
            <AttackLab onActiveChange={setActiveAttackId} />
          </GlassCard>

          {/* ── Firewall Console ── */}
          <GlassCard>
            <FirewallConsole />
          </GlassCard>

          {/* ── Incident Feed ── */}
          <GlassCard>
            <IncidentFeed activeAttackLabel={activeAttackLabel} />
          </GlassCard>

          {/* ── Profile (mode selector) ── */}
          <section>
            <SectionLabel>Profile</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {PROFILES.map((p) => {
                const active = mode === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleMode(p.id)}
                    style={{
                      borderRadius: '0.75rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      border: active
                        ? '1px solid rgba(200,240,60,0.45)'
                        : '1px solid rgba(255,255,255,0.09)',
                      background: active
                        ? 'rgba(200,240,60,0.12)'
                        : 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: active ? '#C8F03C' : '#D1D5DB',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                      boxShadow: active ? '0 0 10px rgba(200,240,60,0.15)' : 'none',
                    }}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Stream controls ── */}
          <section style={{ display: 'flex', gap: '0.5rem' }}>
            {running ? (
              <button type="button" onClick={stop} style={{
                borderRadius: '0.75rem', padding: '0.5rem 1.25rem',
                fontSize: '0.875rem', fontWeight: 600,
                background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 0 14px rgba(239,68,68,0.40)',
              }}>Stop</button>
            ) : (
              <button type="button" onClick={start} style={{
                borderRadius: '0.75rem', padding: '0.5rem 1.25rem',
                fontSize: '0.875rem', fontWeight: 600,
                background: '#22C55E', color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 0 14px rgba(34,197,94,0.40)',
              }}>Start</button>
            )}
            <button type="button" onClick={reset} style={{
              borderRadius: '0.75rem', padding: '0.5rem 1.25rem',
              fontSize: '0.875rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', color: '#D1D5DB',
              border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer',
            }}>Reset</button>
          </section>

          {/* ── Telemetry chips ── */}
          <section>
            <SectionLabel>Live Telemetry</SectionLabel>
            <TelemetryStrip />
          </section>

          {/* ── Twin chart ── */}
          <GlassCard>
            <TwinChart />
          </GlassCard>

          {/* ── Footer ── */}
          <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <p style={{ margin: 0, fontSize: '0.68rem', color: '#4B5563' }}>
              Background imagery: stock photo, for demonstration only.
            </p>
            <p style={{ margin: 0, fontSize: '0.68rem', color: '#374151' }}>
              AxiomWall — Battery Physics Firewall Demo
            </p>
          </footer>

        </div>
      </div>
    </>
  )
}