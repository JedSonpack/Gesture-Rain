import type { GestureReading } from './lib/gesture';

export type TrackerStatus = 'idle' | 'loading' | 'ready' | 'tracking' | 'no-hand' | 'error';

export type TrackerSnapshot = {
  status: TrackerStatus;
  message: string;
  confidence: number;
  hasHand: boolean;
};

export type RainMetrics = {
  intensity: number;
  wind: number;
  particles: number;
  speed: number;
  length: number;
  brightness: number;
};

export type GestureUpdate = {
  reading: GestureReading;
  hasHand: boolean;
  timestamp: number;
};
