// src/components/DemoMode.jsx
// Header button, fixed top caption bar, and summary modal for the 90s Demo story.

const ATTACK_NAMES = {
  freeze_T: 'Temperature Freeze',
  discharge_off: 'DISCHARGE_OFF at Speed',
  malicious_cmd: 'Malicious Command Limit',
  forged_packet: 'Forged Packet (Layer 1)',
}

/**
 * Neon pill button in the header to run/stop demo
 */
export function DemoButton({ isRunning, onStart }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-md select-none"
      style={{
        background: isRunning
          ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(34, 211, 238, 0.9) 100%)',
        color: '#FFFFFF',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: isRunning
          ? '0 0 16px rgba(239, 68, 68, 0.4)'
          : '0 0 18px rgba(118, 255, 3, 0.35)',
      }}
    >
      <span>{isRunning ? '⏹ Stop Demo' : '▶ Run 90s Demo'}</span>
    </button>
  )
}

/**
 * Compact fixed top-centre caption bar during demo
 */
export function DemoCaptionBar({ demo }) {
  if (!demo.isRunning) return null

  const {
    currentStep,
    stepIndex,
    totalSteps,
    progressRatio,
    elapsedSec,
    totalSec,
    isPaused,
    pauseDemo,
    resumeDemo,
    skipStep,
    stopDemo,
  } = demo

  return (
    <div
      role="region"
      aria-label="Demo mode caption bar"
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'calc(100% - 2rem)',
        maxWidth: '46rem',
        background: 'rgba(5, 7, 11, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(34, 211, 238, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 211, 238, 0.25)',
        borderRadius: '1rem',
        padding: '0.85rem 1.25rem',
        color: '#FFFFFF',
      }}
    >
      {/* Thin Neon Progress Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(255, 255, 255, 0.15)',
          overflow: 'hidden',
          borderRadius: '1rem 1rem 0 0',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressRatio * 100}%`,
            background: 'linear-gradient(90deg, #22D3EE, #76FF03)',
            boxShadow: '0 0 8px #76FF03',
            transition: 'width 1s linear',
          }}
        />
      </div>

      {/* Top row: step badge, title & controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.45rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              background: 'rgba(34, 211, 238, 0.18)',
              color: '#22D3EE',
              border: '1px solid rgba(34, 211, 238, 0.35)',
            }}
          >
            STEP {stepIndex}/{totalSteps} ({elapsedSec}s/{totalSec}s)
          </span>
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: '0.82rem',
              color: '#F1F5F9',
              letterSpacing: '0.04em',
            }}
          >
            {currentStep.title}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            onClick={isPaused ? resumeDemo : pauseDemo}
            className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#F8FAFC',
            }}
            title="Space to toggle pause"
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            type="button"
            onClick={skipStep}
            className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#F8FAFC',
            }}
          >
            ⏭ Skip
          </button>
          <button
            type="button"
            onClick={stopDemo}
            className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer"
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#FCA5A5',
            }}
            title="Esc to exit"
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Caption text: minimum 18px on desktop, 15px at 390px, instant change */}
      <p
        style={{
          margin: 0,
          fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)',
          lineHeight: '1.4',
          color: '#F8FAFC',
          fontWeight: 500,
        }}
      >
        {currentStep.caption}
      </p>
    </div>
  )
}

/**
 * Measured Summary Modal at the end of the demo
 */
export function DemoSummaryModal({ show, runStats, onClose, onRunAgain }) {
  if (!show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          maxWidth: '36rem',
          width: '100%',
          background: '#0B0F17',
          border: '1px solid rgba(34, 211, 238, 0.4)',
          borderRadius: '1.25rem',
          boxShadow: '0 20px 48px rgba(0,0,0,0.8), 0 0 30px rgba(118,255,3,0.2)',
          padding: '1.75rem',
          color: '#FFFFFF',
        }}
      >
        <h3
          style={{
            margin: '0 0 0.5rem',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '1.35rem',
            color: '#76FF03',
            letterSpacing: '0.02em',
          }}
        >
          ⚡ 90s Demo Run Summary
        </h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.5 }}>
          Measured physical firewall enforcement telemetry during this automated run:
        </p>

        {/* Results table */}
        <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#64748B', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.6rem' }}>Attack</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>First Detection</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>Final Verdict</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>Fault Node</th>
              </tr>
            </thead>
            <tbody>
              {runStats.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>
                    All attacks blocked or completed within expected physical tolerances.
                  </td>
                </tr>
              ) : (
                runStats.map((s) => (
                  <tr key={s.attackId} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#F8FAFC', fontWeight: 600 }}>
                      {ATTACK_NAMES[s.attackId] || s.attackId}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#38BDF8' }}>
                      {s.latencyDisplay}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', fontWeight: 700, color: s.peakResponse === 'BLOCK' ? '#EF4444' : '#F59E0B' }}>
                      {s.peakResponse}
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', color: '#C084FC' }}>
                      {s.node}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Honest engineering note */}
        <p
          style={{
            margin: '0 0 1.5rem',
            padding: '0.65rem 0.9rem',
            borderRadius: '0.75rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.75rem',
            color: '#CBD5E1',
            lineHeight: 1.45,
          }}
        >
          <strong>Note:</strong> Simulated data. Phase 1 recommends and simulates enforcement; an edge gateway would enforce it.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onRunAgain}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            style={{
              background: '#16A34A',
              color: '#FFFFFF',
              boxShadow: '0 0 14px rgba(22, 163, 74, 0.4)',
            }}
          >
            Run again
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
