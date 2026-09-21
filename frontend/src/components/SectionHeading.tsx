import type { ReactNode } from 'react';

export type SectionHeadingProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
};

export function SectionHeading({ title, subtitle, className }: SectionHeadingProps) {
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle != null && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
