import { Activity, AlertTriangle, Camera, Loader2, RadioTower } from 'lucide-react';
import type { TrackerStatus } from '../types';

type StatusBadgeProps = {
  status: TrackerStatus;
  message: string;
};

const statusStyle: Record<TrackerStatus, string> = {
  idle: 'border-slate-400/35 text-slate-200',
  loading: 'border-cyan-300/45 text-cyan-100',
  ready: 'border-emerald-300/45 text-emerald-100',
  tracking: 'border-acid/55 text-acid',
  'no-hand': 'border-amber-300/45 text-amber-100',
  error: 'border-rose-300/55 text-rose-100',
};

export function StatusBadge({ status, message }: StatusBadgeProps) {
  const Icon =
    status === 'loading'
      ? Loader2
      : status === 'tracking'
        ? RadioTower
        : status === 'error'
          ? AlertTriangle
          : status === 'idle'
            ? Camera
            : Activity;

  return (
    <div
      className={`inline-flex max-w-full items-center gap-2 rounded-full border bg-black/25 px-3 py-1.5 text-xs uppercase tracking-[0.14em] backdrop-blur-md ${statusStyle[status]}`}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${status === 'loading' ? 'animate-spin' : ''}`} />
      <span className="truncate">{message}</span>
    </div>
  );
}
