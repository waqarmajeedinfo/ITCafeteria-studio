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
}

export const HOLOGRAPHIC_THEMES: { id: HolographicTheme; name: string; desc: string; previewColor: string }[] = [
  { id: 'cyber-matrix', name: 'Cyber Matrix Grid', desc: '3D perspective wireframe with holographic neon scan waves', previewColor: 'from-cyan-500 to-blue-600' },
  { id: 'holographic-aurora', name: 'Cosmic Holographic Aurora', desc: 'Flowing ethereal aurora waves in cyan, magenta and deep indigo', previewColor: 'from-purple-500 to-cyan-400' },
  { id: 'digital-circuit', name: 'Circuit Board Energy', desc: 'Digital tech nodes with glowing electric pulses moving along traces', previewColor: 'from-emerald-400 to-cyan-500' },
  { id: 'hex-nexus', name: 'Hexagon Quantum Nexus', desc: 'Floating tech honeycomb grid with undulating energy pulses', previewColor: 'from-blue-500 to-teal-400' },
  { id: 'quantum-orbs', name: 'Quantum Dust & Floating Orbs', desc: 'Luminous holographic particles and stardust drifting smoothly', previewColor: 'from-indigo-400 to-pink-500' },
  { id: 'laser-grid', name: 'Studio Holographic Lasers', desc: 'Horizontal scanning laser beams and ambient studio flares', previewColor: 'from-red-500 to-cyan-400' },
];

