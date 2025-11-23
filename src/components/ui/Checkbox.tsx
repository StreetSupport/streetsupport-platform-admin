'use client';

import { InputHTMLAttributes } from 'react';
import { Input } from './Input';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export function Checkbox({ label, className = '', id, ...props }: CheckboxProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Input
        type="checkbox"
        id={id}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="ml-2 block text-sm text-gray-900 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
}
