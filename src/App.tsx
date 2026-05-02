import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CloudLightning } from 'lucide-react';
import { CameraHandTracker, type CameraHandTrackerHandle } from './components/CameraHandTracker';
import { ControlPanel } from './components/ControlPanel';
import { GestureHUD } from './components/GestureHUD';
import { RainCanvas } from './components/RainCanvas';
import {
  classifyGesture,
  defaultGestureReading,
  detectRapidOpen,
  smoothValue,
  type GestureReading,
} from './lib/gesture';
import type { GestureUpdate, RainMetrics, TrackerSnapshot } from './types';

const defaultTracker: TrackerSnapshot = {
  status: 'idle',
  message: 'Camera offline',
  confidence: 0,
  hasHand: false,
};

const buildReading = (base: GestureReading, openness: number, intensity: number): GestureReading => ({
  ...base,
  openness,
  rainIntensity: intensity,
  label: classifyGesture(openness),
});

const mapRainMetrics = (reading: GestureReading): RainMetrics => {
  const intensity = reading.rainIntensity;
  const palmBias = (0.5 - reading.palmCenter.x) * 18;
  return {
    intensity,
    wind: palmBias + (intensity - 0.5) * 12,
    particles: Math.round(55 + intensity * 520),
    speed: 0.35 + intensity * 1.85,
    length: 12 + intensity * 42,
    brightness: 0.14 + intensity * 0.62,
  };
};

export default function App() {
  const trackerRef = useRef<CameraHandTrackerHandle | null>(null);
  const [targetReading, setTargetReading] = useState<GestureReading>(defaultGestureReading);
  const [displayReading, setDisplayReading] = useState<GestureReading>(defaultGestureReading);
  const [tracker, setTracker] = useState<TrackerSnapshot>(defaultTracker);
  const [lightningToken, setLightningToken] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const lastOpenRef = useRef({ openness: defaultGestureReading.openness, timestamp: performance.now() });

  const triggerLightning = useCallback(() => {
    setLightningToken((value) => value + 1);
    setIsShaking(true);
    window.setTimeout(() => setIsShaking(false), 460);
  }, []);

  const handleGestureUpdate = useCallback(
    ({ reading, hasHand, timestamp }: GestureUpdate) => {
      if (!hasHand) {
        setTargetReading(defaultGestureReading);
        return;
      }

      const last = lastOpenRef.current;
      if (detectRapidOpen(last.openness, reading.openness, timestamp - last.timestamp)) {
        triggerLightning();
      }

      lastOpenRef.current = { openness: reading.openness, timestamp };
      setTargetReading(reading);
    },
    [triggerLightning],
  );

  const resetStorm = useCallback(() => {
    setTargetReading(defaultGestureReading);
    setDisplayReading(defaultGestureReading);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setDisplayReading((current) => {
        const openness = smoothValue(current.openness, targetReading.openness, 0.12);
        const intensity = smoothValue(current.rainIntensity, targetReading.rainIntensity, 0.1);
        const confidence = smoothValue(current.confidence, targetReading.confidence, 0.16);
        return buildReading({ ...targetReading, confidence }, openness, intensity);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetReading]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void trackerRef.current?.start();
    }, 800);
    return () => window.clearTimeout(id);
  }, []);

  const metrics = useMemo(() => mapRainMetrics(displayReading), [displayReading]);
  const highEnergy = displayReading.rainIntensity > 0.72;

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-void text-white ${isShaking ? 'screen-shake' : ''}`}
    >
      <RainCanvas metrics={metrics} gestureLabel={displayReading.label} lightningToken={lightningToken} />

      <div
        className={`pointer-events-none fixed inset-0 z-10 transition duration-500 ${
          highEnergy ? 'storm-aura storm-aura-hot' : 'storm-aura'
        }`}
      />

      <div className="pointer-events-none relative z-20 flex min-h-screen flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-black/25 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-cyan-100 backdrop-blur"
            >
              <CloudLightning className="h-4 w-4" />
              Browser local hand tracking
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6 }}
              className="mt-3 max-w-[900px] font-display text-4xl font-black uppercase leading-none tracking-[0.08em] text-white sm:text-5xl lg:text-6xl"
            >
              Gesture Rain Controller
            </motion.h1>
          </div>

          <div className="mt-1">
            <ControlPanel
              onStartCamera={() => void trackerRef.current?.start()}
              onResetStorm={resetStorm}
              onLightning={triggerLightning}
              canStart={tracker.status !== 'loading'}
              loading={tracker.status === 'loading'}
            />
          </div>
        </header>

        <section className="mt-5 grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[380px_1fr_360px] lg:items-start">
          <div className="lg:col-start-1">
            <CameraHandTracker
              ref={trackerRef}
              onUpdate={handleGestureUpdate}
              onSnapshot={setTracker}
            />
          </div>

          <div className="hidden h-full items-end justify-center pb-10 lg:flex">
            <motion.div
              animate={{
                opacity: highEnergy ? 1 : 0.7,
                scale: 0.98 + displayReading.rainIntensity * 0.06,
              }}
              className="pointer-events-none text-center"
            >
              <div className="font-display text-[9rem] font-black leading-none text-white/5">
                {Math.round(metrics.intensity * 100)}
              </div>
              <div className="mt-[-1.5rem] font-display text-xs uppercase tracking-[0.6em] text-cyan-100/70">
                rain intensity
              </div>
            </motion.div>
          </div>

          <div className="lg:col-start-3 lg:justify-self-end">
            <GestureHUD
              gesture={displayReading}
              metrics={metrics}
              tracker={tracker}
              lightningCount={lightningToken}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
