// src/App.jsx
// PhysGuard — main shell: mode buttons, Start/Stop, TelemetryStrip, TwinChart.
// Streaming starts automatically on load.

import { useEffect } from 'react'
import useStore from './store/useStore.js'
import TelemetryStrip from './components/TelemetryStrip.jsx'
import TwinChart from './components/TwinChart.jsx'

const PROFILES = [
  { id: 'idle',          label: 'Idle' },
  { id: 'charge',        label: 'Charge' },
  { id: 'drive',         label: 'Drive' },
  { id: 'fastChargeRamp', label: 'Fast-charge ramp' },
]

export default function App() {
  const mode    = useStore((s) => s.mode)
  const running = useStore((s) => s.running)
  const start   = useStore((s) => s.start)
  const stop    = useStore((s) => s.stop)
  const reset   = useStore((s) => s.reset)
  const setMode = useStore((s) => s.setMode)

  // Auto-start streaming on mount
  useEffect(() => { start() }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  function handleMode(id) {
    setMode(id)
    // If stopped, restart so the new profile takes effect immediately
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
              className="rounded-xl bg-block px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="rounded-xl bg-allow px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
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