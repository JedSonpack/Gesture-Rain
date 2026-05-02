import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { Camera, Lock, ScanLine } from 'lucide-react';
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { createGestureReading, type HandLandmark } from '../lib/gesture';
import type { GestureUpdate, TrackerSnapshot, TrackerStatus } from '../types';
import { StatusBadge } from './StatusBadge';

export type CameraHandTrackerHandle = {
  start: () => Promise<void>;
};

type CameraHandTrackerProps = {
  onUpdate: (update: GestureUpdate) => void;
  onSnapshot: (snapshot: TrackerSnapshot) => void;
};

const modelUrl =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const wasmUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';

const connections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
] as const;

export const CameraHandTracker = forwardRef<CameraHandTrackerHandle, CameraHandTrackerProps>(
  function CameraHandTracker({ onUpdate, onSnapshot }, ref) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const frameRef = useRef<number | null>(null);
    const lastVideoTimeRef = useRef(-1);
    const streamRef = useRef<MediaStream | null>(null);
    const [snapshot, setSnapshot] = useState<TrackerSnapshot>({
      status: 'idle',
      message: 'Camera offline',
      confidence: 0,
      hasHand: false,
    });

    const publishSnapshot = useCallback(
      (status: TrackerStatus, message: string, confidence = 0, hasHand = false) => {
        const next = { status, message, confidence, hasHand };
        setSnapshot(next);
        onSnapshot(next);
      },
      [onSnapshot],
    );

    const drawHand = useCallback((result: HandLandmarkerResult) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const hand = result.landmarks?.[0] as HandLandmark[] | undefined;
      if (!hand) return;

      ctx.save();
      ctx.lineWidth = 3;
      ctx.shadowBlur = 16;
      ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.88)';
      connections.forEach(([from, to]) => {
        const a = hand[from];
        const b = hand[to];
        ctx.beginPath();
        ctx.moveTo((1 - a.x) * width, a.y * height);
        ctx.lineTo((1 - b.x) * width, b.y * height);
        ctx.stroke();
      });

      hand.forEach((point, index) => {
        const radius = [4, 8, 12, 16, 20].includes(index) ? 5 : 3.5;
        ctx.beginPath();
        ctx.fillStyle = [8, 12, 16, 20].includes(index)
          ? 'rgba(244, 114, 182, 0.95)'
          : 'rgba(163, 230, 53, 0.95)';
        ctx.arc((1 - point.x) * width, point.y * height, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }, []);

    const track = useCallback(() => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        frameRef.current = requestAnimationFrame(track);
        return;
      }

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        drawHand(result);

        const hand = result.landmarks?.[0] as HandLandmark[] | undefined;
        if (hand) {
          const confidence = result.handedness?.[0]?.[0]?.score ?? 0.72;
          const reading = createGestureReading(hand, confidence);
          publishSnapshot('tracking', 'Hand locked', confidence, true);
          onUpdate({ reading, hasHand: true, timestamp: now });
        } else {
          publishSnapshot('no-hand', 'No hand signal', 0, false);
          onUpdate({
            reading: {
              label: 'HALF OPEN',
              openness: 0.5,
              rainIntensity: 0.52,
              confidence: 0,
              palmCenter: { x: 0.5, y: 0.5, z: 0 },
            },
            hasHand: false,
            timestamp: now,
          });
        }
      }

      frameRef.current = requestAnimationFrame(track);
    }, [drawHand, onUpdate, publishSnapshot]);

    const start = useCallback(async () => {
      if (snapshot.status === 'loading' || snapshot.status === 'tracking') return;

      try {
        publishSnapshot('loading', 'Loading vision model', 0, false);

        if (!landmarkerRef.current) {
          const vision = await FilesetResolver.forVisionTasks(wasmUrl);
          landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.45,
            minHandPresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        }

        publishSnapshot('loading', 'Requesting camera', 0, false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 960 },
            height: { ideal: 540 },
          },
          audio: false,
        });

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth || 480;
          canvas.height = video.videoHeight || 270;
        }

        publishSnapshot('ready', 'Camera ready', 0, false);
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(track);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Camera unavailable';
        publishSnapshot('error', message, 0, false);
      }
    }, [publishSnapshot, snapshot.status, track]);

    useImperativeHandle(ref, () => ({ start }), [start]);

    useEffect(() => {
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        streamRef.current?.getTracks().forEach((trackItem) => trackItem.stop());
        landmarkerRef.current?.close();
      };
    }, []);

    return (
      <motion.section
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="glass-panel pointer-events-auto w-[min(360px,calc(100vw-1.5rem))] overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            <Camera className="h-4 w-4" />
            Local Vision
          </div>
          <StatusBadge status={snapshot.status} message={snapshot.status === 'idle' ? 'Idle' : snapshot.message} />
        </div>
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-full w-full scale-x-[-1] object-cover opacity-80"
          />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          <div className="pointer-events-none absolute inset-0 border border-cyan-300/20 shadow-[inset_0_0_28px_rgba(34,211,238,0.18)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-cyan-200/10 to-transparent animate-scan" />
          {snapshot.status === 'idle' && (
            <div className="absolute inset-0 grid place-items-center bg-black/50 text-center">
              <div>
                <Lock className="mx-auto mb-3 h-7 w-7 text-cyan-100" />
                <div className="font-display text-xs uppercase tracking-[0.18em] text-slate-200">
                  Camera permission required
                </div>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded bg-black/45 px-2 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
            <ScanLine className="h-3 w-3" />
            On-device only
          </div>
        </div>
      </motion.section>
    );
  },
);
