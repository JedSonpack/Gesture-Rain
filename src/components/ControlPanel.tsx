import { Camera, RefreshCw, Zap } from 'lucide-react';
import { NeonButton } from './NeonButton';

type ControlPanelProps = {
  onStartCamera: () => void;
  onResetStorm: () => void;
  onLightning: () => void;
  canStart: boolean;
  loading: boolean;
};

export function ControlPanel({
  onStartCamera,
  onResetStorm,
  onLightning,
  canStart,
  loading,
}: ControlPanelProps) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-3">
      <NeonButton
        onClick={onStartCamera}
        disabled={!canStart || loading}
        icon={<Camera className="h-4 w-4" />}
      >
        {loading ? 'Starting' : 'Camera'}
      </NeonButton>
      <NeonButton onClick={onLightning} tone="magenta" icon={<Zap className="h-4 w-4" />}>
        Flash
      </NeonButton>
      <NeonButton onClick={onResetStorm} icon={<RefreshCw className="h-4 w-4" />}>
        Reset
      </NeonButton>
    </div>
  );
}
