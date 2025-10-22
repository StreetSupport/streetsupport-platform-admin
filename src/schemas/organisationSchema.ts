import { z } from 'zod';
import { ValidationResult, createValidationResult } from './validationHelpers';
import { isValidPostcodeFormat } from '../utils/postcodeValidation';

// Time validation helper
const timeStringSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format');

// Convert time string (HH:MM) to number (HHMM)
export function timeStringToNumber(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 100 + minutes;
}

// We don't use it now. Maybe we need it for Edit Organisations
// Convert number (HHMM) to time string (HH:MM)
export function timeNumberToString(timeNum: number): string {
  const hours = Math.floor(timeNum / 100);
  const minutes = timeNum % 100;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Preprocessing helper to convert null/undefined to empty string
const preprocessNullableString = (val: unknown) => {
  if (val === null || val === undefined) return '';
  return val;
};

// Nested schemas for organisation components
export const LocationCoordinatesSchema = z.object({
  type: z.string().min(1, 'Location type is required'),
  coordinates: z.tuple([z.number(), z.number()]),
});

// Form schema: Uses string times (HH:MM format) for form inputs
export const OpeningTimeFormSchema = z.object({
  Day: z.number().min(0).max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'),
  StartTime: timeStringSchema,
  EndTime: timeStringSchema,
}).refine((data) => {
  const startNum = timeStringToNumber(data.StartTime);
  const endNum = timeStringToNumber(data.EndTime);
  return startNum < endNum;
}, {
  message: 'End time must be after start time',
  path: ['EndTime']
});

// API schema: Uses number times (e.g., 900 for 09:00) for database storage
export const OpeningTimeSchema = z.object({
  Day: z.number().min(0).max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'),
  StartTime: z.number().min(0).max(2359, 'Start time must be between 0 and 2359'),
  EndTime: z.number().min(0).max(2359, 'End time must be between 0 and 2359'),
}).refine((data) => {
  return data.StartTime < data.EndTime;
}, {
  message: 'End time must be after start time',
  path: ['EndTime']
});

export const AddressSchema = z.object({
  Street: z.string().min(1, 'Street is required'),
  Street1: z.preprocess(preprocessNullableString, z.string().optional()),
  Street2: z.preprocess(preprocessNullableString, z.string().optional()),
  Street3: z.preprocess(preprocessNullableString, z.string().optional()),
  City: z.preprocess(preprocessNullableString, z.string().optional()),
  Postcode: z.string().min(1, 'Postcode is required').refine((postcode) => {
    return isValidPostcodeFormat(postcode);
  }, {
    message: 'Invalid postcode format'
  }),
  Telephone: z.preprocess(preprocessNullableString, z.string().optional()),
  IsOpen247: z.boolean().optional(),
  IsAppointmentOnly: z.boolean().optional(),
  Location: LocationCoordinatesSchema.optional(),
  // We don't need to validate opening times in the form, because we validate them directly in the form via OpeningTimeFormSchema and also in the API
  //OpeningTimes: z.array(OpeningTimeSchema).default([]),
});
// .refine((data) => {
//   // If not open 24/7 and not appointment only, must have at least one opening time
//   if (!data.IsOpen247 && !data.IsAppointmentOnly) {
//     return data.OpeningTimes.length > 0;
//   }
//   return true;
// }, {
//   message: 'At least one opening time is required when location is not open 24/7 and not appointment only',
//   path: ['OpeningTimes']
// });

export const NoteSchema = z.object({
  CreationDate: z.date(),
  Date: z.date(),
  StaffName: z.string().min(1, 'Staff name is required'),
  Reason: z.string().min(1, 'Reason is required'),
});

// Organisation form validation schema
export const OrganisationSchema = z.object({
  // General Details
  Name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  AssociatedLocationIds: z.array(z.string()).min(1, 'At least one associated location is required'),
  ShortDescription: z.string().min(1, 'Short description is required'),
  Description: z.string().min(1, 'Description is required'),
  Tags: z.array(z.string()).default([]),
  
  // Contact Information
  Telephone: z.preprocess(preprocessNullableString, z.string().optional()),
  Email: z.preprocess(preprocessNullableString, 
    z.string().email('Invalid email address').optional().or(z.literal(''))
  ),
  Website: z.preprocess(preprocessNullableString,
    z.string().url('Invalid website URL').optional().or(z.literal(''))
  ),
  Facebook: z.preprocess(preprocessNullableString, z.string().url('Invalid Facebook URL').optional().or(z.literal(''))),
  Twitter: z.preprocess(preprocessNullableString, z.string().url('Invalid Twitter URL').optional().or(z.literal(''))),
  
  // Locations
  Addresses: z.array(AddressSchema).default([]),
  
  // System fields
  IsVerified: z.boolean().default(false),
  IsPublished: z.boolean().default(false),
  Notes: z.array(NoteSchema).default([]),
});

// Service Provider schema (for API)

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  // Handle nested address errors (e.g., "Addresses.0.Postcode" -> "Location 1 - Postcode")
  const addressMatch = path.match(/^Addresses\.(\d+)\.(.+)$/);
  if (addressMatch) {
    const locationIndex = parseInt(addressMatch[1]) + 1;
    const fieldName = addressMatch[2];
    return `Location ${locationIndex} - ${fieldName}`;
  }
  
  // Handle AssociatedLocationIds
  if (path === 'AssociatedLocationIds') {
    return 'Associated Locations';
  }

  // Handle AssociatedLocationIds
  if (path === 'ShortDescription') {
    return 'Short Description';
  }
  
  // Return original path for fields without transformation
  return path;
}

// Validation functions
export function validateOrganisation(data: unknown): ValidationResult<z.infer<typeof OrganisationSchema>> {
  const result = OrganisationSchema.safeParse(data);
  return createValidationResult(result);
}
