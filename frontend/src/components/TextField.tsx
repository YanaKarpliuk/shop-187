import type { InputHTMLAttributes } from 'react';
import { CONTROL_BASE, FIELD_LAYOUT, type FieldOrientation } from './fieldStyles';

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string;
  onValueChange?: (value: string) => void;
  orientation?: FieldOrientation;
  className?: string;
  inputClassName?: string;
};

const INPUT_WIDTH = { stacked: 'w-full', inline: 'w-16' } as const;

export function TextField({
  label,
  onValueChange,
  onChange,
  orientation = 'stacked',
  className = '',
  inputClassName = '',
  ...inputProps
}: TextFieldProps) {
  const layout = FIELD_LAYOUT[orientation];

  return (
    <label className={`${layout.wrapper} ${className}`.trim()}>
      <span className={layout.label}>{label}</span>
      <input
        {...inputProps}
        className={`${CONTROL_BASE} ${layout.control} ${INPUT_WIDTH[orientation]} ${inputClassName}`.trim()}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
      />
    </label>
  );
}
