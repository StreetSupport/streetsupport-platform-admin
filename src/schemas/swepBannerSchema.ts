import { z } from 'zod';
import { ValidationResult, createValidationResult, preprocessNullableString, preprocessNullableObject } from './validationHelpers';

// Emergency Contact schema
const EmergencyContactSchema = z.object({
  phone: z.preprocess(preprocessNullableString, z.string().optional()),
  email: z.preprocess(preprocessNullableString, z.string().email('Invalid emergency email address').optional()),
  hours: z.preprocess(preprocessNullableString, z.string().optional())
});

// SWEP Banner validation schema for admin forms
export const SwepBannerFormSchema = z.object({
  locationSlug: z.string().min(1, 'Location is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body content is required'),
  shortMessage: z.string().min(1, 'Short message is required'),
  
  // Date fields
  swepActiveFrom: z.date().optional(),
  swepActiveUntil: z.date().optional(),
  isActive: z.boolean().default(false),
  
  // Emergency contact
  emergencyContact: z.preprocess(preprocessNullableObject, EmergencyContactSchema.optional()),
}).refine((data) => {
  // If date range is set, swepActiveFrom must be before swepActiveUntil
  if (data.swepActiveFrom && data.swepActiveUntil) {
    return data.swepActiveFrom < data.swepActiveUntil;
  }
  return true;
}, {
  message: 'SWEP active from date must be before active until date',
  path: ['swepActiveUntil']
});

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  // Handle emergency contact nested errors
  if (path.startsWith('emergencyContact.')) {
    const fieldName = path.replace('emergencyContact.', '');
    const fieldMap: Record<string, string> = {
      'email': 'Email'
    };
    return fieldMap[fieldName] || path;
  }
  
  // Handle camelCase field names
  const fieldMap: Record<string, string> = {
    'title': 'Title',
    'body': 'Body Content',
    'shortMessage': 'Short Message'
  };
  
  return fieldMap[path] || path;
}

// Validation function
export function validateSwepBanner(data: unknown): ValidationResult<z.infer<typeof SwepBannerFormSchema>> {
  const result = SwepBannerFormSchema.safeParse(data);
  return createValidationResult(result);
}
