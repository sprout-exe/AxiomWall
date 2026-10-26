// src/components/SustainabilityCard.jsx
// Cyber-Physical Sustainability & ROI Card.
// Derives counters ONLY from existing incident/result history in the browser.
// Metrics: attacks blocked, unsafe commands stopped, detection latency,
// over-current minutes prevented, overheating events avoided, battery life protected,
// estimated damage avoided.
// Assumptions collapsible with editable inputs and "Estimates based on editable assumptions, not measured data".
// Ties to fire safety, less e-waste, driver income, and grid stability.
// Transform/opacity count-up disabled under prefers-reduced-motion.

import { useState, useEffect, useRef } from 'react'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    try {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReduced(media.matches)
      const handler = (e) => setReduced(e.matches)
      media.addEventListener('change', handler)
      return () => media.removeEventListener('change', handler)
    } catch (e) {}
  }, [])
  return reduced
}

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const reducedMotion = usePrefersReducedMotion()
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value)
      return
    }

    const start = prevValue.current
    const end = value
    if (start === end) return

    const duration = 500
    const startTime = performance.now()

    let frameId
    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * ease)
      setDisplayValue(current)

      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      } else {
        prevValue.current = end
      }
    }

    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [value, reducedMotion])

  return (
    <span style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}{suffix}
    </span>
  )
}

