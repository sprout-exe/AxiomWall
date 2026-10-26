// src/App.jsx
// PhysGuard — main shell.
// Layout (top-to-bottom):
//   1. Header
//   2. DigitalVsPhysical (Truth Split hero)
//   3. Debug strip (mode, I, speed, failing rules)  ← temporary
//   4. AttackLab
//   5. FirewallConsole
//   6. IncidentFeed
//   7. Profile (mode selector) + stream controls
//   8. TelemetryStrip
//   9. TwinChart

import { useEffect, useState } from 'react'
import useStore from './store/useStore.js'
import TelemetryStrip    from './components/TelemetryStrip.jsx'
import TwinChart         from './components/TwinChart.jsx'
import DigitalVsPhysical from './components/DigitalVsPhysical.jsx'
import AttackLab         from './components/AttackLab.jsx'
import IncidentFeed      from './components/IncidentFeed.jsx'
import FirewallConsole   from './components/FirewallConsole.jsx'

const PROFILES = [
  { id: 'idle',           label: 'Idle' },
  { id: 'charge',         label: 'Charge' },
  { id: 'drive',          label: 'Drive' },
  { id: 'fastChargeRamp', label: 'Fast-charge ramp' },
]

// Map attack ID → human label for the incident feed
const ATTACK_LABELS = {
  freeze_T:      'Temperature Freeze',
  replay:        'Replay',
  soc_jump:      'SoC Jump',
  coord_spoof:   'Coordinated Spoof',
  malicious_cmd: 'Malicious Command',
  discharge_off: 'DISCHARGE_OFF at Speed',
  legit_ramp:    'Legit Fast-Charge Ramp',
};

// ── Tiny debug strip ──────────────────────────────────────────────────────────
function DebugStrip() {
  const mode    = useStore((s) => s.mode);
  const sample  = useStore((s) => s.sample);
  const result  = useStore((s) => s.result);

  const I     = sample?.I?.toFixed(1)     ?? '—';
  const speed = sample?.speed?.toFixed(1) ?? '—';
  const precheck = result?.precheck ? ' ⚡PRE-CHECK' : '';

  const failingRules = result?.reasons
    ?.map(r => `${r.rule}:${(r.severity * 100).toFixed(0)}%`)
    .join('  ') ?? '—';

  return (
    <div
      className="rounded-xl px-4 py-2 font-mono text-xs flex flex-wrap gap-x-6 gap-y-1"
      style={{ background: 'rgba(0,0,0,0.6)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span><span style={{ color: '#9CA3AF' }}>mode:</span> <span style={{ color: '#C8F03C' }}>{mode}</span></span>
      <span><span style={{ color: '#9CA3AF' }}>I:</span> {I} A</span>
      <span><span style={{ color: '#9CA3AF' }}>speed:</span> {speed} km/h</span>
      <span><span style={{ color: '#9CA3AF' }}>risk:</span> {result?.risk ?? 0}</span>
      <span><span style={{ color: '#9CA3AF' }}>response:</span> <span style={{ color: result?.response === 'ALLOW' ? '#22C55E' : '#EF4444' }}>{result?.response ?? 'ALLOW'}{precheck}</span></span>
      <span style={{ color: '#4B5563', flexBasis: '100%' }}>
        <span style={{ color: '#9CA3AF' }}>rules:</span> {failingRules}
      </span>
    </div>
  );
}

export default function App() {
  const mode    = useStore((s) => s.mode)
  const running = useStore((s) => s.running)
  const start   = useStore((s) => s.start)
  const stop    = useStore((s) => s.stop)
  const reset   = useStore((s) => s.reset)
  const setMode = useStore((s) => s.setMode)

  // Track active attack ID so IncidentFeed knows the name
  const [activeAttackId, setActiveAttackId] = useState(null)

  // Auto-start streaming on mount
  useEffect(() => { start() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleMode(id) {
    setMode(id)
    if (!running) start()
  }

  const activeAttackLabel = activeAttackId ? (ATTACK_LABELS[activeAttackId] ?? activeAttackId) : null;

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Header ── */}
        <header className="flex items-end justify-between">
          <div>
            <h1
              className="text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Sora', 'Inter', sans-serif", color: '#C8F03C' }}
            >
              PhysGuard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Physics checks what passwords can't.
            </p>
            <p className="mt-0.5 text-xs" style={{ color: '#4B5563' }}>
              Simulated data. Thermal time-scale ×20.
            </p>
          </div>

          {/* Running indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span
              className={[
                'h-2.5 w-2.5 rounded-full',
                running ? 'bg-allow animate-pulse' : 'bg-gray-300',
              ].join(' ')}
            />
            {running ? 'Streaming' : 'Stopped'}
          </div>
        </header>

        {/* ── Truth Split Hero ── */}
        <section>
          <DigitalVsPhysical />
        </section>

        {/* ── Debug strip (temporary) ── */}
        <section>
          <DebugStrip />
        </section>

        {/* ── Attack Lab ── */}
        <section>
          <AttackLab onActiveChange={setActiveAttackId} />
        </section>

        {/* ── Firewall Console ── */}
        <section>
          <FirewallConsole />
        </section>

        {/* ── Incident Feed ── */}
        <section>
          <IncidentFeed activeAttackLabel={activeAttackLabel} />
        </section>

        {/* ── Profile (mode selector) ── */}
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">
            Profile
          </p>
          <div className="flex flex-wrap gap-2">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleMode(p.id)}
                className={[
                  'rounded-xl px-4 py-2 text-sm font-medium transition-all',
                  mode === p.id
                    ? 'text-white shadow'
                    : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50',
                ].join(' ')}
                style={mode === p.id ? { background: '#1a1b1e', color: '#C8F03C' } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Stream controls ── */}
        <section className="flex gap-2">
          {running ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
              style={{ background: '#EF4444' }}
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="rounded-xl px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
              style={{ background: '#22C55E' }}
            >
              Start
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </section>

        {/* ── Telemetry chips ── */}
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400">
            Live Telemetry
          </p>
          <TelemetryStrip />
        </section>

        {/* ── Twin chart ── */}
        <section>
          <TwinChart />
        </section>

      </div>
    </div>
  )
}