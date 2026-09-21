import type { InputHTMLAttributes } from 'react';

const CHECKBOX_BASE = 'h-4 w-4 rounded border-slate-300';

type CheckboxBaseProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'className' | 'checked'
> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

export type CheckboxProps = CheckboxBaseProps &
  ({ label: string; 'aria-label'?: never } | { label?: never; 'aria-label': string });

export function Checkbox({
  label,
  onCheckedChange,
  onChange,
  className = '',
  ...inputProps
}: CheckboxProps) {
  const input = (
    <input
      {...inputProps}
      type="checkbox"
      className={`${CHECKBOX_BASE} ${className}`.trim()}
      onChange={(event) => {
        onChange?.(event);
        onCheckedChange?.(event.target.checked);
      }}
    />
  );

  if (label == null) return input;

  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      {input}
      <span>{label}</span>
    </label>
  );
}
