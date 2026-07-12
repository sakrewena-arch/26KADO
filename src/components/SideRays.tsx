"use client";

import { useEffect, useRef } from 'react';

interface SideRaysProps {
  speed?: number;
  rayColor1?: string;
  rayColor2?: string;
  intensity?: number;
  spread?: number;
  origin?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  tilt?: number;
  saturation?: number;
  blend?: number;
  falloff?: number;
  opacity?: number;
}

const hexToRgb = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const SideRays = ({
  speed = 2.5,
  rayColor1 = '#EAB308',
  rayColor2 = '#96c8ff',
  intensity = 2,
  spread = 2,
  origin = 'top-right',
  tilt = 0,
  saturation = 1.5,
  blend = 0.75,
  falloff = 1.6,
  opacity = 1.0,
}: SideRaysProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const c1 = hexToRgb(rayColor1);
    const c2 = hexToRgb(rayColor2);

    const draw = () => {
      time += 0.016 * speed;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Source lumineuse : coin supérieur droit
      const sx = w;
      const sy = 0;

      const numRays = 60;
      const spreadAngle = spread * 0.4; // 0.8 rad ~ 45°

      for (let i = 0; i < numRays; i++) {
        // Angle : de -spreadAngle/2 à +spreadAngle/2 autour de la diagonale (haut-droite → bas-gauche)
        const angleOffset = (i / (numRays - 1) - 0.5) * spreadAngle;
        const angle = Math.PI * 0.75 + angleOffset + tilt * Math.PI / 180;

        // Animation sinusoïdale
        const flicker = 0.6 + 0.4 * Math.sin(time * speed * 0.5 + i * 0.8);
        const pulse = 0.7 + 0.3 * Math.sin(time * speed * 0.3 + i * 1.2);

        // Mélange des couleurs
        const mix = i / numRays;
        const r = c1[0] * (1 - mix) + c2[0] * mix;
        const g = c1[1] * (1 - mix) + c2[1] * mix;
        const b = c1[2] * (1 - mix) + c2[2] * mix;

        // Saturation
        const gray = r * 0.299 + g * 0.587 + b * 0.114;
        const sr = gray + (r - gray) * saturation;
        const sg = gray + (g - gray) * saturation;
        const sb = gray + (b - gray) * saturation;

        const alpha = flicker * pulse * intensity * 0.12 * opacity;

        // Distance max
        const maxDist = Math.sqrt(w * w + h * h) * 1.2;

        // Dégradé radial depuis le coin
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, maxDist);
        grad.addColorStop(0, `rgba(${sr * 255},${sg * 255},${sb * 255},${alpha})`);
        grad.addColorStop(0.1, `rgba(${sr * 255},${sg * 255},${sb * 255},${alpha * 0.8})`);
        grad.addColorStop(0.3, `rgba(${sr * 255},${sg * 255},${sb * 255},${alpha * 0.4})`);
        grad.addColorStop(0.6, `rgba(${sr * 255},${sg * 255},${sb * 255},${alpha * 0.15})`);
        grad.addColorStop(1, `rgba(${sr * 255},${sg * 255},${sb * 255},0)`);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);

        // Forme du rayon : triangle allongé
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(maxDist, -4);
        ctx.lineTo(maxDist, 4);
        ctx.closePath();

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [speed, rayColor1, rayColor2, intensity, spread, origin, tilt, saturation, blend, falloff, opacity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default SideRays;