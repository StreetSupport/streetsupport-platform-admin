import { z } from 'zod';
import { ValidationResult, createValidationResult, preprocessNullableString, preprocessNullableObject } from './validationHelpers';

// Emergency Contact schema
const EmergencyContactSchema = z.object({
  Phone: z.preprocess(preprocessNullableString, z.string().optional()),
  Email: z.preprocess(preprocessNullableString, z.string().email('Invalid emergency email address').optional()),
  Hours: z.preprocess(preprocessNullableString, z.string().optional())
});

// SWEP Banner validation schema for admin forms
export const SwepBannerFormSchema = z.object({
  LocationSlug: z.string().min(1, 'Location is required'),
  Title: z.string().min(1, 'Title is required'),
  Body: z.string().min(1, 'Body content is required'),
  ShortMessage: z.string().min(1, 'Short message is required'),
  
  // Image field - required for SWEP banners
  Image: z.string().optional().nullable(),
  
  // Date fields - allow null values
  SwepActiveFrom: z.date().optional().nullable(),
  SwepActiveUntil: z.date().optional().nullable(),
  IsActive: z.boolean().default(false),
  
  // Emergency contact
  EmergencyContact: z.preprocess(preprocessNullableObject, EmergencyContactSchema.optional()),
}).refine((data) => {
  // If date range is set, SwepActiveFrom must be before SwepActiveUntil
  if (data.SwepActiveFrom && data.SwepActiveUntil) {
    return data.SwepActiveFrom < data.SwepActiveUntil;
  }
  return true;
}, {
  message: 'SWEP active from date must be before active until date',
  path: ['SwepActiveUntil']
});

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  // Handle emergency contact nested errors
  if (path.startsWith('EmergencyContact.')) {
    const fieldName = path.replace('EmergencyContact.', '');
    const fieldMap: Record<string, string> = {
      'Email': 'Email'
    };
    return fieldMap[fieldName] || path;
  }
  
  // Handle camelCase field names
  const fieldMap: Record<string, string> = {
    'Body': 'Body Content',
    'ShortMessage': 'Short Message'
  };
  
  return fieldMap[path] || path;
}

// Validation function
export function validateSwepBanner(data: unknown): ValidationResult<z.infer<typeof SwepBannerFormSchema>> {
  const result = SwepBannerFormSchema.safeParse(data);
  return createValidationResult(result);
}
