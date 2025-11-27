import { z } from 'zod';

// ============================================================================
// HTML Content Validation Helpers
// ============================================================================

/**
 * Check if HTML content is effectively empty (only contains empty tags like <p></p>)
 * Used for RichTextEditor validation where empty content produces <p></p>
 */
export function isHtmlContentEmpty(html: string): boolean {
  if (!html || html.trim() === '') return true;
  
  // Remove all HTML tags and check if any text content remains
  const textContent = html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .trim();
  
  return textContent.length === 0;
}

/**
 * Zod refinement for validating non-empty HTML content
 * Use with .refine() on string fields that accept HTML from RichTextEditor
 */
export function validateNonEmptyHtml(value: string): boolean {
  return !isHtmlContentEmpty(value);
}

// Shared validation function structure
export interface ValidationResult<T> {
  success: boolean;
  errors: Array<{ path: string; message: string; code: string }>;
  data: T | undefined;
}

// Helper function to create validation result from Zod result
// Define a local type compatible with Zod's safeParse result to avoid depending on non-exported classic types
type ZodSafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

export function createValidationResult<T>(result: ZodSafeParseResult<T>): ValidationResult<T> {
  if (!result.success) {
    const errors = result.error.issues.map((issue: z.ZodIssue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));

    return {
      success: false,
      errors,
      data: undefined
    };
  }

  return {
    success: true,
    errors: [],
    data: result.data
  };
}

// Helper function to get field-specific errors
export function getFieldErrors(
  errors: Array<{ path: string; message: string; code: string }>,
  fieldPath: string
): string[] {
  return errors
    .filter(error => error.path === fieldPath || error.path.startsWith(`${fieldPath}.`))
    .map(error => error.message);
}

// ============================================================================
// Preprocessing Helpers for Zod Schemas
// ============================================================================

/**
 * Converts null/undefined to empty string
 * Used for optional string fields that should default to empty string
 */
export const preprocessNullableString = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  return val as string;
};

/**
 * Converts null/undefined to empty object
 * Used for optional object fields that should default to empty object
 */
export const preprocessNullableObject = (val: unknown): object => {
  if (val === null || val === undefined) return {};
  return val as object;
};

// ============================================================================
// Time Conversion Helpers
// ============================================================================

/**
 * Convert time string (HH:MM) to number (HHMM)
 * Example: "09:30" -> 930
 */
export function timeStringToNumber(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 100 + minutes;
}

/**
 * Convert number (HHMM) to time string (HH:MM)
 * Example: 930 -> "09:30"
 */
export function timeNumberToString(timeNum: number): string {
  const hours = Math.floor(timeNum / 100);
  const minutes = timeNum % 100;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