export const HolographicBackground: React.FC<HolographicBackgroundProps> = ({
  theme = 'cyber-matrix',
  opacity = 0.55,
  speed = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool for themes
    const particleCount = 65;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.8 + 0.8,
      vx: (Math.random() - 0.5) * 0.6 * speed,
      vy: (Math.random() - 0.5) * 0.6 * speed,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      color: Math.random() > 0.5 ? '#06b6d4' : Math.random() > 0.5 ? '#818cf8' : '#ec4899',
    }));

    // Circuit nodes pool
    const circuitNodes = Array.from({ length: 28 }, () => ({
      x: Math.floor(Math.random() * (width / 70)) * 70,
      y: Math.floor(Math.random() * (height / 70)) * 70,
      pulse: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += 0.015 * speed;
      ctx.clearRect(0, 0, width, height);

      // Deep dark base tint with slight theme color tone
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#060a14');
      baseGrad.addColorStop(0.5, '#090f1f');
      baseGrad.addColorStop(1, '#05070f');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = opacity;

      if (theme === 'cyber-matrix') {
        // --- 1. CYBER MATRIX GRID ---
        const horizon = height * 0.45;
        const gridLines = 24;
        const fov = 350;

        // Vanishing perspective lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
        ctx.lineWidth = 1;

        for (let i = -gridLines; i <= gridLines; i++) {
          const x = width / 2 + (i * width) / gridLines;
          ctx.beginPath();
          ctx.moveTo(width / 2, horizon);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Horizontal moving grid lines
        const offset = (time * 40) % 60;
        for (let y = horizon; y < height; y += (y - horizon + 15) * 0.18) {
          const py = y + offset * ((y - horizon) / (height - horizon));
          if (py <= height && py >= horizon) {
            const lineAlpha = Math.min(0.35, ((py - horizon) / (height - horizon)) * 0.4);
            ctx.strokeStyle = `rgba(34, 211, 238, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(width, py);
            ctx.stroke();
          }
        }

        // Holographic scan wave
        const waveY = (Math.sin(time * 0.8) * 0.5 + 0.5) * height;
        const waveGrad = ctx.createLinearGradient(0, waveY - 80, 0, waveY + 80);
        waveGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        waveGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.18)');
        waveGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = waveGrad;
        ctx.fillRect(0, waveY - 80, width, 160);

      } else if (theme === 'holographic-aurora') {
        // --- 2. HOLOGRAPHIC AURORA ---
        const waves = 4;
        for (let w = 0; w < waves; w++) {
          ctx.beginPath();
          ctx.moveTo(0, height);

          const grad = ctx.createLinearGradient(0, 0, width, height);
          if (w === 0) {
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
            grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.2)');
            grad.addColorStop(1, 'rgba(236, 72, 153, 0.12)');
          } else if (w === 1) {
            grad.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
            grad.addColorStop(0.5, 'rgba(45, 212, 191, 0.18)');
            grad.addColorStop(1, 'rgba(59, 130, 246, 0.12)');
          } else {
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
            grad.addColorStop(1, 'rgba(147, 51, 234, 0.15)');
          }

          ctx.fillStyle = grad;

          for (let x = 0; x <= width; x += 30) {
            const y =
              height * 0.35 +
              Math.sin(x * 0.003 + time * (0.8 + w * 0.3) + w) * 120 +
              Math.cos(x * 0.0015 - time * 0.5) * 80;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        }

      } else if (theme === 'digital-circuit') {
        // --- 3. DIGITAL CIRCUIT FLOW ---
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 1.2;

        // Draw circuit grid lines
        for (let x = 0; x < width; x += 70) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 70) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw pulsing circuit nodes
        circuitNodes.forEach((node, i) => {
          node.pulse += 0.04 * speed;
          const r = Math.sin(node.pulse) * 3 + 4;
          const nodeAlpha = Math.sin(node.pulse) * 0.35 + 0.45;

          ctx.fillStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${nodeAlpha})` : `rgba(16, 185, 129, ${nodeAlpha})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Connect to neighbor
          const next = circuitNodes[(i + 1) % circuitNodes.length];
          ctx.strokeStyle = `rgba(34, 211, 238, ${nodeAlpha * 0.25})`;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(next.x, node.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        });

      } else if (theme === 'hex-nexus') {
        // --- 4. HEXAGON QUANTUM NEXUS ---
        const hexRadius = 45;
        const hexHeight = Math.sqrt(3) * hexRadius;
        const hexWidth = 2 * hexRadius;
        const side = (3 / 2) * hexRadius;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.lineWidth = 1;

        for (let row = 0; row < height / hexHeight + 2; row++) {
          for (let col = 0; col < width / side + 2; col++) {
            const cx = col * side;
            const cy = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);

            // Distance based pulse
            const dist = Math.hypot(cx - width / 2, cy - height / 2);
            const hexPulse = Math.sin(dist * 0.005 - time * 2);

            if (hexPulse > 0.4) {
              ctx.strokeStyle = `rgba(34, 211, 238, ${(hexPulse - 0.4) * 0.45})`;
              ctx.fillStyle = `rgba(6, 182, 212, ${(hexPulse - 0.4) * 0.08})`;
            } else {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
              ctx.fillStyle = 'transparent';
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
            if (hexPulse > 0.4) ctx.fill();
          }
        }

      } else if (theme === 'quantum-orbs') {
        // --- 5. QUANTUM DUST & FLOATING ORBS ---
        // Big background ambient glows
        const orb1X = width * 0.25 + Math.sin(time * 0.5) * 140;
        const orb1Y = height * 0.35 + Math.cos(time * 0.4) * 100;
        const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 320);
        grad1.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
        grad1.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = grad1;
        ctx.beginPath();
        ctx.arc(orb1X, orb1Y, 320, 0, Math.PI * 2);
        ctx.fill();

        const orb2X = width * 0.75 + Math.cos(time * 0.6) * 160;
        const orb2Y = height * 0.65 + Math.sin(time * 0.5) * 120;
        const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, 360);
        grad2.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
        grad2.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = grad2;
        ctx.beginPath();
        ctx.arc(orb2X, orb2Y, 360, 0, Math.PI * 2);
        ctx.fill();

      } else if (theme === 'laser-grid') {
        // --- 6. STUDIO HOLOGRAPHIC LASERS ---
        // Sweeping laser beams
        const beamAngle = time * 0.4;
        const beamX = width / 2;
        const beamY = -100;

        for (let b = 0; b < 5; b++) {
          const currentAngle = beamAngle + (b * Math.PI) / 4;
          const targetX = beamX + Math.sin(currentAngle) * width * 1.2;
          const targetY = height + 100;

          const beamGrad = ctx.createLinearGradient(beamX, beamY, targetX, targetY);
          const beamColor = b % 2 === 0 ? 'rgba(34, 211, 238,' : 'rgba(244, 63, 94,';
          beamGrad.addColorStop(0, `${beamColor} 0.3)`);
          beamGrad.addColorStop(0.7, `${beamColor} 0.08)`);
          beamGrad.addColorStop(1, `${beamColor} 0)`);

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(beamX - 10, beamY);
          ctx.lineTo(beamX + 10, beamY);
          ctx.lineTo(targetX + 60, targetY);
          ctx.lineTo(targetX - 60, targetY);
          ctx.closePath();
          ctx.fill();
        }

        // Horizontal laser lines
        for (let l = 0; l < 4; l++) {
          const ly = ((time * 60 + l * 200) % height);
          ctx.strokeStyle = l % 2 === 0 ? 'rgba(6, 182, 212, 0.25)' : 'rgba(239, 68, 68, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(width, ly);
          ctx.stroke();
        }
      }

      // Shared floating stardust particles across all themes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dynamicAlpha = p.alpha * (Math.sin(p.pulse) * 0.35 + 0.65);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = dynamicAlpha * opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, opacity, speed]);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 60fps GPU Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Holographic Vignette Frame */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_30%,rgba(6,10,20,0.85)_100%] pointer-events-none" />
    </div>
  );
};
