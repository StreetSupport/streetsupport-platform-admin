import { z } from 'zod';
import {
  BannerSchemaCore,
  createValidationResult,
  type ValidationResult
} from './bannerSchemaCore';
import { getFieldErrors } from './validationHelpers';

// Type exports
export type BannerFormData = z.infer<typeof BannerSchemaCore>;

// Validation function for frontend forms
export function validateBannerForm(data: unknown): ValidationResult<BannerFormData> {
  const result = BannerSchemaCore.safeParse(data);
  return createValidationResult(result);
}

// Re-export getFieldErrors for convenience
export { getFieldErrors };
