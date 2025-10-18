import { z } from 'zod';
import {
  BannerSchemaCore,
  createValidationResult,
  type ValidationResult
} from './bannerSchemaCore';
import { getFieldErrors } from './validationHelpers';

// Validation function for frontend forms
export function validateBannerForm(data: unknown): ValidationResult<z.infer<typeof BannerSchemaCore>> {
  const result = BannerSchemaCore.safeParse(data);
  return createValidationResult(result);
}

// Re-export getFieldErrors for convenience
export { getFieldErrors };
