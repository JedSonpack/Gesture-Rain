import { useEffect, useMemo, useRef } from 'react';
import type { GestureLabel } from '../lib/gesture';
import type { RainMetrics } from '../types';

type RainCanvasProps = {
  metrics: RainMetrics;
  gestureLabel: GestureLabel;
  lightningToken: number;
};

type Drop = {
  x: number;
  y: number;
  z: number;
  speed: number;
  length: number;
  drift: number;
  alpha: number;
};

type Building = {
  x: number;
  width: number;
  height: number;
  tone: string;
  windows: Array<{ x: number; y: number; color: string }>;
};

const randomRange = (min: number, max: number) => min + Math.random() * (max - min);

function createDrop(width: number, height: number, metrics: RainMetrics, fromTop = false): Drop {
  const depth = randomRange(0.35, 1);
  return {
    x: randomRange(-width * 0.15, width * 1.15),
    y: fromTop ? randomRange(-height * 0.35, -10) : randomRange(-height * 0.2, height * 1.05),
    z: depth,
    speed: randomRange(8, 22) * metrics.speed * depth,
    length: randomRange(metrics.length * 0.55, metrics.length * 1.25) * depth,
    drift: metrics.wind * depth,
    alpha: randomRange(0.25, 0.8) * depth,
  };
}

export function RainCanvas({ metrics, gestureLabel, lightningToken }: RainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropsRef = useRef<Drop[]>([]);
  const skylineRef = useRef<Building[]>([]);
  const metricsRef = useRef(metrics);
  const lightningRef = useRef(0);
  const lastTokenRef = useRef(lightningToken);

  metricsRef.current = metrics;

  const stormPalette = useMemo(
    () => ({
      sky: gestureLabel === 'FIST' ? '#03040b' : gestureLabel === 'STORM MODE' ? '#0a0b18' : '#060916',
      horizon: gestureLabel === 'STORM MODE' ? '#20113c' : '#071423',
    }),
    [gestureLabel],
  );

  useEffect(() => {
    if (lastTokenRef.current !== lightningToken) {
      lightningRef.current = 1;
      lastTokenRef.current = lightningToken;
    }
  }, [lightningToken]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const createSkyline = (width: number, height: number) => {
      const horizon = height * 0.64;
      skylineRef.current = Array.from({ length: 26 }, (_, index) => {
        const buildingWidth = width / 28;
        const x = index * buildingWidth + randomRange(-6, 6);
        const buildingHeight = randomRange(height * 0.08, height * 0.25);
        const windows: Building['windows'] = [];
        for (let wy = horizon - buildingHeight + 12; wy < horizon - 8; wy += 18) {
          if (Math.random() > 0.55) {
            windows.push({
              x: buildingWidth * 0.25,
              y: wy - (horizon - buildingHeight),
              color: index % 4 === 0 ? 'rgba(34,211,238,0.75)' : 'rgba(244,114,182,0.62)',
            });
          }
          if (Math.random() > 0.65) {
            windows.push({
              x: buildingWidth * 0.58,
              y: wy - (horizon - buildingHeight),
              color: index % 4 === 0 ? 'rgba(34,211,238,0.75)' : 'rgba(244,114,182,0.62)',
            });
          }
        }
        return {
          x,
          width: buildingWidth * randomRange(0.65, 1.2),
          height: buildingHeight,
          tone: index % 3 === 0 ? 'rgba(12, 18, 38, 0.78)' : 'rgba(4, 8, 22, 0.82)',
          windows,
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dropsRef.current = Array.from({ length: metricsRef.current.particles }, () =>
        createDrop(width, height, metricsRef.current),
      );
      createSkyline(width, height);
    };

    const drawCity = (width: number, height: number, brightness: number) => {
      const horizon = height * 0.64;
      ctx.save();
      ctx.globalAlpha = 0.48 + brightness * 0.25;
      skylineRef.current.forEach((building) => {
        ctx.fillStyle = building.tone;
        ctx.fillRect(building.x, horizon - building.height, building.width, building.height);
        building.windows.forEach((windowLight) => {
          ctx.fillStyle = windowLight.color;
          ctx.fillRect(building.x + windowLight.x, horizon - building.height + windowLight.y, 3, 7);
        });
      });
      ctx.restore();
    };

    const render = (time: number) => {
      const dt = Math.min(32, time - last) / 16.67;
      last = time;

      const { intensity, wind, particles, brightness } = metricsRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;

      const target = particles;
      const drops = dropsRef.current;
      if (drops.length < target) {
        for (let i = drops.length; i < target; i += 1) {
          drops.push(createDrop(width, height, metricsRef.current, true));
        }
      } else if (drops.length > target) {
        drops.splice(target);
      }

      if (intensity > 0.84 && Math.random() < 0.0035 * intensity) {
        lightningRef.current = Math.max(lightningRef.current, 0.72);
      }

      const flash = lightningRef.current;
      lightningRef.current = Math.max(0, lightningRef.current - 0.045 * dt);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, flash > 0 ? '#dff8ff' : stormPalette.sky);
      gradient.addColorStop(0.48, stormPalette.horizon);
      gradient.addColorStop(1, '#03050d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.32 + brightness * 0.28;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.14)';
      ctx.lineWidth = 1;
      const gridTop = height * 0.58;
      for (let x = -width; x < width * 2; x += 48) {
        ctx.beginPath();
        ctx.moveTo(width / 2 + (x - width / 2) * 0.25, gridTop);
        ctx.lineTo(x + wind * 18, height);
        ctx.stroke();
      }
      for (let y = gridTop; y < height; y += 42) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      drawCity(width, height, brightness);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      drops.forEach((drop) => {
        drop.y += drop.speed * dt;
        drop.x += (drop.drift + wind * 0.25) * dt;
        if (drop.y - drop.length > height || drop.x > width * 1.25 || drop.x < -width * 0.25) {
          Object.assign(drop, createDrop(width, height, metricsRef.current, true));
        }

        const trail = ctx.createLinearGradient(drop.x, drop.y - drop.length, drop.x + wind, drop.y);
        trail.addColorStop(0, `rgba(34, 211, 238, 0)`);
        trail.addColorStop(0.35, `rgba(125, 249, 255, ${drop.alpha * (0.25 + intensity * 0.45)})`);
        trail.addColorStop(1, `rgba(255, 255, 255, ${drop.alpha * (0.45 + intensity * 0.38)})`);
        ctx.strokeStyle = trail;
        ctx.lineWidth = Math.max(1, drop.z * 2.1);
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y - drop.length);
        ctx.lineTo(drop.x + wind * drop.z, drop.y);
        ctx.stroke();
      });
      ctx.restore();

      if (flash > 0) {
        ctx.save();
        ctx.globalAlpha = flash * 0.75;
        ctx.fillStyle = 'rgba(220, 250, 255, 0.9)';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = `rgba(255, 255, 255, ${flash})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 28;
        ctx.shadowColor = '#e0fbff';
        ctx.beginPath();
        let x = width * randomRange(0.25, 0.75);
        ctx.moveTo(x, 0);
        for (let y = 0; y < height * 0.46; y += randomRange(26, 52)) {
          x += randomRange(-38, 38);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [stormPalette]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 h-screen w-screen bg-void"
      aria-label="Interactive rain particle canvas"
    />
  );
}
