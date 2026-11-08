import React, { useEffect, useRef } from 'react';

export type HolographicTheme = 
  | 'cyber-matrix'
  | 'holographic-aurora'
  | 'digital-circuit'
  | 'hex-nexus'
  | 'quantum-orbs'
  | 'laser-grid';

export interface HolographicBackgroundProps {
  theme: HolographicTheme;
  opacity?: number; // 0.1 to 1.0
  speed?: number; // 0.5 to 2.0
  activityReactive?: boolean;
}

export const HOLOGRAPHIC_THEMES: { id: HolographicTheme; name: string; desc: string; previewColor: string }[] = [
  { id: 'cyber-matrix', name: 'Cyber Matrix Grid', desc: '3D perspective wireframe with holographic neon scan waves', previewColor: 'from-cyan-500 to-blue-600' },
  { id: 'holographic-aurora', name: 'Cosmic Holographic Aurora', desc: 'Flowing ethereal aurora waves in cyan, magenta and deep indigo', previewColor: 'from-purple-500 to-cyan-400' },
  { id: 'digital-circuit', name: 'Circuit Board Energy', desc: 'Digital tech nodes with glowing electric pulses moving along traces', previewColor: 'from-emerald-400 to-cyan-500' },
  { id: 'hex-nexus', name: 'Hexagon Quantum Nexus', desc: 'Floating tech honeycomb grid with undulating energy pulses', previewColor: 'from-blue-500 to-teal-400' },
  { id: 'quantum-orbs', name: 'Quantum Dust & Floating Orbs', desc: 'Luminous holographic particles and stardust drifting smoothly', previewColor: 'from-indigo-400 to-pink-500' },
  { id: 'laser-grid', name: 'Studio Holographic Lasers', desc: 'Horizontal scanning laser beams and ambient studio flares', previewColor: 'from-red-500 to-cyan-400' },
];