export default function SustainabilityCard({ incidents = [] }) {
  const [costPerIncident, setCostPerIncident] = useState(50000)
  const [currencyUnit, setCurrencyUnit] = useState('₹')
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)

  // Derive metrics
  const blockedIncidents = incidents.filter(
    (inc) => inc.peakResponse === 'BLOCK' || inc.response === 'BLOCK'
  )
  const attacksBlocked = blockedIncidents.length

  const unsafeCommandsStopped = incidents.filter((inc) => {
    const r = (inc.topRuleId || inc.topReason || '').toLowerCase()
    const a = (inc.attackName || '').toLowerCase()
    return (
      r.includes('kinetic') ||
      r.includes('command') ||
      a.includes('command') ||
      a.includes('discharge')
    )
  }).length

  // Measured detection latency in seconds
  const latencies = incidents
    .map((inc) => inc.detectionMs)
    .filter((ms) => ms != null && ms >= 0)
  const avgLatency =
    latencies.length > 0
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
      : '0.0'

  // Estimates based on blocked episodes
  const overCurrentMinutes = attacksBlocked * 15 // ~15 mins per prevented runaway event
  const overheatingAvoided = incidents.filter((inc) => {
    const r = (inc.topRuleId || '').toLowerCase()
    return r.includes('heat') || r.includes('twin_t') || r.includes('temperature')
  }).length || (attacksBlocked > 0 ? attacksBlocked : 0)

  const batteryLifeProtectedPct = (attacksBlocked * 1.5).toFixed(1)
  const damageAvoided = attacksBlocked * costPerIncident

  return (
    <div
      className="p-5 sm:p-7 rounded-3xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 247, 251, 0.94) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.14), 0 0 24px rgba(34, 197, 94, 0.10), 0 16px 40px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-5 flex-wrap">
        <div>
          <h3
            className="text-base sm:text-lg font-bold text-slate-900 m-0 tracking-wide uppercase"
            style={{ fontFamily: "'Russo One', 'Teko', sans-serif" }}
          >
            Cyber-Physical Sustainability & Fleet Impact
          </h3>
          <p className="text-xs text-slate-500 m-0 mt-0.5 font-medium">
            Hardware lifecycle extension, safety integrity and cost avoidance
          </p>
        </div>

        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold"
          style={{
            background: attacksBlocked > 0 ? '#F0FDF4' : '#F8FAFC',
            border: `1.5px solid ${attacksBlocked > 0 ? '#22C55E' : '#CBD5E1'}`,
            color: attacksBlocked > 0 ? '#15803D' : '#64748B',
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: attacksBlocked > 0 ? '#22C55E' : '#94A3B8',
              boxShadow: attacksBlocked > 0 ? '0 0 8px #22C55E' : 'none',
            }}
          />
          {attacksBlocked > 0 ? `${attacksBlocked} EPISODES BLOCKED` : 'MONITORING'}
        </span>
      </div>

      {/* Grid of 6 Key Impact & Sustainability Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 mb-5">
        {/* 1. Attacks Blocked */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Attacks Blocked
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono m-0 my-0.5" style={{ color: '#DC2626' }}>
            <AnimatedNumber value={attacksBlocked} />
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            Distinct physical BLOCK episodes
          </span>
        </div>

        {/* 2. Unsafe Commands Stopped */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Unsafe Commands Stopped
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono m-0 my-0.5" style={{ color: '#D97706' }}>
            <AnimatedNumber value={unsafeCommandsStopped} />
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            Kinetic & electrical over-limit commands
          </span>
        </div>

        {/* 3. Measured Detection Latency */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Detection Latency
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono m-0 my-0.5" style={{ color: '#2563EB' }}>
            {avgLatency} <span className="text-sm font-sans font-semibold text-slate-500">s (measured)</span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            Attack start to first BLOCK/THROTTLE
          </span>
        </div>

        {/* 4. Over-current Minutes Prevented */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Overcurrent Prevented
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono m-0 my-0.5" style={{ color: '#059669' }}>
            <AnimatedNumber value={overCurrentMinutes} /> <span className="text-sm font-sans font-semibold text-slate-500">min (est.)</span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            High-C charge/discharge stress avoided
          </span>
        </div>

        {/* 5. Overheating Events Avoided */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Overheating Avoided
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono m-0 my-0.5" style={{ color: '#E11D48' }}>
            <AnimatedNumber value={overheatingAvoided} /> <span className="text-sm font-sans font-semibold text-slate-500">events (est.)</span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            Thermal runaway thresholds defended
          </span>
        </div>

        {/* 6. Estimated Battery Life Protected */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Battery Life Protected
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono m-0 my-0.5" style={{ color: '#16A34A' }}>
            +{batteryLifeProtectedPct}% <span className="text-sm font-sans font-semibold text-slate-500">(est.)</span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            Cell cycle retention safeguarded
          </span>
        </div>
      </div>

      {/* Avoided Damage Banner */}
      <div
        className="p-4 rounded-2xl mb-4 flex items-center justify-between flex-wrap gap-3"
        style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
          border: '1.5px solid #86EFAC',
        }}
      >
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Estimated Hardware Damage Avoided
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-900 font-mono m-0 mt-0.5">
            {currencyUnit}{typeof damageAvoided === 'number' ? damageAvoided.toLocaleString() : damageAvoided}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">
            Calculated as {attacksBlocked} blocked episodes × {currencyUnit}{costPerIncident.toLocaleString()} assumed cost
          </span>
        </div>

        {/* Narrative line on sustainability impact */}
        <div className="max-w-md text-right sm:text-left text-xs font-medium text-emerald-950 leading-relaxed">
          Shielding physical invariants enforces battery fire safety, prevents premature e-waste discard, secures commercial driver daily uptime, and buffers charging grid stability.
        </div>
      </div>

      {/* Assumptions Collapsible */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
        <button
          type="button"
          onClick={() => setAssumptionsOpen(!assumptionsOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono">{assumptionsOpen ? '▼' : '▶'}</span>
            <span>Assumptions & Modeling Parameters</span>
          </div>
          <span className="text-[11px] font-normal text-slate-500 italic">
            Estimate based on editable assumptions, not measured data
          </span>
        </button>

        {assumptionsOpen && (
          <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="cost-input" className="text-xs font-semibold text-slate-600">
                Repair cost per incident:
              </label>
              <input
                id="cost-input"
                type="number"
                min="0"
                step="5000"
                value={costPerIncident}
                onChange={(e) => setCostPerIncident(Math.max(0, Number(e.target.value)))}
                className="px-2.5 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg w-28 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="curr-input" className="text-xs font-semibold text-slate-600">
                Currency unit:
              </label>
              <input
                id="curr-input"
                type="text"
                maxLength="4"
                value={currencyUnit}
                onChange={(e) => setCurrencyUnit(e.target.value)}
                className="px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg w-14 text-center text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="text-[11px] text-slate-500 italic ml-auto">
              * Note: Numbers update in real-time without modifying engine or telemetry models.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
