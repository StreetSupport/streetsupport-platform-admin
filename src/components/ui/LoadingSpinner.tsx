"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: number; // tailwind size in pixels
  className?: string;
  label?: string;
}

// Simple, reusable loading spinner using Tailwind CSS
// Usage: <LoadingSpinner /> or <LoadingSpinner size={24} label="Loading banners..." />
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 20,
  className = "",
  label,
}) => {
  const borderSize = Math.max(2, Math.round(size / 10));

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <span
        className="inline-block animate-spin rounded-full border-current border-t-transparent text-gray-500"
        style={{
          width: size,
          height: size,
          borderWidth: borderSize,
        }}
        aria-hidden="true"
      />
      {label ? (
        <span className="text-sm text-gray-600">{label}</span>
      ) : null}
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default LoadingSpinner;