export const HolographicBackground: React.FC<HolographicBackgroundProps> = React.memo(({
  theme = 'cyber-matrix',
  opacity = 0.55,
  speed = 1.0,
  activityReactive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live refs to prevent rebuilding canvas loop and particle arrays on prop updates
  const themeRef = useRef(theme);
  const opacityRef = useRef(opacity);
  const speedRef = useRef(speed);
  const activityReactiveRef = useRef(activityReactive);

  themeRef.current = theme;
  opacityRef.current = opacity;
  speedRef.current = speed;
  activityReactiveRef.current = activityReactive;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let isPaused = false;
    let lastFrameTime = 0;
    const TARGET_FPS = 25; // 25 FPS throttle keeps main thread completely unblocked
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    // Use 0.75 internal resolution for smooth ambient rendering with half the pixel calculations
    const RESOLUTION_SCALE = 0.75;
    let width = (canvas.width = Math.max(320, Math.round(window.innerWidth * RESOLUTION_SCALE)));
    let height = (canvas.height = Math.max(240, Math.round(window.innerHeight * RESOLUTION_SCALE)));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = Math.max(320, Math.round(window.innerWidth * RESOLUTION_SCALE));
      height = canvas.height = Math.max(240, Math.round(window.innerHeight * RESOLUTION_SCALE));
    };

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused) {
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Internal activity booster: modifies local canvas opacity without ANY React re-render
    let localActivityBoost = 0;
    let activityTimer: ReturnType<typeof setTimeout> | null = null;
    const handleUserActivity = () => {
      if (!activityReactiveRef.current) return;
      localActivityBoost = 0.12;
      if (activityTimer) clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        localActivityBoost = 0;
      }, 5000);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });

    // Lightweight particle pool (32 particles instead of 65)
    const particleCount = 32;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      color: Math.random() > 0.5 ? '#06b6d4' : Math.random() > 0.5 ? '#818cf8' : '#ec4899',
    }));

    // Circuit nodes pool (16 nodes instead of 28)
    const circuitNodes = Array.from({ length: 16 }, () => ({
      x: Math.floor(Math.random() * Math.max(1, width / 90)) * 90,
      y: Math.floor(Math.random() * Math.max(1, height / 90)) * 90,
      pulse: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = (now: number) => {
      if (isPaused) return;

      const elapsed = now - lastFrameTime;
      if (elapsed < FRAME_INTERVAL) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now - (elapsed % FRAME_INTERVAL);

      const currentSpeed = speedRef.current;
      const currentTheme = themeRef.current;
      const baseOpacity = opacityRef.current;
      const currentOpacity = Math.min(1.0, Math.max(0.1, baseOpacity + localActivityBoost));

      time += 0.015 * currentSpeed;

      // Dark base background fill
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = currentOpacity;

      if (currentTheme === 'cyber-matrix') {
        // --- 1. CYBER MATRIX GRID ---
        const horizon = height * 0.45;
        const gridLines = 14;

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.lineWidth = 1;

        for (let i = -gridLines; i <= gridLines; i++) {
          const x = width / 2 + (i * width) / gridLines;
          ctx.beginPath();
          ctx.moveTo(width / 2, horizon);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Horizontal moving grid lines
        const offset = (time * 30) % 50;
        for (let y = horizon; y < height; y += (y - horizon + 15) * 0.22) {
          const py = y + offset * ((y - horizon) / (height - horizon));
          if (py <= height && py >= horizon) {
            const lineAlpha = Math.min(0.3, ((py - horizon) / (height - horizon)) * 0.35);
            ctx.strokeStyle = `rgba(34, 211, 238, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(width, py);
            ctx.stroke();
          }
        }

        // Lightweight holographic scan wave
        const waveY = (Math.sin(time * 0.7) * 0.5 + 0.5) * height;
        const waveGrad = ctx.createLinearGradient(0, waveY - 60, 0, waveY + 60);
        waveGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        waveGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
        waveGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = waveGrad;
        ctx.fillRect(0, waveY - 60, width, 120);

      } else if (currentTheme === 'holographic-aurora') {
        // --- 2. HOLOGRAPHIC AURORA ---
        const waves = 2;
        for (let w = 0; w < waves; w++) {
          ctx.beginPath();
          ctx.moveTo(0, height);

          const grad = ctx.createLinearGradient(0, 0, width, height);
          if (w === 0) {
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
            grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.18)');
            grad.addColorStop(1, 'rgba(236, 72, 153, 0.12)');
          } else {
            grad.addColorStop(0, 'rgba(168, 85, 247, 0.14)');
            grad.addColorStop(0.5, 'rgba(45, 212, 191, 0.16)');
            grad.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
          }

          ctx.fillStyle = grad;

          for (let x = 0; x <= width; x += 50) {
            const y =
              height * 0.38 +
              Math.sin(x * 0.003 + time * (0.8 + w * 0.3) + w) * 100 +
              Math.cos(x * 0.0015 - time * 0.5) * 60;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        }

      } else if (currentTheme === 'digital-circuit') {
        // --- 3. DIGITAL CIRCUIT FLOW ---
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += 90) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 90) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        circuitNodes.forEach((node, i) => {
          node.pulse += 0.04 * currentSpeed;
          const r = Math.sin(node.pulse) * 2 + 3.5;
          const nodeAlpha = Math.sin(node.pulse) * 0.3 + 0.4;

          ctx.fillStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${nodeAlpha})` : `rgba(16, 185, 129, ${nodeAlpha})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          const next = circuitNodes[(i + 1) % circuitNodes.length];
          ctx.strokeStyle = `rgba(34, 211, 238, ${nodeAlpha * 0.2})`;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(next.x, node.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        });

      } else if (currentTheme === 'hex-nexus') {
        // --- 4. HEXAGON QUANTUM NEXUS ---
        const hexRadius = 60;
        const hexHeight = Math.sqrt(3) * hexRadius;
        const side = (3 / 2) * hexRadius;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.lineWidth = 1;

        for (let row = 0; row < height / hexHeight + 1; row++) {
          for (let col = 0; col < width / side + 1; col++) {
            const cx = col * side;
            const cy = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);

            const dist = Math.hypot(cx - width / 2, cy - height / 2);
            const hexPulse = Math.sin(dist * 0.005 - time * 1.5);

            if (hexPulse > 0.5) {
              ctx.strokeStyle = `rgba(34, 211, 238, ${(hexPulse - 0.5) * 0.4})`;
            } else {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
            }

            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
              const angle = (Math.PI / 3) * a;
              const x = cx + hexRadius * Math.cos(angle);
              const y = cy + hexRadius * Math.sin(angle);
              if (a === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }

      } else if (currentTheme === 'quantum-orbs') {
        // --- 5. QUANTUM DUST & FLOATING ORBS ---
        const orb1X = width * 0.25 + Math.sin(time * 0.4) * 100;
        const orb1Y = height * 0.35 + Math.cos(time * 0.3) * 70;
        const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 260);
        grad1.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        grad1.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = grad1;
        ctx.beginPath();
        ctx.arc(orb1X, orb1Y, 260, 0, Math.PI * 2);
        ctx.fill();

        const orb2X = width * 0.75 + Math.cos(time * 0.5) * 120;
        const orb2Y = height * 0.65 + Math.sin(time * 0.4) * 90;
        const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, 280);
        grad2.addColorStop(0, 'rgba(168, 85, 247, 0.16)');
        grad2.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = grad2;
        ctx.beginPath();
        ctx.arc(orb2X, orb2Y, 280, 0, Math.PI * 2);
        ctx.fill();

      } else if (currentTheme === 'laser-grid') {
        // --- 6. STUDIO HOLOGRAPHIC LASERS ---
        for (let l = 0; l < 3; l++) {
          const ly = (time * 50 + l * 240) % height;
          ctx.strokeStyle = l % 2 === 0 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(239, 68, 68, 0.16)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(width, ly);
          ctx.stroke();
        }
      }

      // Floating stardust particles (32 particles, smooth and low CPU)
      particles.forEach((p) => {
        p.x += p.vx * currentSpeed;
        p.y += p.vy * currentSpeed;
        p.pulse += p.pulseSpeed;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dynamicAlpha = p.alpha * (Math.sin(p.pulse) * 0.3 + 0.7);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = dynamicAlpha * currentOpacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      if (activityTimer) clearTimeout(activityTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          width: '100%',
          height: '100%',
          transform: 'translateZ(0)',
        }}
      />
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_30%,rgba(6,10,20,0.85)_100%] pointer-events-none" />
    </div>
  );
});

HolographicBackground.displayName = 'HolographicBackground';
