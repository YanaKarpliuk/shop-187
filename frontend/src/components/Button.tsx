import type { ButtonHTMLAttributes, ReactNode } from 'react';

const base = 'rounded-lg px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40';

const typeOptions = {
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  neutral: 'border border-slate-300 text-slate-600 hover:bg-slate-50',
  dark: 'bg-slate-900 text-white hover:bg-slate-800',
  text: 'text-slate-500 hover:text-slate-700',
};

const sizeOptions = {
  large: 'text-sm',
  small: 'text-xs font-medium',
};

export default function Button({
  variant = 'neutral',
  size = 'small',
  className = '',
  children,
  ...buttonProps
}: Props) {
  return (
    <button
      {...buttonProps}
      className={`${base} ${typeOptions[variant]} ${sizeOptions[size]} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: 'success' | 'danger' | 'neutral' | 'dark' | 'text';
  size?: 'large' | 'small';
  children: ReactNode;
  className?: string;
};
