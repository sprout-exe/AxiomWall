// src/security/signing.js
// HMAC-SHA256 telemetry packet signing and verification.
// Synchronous pipeline to keep the telemetry tick synchronous.

import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'

// demo key; production uses a per-device key in secure storage
export const DEMO_KEY = 'axiomwall-demo-device-key-2026-sec'

const KEY_BYTES = utf8ToBytes(DEMO_KEY)

/**
 * Builds the canonical string from strictly the 6 reported fields,
 * plus sequence, timestamp, and nonce.
 * Note: Never includes twin_* fields or sample.t.
 */
export function toCanonicalString(fields, seq, ts, nonce) {
  const v   = Number(fields?.V ?? 0).toFixed(3)
  const i   = Number(fields?.I ?? 0).toFixed(3)
  const t   = Number(fields?.T ?? 0).toFixed(3)
  const soc = Number(fields?.SoC ?? 0).toFixed(3)
  const p   = Number(fields?.P ?? 0).toFixed(3)
  const spd = Number(fields?.speed ?? 0).toFixed(3)
  return `V=${v}|I=${i}|T=${t}|SoC=${soc}|P=${p}|speed=${spd}|seq=${seq}|ts=${ts}|nonce=${nonce}`
}

/**
 * Signs a sample and returns the signed packet.
 */
export function signPacket(sample, seq, ts, nonce) {
  const fields = {
    V: sample.V,
    I: sample.I,
    T: sample.T,
    SoC: sample.SoC,
    P: sample.P,
    speed: sample.speed,
  }
  const canonical = toCanonicalString(fields, seq, ts, nonce)
  const sigBytes = hmac(sha256, KEY_BYTES, utf8ToBytes(canonical))
  const sig = bytesToHex(sigBytes)
  return { fields, seq, ts, nonce, sig }
}

/**
 * Constant-time string equality check using bitwise XOR.
 */
export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Verifies a packet against a state containing lastSeq and seenNonces.
 * Returns { valid: boolean, reason: 'ok' | 'bad_signature' | 'stale_timestamp' | 'replayed_nonce' | 'bad_sequence' }
 */
export function verifyPacket(packet, state) {
  if (!packet || !packet.fields) {
    return { valid: false, reason: 'bad_signature' }
  }

  // 1. Sequence strictly increasing
  if (typeof packet.seq !== 'number' || packet.seq <= state.lastSeq) {
    return { valid: false, reason: 'bad_sequence' }
  }

  // 2. Timestamp within +-5 s of Date.now() (wall clock)
  const now = Date.now()
  if (typeof packet.ts !== 'number' || Math.abs(now - packet.ts) > 5000) {
    return { valid: false, reason: 'stale_timestamp' }
  }

  // 3. Nonce not seen before (bounded set of last 200)
  if (!packet.nonce || state.seenNonces.has(packet.nonce)) {
    return { valid: false, reason: 'replayed_nonce' }
  }

  // 4. Constant-time signature compare
  const canonical = toCanonicalString(packet.fields, packet.seq, packet.ts, packet.nonce)
  const expectedSigBytes = hmac(sha256, KEY_BYTES, utf8ToBytes(canonical))
  const expectedSig = bytesToHex(expectedSigBytes)

  if (!constantTimeEqual(expectedSig, packet.sig)) {
    return { valid: false, reason: 'bad_signature' }
  }

  // Valid packet: update verifier state
  state.lastSeq = packet.seq
  state.seenNonces.add(packet.nonce)
  if (!state.nonceList) state.nonceList = []
  state.nonceList.push(packet.nonce)
  if (state.nonceList.length > 200) {
    const oldest = state.nonceList.shift()
    state.seenNonces.delete(oldest)
  }

  return { valid: true, reason: 'ok' }
}

// ── Shared runtime state for signer and verifier ──────────────────────
let currentSeq = 0
let verifierState = {
  lastSeq: 0,
  seenNonces: new Set(),
  nonceList: [],
}

export function resetSecurityState() {
  currentSeq = 0
  verifierState = {
    lastSeq: 0,
    seenNonces: new Set(),
    nonceList: [],
  }
}

export function generateNonce() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/**
 * Convenience helper to sign a sample using the incrementing sequence and current wall time.
 */
export function signSample(sample) {
  currentSeq += 1
  const ts = Date.now()
  const nonce = generateNonce()
  return signPacket(sample, currentSeq, ts, nonce)
}

/**
 * Convenience helper to verify with the live verifier state.
 */
export function verifySamplePacket(packet) {
  return verifyPacket(packet, verifierState)
}

// ── One-time benchmark of verifyPacket over 200 packets ────────────────
let benchmarkRan = false
export function runVerifyBenchmarkOnce() {
  if (benchmarkRan) return
  benchmarkRan = true

  const timesUs = []
  const benchState = { lastSeq: 0, seenNonces: new Set(), nonceList: [] }
  const baseTs = Date.now()
  const dummySample = { V: 380.2, I: 25.0, T: 31.0, SoC: 65.0, P: 9.5, speed: 28.0 }

  for (let i = 1; i <= 200; i++) {
    const nonce = `b_nonce_${i}_${Math.random()}`
    const packet = signPacket(dummySample, i, baseTs, nonce)
    const t0 = performance.now()
    verifyPacket(packet, benchState)
    const t1 = performance.now()
    timesUs.push((t1 - t0) * 1000)
  }

  timesUs.sort((a, b) => a - b)
  const sum = timesUs.reduce((acc, v) => acc + v, 0)
  const avg = (sum / timesUs.length).toFixed(2)
  const p95 = timesUs[Math.floor(timesUs.length * 0.95)].toFixed(2)
  console.log(`[AxiomWall Security] verifyPacket benchmark (200 packets): avg = ${avg} µs, p95 = ${p95} µs`)
}

// Automatically run once when module is loaded
try {
  runVerifyBenchmarkOnce()
} catch (e) {
  console.warn('Benchmark initial run skipped:', e)
}
