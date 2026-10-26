// src/components/IncidentFeed.jsx
// Incident Feed — deep indigo-navy gradient background (#1E1B4B to #0F172A),
// bold white headings, event rows with bold colored left stripes,
// timestamps in mono at slate-300, readable contrast >= 4.5:1.

import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore.js'

const MAX_INCIDENTS = 20

const RESPONSE_COLOR = {
  WARN:  '#F59E0B',
  LIMIT: '#F97316',
  BLOCK: '#EF4444',
  ALLOW: '#22C55E',
}

const RESPONSE_LABEL = {
  WARN:  'WARNED',
  LIMIT: 'LIMITED',
  BLOCK: 'BLOCKED',
  ALLOW: 'ALLOWED',
}

function shortReason(reasons) {
  if (!reasons || reasons.length === 0) return '—'
  const top = reasons[0]
  const text = top.text || top.rule || ''
  return text.length > 72 ? text.slice(0, 70) + '…' : text
}

export default function IncidentFeed({ activeAttackLabel }) {
  const result  = useStore((s) => s.result)
  const sample  = useStore((s) => s.sample)

  const [incidents, setIncidents] = useState([])
  const prevResponse = useRef('ALLOW')
  const attackStartRef = useRef(null)
  const peakRef = useRef('ALLOW')

  useEffect(() => {
    if (!result || !sample) return
    const { response, reasons } = result

    if (activeAttackLabel && prevResponse.current === 'ALLOW' && response !== 'ALLOW') {
      attackStartRef.current = { t: sample.t, label: activeAttackLabel }
      peakRef.current = response
    } else if (response !== 'ALLOW') {
      const ORDER = ['ALLOW', 'WARN', 'LIMIT', 'BLOCK']
      if (ORDER.indexOf(response) > ORDER.indexOf(peakRef.current)) {
        peakRef.current = response
      }
    }

    if (prevResponse.current === 'ALLOW' && response !== 'ALLOW') {
      const detectionSecs = attackStartRef.current
        ? sample.t - attackStartRef.current.t
        : null

      const incident = {
        id:           Date.now(),
        time:         new Date().toLocaleTimeString('en-US', { hour12: false }),
        attackName:   activeAttackLabel ?? 'Unknown',
        response,
        peakResponse: response,
        topReason:    shortReason(reasons),
        detectionMs:  detectionSecs != null ? Math.round(detectionSecs) : null,
      }

      setIncidents((prev) => {
        const next = [incident, ...prev]
        return next.slice(0, MAX_INCIDENTS)
      })
    }

    prevResponse.current = response
  }, [result, sample, activeAttackLabel])

  return (
    <div
      className="p-6 rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div className="pb-3 flex items-center justify-between border-b border-white/10 mb-3">
        <p
          className="text-sm uppercase tracking-wider font-bold text-white m-0"
          style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
        >
          Incident Security Feed
        </p>
        <span className="text-xs font-mono font-semibold text-slate-300">
          {incidents.length}/{MAX_INCIDENTS}
        </span>
      </div>

      {incidents.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-slate-400 italic m-0 font-medium">
            No security incidents detected yet. Normal telemetry operations.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="rounded-xl p-3.5 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: `4px solid ${RESPONSE_COLOR[inc.peakResponse] ?? '#94A3B8'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-xs font-bold font-mono px-2 py-0.5 rounded shadow-sm"
                  style={{
                    background: `${RESPONSE_COLOR[inc.peakResponse]}22`,
                    color: RESPONSE_COLOR[inc.peakResponse],
                    border: `1px solid ${RESPONSE_COLOR[inc.peakResponse]}55`,
                  }}
                >
                  {RESPONSE_LABEL[inc.peakResponse] ?? inc.peakResponse}
                </span>
                <span className="text-xs font-mono text-slate-300">{inc.time}</span>
                {inc.detectionMs != null && (
                  <span className="ml-auto text-xs font-mono font-medium text-slate-300">
                    +{inc.detectionMs} s to detect
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-red-950/80 text-red-200 border border-red-500/40"
                >
                  {inc.attackName}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed m-0 font-medium">
                {inc.topReason}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}