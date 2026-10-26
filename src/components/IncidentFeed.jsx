// src/components/IncidentFeed.jsx
// Incident Feed — newest entry first inside glossy white card.
// Text colors: dark ink (#101114 headings, #475569 secondary).

import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore.js'

const MAX_INCIDENTS = 20

const RESPONSE_COLOR = {
  WARN:  '#D97706',
  LIMIT: '#EA580C',
  BLOCK: '#DC2626',
  ALLOW: '#16A34A',
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

  if (incidents.length === 0) {
    return (
      <div className="p-6 text-center">
        <p
          className="text-xs uppercase tracking-wider font-bold text-slate-700 m-0"
          style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
        >
          Incident Feed
        </p>
        <p className="mt-2 text-xs text-slate-500 italic m-0 font-medium">
          No security incidents detected yet.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="pb-3 flex items-center justify-between">
        <p
          className="text-xs uppercase tracking-wider font-bold text-slate-900 m-0"
          style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
        >
          Incident Feed
        </p>
        <span className="text-xs font-mono font-semibold text-slate-500">
          {incidents.length}/{MAX_INCIDENTS}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="rounded-xl p-3.5 transition-all"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderLeft: `4px solid ${RESPONSE_COLOR[inc.peakResponse] ?? '#94A3B8'}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                style={{
                  background: `${RESPONSE_COLOR[inc.peakResponse]}18`,
                  color: RESPONSE_COLOR[inc.peakResponse],
                }}
              >
                {RESPONSE_LABEL[inc.peakResponse] ?? inc.peakResponse}
              </span>
              <span className="text-xs font-mono text-slate-500">{inc.time}</span>
              {inc.detectionMs != null && (
                <span className="ml-auto text-xs font-mono font-medium text-slate-600">
                  +{inc.detectionMs} s to detect
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="rounded px-2 py-0.5 text-xs font-bold font-mono"
                style={{ background: '#FEE2E2', color: '#B91C1C' }}
              >
                {inc.attackName}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed m-0 font-medium">
              {inc.topReason}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}