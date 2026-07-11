"use client";

import { useEffect, useRef } from 'react';

interface BeamsProps {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
}

const Beams = ({
  beamWidth = 3,
  beamHeight = 30,
  beamNumber = 20,
  lightColor = '#ffffff',
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 30,
}: BeamsProps) => {
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

    const hexToRgb = (hex: string) => {
      const c = hex.replace('#', '');
      return {
        r: parseInt(c.substring(0, 2), 16) / 255,
        g: parseInt(c.substring(2, 4), 16) / 255,
        b: parseInt(c.substring(4, 6), 16) / 255,
      };
    };

    const color = hexToRgb(lightColor);
    const rad = (rotation * Math.PI) / 180;

    const draw = () => {
      time += 0.01 * speed;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rad);

      const spacing = w / beamNumber;
      const totalWidth = beamNumber * spacing;

      for (let i = 0; i < beamNumber; i++) {
        const x = -totalWidth / 2 + i * spacing + spacing / 2;
        const noise = Math.sin(time * 2 + i * 1.5) * 0.3 + Math.sin(time * 3 + i * 0.7) * 0.2;
        const alpha = 0.15 + Math.sin(time + i * 0.5) * 0.1 + 0.1;
        const waveY = Math.sin(time + i * 0.3) * 5;

        const gradient = ctx.createLinearGradient(x, -h / 2, x, h / 2);
        gradient.addColorStop(0, `rgba(${color.r * 255},${color.g * 255},${color.b * 255},0)`);
        gradient.addColorStop(0.3 + noise * 0.1, `rgba(${color.r * 255},${color.g * 255},${color.b * 255},${alpha})`);
        gradient.addColorStop(0.5 + noise * 0.1, `rgba(${color.r * 255},${color.g * 255},${color.b * 255},${alpha * 1.5})`);
        gradient.addColorStop(0.7 + noise * 0.1, `rgba(${color.r * 255},${color.g * 255},${color.b * 255},${alpha})`);
        gradient.addColorStop(1, `rgba(${color.r * 255},${color.g * 255},${color.b * 255},0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x - beamWidth / 2, -h / 2 + waveY, beamWidth, h);
      }

      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [beamWidth, beamHeight, beamNumber, lightColor, speed, noiseIntensity, scale, rotation]);

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
        opacity: 0.6,
      }}
    />
  );
};

export default Beams;