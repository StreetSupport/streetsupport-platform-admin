"use client";

import React from 'react';

interface LoadingSpinnerProps {
  /**
   * Optional loading message to display below spinner
   */
  message?: string;
  
  /**
   * Additional CSS classes for the wrapper
   */
  className?: string;
}

/**
 * Reusable loading spinner component for consistent loading UI across the application.
 * Displays a centered spinner with optional message.
 * 
 * @example
 * // Default usage
 * <LoadingSpinner />
 * 
 * @example
 * // With message
 * <LoadingSpinner message="Loading banner..." />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  className = '',
}) => {
  const spinnerClass = 'animate-spin rounded-full border-b-2 border-brand-a h-12 w-12';

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
            <div className={spinnerClass}></div>
            {message && (
            <p className="text-brand-k mt-4">{message}</p>
            )}
        </div>
    </div>
  );
};

export default LoadingSpinner;
