'use client';

import { AlertCircle } from 'lucide-react';

export interface ValidationError {
  Path: string;
  Message: string;
}

export interface ErrorDisplayProps {
  /**
   * General error message to display at the top
   */
  ErrorMessage?: string;
  
  /**
   * Field-specific errors as an object with field names as keys
   */
  FieldErrors?: Record<string, string>;
  
  /**
   * Structured validation errors with path and message
   */
  ValidationErrors?: ValidationError[];
  
  /**
   * Optional className for custom styling
   */
  ClassName?: string;
}

/**
 * Reusable error display component following Street Support design system
 * Shows validation and error messages in a consistent format
 * 
 * Usage:
 * <ErrorDisplay 
 *   ErrorMessage="Form submission failed"
 *   FieldErrors={{ email: "Invalid email format" }}
 *   ValidationErrors={[{ Path: "Title", Message: "Title is required" }]}
 * />
 */
export default function ErrorDisplay({
  ErrorMessage,
  FieldErrors = {},
  ValidationErrors = [],
  ClassName = '',
}: ErrorDisplayProps) {
  // Don't render if no errors
  const hasErrors = 
    ErrorMessage || 
    Object.keys(FieldErrors).length > 0 || 
    ValidationErrors.length > 0;
  
  if (!hasErrors) {
    return null;
  }

  return (
    <div className={`card card-compact border-brand-g bg-red-50 ${ClassName}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-brand-g" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-small font-medium text-brand-g">
            {ErrorMessage ? 'Error' : 'Validation Error'}
          </h3>
          
          {/* General error message */}
          {ErrorMessage && (
            <div className="mt-2 text-small text-brand-g">
              {ErrorMessage}
            </div>
          )}
          
          {/* Field-specific errors */}
          {Object.keys(FieldErrors).length > 0 && (
            <ul className="mt-2 text-small text-brand-g list-disc list-inside space-y-1">
              {Object.entries(FieldErrors).map(([field, message]) => (
                <li key={field}>
                  <strong>{field}:</strong> {message}
                </li>
              ))}
            </ul>
          )}
          
          {/* Validation errors with paths */}
          {ValidationErrors.length > 0 && (
            <ul className="mt-2 text-small text-brand-g list-disc list-inside space-y-1">
              {ValidationErrors.map((err, index) => (
                <li key={index}>
                  <strong>{err.Path}:</strong> {err.Message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
