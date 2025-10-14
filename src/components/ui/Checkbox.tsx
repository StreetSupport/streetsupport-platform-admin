'use client';

import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        {...props}
      />
      {label && (
        <label className="ml-2 block text-sm text-gray-900">
          {label}
        </label>
      )}
    </div>
  );
}
