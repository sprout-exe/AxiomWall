// src/demo/useDemo.js
// Demo mode controller hook.
// Runs the 90s story script, manages step transitions, tracks measured stats,
// and guarantees StrictMode timer safety and complete state restoration on teardown.

import { useState, useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore.js'
import { demoBus } from './bus.js'
import { DEMO_STEPS, TOTAL_DEMO_SECONDS } from './script.js'

export function useDemo() {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [runStats, setRunStats] = useState([])

  const prevModeRef = useRef('drive')
  const prevRunningRef = useRef(false)
  const timerRef = useRef(null)
  const currentStepRef = useRef(null)
  const attackStatsRef = useRef({})
  const attackStartTimeRef = useRef(null)

  const restoreState = useCallback(() => {
    demoBus.emit('STOP_ATTACK')
    demoBus.emit('DEMO_ACTIVE', false)
    const store = useStore.getState()
    if (prevModeRef.current) {
      store.setMode(prevModeRef.current)
    }
    if (!prevRunningRef.current) {
      store.stop()
    }
  }, [])

  const stopDemo = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    restoreState()
    setIsRunning(false)
    setIsPaused(false)
    setElapsedSec(0)
    setCurrentStepIndex(0)
  }, [restoreState])

  const executeStep = useCallback((step) => {
    currentStepRef.current = step
    const store = useStore.getState()

    // 1. If reset requested between scenarios to clear risk hysteresis
    if (step.resetBefore) {
      demoBus.emit('STOP_ATTACK')
      store.reset()
      store.start()
    }

    // 2. Set mode
    if (step.mode) {
      store.setMode(step.mode)
    }

    // 3. Trigger or stop attack
    if (step.attack) {
      demoBus.emit('START_ATTACK', step.attack)
      attackStartTimeRef.current = Date.now()
      if (!attackStatsRef.current[step.attack]) {
        attackStatsRef.current[step.attack] = {
          attackId: step.attack,
          firstDetectLatency: null,
          peakResponse: 'ALLOW',
          node: 'none',
        }
      }
    } else {
      demoBus.emit('STOP_ATTACK')
      attackStartTimeRef.current = null
    }

    // 4. Show summary overlay if final step
    if (step.showSummary) {
      const statsList = Object.values(attackStatsRef.current).map((s) => ({
        ...s,
        latencyDisplay: s.firstDetectLatency !== null ? `${s.firstDetectLatency.toFixed(1)}s` : '—',
      }))
      setRunStats(statsList)
      setShowSummary(true)
    }
  }, [])

  const startDemo = useCallback(() => {
    // Capture state to restore later
    const store = useStore.getState()
    prevModeRef.current = store.mode || 'drive'
    prevRunningRef.current = store.running

    // Reset stats
    attackStatsRef.current = {}
    attackStartTimeRef.current = null
    setRunStats([])
    setShowSummary(false)
    setElapsedSec(0)
    setCurrentStepIndex(0)
    setIsPaused(false)
    setIsRunning(true)

    demoBus.emit('DEMO_ACTIVE', true)

    // Scroll hero truth split into view at start only
    try {
      const el = document.getElementById('hero-truth-split')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } catch (e) {
      // ignore
    }

    // Execute step 0
    executeStep(DEMO_STEPS[0])
  }, [executeStep])

  const pauseDemo = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resumeDemo = useCallback(() => {
    setIsPaused(false)
  }, [])

  const skipStep = useCallback(() => {
    const curIdx = currentStepIndex
    if (curIdx < DEMO_STEPS.length - 1) {
      const nextStep = DEMO_STEPS[curIdx + 1]
      setElapsedSec(nextStep.startSec)
      setCurrentStepIndex(curIdx + 1)
      executeStep(nextStep)
    } else {
      stopDemo()
    }
  }, [currentStepIndex, executeStep, stopDemo])

  // 1 Hz timer when running and not paused
  useEffect(() => {
    if (!isRunning || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1
        if (next >= TOTAL_DEMO_SECONDS) {
          stopDemo()
          return 0
        }

        // Find matching step
        const stepIdx = DEMO_STEPS.findIndex(
          (s) => next >= s.startSec && next < s.endSec
        )
        if (stepIdx !== -1 && stepIdx !== currentStepRef.current?.stepIndex - 1) {
          const step = DEMO_STEPS[stepIdx]
          setCurrentStepIndex(stepIdx)
          executeStep(step)
        }

        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning, isPaused, executeStep, stopDemo])

  // Monitor live store result to record attack stats during demo
  useEffect(() => {
    if (!isRunning) return

    const unsub = useStore.subscribe((state) => {
      const activeAttack = currentStepRef.current?.attack
      if (!activeAttack || !attackStatsRef.current[activeAttack]) return

      const res = state.result
      if (!res) return

      const stat = attackStatsRef.current[activeAttack]
      if (['WARN', 'THROTTLE', 'BLOCK'].includes(res.response)) {
        if (stat.firstDetectLatency === null && attackStartTimeRef.current) {
          stat.firstDetectLatency = Math.max(0.1, (Date.now() - attackStartTimeRef.current) / 1000)
        }
        if (res.response === 'BLOCK') stat.peakResponse = 'BLOCK'
        else if (res.response === 'THROTTLE' && stat.peakResponse !== 'BLOCK') stat.peakResponse = 'THROTTLE'
        else if (res.response === 'WARN' && stat.peakResponse === 'ALLOW') stat.peakResponse = 'WARN'
      }

      if (res.localization?.node && res.localization.node !== 'none' && res.localization.node !== 'SYSTEM') {
        stat.node = res.localization.node
      }
    })

    return () => unsub()
  }, [isRunning])

  // Global hotkeys: Space to pause/resume, Esc to exit
  useEffect(() => {
    if (!isRunning) return

    function handleKeyDown(e) {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsPaused((p) => !p)
      } else if (e.code === 'Escape') {
        e.preventDefault()
        stopDemo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, stopDemo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      restoreState()
    }
  }, [restoreState])

  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0]
  const progressRatio = Math.min(1, elapsedSec / TOTAL_DEMO_SECONDS)

  return {
    isRunning,
    isPaused,
    elapsedSec,
    totalSec: TOTAL_DEMO_SECONDS,
    progressRatio,
    currentStep,
    stepIndex: currentStepIndex + 1,
    totalSteps: DEMO_STEPS.length,
    showSummary,
    runStats,
    startDemo,
    stopDemo,
    pauseDemo,
    resumeDemo,
    skipStep,
    closeSummary: () => setShowSummary(false),
  }
}
