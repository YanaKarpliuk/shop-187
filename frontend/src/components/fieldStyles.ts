export type FieldOrientation = 'stacked' | 'inline';

export const CONTROL_BASE =
  'rounded-lg border border-slate-300 text-sm focus:border-slate-500 focus:outline-none';

export const FIELD_LAYOUT = {
  stacked: {
    wrapper: 'block',
    label: 'mb-1 block text-sm font-medium text-slate-700',
    control: 'px-3 py-2',
  },
  inline: {
    wrapper: 'flex items-center gap-1.5 text-sm text-slate-600',
    label: '',
    control: 'px-2 py-1',
  },
} as const;
