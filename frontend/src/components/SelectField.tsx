import type { SelectHTMLAttributes } from 'react';
import { CONTROL_BASE, FIELD_LAYOUT, type FieldOrientation } from './fieldStyles';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export type SelectFieldProps<T extends string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'className' | 'value'
> & {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onValueChange?: (value: T) => void;
  orientation?: FieldOrientation;
  className?: string;
  selectClassName?: string;
};

const SELECT_WIDTH = { stacked: 'w-full', inline: '' } as const;

export function SelectField<T extends string>({
  label,
  value,
  options,
  onValueChange,
  onChange,
  orientation = 'stacked',
  className = '',
  selectClassName = '',
  ...selectProps
}: SelectFieldProps<T>) {
  const layout = FIELD_LAYOUT[orientation];

  return (
    <label className={`${layout.wrapper} ${className}`.trim()}>
      <span className={layout.label}>{label}</span>
      <select
        {...selectProps}
        value={value}
        className={`${CONTROL_BASE} ${layout.control} ${SELECT_WIDTH[orientation]} ${selectClassName}`.trim()}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value as T);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
