import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'amber' | 'emerald' | 'red';

const BADGE_BASE = 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium';

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-100 text-amber-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
};

export type BadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', className = '', children }: BadgeProps) {
  return <span className={`${BADGE_BASE} ${BADGE_TONE[tone]} ${className}`.trim()}>{children}</span>;
}
