export type GestureLabel = 'FIST' | 'HALF OPEN' | 'OPEN PALM' | 'STORM MODE';

export type HandLandmark = {
  x: number;
  y: number;
  z?: number;
};

export type GestureReading = {
  label: GestureLabel;
  openness: number;
  rainIntensity: number;
  confidence: number;
  palmCenter: HandLandmark;
};

const fingerTips = [8, 12, 16, 20] as const;
const palmPoints = [0, 5, 9, 13, 17] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const landmarkDistance = (a: HandLandmark, b: HandLandmark) => {
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.hypot(a.x - b.x, a.y - b.y, dz);
};

export const smoothValue = (current: number, target: number, factor: number) => {
  return current + (target - current) * clamp01(factor);
};

export const classifyGesture = (openness: number): GestureLabel => {
  if (openness >= 0.92) return 'STORM MODE';
  if (openness >= 0.68) return 'OPEN PALM';
  if (openness >= 0.28) return 'HALF OPEN';
  return 'FIST';
};

export const detectRapidOpen = (
  previousOpenness: number,
  nextOpenness: number,
  elapsedMs: number,
) => elapsedMs <= 240 && previousOpenness < 0.36 && nextOpenness > 0.72;

const averagePoint = (points: HandLandmark[]): HandLandmark => {
  const total = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: (acc.z ?? 0) + (point.z ?? 0),
    }),
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
    z: (total.z ?? 0) / points.length,
  };
};

export const createGestureReading = (
  landmarks: HandLandmark[],
  confidence = 0,
): GestureReading => {
  if (landmarks.length < 21) {
    throw new Error('Expected 21 MediaPipe hand landmarks.');
  }

  const palmCenter = averagePoint(palmPoints.map((index) => landmarks[index]));
  const avgTipDistance =
    fingerTips.reduce((sum, index) => sum + landmarkDistance(landmarks[index], palmCenter), 0) /
    fingerTips.length;

  const palmWidth = Math.max(
    landmarkDistance(landmarks[5], landmarks[17]),
    landmarkDistance(landmarks[0], landmarks[9]),
    0.001,
  );

  const normalized = clamp01((avgTipDistance / palmWidth - 0.34) / 0.7);
  const rainIntensity = clamp01(normalized * 0.94 + 0.04);

  return {
    label: classifyGesture(normalized),
    openness: normalized,
    rainIntensity,
    confidence: clamp01(confidence),
    palmCenter,
  };
};

export const defaultGestureReading: GestureReading = {
  label: 'HALF OPEN',
  openness: 0.48,
  rainIntensity: 0.52,
  confidence: 0,
  palmCenter: { x: 0.5, y: 0.5, z: 0 },
};
