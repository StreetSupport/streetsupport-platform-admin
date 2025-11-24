import React from 'react';
import { Button } from './Button';

interface ErrorStateProps {
  /** Error message to display */
  message: string;
  /** Optional title (defaults to "Error Loading Data") */
  title?: string;
  /** Callback function for retry button */
  onRetry?: () => void;
  /** Optional retry button text (defaults to "Try Again") */
  retryButtonText?: string;
  /** Optional className for container */
  className?: string;
}

/**
 * Reusable error state component for displaying errors with retry functionality
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   title="Error Loading Users"
 *   message={error}
 *   onRetry={fetchUsers}
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  title = 'Error Loading Data',
  onRetry,
  retryButtonText = 'Try Again',
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <h2 className="heading-5 mb-4 text-brand-g">{title}</h2>
      <p className="text-base text-brand-f mb-6">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          {retryButtonText}
        </Button>
      )}
    </div>
  );
};
