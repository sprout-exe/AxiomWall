// src/components/LocalizationPipeline.jsx
// Fault Localization Pipeline card.
// Four architectural nodes in a row: Sensor > Comms > Controller > Actuator.
// The active localized node glows in response color (amber/orange/red); others stay calm grey.
// White glossy glass card style, dark text (slate-600 or darker), responsive at 390 px.

import useStore from '../store/useStore.js'

const NODES = [
  { id: 'sensor',     label: 'Sensor',     icon: '📡' },
  { id: 'comms',      label: 'Comms',      icon: '🔗' },
  { id: 'controller', label: 'Controller', icon: '⚡' },
  { id: 'actuator',   label: 'Actuator',   icon: '⚙️' },
]

const RESPONSE_COLOR = {
  ALLOW:    '#22C55E',
  WARN:     '#F59E0B',
  LIMIT:    '#F97316',
  THROTTLE: '#F97316',
  BLOCK:    '#EF4444',
}

export default function LocalizationPipeline() {
  const result = useStore((s) => s.result)
  const loc = result?.localization || { node: 'none', confidence: 0, evidence: [] }
  const activeNode = loc.node || 'none'
  const confidencePct = Math.round((loc.confidence || 0) * 100)
  const response = result?.response || 'ALLOW'
  const glowColor = RESPONSE_COLOR[response] || '#EF4444'

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl flex flex-col justify-between"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 247, 251, 0.93) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.14), 0 0 24px rgba(118, 255, 3, 0.08), 0 12px 36px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
        <div>
          <span
            className="text-xs uppercase tracking-wider font-bold text-slate-900 block"
            style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
          >
            Fault Localization Pipeline
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Architectural origin of physical safety divergence
          </span>
        </div>
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
          style={{
            background: activeNode !== 'none' ? `${glowColor}15` : '#F1F5F9',
            color: activeNode !== 'none' ? glowColor : '#64748B',
            border: `1px solid ${activeNode !== 'none' ? `${glowColor}40` : '#CBD5E1'}`,
          }}
        >
          {activeNode !== 'none' ? activeNode.toUpperCase() : 'PASS'}
        </span>
      </div>

      {/* 4 Nodes in a row connected by lines */}
      <div className="py-2 my-1">
        <div className="flex items-center justify-between relative">
          {/* Connecting line behind nodes */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-200 z-0"
          />

          {NODES.map((n, idx) => {
            const isActive = activeNode === n.id
            return (
              <div
                key={n.id}
                className="flex flex-col items-center gap-1.5 z-10 relative"
                style={{ flex: '1 1 0' }}
              >
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={{
                    background: isActive ? '#FFFFFF' : '#F8FAFC',
                    border: isActive ? `2px solid ${glowColor}` : '1.5px solid #CBD5E1',
                    boxShadow: isActive
                      ? `0 0 18px ${glowColor}55, 0 4px 12px rgba(0,0,0,0.08)`
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <span className="select-none">{n.icon}</span>
                </div>
                <span
                  className="text-[11px] font-bold text-center tracking-wide"
                  style={{
                    color: isActive ? glowColor : '#475569',
                    fontWeight: isActive ? 800 : 600,
                  }}
                >
                  {n.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sub-status & Evidence */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
        {activeNode !== 'none' ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-1 text-xs">
              <span className="font-semibold text-slate-700">
                Likely source:{' '}
                <strong className="text-slate-900 uppercase font-mono">{activeNode}</strong>
              </span>
              <span className="font-mono text-slate-500 font-semibold">
                confidence {confidencePct}%
              </span>
            </div>
            {loc.evidence && loc.evidence.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-slate-600 mt-0.5">
                <span className="text-slate-500 font-sans text-[10px] uppercase font-bold tracking-wider">
                  Evidence:
                </span>
                {loc.evidence.map((ruleId) => (
                  <span
                    key={ruleId}
                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {ruleId}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="py-1 text-center">
            <span className="text-xs text-slate-500 font-medium">
              No fault localized · Telemetry matches plant model
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
