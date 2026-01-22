'use client';

import { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly SelectOption[] | SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({ options, placeholder, className = '', ...props }: SelectProps) {
  // When there's a placeholder and no value/defaultValue is provided, default to showing the placeholder
  const defaultValueProp = placeholder && props.value === undefined && props.defaultValue === undefined
    ? { defaultValue: '' }
    : {};

  return (
    <select
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-transparent sm:text-sm ${className}`}
      {...defaultValueProp}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
