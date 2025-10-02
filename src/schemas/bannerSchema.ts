import { z } from 'zod';
import {
  BannerSchemaCore,
  createValidationResult,
  type ValidationResult
} from './bannerSchemaCore';

// Type exports
export type BannerFormData = z.infer<typeof BannerSchemaCore>;

// Validation function for frontend forms
export function validateBannerForm(data: unknown): ValidationResult<BannerFormData> {
  const result = BannerSchemaCore.safeParse(data);
  return createValidationResult(result);
}

// Helper function to get field-specific errors (moved from bannerSchemaCore)
export function getFieldErrors(
  errors: Array<{ path: string; message: string; code: string }>,
  fieldPath: string
) {
  return errors
    .filter(error => error.path === fieldPath || error.path.startsWith(`${fieldPath}.`))
    .map(error => error.message);
}
