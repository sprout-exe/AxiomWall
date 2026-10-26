// src/components/LoadingScreen.jsx
// Presentational full-screen loader shown once per page load.
// Features: AXIOMWALL title, moving toy EV with glowing headlight on dashed track,
// counting percentage number in Russo One, thin neon progress bar, and dynamic status messages.
// Runs ~2.5s then fades out in 300ms. Runs completely independently of simulator engine.

import { useEffect, useState, useRef } from 'react'

const isReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(() => (isReducedMotion() ? 100 : 0))
  const [fadingOut, setFadingOut] = useState(false)
  const [statusText, setStatusText] = useState(() =>
    isReducedMotion() ? 'Arming rules...' : 'Booting digital twin...'
  )
  const animFrameRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (isReducedMotion()) {
      // Reduced motion: skip animation, show loader for 600 ms with number only
      const timer = setTimeout(() => {
        setFadingOut(true)
        setTimeout(() => {
          onComplete?.()
        }, 300)
      }, 600)
      return () => clearTimeout(timer)
    }

    // Normal motion: 2.5 second animation using requestAnimationFrame
    const DURATION = 2500

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const pct = Math.min(100, Math.round((elapsed / DURATION) * 100))

      setProgress(pct)

      if (pct < 30) {
        setStatusText('Booting digital twin...')
      } else if (pct < 70) {
        setStatusText('Loading physics engine...')
      } else {
        setStatusText('Arming rules...')
      }

      if (elapsed < DURATION) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        // Complete! Fade out 300ms then unmount
        setProgress(100)
        setFadingOut(true)
        setTimeout(() => {
          onComplete?.()
        }, 300)
      }
    }

    animFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [onComplete])

  const trackRef = useRef(null)
  const [trackWidth, setTrackWidth] = useState(300)

  useEffect(() => {
    const updateWidth = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const CAR_WIDTH = 36
  const carTranslateX = (progress / 100) * Math.max(0, trackWidth - CAR_WIDTH)

  return (
    <div
      aria-label="Loading AxiomWall"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#05070B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 300ms ease-out',
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      {/* Background ambient neon glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, rgba(34,197,94,0.05) 45%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Title in Russo One with neon glow ── */}
      <h1
        style={{
          fontFamily: "'Russo One', 'Teko', sans-serif",
          fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          margin: '0 0 0.25rem',
          transform: 'skewX(-8deg)',
          textAlign: 'center',
          textShadow:
            '0 0 12px rgba(255,255,255,0.85), 0 0 24px rgba(34,211,238,0.5), 0 0 40px rgba(34,197,94,0.35)',
        }}
      >
        AXIOMWALL
      </h1>
      <p style={{ margin: '0 0 2.5rem', fontSize: '0.82rem', color: '#9CA3AF', textAlign: 'center' }}>
        Physics checks what passwords can't.
      </p>

      {/* ── Big percentage number in Russo One ── */}
      <div
        style={{
          fontFamily: "'Russo One', 'Teko', sans-serif",
          fontSize: 'clamp(3.5rem, 9vw, 5rem)',
          fontWeight: 400,
          color: '#FFFFFF',
          lineHeight: 1,
          marginBottom: '2rem',
          textAlign: 'center',
          textShadow:
            '0 0 16px rgba(255,255,255,0.75), 0 0 32px rgba(34,211,238,0.45)',
        }}
      >
        {progress}%
      </div>

      {/* ── Horizontal Track & Toy EV Car ── */}
      <div
        ref={trackRef}
        style={{
          width: '100%',
          maxWidth: '320px',
          minWidth: '240px',
          position: 'relative',
          marginBottom: '1rem',
        }}
      >
        {/* Car travel area */}
        <div style={{ height: '24px', position: 'relative', width: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translateX(${carTranslateX}px)`,
              willChange: 'transform',
            }}
          >
            {/* Inline SVG Toy EV */}
            <svg width={CAR_WIDTH + 18} height={22} viewBox="0 0 54 22" fill="none">
              <defs>
                <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#22D3EE" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="60%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
              </defs>

              {/* Glowing green headlight projection beam */}
              <polygon points="34,11 53,5 53,17" fill="url(#headlightBeam)" />

              {/* Car body */}
              <path
                d="M 4 14 C 4 9 8 5.5 13 5.5 L 20 5.5 C 24 5.5 28 8 32 11 C 34.5 12 34.5 14 33 14 L 4 14 Z"
                fill="url(#carBodyGrad)"
              />

              {/* Windshield / cabin glass */}
              <path
                d="M 12 7 L 18 7 C 22 7 25 8.5 27.5 11 L 11 11 Z"
                fill="#05070B"
                opacity="0.85"
              />

              {/* Headlight bulb with glow */}
              <circle
                cx="33"
                cy="11.5"
                r="1.8"
                fill="#C8F03C"
                style={{ filter: 'drop-shadow(0 0 3px #C8F03C)' }}
              />

              {/* Wheels */}
              <circle cx="10" cy="14" r="3.2" fill="#0B0F17" stroke="#22C55E" strokeWidth="1.2" />
              <circle cx="10" cy="14" r="1.2" fill="#22D3EE" />
              <circle cx="27" cy="14" r="3.2" fill="#0B0F17" stroke="#22C55E" strokeWidth="1.2" />
              <circle cx="27" cy="14" r="1.2" fill="#22D3EE" />
            </svg>
          </div>
        </div>

        {/* Dashed road marks */}
        <div
          style={{
            height: '2px',
            width: '100%',
            background:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.45) 0px, rgba(255,255,255,0.45) 8px, transparent 8px, transparent 18px)',
            marginBottom: '6px',
          }}
        />

        {/* Thin neon progress bar beneath */}
        <div
          style={{
            height: '3px',
            width: '100%',
            borderRadius: '2px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #22D3EE 0%, #22C55E 100%)',
              boxShadow: '0 0 10px #22D3EE, 0 0 16px #22C55E',
              transition: 'width 60ms linear',
            }}
          />
        </div>
      </div>

      {/* ── Status text that updates at 30% and 70% ── */}
      <p
        style={{
          marginTop: '0.75rem',
          fontSize: '0.8rem',
          color: '#6B7280',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.04em',
          minHeight: '1.2rem',
        }}
      >
        {statusText}
      </p>
    </div>
  )
}
