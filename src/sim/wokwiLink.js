// src/sim/wokwiLink.js
// Live link to the Wokwi ESP32 simulator ("BMS Guard") over MQTT-on-WebSocket.
// The ESP32 publishes one JSON message per second. This file converts it into the
// SAME sample shape the built-in simulator produces, so the whole engine
// (rules, twin, risk, localization, impact chain) runs on it unchanged:
//   { t, V, I, T, SoC, P, speed, digitalValid }
// Sign convention (same as twin.js): I > 0 = discharge/drive, I < 0 = charging.

import mqtt from 'mqtt'

export const DEFAULT_BROKER = 'wss://broker.hivemq.com:8884/mqtt'
export const DEFAULT_TOPIC  = 'bms-guard-ai01-7421/telemetry'   // must match TOPIC in sketch.ino

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Convert one ESP32 message into an engine sample, or null if it is malformed. */
export function toSample(m) {
  if (!m || typeof m !== 'object') return null
  const t = num(m.t), V = num(m.V), I = num(m.I), T = num(m.T), SoC = num(m.SoC), P = num(m.P)
  if ([t, V, I, T, SoC, P].some((v) => v === null)) return null
  return { t, V, I, T, SoC, P, speed: num(m.speed) ?? 0, digitalValid: m.digitalValid !== false }
}

/**
 * Connect and start listening.
 *  onSample(sample, command)  – every valid message (command is {type,value} or null)
 *  onGuard(guard, mode)       – the ESP32's own on-board verdict, for display only
 *  onStatus(status)           – 'connecting' | 'waiting' | 'live' | 'error'
 * Returns { close() }.
 */
export function connectWokwi({ broker = DEFAULT_BROKER, topic = DEFAULT_TOPIC, onSample, onGuard, onStatus }) {
  onStatus?.('connecting')
  const client = mqtt.connect(broker, { reconnectPeriod: 3000, connectTimeout: 8000 })
  let watchdog = null

  const armWatchdog = () => {
    clearTimeout(watchdog)
    // No message for 5 s -> the simulation is paused/stopped
    watchdog = setTimeout(() => onStatus?.('waiting'), 5000)
  }

  client.on('connect',   () => { onStatus?.('waiting'); client.subscribe(topic) })
  client.on('reconnect', () => onStatus?.('connecting'))
  client.on('error',     () => onStatus?.('error'))

  client.on('message', (_topic, payload) => {
    let m
    try { m = JSON.parse(payload.toString()) } catch { return }
    const sample = toSample(m)
    if (!sample) return
    onStatus?.('live')
    armWatchdog()
    onSample(sample, m.command ?? null)
    onGuard?.(m.guard ?? null, m.mode ?? null)
  })

  return {
    close() {
      clearTimeout(watchdog)
      client.end(true)
    },
  }
}
