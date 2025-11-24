'use client';

import { ReactNode } from 'react';

interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

// NOTE: As I can see we use this component only for 'label' in the most cases. 
// Also we don't use it in all forms. 
// I think we should use it for all forms and for all fields.
export function FormField({ label, children, error, required = false, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
