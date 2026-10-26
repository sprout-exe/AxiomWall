// src/components/ImpactChain.jsx
// Cyber-Physical Impact Chain Card.
// Four progression steps: Command -> Current -> Heat -> Cell damage.
// Shows state colors (ok: green, at-risk: amber, hit: red),
// estimate-labelled "~N s to damage" counter when etaSeconds is set,
// and the consequence line.

import useStore from '../store/useStore.js'

const STATE_STYLE = {
  ok: {
    bg: '#F0FDF4',
    border: '#86EFAC',
    text: '#15803D',
    dot: '#22C55E',
    label: 'OK',
  },
  'at-risk': {
    bg: '#FFFBEB',
    border: '#FCD34D',
    text: '#B45309',
    dot: '#F59E0B',
    label: 'AT-RISK',
  },
  hit: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#B91C1C',
    dot: '#EF4444',
    label: 'HIT',
  },
}

export default function ImpactChain() {
  const result = useStore((s) => s.result)
  const impact = result?.impact || { chain: [], etaSeconds: null, consequence: '' }
  const chain = impact.chain && impact.chain.length > 0 ? impact.chain : [
    { stage: 'command',     label: 'Command',     state: 'ok' },
    { stage: 'current',     label: 'Current',     state: 'ok' },
    { stage: 'heat',        label: 'Heat',        state: 'ok' },
    { stage: 'cell_damage', label: 'Cell Damage', state: 'ok' },
  ]

  const etaSeconds = impact.etaSeconds
  const consequence = impact.consequence

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
            Physical Impact Chain
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Propagation from CAN injection to battery cell stress
          </span>
        </div>

        {/* ETA badge (labelled estimate) */}
        {etaSeconds != null ? (
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5"
            style={{
              background: '#FEF2F2',
              color: '#B91C1C',
              border: '1px solid #FCA5A5',
              boxShadow: '0 0 10px rgba(239,68,68,0.2)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span>~{etaSeconds}s to damage (est.)</span>
          </span>
        ) : (
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
            style={{
              background: '#F0FDF4',
              color: '#15803D',
              border: '1px solid #86EFAC',
            }}
          >
            NOMINAL
          </span>
        )}
      </div>

      {/* 4 Steps Progression */}
      <div className="py-2 my-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {chain.map((st, idx) => {
            const conf = STATE_STYLE[st.state] || STATE_STYLE.ok
            return (
              <div
                key={st.stage}
                className="rounded-2xl p-2.5 flex flex-col justify-between border transition-all"
                style={{
                  background: conf.bg,
                  borderColor: conf.border,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    0{idx + 1}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: conf.dot, boxShadow: `0 0 6px ${conf.dot}` }}
                  />
                </div>
                <div className="mt-1">
                  <p className="text-[12px] font-bold text-slate-900 leading-tight m-0">
                    {st.label}
                  </p>
                  <p
                    className="text-[10px] font-mono font-bold m-0 mt-0.5"
                    style={{ color: conf.text }}
                  >
                    {conf.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Consequence Line */}
      <div
        className="mt-4 p-2.5 rounded-xl border text-xs leading-relaxed"
        style={{
          background: etaSeconds != null ? '#FFFBEB' : '#F8FAFC',
          borderColor: etaSeconds != null ? '#FDE68A' : '#E2E8F0',
          color: etaSeconds != null ? '#92400E' : '#475569',
        }}
      >
        <span className="font-bold mr-1.5 uppercase tracking-wider text-[10px] text-slate-900 block sm:inline">
          Consequence:
        </span>
        <span className="font-medium text-slate-800 font-sans">
          {consequence}
        </span>
      </div>
    </div>
  )
}
