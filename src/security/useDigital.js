// src/security/useDigital.js
// Separate Zustand store for Digital Layer 1 verification state.
// Tracks signature validity, sequence, counts, and reason.

import { create } from 'zustand'
import { resetSecurityState } from './signing.js'

const useDigital = create((set) => ({
  valid: true,
  reason: 'ok',
  packetsVerified: 0,
  packetsRejected: 0,
  lastSigShort: '—',
  lastSeq: 0,

  recordVerification({ valid, reason, sig, seq }) {
    set((s) => ({
      valid,
      reason: reason || (valid ? 'ok' : 'bad_signature'),
      packetsVerified: s.packetsVerified + (valid ? 1 : 0),
      packetsRejected: s.packetsRejected + (valid ? 0 : 1),
      lastSigShort: sig ? sig.slice(0, 8) : s.lastSigShort,
      lastSeq: typeof seq === 'number' ? seq : s.lastSeq,
    }))
  },

  reset() {
    resetSecurityState()
    set({
      valid: true,
      reason: 'ok',
      packetsVerified: 0,
      packetsRejected: 0,
      lastSigShort: '—',
      lastSeq: 0,
    })
  },
}))

export default useDigital
