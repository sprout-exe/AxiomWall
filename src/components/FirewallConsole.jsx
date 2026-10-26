// src/components/FirewallConsole.jsx
// Firewall Console — ink-black card with JetBrains Mono.
// One line per sample tick, format:
//   [Auth PASSED] -> [Physics FAILED: <top reason>] -> [BLOCKED|LIMITED|WARNED]
//   [Auth PASSED] -> [Physics OK] -> [ALLOWED]   (legit ramp / clean)
// Keeps last 80 lines. Auto-scrolls to bottom.

import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore.js'

const MAX_LINES = 80;

const VERDICT_COLOR = {
  ALLOW: '#22C55E',
  WARN:  '#F59E0B',
  LIMIT: '#F97316',
  BLOCK: '#EF4444',
};

const VERDICT_TAG = {
  ALLOW: 'ALLOWED',
  WARN:  'WARNED',
  LIMIT: 'LIMITED',
  BLOCK: 'BLOCKED',
};

function shortTopReason(reasons) {
  if (!reasons || reasons.length === 0) return null;
  const top = reasons[0];
  const text = top.text || top.rule || '';
  return text.length > 60 ? text.slice(0, 58) + '…' : text;
}

export default function FirewallConsole() {
  const result  = useStore((s) => s.result);
  const sample  = useStore((s) => s.sample);

  const [lines, setLines] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!result || !sample) return;

    const { response, reasons } = result;
    const color = VERDICT_COLOR[response] ?? '#aaa';
    const tag   = VERDICT_TAG[response]   ?? response;

    let physicsStr;
    if (response === 'ALLOW') {
      physicsStr = '[Physics OK]';
    } else {
      const top = shortTopReason(reasons);
      physicsStr = top
        ? `[Physics FAILED: ${top}]`
        : `[Physics FAILED]`;
    }

    const line = {
      id:       Date.now() + Math.random(),
      t:        `t=${sample.t ?? 0}`,
      physics:  physicsStr,
      verdict:  tag,
      color,
      isAllow:  response === 'ALLOW',
    };

    setLines((prev) => {
      const next = [...prev, line];
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
    });
  }, [result, sample]);

  // Auto-scroll to newest line
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-xl"
      style={{ background: '#060708', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header bar */}
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Traffic-light dots */}
        <span className="h-3 w-3 rounded-full" style={{ background: '#EF4444' }} />
        <span className="h-3 w-3 rounded-full" style={{ background: '#F59E0B' }} />
        <span className="h-3 w-3 rounded-full" style={{ background: '#22C55E' }} />
        <span
          className="ml-2 text-xs font-semibold uppercase tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: '#4B5563' }}
        >
          Firewall Console
        </span>
      </div>

      {/* Log area */}
      <div
        ref={scrollRef}
        className="p-4 overflow-y-auto"
        style={{
          fontFamily:  "'JetBrains Mono', 'Fira Code', monospace",
          fontSize:    '11px',
          lineHeight:  '1.7',
          maxHeight:   '260px',
          color:       '#6B7280',
        }}
      >
        {lines.length === 0 && (
          <span style={{ color: '#374151', fontStyle: 'italic' }}>
            Awaiting telemetry…
          </span>
        )}
        {lines.map((ln) => (
          <div key={ln.id} className="flex gap-2 flex-wrap">
            {/* timestamp */}
            <span style={{ color: '#374151', minWidth: '52px' }}>{ln.t}</span>

            {/* auth chain */}
            <span style={{ color: '#22C55E' }}>[Auth PASSED]</span>
            <span style={{ color: '#374151' }}>-&gt;</span>

            {/* physics verdict */}
            <span style={{ color: ln.isAllow ? '#22C55E' : '#F59E0B', wordBreak: 'break-all' }}>
              {ln.physics}
            </span>
            <span style={{ color: '#374151' }}>-&gt;</span>

            {/* firewall decision */}
            <span style={{ color: ln.color, fontWeight: 700 }}>
              [{ln.verdict}]
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
