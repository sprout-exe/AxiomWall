// src/components/LoadingScreen.jsx
// Cyber-garage loader: animated perspective road grid scrolling toward viewer,
// AXIOMWALL racing title, detailed toy EV/F1 car with light cone, spinning wheels,
// speed lines and green spark trail, big glowing percentage, segmented neon progress bar,
// rotating status text, 100% arrival hop + bright flash sweep.

import { useEffect, useState, useRef } from 'react'

const isReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(() => (isReducedMotion() ? 100 : 0))
  const [isArrived, setIsArrived] = useState(false)
  const [flash, setFlash] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)
  const [statusText, setStatusText] = useState(() =>
    isReducedMotion() ? 'Arming rules...' : 'Booting digital twin...'
  )
  const animFrameRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (isReducedMotion()) {
      const timer = setTimeout(() => {
        setFadingOut(true)
        setTimeout(() => {
          onComplete?.()
        }, 300)
      }, 600)
      return () => clearTimeout(timer)
    }

    const DRIVE_DURATION = 2500

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const pct = Math.min(100, Math.round((elapsed / DRIVE_DURATION) * 100))

      setProgress(pct)

      if (pct < 35) {
        setStatusText('Booting digital twin...')
      } else if (pct < 75) {
        setStatusText('Loading physics engine...')
      } else {
        setStatusText('Arming rules...')
      }

      if (elapsed < DRIVE_DURATION) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        setProgress(100)
        setIsArrived(true)
        setFlash(true)
        setTimeout(() => {
          setFadingOut(true)
          setTimeout(() => {
            onComplete?.()
          }, 350)
        }, 400)
      }
    }

    animFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [onComplete])

  const trackRef = useRef(null)
  const [trackWidth, setTrackWidth] = useState(360)

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

  const CAR_OFFSET = 64
  const carTranslateX = (progress / 100) * Math.max(0, trackWidth - CAR_OFFSET)

  const NUM_SEGMENTS = 16
  const filledSegments = Math.round((progress / 100) * NUM_SEGMENTS)

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
        background: '#04060A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 350ms ease-out',
        pointerEvents: fadingOut ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      {/* ── Perspective Road Grid ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '-20%',
          right: '-20%',
          height: '50%',
          perspective: '350px',
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      >
        <div
          className="cyber-grid"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateX(62deg)',
            transformOrigin: 'bottom center',
            backgroundSize: '40px 40px',
            backgroundImage: `
              linear-gradient(to right, rgba(34, 211, 238, 0.22) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(118, 255, 3, 0.22) 1px, transparent 1px)
            `,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, #04060A 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Cyber garage neon glows */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-15%',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.12) 0%, rgba(118,255,3,0.08) 50%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Flash Sweep Overlay on 100% */}
      {flash && (
        <div
          aria-hidden="true"
          className="flash-sweep"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}

      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Title */}
        <h1
          style={{
            fontFamily: "'Russo One', 'Teko', sans-serif",
            fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            margin: '0 0 0.25rem',
            transform: 'skewX(-8deg)',
            textAlign: 'center',
            textShadow:
              '0 0 14px rgba(255,255,255,0.9), 0 0 28px rgba(118,255,3,0.6), 0 0 45px rgba(34,197,94,0.4)',
          }}
        >
          <span>AXIOM</span>
          <span style={{ color: '#76FF03' }}>WALL</span>
        </h1>
        <p
          style={{
            margin: '0 0 1.75rem',
            fontSize: '0.85rem',
            color: '#9CA3AF',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          Physics checks what passwords can't.
        </p>

        {/* Big percentage number */}
        <div
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 'clamp(3.8rem, 9vw, 5.5rem)',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1,
            marginBottom: '1.75rem',
            textAlign: 'center',
            textShadow:
              '0 0 18px rgba(255,255,255,0.8), 0 0 35px rgba(118,255,3,0.5)',
          }}
        >
          {progress}%
        </div>

        {/* Track & Car Container */}
        <div
          ref={trackRef}
          style={{
            width: '100%',
            maxWidth: '380px',
            minWidth: '260px',
            position: 'relative',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ height: '38px', position: 'relative', width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                transform: `translateX(${carTranslateX}px)`,
                willChange: 'transform',
              }}
            >
              <div className={isArrived ? 'car-hop' : 'car-bounce'}>
                <svg width="86" height="34" viewBox="0 0 86 34" fill="none">
                  <defs>
                    <linearGradient id="lightCone" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#76FF03" stopOpacity="0.85" />
                      <stop offset="25%" stopColor="#22D3EE" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                    </linearGradient>

                    <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="50%" stopColor="#22D3EE" />
                      <stop offset="100%" stopColor="#76FF03" />
                    </linearGradient>

                    <linearGradient id="bodyGlint" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {!isArrived && (
                    <g className="speed-lines">
                      <line x1="12" y1="6" x2="3" y2="6" stroke="#22D3EE" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                      <line x1="8" y1="12" x2="0" y2="12" stroke="#76FF03" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                      <line x1="14" y1="28" x2="5" y2="28" stroke="#22D3EE" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                    </g>
                  )}

                  {!isArrived && (
                    <g className="leaf-trail">
                      <circle cx="10" cy="18" r="2.2" fill="#76FF03" className="spark-dot-1" />
                      <circle cx="5" cy="14" r="1.8" fill="#22C55E" className="spark-dot-2" />
                      <circle cx="2" cy="20" r="1.5" fill="#22D3EE" className="spark-dot-3" />
                    </g>
                  )}

                  <polygon points="56,18 86,9 86,27" fill="url(#lightCone)" />

                  <rect x="14" y="9" width="3" height="7" rx="1" fill="#0F172A" stroke="#22D3EE" strokeWidth="0.8" />
                  <rect x="11" y="8" width="7" height="2" rx="0.8" fill="#22D3EE" />

                  <path
                    d="M 17,23 C 15,23 15,16 17,14 C 19,12 22,11 25,11 C 28,6 32,4 39,4 C 45,4 49,6 51,12 L 55,13 C 58,15 59,18 58,22 C 57,23 55,23 53,23 C 52,19 44,19 43,23 L 31,23 C 30,19 22,19 21,23 Z"
                    fill="url(#carBodyGrad)"
                    filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))"
                  />

                  <path
                    d="M 33 6 C 36 5.2 41 5.2 44 6 C 41 7 36 7 33 6 Z"
                    fill="url(#bodyGlint)"
                  />

                  <path
                    d="M 29,11 C 31,7.5 35,6.5 39,6.5 C 43,6.5 46,7.5 48,11 L 48,12 L 29,12 Z"
                    fill="#080E1A"
                    opacity="0.9"
                  />
                  <path d="M 33 7.5 L 36 7.5 L 34 11 L 31 11 Z" fill="#FFFFFF" opacity="0.6" />

                  <circle
                    cx="56"
                    cy="18"
                    r="2.4"
                    fill="#76FF03"
                    style={{ filter: 'drop-shadow(0 0 5px #76FF03)' }}
                  />

                  <g className={isArrived ? '' : 'wheel-spin'} style={{ transformOrigin: '26px 23px' }}>
                    <circle cx="26" cy="23" r="6" fill="#080C14" stroke="#76FF03" strokeWidth="1.2" />
                    <circle cx="26" cy="23" r="3.5" fill="#1E293B" />
                    <line x1="22.5" y1="23" x2="29.5" y2="23" stroke="#22D3EE" strokeWidth="1.2" />
                    <line x1="26" y1="19.5" x2="26" y2="26.5" stroke="#22D3EE" strokeWidth="1.2" />
                    <circle cx="26" cy="23" r="1.3" fill="#FFFFFF" />
                  </g>

                  <g className={isArrived ? '' : 'wheel-spin'} style={{ transformOrigin: '48px 23px' }}>
                    <circle cx="48" cy="23" r="6" fill="#080C14" stroke="#76FF03" strokeWidth="1.2" />
                    <circle cx="48" cy="23" r="3.5" fill="#1E293B" />
                    <line x1="44.5" y1="23" x2="51.5" y2="23" stroke="#22D3EE" strokeWidth="1.2" />
                    <line x1="48" y1="19.5" x2="48" y2="26.5" stroke="#22D3EE" strokeWidth="1.2" />
                    <circle cx="48" cy="23" r="1.3" fill="#FFFFFF" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Road */}
          <div
            style={{
              height: '2px',
              width: '100%',
              background:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 10px, transparent 10px, transparent 20px)',
              marginBottom: '8px',
            }}
          />

          {/* Segmented Neon Progress Bar */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              width: '100%',
              padding: '2px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {Array.from({ length: NUM_SEGMENTS }, (_, i) => {
              const active = i < filledSegments
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '5px',
                    borderRadius: '2px',
                    background: active
                      ? 'linear-gradient(90deg, #22D3EE, #76FF03)'
                      : 'rgba(255,255,255,0.06)',
                    boxShadow: active
                      ? '0 0 6px rgba(34,211,238,0.7), 0 0 10px rgba(118,255,3,0.5)'
                      : 'none',
                    transition: 'background 80ms ease, box-shadow 80ms ease',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Status text */}
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.82rem',
            color: '#9CA3AF',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.04em',
            minHeight: '1.2rem',
          }}
        >
          {statusText}
        </p>
      </div>

      <style>{`
        .cyber-grid { animation: gridScroll 1.2s linear infinite; }
        @keyframes gridScroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        .car-bounce {
          animation: carBounce 0.32s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes carBounce {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-2px); }
        }
        .car-hop {
          animation: carArrivalHop 0.38s ease-out forwards;
          will-change: transform;
        }
        @keyframes carArrivalHop {
          0%   { transform: translateY(0px) scale(1, 1); }
          30%  { transform: translateY(-7px) scale(0.95, 1.1); }
          65%  { transform: translateY(0px) scale(1.05, 0.95); }
          85%  { transform: translateY(-2px) scale(0.98, 1.02); }
          100% { transform: translateY(0px) scale(1, 1); }
        }
        .flash-sweep {
          animation: flashAcross 0.4s ease-out forwards;
        }
        @keyframes flashAcross {
          0%   { transform: translateX(-100%); opacity: 0; }
          40%  { opacity: 0.9; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .wheel-spin {
          animation: wheelSpin 0.22s linear infinite;
          will-change: transform;
        }
        @keyframes wheelSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .speed-lines { animation: speedFlicker 0.25s steps(2) infinite; }
        @keyframes speedFlicker {
          0%, 100% { opacity: 0.8; }
          50%      { opacity: 0.3; }
        }
        .spark-dot-1 { animation: sparkDot1 0.5s ease-out infinite; }
        .spark-dot-2 { animation: sparkDot2 0.6s ease-out infinite 0.15s; }
        .spark-dot-3 { animation: sparkDot3 0.55s ease-out infinite 0.3s; }
        @keyframes sparkDot1 {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.9; }
          100% { transform: translate(-10px, -2px) scale(0.2); opacity: 0; }
        }
        @keyframes sparkDot2 {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.8; }
          100% { transform: translate(-12px, 3px) scale(0.2); opacity: 0; }
        }
        @keyframes sparkDot3 {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.75; }
          100% { transform: translate(-8px, -3px) scale(0.2); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cyber-grid, .car-bounce, .car-hop, .wheel-spin, .flash-sweep, .speed-lines, [class*="spark-dot"] {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}