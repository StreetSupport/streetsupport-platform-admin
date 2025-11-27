import { z } from 'zod';
import { ValidationResult, createValidationResult } from './validationHelpers';

/**
 * Location Logo Form Data Schema
 * Used for client-side validation in admin forms
 */
export const LocationLogoFormSchema = z.object({
  Name: z.string().min(1, 'Name is required'),
  DisplayName: z.string().min(1, 'Display name is required'),
  LocationSlug: z.string().min(1, 'Location slug is required'),
  LocationName: z.string().min(1, 'Location name is required'),
  LogoPath: z.string().optional(),
  Url: z.string().url('Must be a valid URL').min(1, 'URL is required'),
});

/**
 * Type inferred from schema
 */
export type LocationLogoFormData = z.infer<typeof LocationLogoFormSchema>;

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  // Handle camelCase field names
  const fieldMap: Record<string, string> = {
    'DisplayName': 'Display Name',
    'LocationSlug': 'Location',
    'LocationName': 'Location Name',
    'LogoPath': 'Logo',
    'Url': 'URL'
  };
  
  return fieldMap[path] || path;
}

/**
 * Validate location logo form data
 */
export function validateLocationLogo(data: unknown): ValidationResult<LocationLogoFormData> {
  const result = LocationLogoFormSchema.safeParse(data);
  return createValidationResult(result);
}

