// src/components/WokwiLink.jsx
// Data-source switch: built-in simulator <-> live Wokwi ESP32 (hardware-in-the-loop).
// In Wokwi mode every sample comes from the ESP32 over MQTT and runs through the
// same engine as the built-in simulator. The ESP32's own on-board verdict is shown
// here for comparison only.

import useStore from '../store/useStore.js'

const STATUS = {
  off:        { label: 'Not connected',                  color: '#94A3B8' },
  connecting: { label: 'Connecting to broker…',          color: '#F59E0B' },
  waiting:    { label: 'Connected, waiting for ESP32…',  color: '#F59E0B' },
  live:       { label: 'LIVE from Wokwi',                color: '#16A34A' },
  error:      { label: 'Connection error, retrying…',    color: '#DC2626' },
}

const GUARD_COLOR = { SAFE: '#16A34A', WARNING: '#D97706', ATTACK: '#DC2626' }

function Segment({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.5rem 1.1rem',
        fontSize: '0.8rem',
        fontWeight: 700,
        cursor: 'pointer',
        border: 'none',
        borderRadius: '0.7rem',
        background: active ? '#0F172A' : 'transparent',
        color: active ? '#fff' : '#334155',
        transition: 'background 0.2s',
      }}
    >
      {children}
    </button>
  )
}

export default function WokwiLink() {
  const source       = useStore((s) => s.source)
  const status       = useStore((s) => s.wokwiStatus)
  const topic        = useStore((s) => s.wokwiTopic)
  const guard        = useStore((s) => s.wokwiGuard)
  const running      = useStore((s) => s.running)
  const setSource    = useStore((s) => s.setSource)
  const setTopic     = useStore((s) => s.setWokwiTopic)

  const isWokwi = source === 'wokwi'
  const st = STATUS[status] ?? STATUS.off
  const alerts = guard?.alerts ?? []

  return (
    <div style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontFamily: "'Russo One', 'Teko', sans-serif", fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0891B2' }}>
            Hardware-in-the-Loop · Wokwi ESP32
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#475569' }}>
            Choose where the battery telemetry comes from. The firewall engine below runs on either source.
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.25rem', borderRadius: '0.9rem', background: 'rgba(15,23,42,0.07)' }}>
          <Segment active={!isWokwi} onClick={() => setSource('sim')}>Built-in simulator</Segment>
          <Segment active={isWokwi}  onClick={() => setSource('wokwi')}>Wokwi live</Segment>
        </div>
      </div>

      {isWokwi && (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: st.color, boxShadow: status === 'live' ? `0 0 10px ${st.color}` : 'none' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: st.color }}>{running ? st.label : 'Stopped (press Start)'}</span>
          </div>

          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            MQTT topic (must match TOPIC in sketch.ino)
            <input
              type="text"
              value={topic}
              disabled={running}
              onChange={(e) => setTopic(e.target.value)}
              style={{ padding: '0.5rem 0.7rem', borderRadius: '0.6rem', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '0.82rem', background: running ? '#F1F5F9' : '#fff' }}
            />
          </label>

          {guard && (
            <div style={{ padding: '0.8rem 1rem', borderRadius: '0.9rem', background: 'rgba(15,23,42,0.04)', border: '1px solid #E2E8F0' }}>
              <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ESP32 on-board guard (independent second opinion)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ padding: '0.15rem 0.6rem', borderRadius: '9999px', fontWeight: 800, color: '#fff', background: GUARD_COLOR[guard.state] ?? '#64748B' }}>
                  {guard.state}
                </span>
                <span>Contactor: <b>{guard.contactor_closed ? 'closed' : 'OPEN'}</b></span>
                <span>Applied: <b>{Number(guard.applied_a).toFixed(0)} A</b> (limit {Number(guard.limit_a).toFixed(0)} A)</span>
                {alerts.map((a) => (
                  <span key={a} style={{ padding: '0.1rem 0.5rem', borderRadius: '0.4rem', background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: '0.72rem' }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
            Control the pack and the attacks from the Wokwi buttons. The Attack Lab below can still spoof the stream inside the browser.
          </p>
        </div>
      )}
    </div>
  )
}
