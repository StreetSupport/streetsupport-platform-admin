'use client';

import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-transparent sm:text-sm ${className}`}
      {...props}
    />
  );
}
