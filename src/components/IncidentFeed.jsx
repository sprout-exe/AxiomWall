// src/components/IncidentFeed.jsx
// Incident Feed — newest entry first.
// A new entry is created when the response transitions from ALLOW to anything higher.
// Each entry records: time, attack name, peak response, top reason text, detection lag.

import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore.js'

const MAX_INCIDENTS = 20;

const RESPONSE_COLOR = {
  WARN:  '#F59E0B',
  LIMIT: '#F97316',
  BLOCK: '#EF4444',
  ALLOW: '#22C55E',
};

const RESPONSE_LABEL = {
  WARN:  'WARNED',
  LIMIT: 'LIMITED',
  BLOCK: 'BLOCKED',
  ALLOW: 'ALLOWED',
};

// Short rule labels for compact display
function shortReason(reasons) {
  if (!reasons || reasons.length === 0) return '—';
  const top = reasons[0];
  // Truncate to ~60 chars
  const text = top.text || top.rule || '';
  return text.length > 72 ? text.slice(0, 70) + '…' : text;
}

export default function IncidentFeed({ activeAttackLabel }) {
  const result  = useStore((s) => s.result);
  const sample  = useStore((s) => s.sample);

  const [incidents, setIncidents] = useState([]);
  const prevResponse = useRef('ALLOW');
  const attackStartRef = useRef(null);  // { t, label } when attack response first fired
  const peakRef = useRef('ALLOW');

  useEffect(() => {
    if (!result || !sample) return;
    const { response, reasons } = result;

    // Track attack start time and peak
    if (activeAttackLabel && prevResponse.current === 'ALLOW' && response !== 'ALLOW') {
      attackStartRef.current = { t: sample.t, label: activeAttackLabel };
      peakRef.current = response;
    } else if (response !== 'ALLOW') {
      // Update peak if escalating
      const ORDER = ['ALLOW', 'WARN', 'LIMIT', 'BLOCK'];
      if (ORDER.indexOf(response) > ORDER.indexOf(peakRef.current)) {
        peakRef.current = response;
      }
    }

    // Create incident on ALLOW → non-ALLOW transition
    if (prevResponse.current === 'ALLOW' && response !== 'ALLOW') {
      const detectionSecs = attackStartRef.current
        ? sample.t - attackStartRef.current.t
        : null;

      const incident = {
        id:           Date.now(),
        time:         new Date().toLocaleTimeString('en-US', { hour12: false }),
        attackName:   activeAttackLabel ?? 'Unknown',
        response,
        peakResponse: response,
        topReason:    shortReason(reasons),
        detectionMs:  detectionSecs != null ? Math.round(detectionSecs) : null,
      };

      setIncidents((prev) => {
        const next = [incident, ...prev];
        return next.slice(0, MAX_INCIDENTS);
      });
    }

    prevResponse.current = response;
  }, [result, sample, activeAttackLabel]);

  if (incidents.length === 0) {
    return (
      <div
        className="rounded-3xl px-6 py-8 text-center"
        style={{ background: '#0d0e10', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-gray-600">Incident Feed</p>
        <p className="mt-3 text-xs text-gray-600 italic">No incidents yet.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-xl"
      style={{ background: '#0d0e10', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest" style={{ fontFamily: "'Russo One', 'Teko', sans-serif", color: '#F59E0B' }}>
          Incident Feed
        </p>
        <span className="text-xs text-gray-600">{incidents.length}/{MAX_INCIDENTS}</span>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-2">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="rounded-xl p-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderLeft: `3px solid ${RESPONSE_COLOR[inc.peakResponse] ?? '#888'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-bold font-mono"
                style={{ color: RESPONSE_COLOR[inc.peakResponse] }}
              >
                {RESPONSE_LABEL[inc.peakResponse] ?? inc.peakResponse}
              </span>
              <span className="text-xs text-gray-500">{inc.time}</span>
              {inc.detectionMs != null && (
                <span className="ml-auto text-xs text-gray-600">
                  +{inc.detectionMs} s to detect
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="rounded px-1.5 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}
              >
                {inc.attackName}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{inc.topReason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
