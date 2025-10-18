import { z } from 'zod';
import { ValidationResult, createValidationResult } from './validationHelpers';

// Nested schemas for service provider components
export const LocationSchema = z.object({
  type: z.string().min(1, 'Location type is required'),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const OpeningTimeSchema = z.object({
  StartTime: z.number().min(0).max(2359, 'Start time must be between 0 and 2359'),
  EndTime: z.number().min(0).max(2359, 'End time must be between 0 and 2359'),
  Day: z.number().min(0).max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'),
});

export const AddressSchema = z.object({
  Primary: z.boolean().optional(),
  Key: z.string().min(1, 'Address key is required'),
  Street: z.string().min(1, 'Street is required'),
  Street1: z.string().optional(),
  Street2: z.string().optional(),
  Street3: z.string().optional(),
  City: z.string().optional(),
  Postcode: z.string().min(1, 'Postcode is required'),
  Telephone: z.string().optional(),
  IsOpen247: z.boolean().optional(),
  IsAppointmentOnly: z.boolean().optional(),
  Location: LocationSchema.optional(),
  OpeningTimes: z.array(OpeningTimeSchema).default([]),
  // OpeningTimes: z
  //   .array(OpeningTimeSchema)
  //   .min(1, 'At least one opening time is required'),
});

export const NoteSchema = z.object({
  CreationDate: z.date(),
  Date: z.date(),
  StaffName: z.string().min(1, 'Staff name is required'),
  Reason: z.string().min(1, 'Reason is required'),
});

// Service Provider schema (works for both create and update)
// For CREATE operations, required fields: Key, AssociatedLocationIds (min 1), Name, ShortDescription, Description, IsVerified, IsPublished
// Form should validate these requirements for create operations
export const OrganisationSchema = z.object({
  Key: z.string().min(1, 'Key is required'),
  AssociatedLocationIds: z
    .array(z.string())
    .min(1, 'At least one associated location is required'),
  Name: z.string().min(1, 'Name is required'),
  ShortDescription: z
    .string()
    .max(50, 'Short description must be 50 characters or less'),
  Description: z.string().min(1, 'Description is required'),
  IsVerified: z.boolean(),
  IsPublished: z.boolean(),
  RegisteredCharity: z.number().optional(),
  AreaServiced: z.string().optional(),
  Tags: z.string().optional(),
  DonationUrl: z.string().url('Invalid donation URL').optional().or(z.literal('')),
  DonationDescription: z.string().optional(),
  ItemsDonationUrl: z.string().url('Invalid items donation URL').optional().or(z.literal('')),
  ItemsDonationDescription: z.string().optional(),
  Email: z.string().email('Invalid email address').optional().or(z.literal('')),
  Telephone: z.string().optional(),
  Website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  Facebook: z.string().optional(),
  Twitter: z.string().optional(),
  Addresses: z.array(AddressSchema).optional().default([]),
  Notes: z.array(NoteSchema).optional().default([]),
});

// Validation function
export function validateOrganisation(data: unknown): ValidationResult<z.infer<typeof OrganisationSchema>> {
  const result = OrganisationSchema.safeParse(data);
  return createValidationResult(result);
}
