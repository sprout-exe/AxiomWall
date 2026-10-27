// src/demo/bus.js
// Lightweight event bus for triggering attacks from Demo Mode & external benchmarks

class DemoBus {
  constructor() {
    this.listeners = new Map()
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.off(event, callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
    }
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(payload)
        } catch (err) {
          console.error(`[DemoBus] error in listener for ${event}:`, err)
        }
      }
    }
  }
}

export const demoBus = new DemoBus()
