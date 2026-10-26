// src/components/TelemetryInspector.jsx
// Collapsible telemetry verification inspector.
// Shows live reported vs twin expectation, residual, tolerance,
// and INJECTED badge when an attack falsifies a signal.

import { useState } from 'react'
import useStore from '../store/useStore.js'

export default function TelemetryInspector() {
  const [isOpen, setIsOpen] = useState(false)
  const sample = useStore((s) => s.sample)
  const injectedSignals = useStore((s) => s.injectedSignals) || []

  if (!sample) return null

  const rows = [
    {
      key: 'V',
      name: 'Voltage (V)',
      reported: sample.V != null ? sample.V.toFixed(2) : '—',
      unit: 'V',
      expected: sample.twin_V != null ? sample.twin_V.toFixed(2) : '—',
      residual: sample.twin_V != null ? Math.abs(sample.V - sample.twin_V).toFixed(2) : '—',
      tolerance: '0.50 V',
      isInjected: injectedSignals.includes('V'),
    },
    {
      key: 'I',
      name: 'Current (I)',
      reported: sample.I != null ? sample.I.toFixed(1) : '—',
      unit: 'A',
      expected: 'Input (Twin reads I)',
      residual: '—',
      tolerance: '—',
      isInjected: injectedSignals.includes('I'),
    },
    {
      key: 'T',
      name: 'Temperature (T)',
      reported: sample.T != null ? sample.T.toFixed(1) : '—',
      unit: '°C',
      expected: sample.twin_T != null ? sample.twin_T.toFixed(1) : '—',
      residual: sample.twin_T != null ? Math.abs(sample.T - sample.twin_T).toFixed(1) : '—',
      tolerance: '1.5 °C',
      isInjected: injectedSignals.includes('T'),
    },
    {
      key: 'SoC',
      name: 'State of Charge (SoC)',
      reported: sample.SoC != null ? sample.SoC.toFixed(1) : '—',
      unit: '%',
      expected: sample.twin_SoC != null ? sample.twin_SoC.toFixed(1) : '—',
      residual: sample.twin_SoC != null ? Math.abs(sample.SoC - sample.twin_SoC).toFixed(1) : '—',
      tolerance: '1.5 %',
      isInjected: injectedSignals.includes('SoC'),
    },
    {
      key: 'P',
      name: 'Power (P)',
      reported: sample.P != null ? sample.P.toFixed(2) : '—',
      unit: 'kW',
      expected: sample.twin_V != null ? ((sample.twin_V * sample.I) / 1000).toFixed(2) : '—',
      residual: Math.abs(sample.P - (sample.V * sample.I) / 1000).toFixed(3),
      tolerance: '0.05 kW',
      isInjected: injectedSignals.includes('P'),
    },
    {
      key: 'speed',
      name: 'Vehicle Speed',
      reported: sample.speed != null ? sample.speed.toFixed(1) : '—',
      unit: 'km/h',
      expected: 'Kinetic Plant',
      residual: '—',
      tolerance: '0 km/h (DISCHARGE_OFF)',
      isInjected: injectedSignals.includes('speed'),
    },
  ]

  return (
    <div className="w-full">
      {/* Toggle button */}
      <div className="flex justify-between items-center mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          style={{
            background: isOpen ? '#F0FDF4' : 'rgba(255, 255, 255, 0.95)',
            border: isOpen ? '1px solid #16A34A' : '1px solid rgba(226, 232, 240, 0.9)',
            color: isOpen ? '#15803D' : '#1E293B',
          }}
        >
          <span className="font-mono text-[11px]">{isOpen ? '▼' : '▶'}</span>
          <span>Telemetry data</span>
          {injectedSignals.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
              {injectedSignals.length} INJECTED
            </span>
          )}
        </button>
      </div>

      {/* Collapsible card */}
      {isOpen && (
        <div
          className="rounded-2xl p-5 overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 247, 251, 0.94) 100%)',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06), 0 0 16px rgba(34, 197, 94, 0.08)',
          }}
        >
          {/* Header */}
          <div className="pb-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs font-mono text-slate-600">
            <span>
              Sample rate 1 Hz | source: simulated pack | digital check:{' '}
              <strong className="text-emerald-700">signature valid (simulated)</strong>
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto my-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2 px-3">Signal</th>
                  <th className="py-2 px-3">Reported</th>
                  <th className="py-2 px-3">Twin Expectation</th>
                  <th className="py-2 px-3">Residual</th>
                  <th className="py-2 px-3">Tolerance</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                {rows.map((row) => (
                  <tr key={row.key} className={row.isInjected ? 'bg-red-50/70' : 'hover:bg-slate-50/60'}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {row.reported} {row.reported !== '—' && row.unit}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {row.expected} {row.expected !== '—' && !row.expected.includes(' ') && row.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.residual !== '—' ? (
                        <span className="font-semibold text-amber-700">
                          {row.residual} {row.unit === '°C' ? 'K' : row.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {row.tolerance}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.isInjected ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white shadow-sm animate-pulse">
                          INJECTED
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          NOMINAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="pt-2.5 border-t border-slate-200 text-right text-[11px] font-mono text-slate-500">
            Thermal time-scale x20 (demo setting)
          </div>
        </div>
      )}
    </div>
  )
}