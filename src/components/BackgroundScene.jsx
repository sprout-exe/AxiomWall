// src/components/BackgroundScene.jsx
// Fixed background: F1 photo covers full viewport, brighter, neon screen wash 20%, edge vignette, slow drift.

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
        background: '#05070B',
      }}
    >
      {/* 1. Faint neon corner glows on page base */}
      <div style={{
        position: 'absolute', top: '-12%', right: '-12%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-12%', left: '-12%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '-8%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)',
      }} />

      {/* 2. F1 Photo full viewport, brighter */}
      <img
        src="/bg/f1.jpg"
        alt=""
        className="f1-bg-photo"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'brightness(1.0) contrast(1.1) saturate(1.2) blur(0.5px)',
          animation: 'f1Drift 32s ease-in-out infinite alternate',
          willChange: 'transform',
        }}
      />

      {/* 3. Neon colour wash screen blend ~20% */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(34,211,238,0.20) 0%, rgba(34,197,94,0.20) 100%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* 4. Edge vignette ~35% edges only, light centre */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 48%, rgba(5,7,11,0.50) 78%, rgba(5,7,11,0.80) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 5. Readability gradient: dark left, transparent right */}
      <div className="f1-readability" />

      {/* 6. Floating ambient orbs */}
      <div style={{
        position: 'absolute', top: '18%', right: '12%',
        width: '360px', height: '360px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 68%)',
        animation: 'orbFloat1 28s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '28%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)',
        animation: 'orbFloat2 24s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'absolute', top: '55%', left: '-4%',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)',
        animation: 'orbFloat3 30s ease-in-out infinite',
      }} />

      <style>{`
        @keyframes f1Drift {
          0%   { transform: scale(1.04) translate(0px,  0px); }
          33%  { transform: scale(1.06) translate(-6px, 5px); }
          66%  { transform: scale(1.07) translate( 4px,-4px); }
          100% { transform: scale(1.05) translate( 3px, 6px); }
        }
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(22px,-28px) scale(1.05); }
          66%     { transform: translate(-15px, 14px) scale(0.96); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(-25px, 18px) scale(1.06); }
          75%     { transform: translate( 14px,-20px) scale(0.94); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(18px, 22px) scale(1.04); }
        }
        .f1-readability {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(5,7,11,0.85) 0%,
            rgba(5,7,11,0.72) 50%,
            rgba(5,7,11,0.25) 76%,
            transparent 100%
          );
          pointer-events: none;
        }
        @media (max-width: 767px) {
          .f1-readability { background: rgba(5,7,11,0.65) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .f1-bg-photo { animation: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}