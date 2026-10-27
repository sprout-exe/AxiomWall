// src/App.jsx
// AxiomWall — main shell.
// Layout (top-to-bottom):
//   1. BackgroundScene (fixed, z=0)
//   2. FallingCars (fixed, z=0, pointer-events none)
//   3. Header (wordmark, running indicator)
//   4. DigitalVsPhysical (Truth Split hero — glossy white glass card)
//   5. Debug strip (glossy white glass)
//   6. AttackLab (glossy white glass card with neon circuit background)
//   7. TelemetryInspector (collapsible card below Attack Lab & above chart)
//   8. TwinChart (directly after TelemetryInspector — mint gradient card)
//   9. IncidentFeed (deep indigo-navy gradient card)
//  10. Profile (mode selector — glossy white buttons with neon highlight)
//  11. Stream controls (Start / Stop / Reset)
//  12. TelemetryStrip (glossy white chips)
//  13. FirewallConsole (sticky/fixed docked at bottom)
//  14. Footer

import { useEffect, useState } from 'react'
import useStore from './store/useStore.js'
import TelemetryStrip      from './components/TelemetryStrip.jsx'
import TelemetryInspector  from './components/TelemetryInspector.jsx'
import TwinChart           from './components/TwinChart.jsx'
import DigitalVsPhysical   from './components/DigitalVsPhysical.jsx'
import AttackLab           from './components/AttackLab.jsx'
import WokwiLink           from './components/WokwiLink.jsx'
import IncidentFeed        from './components/IncidentFeed.jsx'
import LocalizationPipeline from './components/LocalizationPipeline.jsx'
import ImpactChain        from './components/ImpactChain.jsx'
import SustainabilityCard  from './components/SustainabilityCard.jsx'
import FirewallConsole     from './components/FirewallConsole.jsx'
import BackgroundScene     from './components/BackgroundScene.jsx'
import LoadingScreen       from './components/LoadingScreen.jsx'
import FallingCars         from './components/FallingCars.jsx'
import useDigital          from './security/useDigital.js'
import { DemoButton, DemoCaptionBar, DemoSummaryModal } from './components/DemoMode.jsx'
import { useDemo }        from './demo/useDemo.js'

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
  forged_packet: 'Forged Packet (no valid key)',
}

// ── Shared glossy white glass card style ──────────────────────────────────────
const WHITE_GLASS = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 247, 251, 0.92) 100%)',
  backdropFilter: 'blur(18px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
  border: '1px solid rgba(255, 255, 255, 0.95)',
  borderRadius: '1.5rem',
  boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.14), 0 0 24px rgba(118, 255, 3, 0.10), 0 12px 36px rgba(0, 0, 0, 0.08)',
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

// ── Security chip (white glass) ───────────────────────────────────────────────
function SecurityChip() {
  const verified = useDigital((s) => s.packetsVerified)
  const rejected = useDigital((s) => s.packetsRejected)
  const valid    = useDigital((s) => s.valid)

  return (
    <div
      style={{
        ...WHITE_GLASS,
        borderRadius: '0.85rem',
        padding: '0.5rem 1.1rem',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.72rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem 1.2rem',
        color: '#475569',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: valid ? '#15803D' : '#DC2626' }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: valid ? '#22C55E' : '#EF4444',
          boxShadow: valid ? '0 0 6px #22C55E' : '0 0 8px #EF4444',
        }} />
        Digital Security (HMAC-SHA256)
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span>
          <span style={{ color: '#64748B' }}>verified: </span>
          <span style={{ color: '#16A34A', fontWeight: 700 }}>{verified}</span>
        </span>
        <span>
          <span style={{ color: '#64748B' }}>rejected: </span>
          <span style={{ color: rejected > 0 ? '#DC2626' : '#64748B', fontWeight: 700 }}>{rejected}</span>
        </span>
      </div>
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
          '0 0 0 1px rgba(34, 211, 238, 0.25), 0 0 28px rgba(118, 255, 3, 0.16), 0 16px 44px rgba(0, 0, 0, 0.12)'
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
  const [incidents, setIncidents] = useState([])

  const demo = useDemo()

  useEffect(() => { start() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMode(id) {
    setMode(id)
    if (!running) start()
  }

  const activeAttackLabel = activeAttackId ? (ATTACK_LABELS[activeAttackId] ?? activeAttackId) : null

  return (
    <>
      {/* ── Loading Screen ── */}
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}

      {/* ── Demo caption bar (fixed, top-centre) ── */}
      <DemoCaptionBar demo={demo} />

      {/* ── Demo summary modal ── */}
      <DemoSummaryModal
        show={demo.showSummary}
        runStats={demo.runStats}
        onClose={demo.closeSummary}
        onRunAgain={() => { demo.closeSummary(); demo.startDemo() }}
      />

      {/* ── Fixed background ── */}
      <BackgroundScene />

      {/* ── Falling F1 Cars ── */}
      <FallingCars />

      {/* ── Scroll container ── */}
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

          {/* ── Header with Logo image + Recolored Wordmark ── */}
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
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
                    '0 0 12px rgba(255,255,255,0.85), 0 0 24px rgba(118,255,3,0.5), 0 0 38px rgba(34,197,94,0.35)',
                }}>
                  <span>AXIOM</span>
                  <span style={{ color: '#76FF03' }}>WALL</span>
                </h1>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#E2E8F0', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  Physics checks what passwords can't.
                </p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: '#CBD5E1', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  Simulated data · Thermal time-scale ×20
                </p>
              </div>

            {/* Right-side header controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, flexWrap: 'wrap' }}>
              {/* Demo button */}
              <DemoButton
                isRunning={demo.isRunning}
                onStart={demo.isRunning ? demo.stopDemo : demo.startDemo}
              />

              {/* Running indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(5,7,11,0.65)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span style={{
                  width: '9px', height: '9px', borderRadius: '50%',
                  background: running ? '#76FF03' : '#94A3B8',
                  boxShadow: running ? '0 0 10px #76FF03' : 'none',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: running ? '#F1F5F9' : '#94A3B8' }}>
                  {running ? 'Streaming' : 'Stopped'}
                </span>
              </div>
            </div>
          </header>

          {/* ── Truth Split Hero ── */}
          <GlassCard>
            <DigitalVsPhysical />
          </GlassCard>

          {/* ── Debug strip & Security chip ── */}
          <DebugStrip />
          <SecurityChip />

          {/* ── Data source: built-in simulator or live Wokwi ESP32 ── */}
          <GlassCard>
            <WokwiLink />
          </GlassCard>

          {/* ── Attack Lab ── */}
          <GlassCard>
            <AttackLab onActiveChange={setActiveAttackId} />
          </GlassCard>

          {/* ── Telemetry Inspector (below Attack Lab, above Chart) ── */}
          <TelemetryInspector />

          {/* ── Twin chart ── */}
          <TwinChart />

          {/* ── Incident Feed (deep indigo-navy gradient) ── */}
          <IncidentFeed
            activeAttackLabel={activeAttackLabel}
            incidents={incidents}
            setIncidents={setIncidents}
          />

          {/* ── Fault Localization & Physical Impact Chain (side by side on desktop, stacked at 390 px) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LocalizationPipeline />
            <ImpactChain />
          </div>

          {/* ── Sustainability & Fleet Impact Card (full width below) ── */}
          <SustainabilityCard incidents={incidents} />

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
                        ? '1.5px solid #76FF03'
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
                        ? '0 0 16px rgba(118,255,3,0.35), 0 2px 6px rgba(0,0,0,0.06)'
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