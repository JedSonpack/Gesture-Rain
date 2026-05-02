import { motion } from 'framer-motion';
import { CloudRain, Gauge, ShieldCheck, Sparkles, Waves, Wind } from 'lucide-react';
import type { GestureReading } from '../lib/gesture';
import type { RainMetrics, TrackerSnapshot } from '../types';
import { StatusBadge } from './StatusBadge';

type GestureHUDProps = {
  gesture: GestureReading;
  metrics: RainMetrics;
  tracker: TrackerSnapshot;
  lightningCount: number;
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

function MetricRow({
  icon,
  label,
  value,
  accent = 'text-cyan-100',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span className="text-cyan-200">{icon}</span>
        {label}
      </div>
      <div className={`font-display text-sm font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

export function GestureHUD({ gesture, metrics, tracker, lightningCount }: GestureHUDProps) {
  const storm = gesture.label === 'STORM MODE';

  return (
    <motion.aside
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass-panel pointer-events-auto w-full max-w-[360px] p-5 md:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.28em] text-cyan-200/80">Live HUD</div>
          <h2 className={`font-display text-2xl font-black ${storm ? 'text-fuchsia-100' : 'text-white'}`}>
            {gesture.label}
          </h2>
        </div>
        <StatusBadge status={tracker.status} message={tracker.message} />
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-300">
          <span>Rain Load</span>
          <span className="font-display text-cyan-100">{formatPercent(metrics.intensity)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-cyan-200/20 bg-black/35">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-acid to-fuchsia-400 shadow-[0_0_26px_rgba(34,211,238,0.65)]"
            animate={{ width: `${Math.round(metrics.intensity * 100)}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className="rounded border border-white/10 bg-black/20 px-4">
        <MetricRow icon={<CloudRain className="h-4 w-4" />} label="Particle Count" value={`${metrics.particles}`} />
        <MetricRow icon={<Wind className="h-4 w-4" />} label="Wind Vector" value={`${metrics.wind.toFixed(1)} px`} />
        <MetricRow icon={<Gauge className="h-4 w-4" />} label="Drop Speed" value={`${metrics.speed.toFixed(1)}x`} />
        <MetricRow icon={<Waves className="h-4 w-4" />} label="Drop Length" value={`${Math.round(metrics.length)} px`} />
        <MetricRow icon={<ShieldCheck className="h-4 w-4" />} label="Confidence" value={formatPercent(tracker.confidence)} />
        <MetricRow
          icon={<Sparkles className="h-4 w-4" />}
          label="Lightning"
          value={`${lightningCount}`}
          accent={storm ? 'text-fuchsia-100' : 'text-cyan-100'}
        />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {['FIST', 'HALF', 'OPEN', 'STORM'].map((item) => {
          const active =
            (item === 'FIST' && gesture.label === 'FIST') ||
            (item === 'HALF' && gesture.label === 'HALF OPEN') ||
            (item === 'OPEN' && gesture.label === 'OPEN PALM') ||
            (item === 'STORM' && gesture.label === 'STORM MODE');
          return (
            <div
              key={item}
              className={`rounded border px-2 py-2 text-center font-display text-[0.66rem] font-semibold uppercase tracking-[0.13em] ${
                active
                  ? 'border-cyan-200 bg-cyan-200/16 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.35)]'
                  : 'border-white/10 bg-white/[0.035] text-slate-500'
              }`}
            >
              {item}
            </div>
          );
        })}
      </div>
    </motion.aside>
  );
}
