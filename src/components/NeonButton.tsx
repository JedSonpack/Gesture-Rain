import type { ButtonHTMLAttributes, ReactNode } from 'react';

type NeonButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  tone?: 'cyan' | 'magenta';
};

export function NeonButton({ children, className = '', icon, tone = 'cyan', ...props }: NeonButtonProps) {
  const toneClass =
    tone === 'cyan'
      ? 'border-cyan-300/55 text-cyan-100 hover:border-cyan-200 hover:shadow-[0_0_28px_rgba(34,211,238,0.5)]'
      : 'border-fuchsia-300/55 text-fuchsia-100 hover:border-fuchsia-200 hover:shadow-[0_0_28px_rgba(244,114,182,0.5)]';

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded border bg-white/[0.055] px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-md transition duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${toneClass} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
