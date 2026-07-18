"use client";

import { useEffect, useRef } from 'react';

interface PixelSnowProps {
  color?: string;
  flakeSize?: number;
  minFlakeSize?: number;
  pixelResolution?: number;
  speed?: number;
  depthFade?: number;
  farPlane?: number;
  brightness?: number;
  density?: number;
  direction?: number;
}

const PixelSnow = ({
  color = '#ffffff',
  pixelResolution = 200,
  speed = 1.25,
  density = 0.3,
  direction = 125,
}: PixelSnowProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const numFlakes = Math.floor(60 * density); // moins de flocons
    const flakes = Array.from({ length: numFlakes }, () => ({
      x: Math.random(),
      y: Math.random() * 2 - 1,
      size: 0.5 + Math.random() * 1.5,
      speed: 0.2 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.01,
    }));

    // Définir la taille UNE FOIS (pas de resize)
    canvas.width = window.innerWidth;
    canvas.height = Math.max(window.innerHeight, document.documentElement.scrollHeight);
    
    const rad = (direction * Math.PI) / 180;
    const windX = Math.cos(rad) * 0.003;
    const windY = Math.sin(rad) * 0.003;

    const pixelSize = Math.max(3, Math.floor(canvas.width / pixelResolution));

    const hexToRgb = (hex: string) => {
      const c = hex.replace('#', '');
      return {
        r: parseInt(c.substring(0, 2), 16),
        g: parseInt(c.substring(2, 4), 16),
        b: parseInt(c.substring(4, 6), 16),
      };
    };

    const rgb = hexToRgb(color);

    const draw = () => {
      time += 0.016 * speed;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      for (const flake of flakes) {
        flake.x += windX * flake.speed + flake.drift * Math.sin(time * 0.5 + flake.x * 3);
        flake.y += windY * flake.speed + 0.002 * flake.speed;

        if (flake.y > 1) { flake.y = -0.1; flake.x = Math.random(); }
        if (flake.x > 1.1) flake.x = -0.1;
        if (flake.x < -0.1) flake.x = 1.1;

        const size = flake.size * 1.5;
        const px = Math.floor(flake.x * w / pixelSize) * pixelSize;
        const py = Math.floor(flake.y * h / pixelSize) * pixelSize;
        const ps = Math.max(pixelSize, Math.floor(size));

        const depth = 1 - Math.abs(flake.y);
        const alpha = Math.min(1, depth * 0.6 + 0.1);

        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
        ctx.fillRect(px, py, ps, ps);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [color, speed, density, direction, pixelResolution]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default PixelSnow;