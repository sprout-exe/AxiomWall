// src/components/BackgroundScene.jsx
// Fixed background scene with F1 photo hero on right 45%, neon blend base,
// fade mask with neon edge line, screen colour wash, and dark readability overlay.

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
      {/* ── 1. Page base: near-black (#05070B) with faint neon blend at corners ── */}
      {/* Cyan glow (top-right) */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
        }}
      />
      {/* Green glow (bottom-right) */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '5%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)',
        }}
      />
      {/* Lavender glow (bottom-left) */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
        }}
      />
      {/* Subtle green glow (top-left) */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)',
        }}
      />

      {/* ── 2. F1 Photo Layer ── */}
      <div className="f1-container">
        {/* Photo with slow drift */}
        <img
          src="/bg/f1.jpg"
          alt=""
          className="f1-photo"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 35%',
            filter: 'brightness(0.7) contrast(1.1) saturate(1.1) blur(0.5px)',
            animation: 'f1Drift 30s ease-in-out infinite alternate',
            willChange: 'transform',
          }}
        />

        {/* Mix-blend-mode screen colour wash (cyan to green) at about 25% over photo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(34,211,238,0.25) 0%, rgba(34,197,94,0.25) 100%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />

        {/* Neon edge: thin green/cyan gradient glow line along the fade */}
        <div
          className="f1-neon-edge"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '2px',
            background: 'linear-gradient(180deg, #22D3EE 0%, #22C55E 100%)',
            boxShadow: '0 0 10px #22D3EE, 0 0 20px #22C55E',
            opacity: 0.75,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── 3. Readability overlay ── */}
      {/* Desktop: dark overlay (#05070B at 75%) over the left and centre so cards stay readable */}
      <div className="f1-readability-overlay" />

      {/* ── 4. Floating slow orbs (4 total) ── */}
      {/* Orb 1 — cyan, upper-right */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 68%)',
          animation: 'orbFloat1 26s ease-in-out infinite',
        }}
      />
      {/* Orb 2 — green, lower-center */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '30%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
          animation: 'orbFloat2 22s ease-in-out infinite reverse',
        }}
      />
      {/* Orb 3 — lavender, mid-left */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '-5%',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)',
          animation: 'orbFloat3 28s ease-in-out infinite',
        }}
      />
      {/* Orb 4 — cyan/green, lower-right */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)',
          animation: 'orbFloat1 32s ease-in-out infinite reverse',
        }}
      />

      {/* Vignette edge darkening */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 110% 90% at 50% 50%, transparent 55%, rgba(5,7,11,0.65) 100%)',
        }}
      />

      {/* ── Responsive styles & keyframes ── */}
      <style>{`
        /* Desktop defaults: right 45%, fade mask, dark overlay on left/center */
        .f1-container {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          width: 45%;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.75) 25%, black 65%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.75) 25%, black 65%);
        }

        .f1-readability-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(5,7,11,0.85) 0%, rgba(5,7,11,0.75) 55%, rgba(5,7,11,0.35) 75%, transparent 100%);
        }

        /* Mobile (below 768px): full width at 35% opacity under 70% dark overlay */
        @media (max-width: 767px) {
          .f1-container {
            width: 100% !important;
            left: 0 !important;
            right: 0 !important;
            opacity: 0.35 !important;
            mask-image: none !important;
            -webkit-mask-image: none !important;
          }
          .f1-neon-edge {
            display: none !important;
          }
          .f1-readability-overlay {
            background: rgba(5, 7, 11, 0.70) !important;
          }
        }

        @keyframes f1Drift {
          0%   { transform: scale(1.04) translate(0px, 0px); }
          50%  { transform: scale(1.06) translate(-5px, 6px); }
          100% { transform: scale(1.08) translate(4px, -5px); }
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(25px, -30px) scale(1.05); }
          66%       { transform: translate(-18px, 16px) scale(0.95); }
        }

        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-28px, 20px) scale(1.06); }
          75%       { transform: translate(16px, -24px) scale(0.94); }
        }

        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, 26px) scale(1.04); }
        }

        @media (prefers-reduced-motion: reduce) {
          .f1-photo, [style*="f1Drift"], [style*="orbFloat"] {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
