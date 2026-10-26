// src/components/FirewallConsole.jsx
// Firewall Console — docked ink-black card with JetBrains Mono.
// Sticky/fixed bottom-4, max-height ~180px, internal scroll, collapse/expand toggle.
// Electric border effect: animated zigzag electricity lines along top/bottom,
// soft glittering shimmer sweep, and twinkling sparkle dots (transform & opacity only).

import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore.js'

const MAX_LINES = 80

const VERDICT_COLOR = {
  ALLOW: '#22C55E',
  WARN:  '#F59E0B',
  LIMIT: '#F97316',
  BLOCK: '#EF4444',
}

const VERDICT_TAG = {
  ALLOW: 'ALLOWED',
  WARN:  'WARNED',
  LIMIT: 'LIMITED',
  BLOCK: 'BLOCKED',
}

function shortTopReason(reasons) {
  if (!reasons || reasons.length === 0) return null
  const top = reasons[0]
  const text = top.text || top.rule || ''
  return text.length > 55 ? text.slice(0, 53) + '…' : text
}

export default function FirewallConsole() {
  const result  = useStore((s) => s.result)
  const sample  = useStore((s) => s.sample)

  const [lines, setLines] = useState([])
  const [collapsed, setCollapsed] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!result || !sample) return

    const { response, reasons } = result
    const color = VERDICT_COLOR[response] ?? '#aaa'
    const tag   = VERDICT_TAG[response]   ?? response

    let physicsStr
    if (response === 'ALLOW') {
      physicsStr = '[Physics OK]'
    } else {
      const top = shortTopReason(reasons)
      physicsStr = top ? `[Physics FAILED: ${top}]` : `[Physics FAILED]`
    }

    const line = {
      id:       Date.now() + Math.random(),
      t:        `t=${sample.t ?? 0}`,
      physics:  physicsStr,
      verdict:  tag,
      color,
      isAllow:  response === 'ALLOW',
    }

    setLines((prev) => {
      const next = [...prev, line]
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next
    })
  }, [result, sample])

  useEffect(() => {
    if (scrollRef.current && !collapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, collapsed])

  return (
    <div
      className="firewall-console-container"
      style={{
        position: 'sticky',
        bottom: '1rem',
        zIndex: 40,
        width: '100%',
        maxWidth: '64rem',
        margin: '0 auto',
      }}
    >
      <div
        className="firewall-console-card rounded-2xl overflow-hidden"
        style={{
          background: '#040608',
          position: 'relative',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75), 0 0 16px rgba(34, 197, 94, 0.25)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
        }}
      >
        {/* ── Top Animated Electric Border ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {/* Animated zigzag electric line */}
          <div
            className="electric-line-top"
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '200%',
              height: '100%',
              background: 'repeating-linear-gradient(90deg, #22D3EE 0px, #22C55E 8px, transparent 8px, transparent 16px)',
              filter: 'drop-shadow(0 0 4px #22D3EE)',
            }}
          />
          {/* Shimmer sweep */}
          <div
            className="electric-shimmer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)',
            }}
          />
        </div>

        {/* ── Bottom Animated Electric Border ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            className="electric-line-bottom"
            style={{
              position: 'absolute',
              bottom: 0,
              left: '-100%',
              width: '200%',
              height: '100%',
              background: 'repeating-linear-gradient(90deg, #22C55E 0px, #C8F03C 8px, transparent 8px, transparent 16px)',
              filter: 'drop-shadow(0 0 4px #22C55E)',
            }}
          />
        </div>

        {/* ── Twinkling sparkle dots along border ── */}
        <div aria-hidden="true" className="sparkle-dot sparkle-1" style={{ top: '-1px', left: '15%' }} />
        <div aria-hidden="true" className="sparkle-dot sparkle-2" style={{ top: '-1px', left: '72%' }} />
        <div aria-hidden="true" className="sparkle-dot sparkle-3" style={{ bottom: '-1px', left: '42%' }} />
        <div aria-hidden="true" className="sparkle-dot sparkle-1" style={{ bottom: '-1px', left: '88%' }} />

        {/* ── Header Bar ── */}
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-3 select-none"
          style={{
            borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(10, 14, 20, 0.95)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#EF4444' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#F59E0B' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#22C55E' }} />
            <span
              className="ml-2 text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: '#4ADE80' }}
            >
              ⚡ AxiomWall Live Firewall Console
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.3)' }}
            >
              {lines.length} events
            </span>
          </div>

          {/* Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand firewall console' : 'Collapse firewall console'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', cursor: 'pointer' }}
          >
            <span>{collapsed ? '▲ Expand' : '▼ Dock/Collapse'}</span>
          </button>
        </div>

        {/* ── Log Area (max height ~180px with internal scroll) ── */}
        {!collapsed && (
          <div
            ref={scrollRef}
            className="p-3.5 overflow-y-auto"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              lineHeight: '1.6',
              maxHeight: '160px',
              color: '#4ADE80',
              background: '#040608',
            }}
          >
            {lines.length === 0 && (
              <span style={{ color: '#4B5563', fontStyle: 'italic' }}>
                Awaiting real-time telemetry stream…
              </span>
            )}
            {lines.map((ln) => (
              <div key={ln.id} className="flex gap-2 flex-wrap items-baseline hover:bg-white/5 px-1 rounded transition-colors">
                {/* timestamp */}
                <span style={{ color: '#6B7280', minWidth: '48px', fontSize: '10px' }}>{ln.t}</span>

                {/* auth chain */}
                <span style={{ color: '#38BDF8' }}>[Auth PASSED]</span>
                <span style={{ color: '#4B5563' }}>-&gt;</span>

                {/* physics verdict */}
                <span style={{ color: ln.isAllow ? '#4ADE80' : '#F59E0B', wordBreak: 'break-all' }}>
                  {ln.physics}
                </span>
                <span style={{ color: '#4B5563' }}>-&gt;</span>

                {/* firewall decision */}
                <span style={{ color: ln.color, fontWeight: 700 }}>
                  [{ln.verdict}]
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* Electricity vibration along borders */
        .electric-line-top {
          animation: electricSlide 2.4s linear infinite;
          will-change: transform;
        }

        .electric-line-bottom {
          animation: electricSlide 2.8s linear infinite reverse;
          will-change: transform;
        }

        @keyframes electricSlide {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(50%); }
        }

        /* Border shimmer sweep */
        .electric-shimmer {
          animation: shimmerSweep 3s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes shimmerSweep {
          0%   { transform: translateX(-100%); opacity: 0; }
          40%  { opacity: 0.9; }
          70%  { opacity: 0.9; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        /* Twinkling sparkle dots */
        .sparkle-dot {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 0 6px #22D3EE, 0 0 10px #22C55E;
          pointer-events: none;
          z-index: 5;
        }

        .sparkle-1 { animation: twinkle 1.8s ease-in-out infinite; }
        .sparkle-2 { animation: twinkle 2.2s ease-in-out infinite 0.7s; }
        .sparkle-3 { animation: twinkle 1.5s ease-in-out infinite 1.2s; }

        @keyframes twinkle {
          0%, 100% { transform: scale(0.5); opacity: 0; }
          50%      { transform: scale(1.6); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .electric-line-top,
          .electric-line-bottom,
          .electric-shimmer,
          .sparkle-dot {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}