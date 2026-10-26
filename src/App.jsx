// src/App.jsx
// PhysGuard — main shell.
// Layout (top-to-bottom):
//   1. Header
//   2. DigitalVsPhysical (Truth Split hero)
//   3. TEMPORARY Dev Panel (fault injection + command)
//   4. Mode selector + stream controls
//   5. TelemetryStrip
//   6. TwinChart

import { useEffect } from 'react'
import useStore from './store/useStore.js'
import TelemetryStrip from './components/TelemetryStrip.jsx'
import TwinChart from './components/TwinChart.jsx'
import DigitalVsPhysical from './components/DigitalVsPhysical.jsx'

const PROFILES = [
  { id: 'idle',           label: 'Idle' },
  { id: 'charge',         label: 'Charge' },
  { id: 'drive',          label: 'Drive' },
  { id: 'fastChargeRamp', label: 'Fast-charge ramp' },
]

const FAULTS = [
  { id: 'freezeT', label: 'Freeze T at 25 °C', toggle: true },
  { id: 'addT',    label: 'Add +6 K to T',      toggle: true },
  { id: 'jumpSoC', label: 'Jump SoC +10 %',     toggle: false }, // one-shot
  { id: 'breakP',  label: 'Break P',             toggle: true  },
]

export default function App() {
  const mode        = useStore((s) => s.mode)
  const running     = useStore((s) => s.running)
  const faults      = useStore((s) => s.faults)
  const start       = useStore((s) => s.start)
  const stop        = useStore((s) => s.stop)
  const reset       = useStore((s) => s.reset)
  const setMode     = useStore((s) => s.setMode)
  const toggleFault = useStore((s) => s.toggleFault)
  const sendCommand = useStore((s) => s.sendCommand)

  // Auto-start streaming on mount
  useEffect(() => { start() }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  function handleMode(id) {
    setMode(id)
    if (!running) start()
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Header ── */}
        <header className="flex items-end justify-between">
          <div>
            <h1
              className="text-4xl font-bold tracking-tight text-ink"
              style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
            >
              PhysGuard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Physics checks what passwords can't.
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

        {/* ── DEV PANEL (temporary) ── */}
        <section
          className="rounded-2xl border p-4 space-y-3"
          style={{ borderColor: 'rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.7)' }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
            🛠 Dev Panel — Fault Injection
          </p>
          <div className="flex flex-wrap gap-2">
            {FAULTS.map((f) => {
              const active = f.toggle ? faults[f.id] : false
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFault(f.id)}
                  className={[
                    'rounded-xl px-4 py-2 text-sm font-medium border transition-all',
                    active
                      ? 'bg-limit text-white border-limit shadow'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
                  ].join(' ')}
                  style={active ? { background: '#F97316', borderColor: '#F97316' } : {}}
                >
                  {f.toggle && active ? '✓ ' : ''}{f.label}
                </button>
              )
            })}

            {/* DISCHARGE_OFF command */}
            <button
              type="button"
              onClick={() => sendCommand('DISCHARGE_OFF')}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-block text-white shadow transition-all hover:opacity-90"
              style={{ background: '#EF4444' }}
            >
              ⚡ DISCHARGE_OFF
            </button>
          </div>
        </section>

        {/* ── Mode selector ── */}
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
                    ? 'bg-ink text-white shadow'
                    : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50',
                ].join(' ')}
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