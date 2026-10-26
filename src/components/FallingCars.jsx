// src/components/FallingCars.jsx
// Spawns 10 mini top-down F1 cars every 5s falling down the screen with glowing trails.
// Pointer-events none, transform-only animation, max 10 in DOM, respects document.hidden & prefers-reduced-motion.

import { useEffect, useState, useRef } from 'react'

const LIVERY_COLORS = ['#EF4444', '#22D3EE', '#C8F03C', '#F97316', '#A78BFA']

function MiniF1Car({ color, trailColor }) {
  return (
    <div style={{ position: 'relative', width: '20px', height: '36px' }}>
      {/* Glowing neon trail behind rear wing */}
      <div
        style={{
          position: 'absolute',
          top: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '6px',
          height: '26px',
          background: `linear-gradient(to top, ${trailColor || color} 0%, transparent 100%)`,
          filter: `drop-shadow(0 0 6px ${trailColor || color})`,
          opacity: 0.85,
          borderRadius: '3px',
        }}
      />
      {/* Sleek top-down F1 car SVG */}
      <svg
        width="20"
        height="36"
        viewBox="0 0 20 36"
        fill="none"
        style={{ filter: `drop-shadow(0 2px 5px rgba(0,0,0,0.6))` }}
      >
        {/* Front wing */}
        <rect x="2" y="32" width="16" height="3" rx="1.5" fill={color} />
        {/* Nose cone & chassis body */}
        <path
          d="M8 32 L8 22 Q7 16 6 12 Q6 8 8 5 L10 2 L12 5 Q14 8 14 12 Q13 16 12 22 L12 32 Z"
          fill={color}
        />
        {/* Halo & Cockpit */}
        <ellipse cx="10" cy="18" rx="2.5" ry="4" fill="#0B0F17" />
        <circle cx="10" cy="16" r="1.5" fill="#FFFFFF" opacity="0.9" />
        {/* Sidepods */}
        <path d="M4 16 C4 13 6 12 6 12 L6 24 C5 24 4 21 4 16 Z" fill={color} opacity="0.9" />
        <path d="M16 16 C16 13 14 12 14 12 L14 24 C15 24 16 21 16 16 Z" fill={color} opacity="0.9" />
        {/* Front Wheels (Suspension links + tires) */}
        <line x1="2" y1="28" x2="8" y2="28" stroke="#374151" strokeWidth="1" />
        <line x1="12" y1="28" x2="18" y2="28" stroke="#374151" strokeWidth="1" />
        <rect x="0" y="25" width="4" height="7" rx="1.5" fill="#111827" stroke="#374151" strokeWidth="0.5" />
        <rect x="16" y="25" width="4" height="7" rx="1.5" fill="#111827" stroke="#374151" strokeWidth="0.5" />
        {/* Rear Wheels */}
        <line x1="2" y1="9" x2="7" y2="9" stroke="#374151" strokeWidth="1" />
        <line x1="13" y1="9" x2="18" y2="9" stroke="#374151" strokeWidth="1" />
        <rect x="0" y="5" width="4.5" height="8" rx="1.5" fill="#111827" stroke="#374151" strokeWidth="0.5" />
        <rect x="15.5" y="5" width="4.5" height="8" rx="1.5" fill="#111827" stroke="#374151" strokeWidth="0.5" />
        {/* Rear wing */}
        <rect x="1" y="2" width="18" height="3" rx="1" fill="#1F2937" stroke={color} strokeWidth="0.8" />
      </svg>
    </div>
  )
}

export default function FallingCars() {
  const [cars, setCars] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    // Check reduced motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const spawnBatch = () => {
      if (document.hidden) return

      const now = Date.now()
      const newCars = Array.from({ length: 10 }, (_, i) => {
        const color = LIVERY_COLORS[Math.floor(Math.random() * LIVERY_COLORS.length)]
        const duration = 3 + Math.random() * 2 // 3 to 5s
        const delay = Math.random() * 1.5 // 0 to 1.5s
        const left = 3 + Math.random() * 94 // 3% to 97% across screen
        const scale = 0.8 + Math.random() * 0.35 // 24px - 36px feel
        const wobbleSign = Math.random() > 0.5 ? 1 : -1
        return {
          id: `${now}-${i}`,
          color,
          duration,
          delay,
          left,
          scale,
          wobbleSign,
        }
      })

      // Replace batch (ensures max 10 in DOM)
      setCars(newCars)
    }

    // Initial spawn after 1 second
    const initialTimer = setTimeout(spawnBatch, 1000)
    // Recurring spawn every 5 seconds
    timerRef.current = setInterval(spawnBatch, 5000)

    const handleVisibility = () => {
      if (document.hidden) {
        setCars([])
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  if (cars.length === 0) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0, // above BackgroundScene (zIndex: 0, positioned right after it before content container with zIndex: 1)
        overflow: 'hidden',
      }}
    >
      {cars.map((car) => (
        <div
          key={car.id}
          className="falling-f1-car"
          style={{
            position: 'absolute',
            top: '-60px',
            left: `${car.left}%`,
            animation: `fallAndWobble ${car.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${car.delay}s forwards`,
            willChange: 'transform',
            transform: `scale(${car.scale})`,
          }}
        >
          <MiniF1Car color={car.color} />
        </div>
      ))}

      <style>{`
        @keyframes fallAndWobble {
          0% {
            transform: translateY(0px) rotate(180deg) scale(var(--car-scale, 1));
            opacity: 0;
          }
          5% {
            opacity: 0.95;
          }
          25% {
            transform: translateY(28vh) rotate(184deg);
          }
          50% {
            transform: translateY(58vh) rotate(176deg);
          }
          75% {
            transform: translateY(88vh) rotate(183deg);
          }
          95% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(115vh) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}