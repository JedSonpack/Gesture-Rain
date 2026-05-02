import { describe, expect, it } from 'vitest';
import {
  classifyGesture,
  createGestureReading,
  detectRapidOpen,
  landmarkDistance,
  smoothValue,
  type HandLandmark,
} from './gesture';

const point = (x: number, y: number, z = 0): HandLandmark => ({ x, y, z });

const makeHand = (tipDistance: number): HandLandmark[] => {
  const landmarks = Array.from({ length: 21 }, () => point(0.5, 0.5));
  landmarks[0] = point(0.5, 0.72);
  landmarks[5] = point(0.38, 0.52);
  landmarks[9] = point(0.5, 0.5);
  landmarks[13] = point(0.62, 0.52);
  landmarks[17] = point(0.74, 0.54);
  landmarks[8] = point(0.5, 0.5 - tipDistance);
  landmarks[12] = point(0.58, 0.5 - tipDistance);
  landmarks[16] = point(0.66, 0.5 - tipDistance);
  landmarks[20] = point(0.74, 0.5 - tipDistance);
  return landmarks;
};

describe('gesture math', () => {
  it('computes euclidean landmark distance', () => {
    expect(landmarkDistance(point(0, 0), point(3, 4))).toBe(5);
  });

  it('classifies closed, half-open, and open palms from normalized openness', () => {
    expect(classifyGesture(0.1)).toBe('FIST');
    expect(classifyGesture(0.48)).toBe('HALF OPEN');
    expect(classifyGesture(0.82)).toBe('OPEN PALM');
    expect(classifyGesture(0.96)).toBe('STORM MODE');
  });

  it('normalizes finger spread into a bounded gesture reading', () => {
    const fist = createGestureReading(makeHand(0.05), 0.4);
    const open = createGestureReading(makeHand(0.28), 0.4);

    expect(fist.openness).toBeLessThan(0.25);
    expect(fist.rainIntensity).toBeLessThan(0.35);
    expect(open.openness).toBeGreaterThan(0.75);
    expect(open.rainIntensity).toBeGreaterThan(0.75);
  });

  it('smooths rain intensity toward new hand readings', () => {
    expect(smoothValue(0.2, 1, 0.25)).toBeCloseTo(0.4);
  });

  it('detects a rapid palm opening for lightning triggers', () => {
    expect(detectRapidOpen(0.22, 0.83, 180)).toBe(true);
    expect(detectRapidOpen(0.22, 0.83, 420)).toBe(false);
    expect(detectRapidOpen(0.62, 0.83, 180)).toBe(false);
  });
});
