// src/components/BackgroundScene.jsx
// Fixed full-viewport background scene.
// Stack (bottom → top):
//   1. Solid dark base
//   2. hero-ev.jpg — visible, covers viewport, slow floating drift, no heavy blur
//   3. Teal colour-tint overlay (mix-blend-mode: multiply) to kill pink sky warmth
//   4. Readability gradient: dark-navy on left/centre, fades right so car stays visible
//   5. Soft green glow behind car area (right side)
//   6. green.jpg masked decorative bottom-left
//   7. 9 slow floating orbs
//   8. Tiny scattered data dots
//   9. Vignette edge darkening
// All pointer-events:none. Animations off under prefers-reduced-motion.

export default function BackgroundScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── 1. Dark navy base (ensures solid bg if image fails to load) ── */}
      <div style={{ position: 'absolute', inset: 0, background: '#070B12' }} />

      {/* ── 2. hero-ev.jpg — visible hero, slow drift animation ── */}
      <img
        src="/bg/hero-ev.jpg"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'right center',
          opacity: 0.85,
          filter: 'brightness(0.85) saturate(1.0) blur(0.5px)',
          animation: 'heroDrift 30s ease-in-out infinite alternate',
          willChange: 'transform',
        }}
      />

      {/* ── 3. Teal colour tint — kills the pink sky, pushes to teal/navy ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(4, 28, 20, 0.40)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* ── 4a. Readability gradient — desktop: dark left, clear right ── */}
      <div
        className="hide-on-mobile"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(100deg, rgba(7,11,18,0.88) 0%, rgba(7,11,18,0.88) 38%, rgba(7,11,18,0.55) 60%, rgba(7,11,18,0.10) 80%, transparent 100%)',
        }}
      />

      {/* ── 4b. Readability overlay — mobile: uniform 65 % ── */}
      <div
        className="show-on-mobile"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7,11,18,0.65)',
        }}
      />

      {/* ── 5. Soft green glow behind car / right area ── */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '-10%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 50%, transparent 72%)',
          animation: 'orbFloat1 28s ease-in-out infinite',
        }}
      />

      {/* ── 6. green.jpg — masked, bottom-left, fading edges ── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '480px',
          height: '360px',
          backgroundImage: 'url(/bg/green.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.20,
          filter: 'brightness(0.6) blur(1.5px)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 80% at 15% 85%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 45%, transparent 78%)',
          maskImage:
            'radial-gradient(ellipse 70% 80% at 15% 85%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 45%, transparent 78%)',
        }}
      />

      {/* ── 7. Floating orbs ── */}
      {/* Orb 1 — teal, upper-left */}
      <div style={{ position:'absolute', top:'5%', left:'-8%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(20,184,166,0.13) 0%, transparent 70%)', animation:'orbFloat1 22s ease-in-out infinite' }} />
      {/* Orb 2 — lime, upper-centre */}
      <div style={{ position:'absolute', top:'15%', left:'25%', width:'380px', height:'380px', borderRadius:'50%', background:'radial-gradient(circle, rgba(200,240,60,0.07) 0%, transparent 68%)', animation:'orbFloat2 30s ease-in-out infinite' }} />
      {/* Orb 3 — indigo, mid-left */}
      <div style={{ position:'absolute', top:'40%', left:'-5%', width:'340px', height:'340px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)', animation:'orbFloat3 25s ease-in-out infinite' }} />
      {/* Orb 4 — teal, lower-right */}
      <div style={{ position:'absolute', bottom:'10%', right:'5%', width:'420px', height:'420px', borderRadius:'50%', background:'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 68%)', animation:'orbFloat1 35s ease-in-out infinite reverse' }} />
      {/* Orb 5 — green, lower-centre */}
      <div style={{ position:'absolute', bottom:'5%', left:'35%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)', animation:'orbFloat2 20s ease-in-out infinite reverse' }} />
      {/* Orb 6 — lime, top-right */}
      <div style={{ position:'absolute', top:'2%', right:'15%', width:'260px', height:'260px', borderRadius:'50%', background:'radial-gradient(circle, rgba(200,240,60,0.06) 0%, transparent 70%)', animation:'orbFloat3 32s ease-in-out infinite' }} />
      {/* Orb 7 — purple, mid-right */}
      <div style={{ position:'absolute', top:'50%', right:'-5%', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 68%)', animation:'orbFloat1 27s ease-in-out infinite' }} />
      {/* Orb 8 — teal, bottom-left */}
      <div style={{ position:'absolute', bottom:'30%', left:'10%', width:'220px', height:'220px', borderRadius:'50%', background:'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)', animation:'orbFloat2 18s ease-in-out infinite' }} />
      {/* Orb 9 — green/lime, centre */}
      <div style={{ position:'absolute', top:'65%', left:'50%', width:'280px', height:'280px', borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 68%)', animation:'orbFloat3 38s ease-in-out infinite reverse' }} />

      {/* ── 8. Tiny data dots — scattered, slow pulse ── */}
      {DATA_DOTS.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            width: d.size,
            height: d.size,
            borderRadius: '50%',
            background: d.color,
            opacity: d.opacity,
            animation: `dataDot ${d.dur}s ease-in-out infinite alternate`,
            animationDelay: d.delay,
          }}
        />
      ))}

      {/* ── 9. Vignette edge darkening ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'radial-gradient(ellipse 110% 90% at 50% 50%, transparent 50%, rgba(7,11,18,0.55) 100%)',
          ].join(','),
        }}
      />

      {/* ── CSS for mobile overlay toggle + motion ── */}
      <style>{`
        .hide-on-mobile  { display: block; }
        .show-on-mobile  { display: none;  }

        @media (max-width: 767px) {
          .hide-on-mobile { display: none;  }
          .show-on-mobile { display: block; }
        }

        @keyframes heroDrift {
          0%   { transform: scale(1.05) translate(0px, 0px); }
          33%  { transform: scale(1.08) translate(-6px, 4px); }
          66%  { transform: scale(1.06) translate(5px, -3px); }
          100% { transform: scale(1.10) translate(-3px, 5px); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(28px, -36px) scale(1.06); }
          66%       { transform: translate(-18px, 18px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-32px, 22px) scale(1.08); }
          75%       { transform: translate(18px, -26px) scale(0.94); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(22px, 30px) scale(1.05); }
        }
        @keyframes dataDot {
          0%   { opacity: var(--dot-lo); transform: scale(0.8); }
          100% { opacity: var(--dot-hi); transform: scale(1.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          img[src*="hero-ev"],
          [style*="orbFloat"],
          [style*="dataDot"],
          [style*="heroDrift"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Static data dot positions ─────────────────────────────────────────────────
// Intentionally hardcoded so no Math.random() runs on render (no SSR issues).
const DATA_DOTS = [
  { id:0,  x:'12%',  y:'18%',  size:'4px',  color:'#C8F03C', opacity:0.45, dur:3.2, delay:'0s'    },
  { id:1,  x:'28%',  y:'72%',  size:'3px',  color:'#22C55E', opacity:0.35, dur:4.1, delay:'0.8s'  },
  { id:2,  x:'55%',  y:'14%',  size:'5px',  color:'#14B8A6', opacity:0.30, dur:5.0, delay:'1.4s'  },
  { id:3,  x:'71%',  y:'55%',  size:'3px',  color:'#C8F03C', opacity:0.25, dur:3.8, delay:'0.3s'  },
  { id:4,  x:'82%',  y:'28%',  size:'4px',  color:'#22C55E', opacity:0.20, dur:6.2, delay:'2.1s'  },
  { id:5,  x:'9%',   y:'48%',  size:'3px',  color:'#A78BFA', opacity:0.30, dur:4.6, delay:'1.1s'  },
  { id:6,  x:'46%',  y:'82%',  size:'4px',  color:'#14B8A6', opacity:0.28, dur:3.5, delay:'0.6s'  },
  { id:7,  x:'65%',  y:'88%',  size:'3px',  color:'#C8F03C', opacity:0.22, dur:5.5, delay:'1.8s'  },
  { id:8,  x:'38%',  y:'35%',  size:'3px',  color:'#22C55E', opacity:0.18, dur:7.0, delay:'2.5s'  },
  { id:9,  x:'90%',  y:'65%',  size:'4px',  color:'#A78BFA', opacity:0.20, dur:4.3, delay:'0.9s'  },
];
