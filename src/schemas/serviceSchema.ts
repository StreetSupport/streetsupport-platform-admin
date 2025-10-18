import { z } from 'zod';
import { ValidationResult, createValidationResult } from './validationHelpers';
import { OpeningTimeSchema, AddressSchema } from './organisationSchema';

// Provided Service schema (works for both create and update)
// Form should validate these requirements for create operations
export const ServiceSchema = z.object({
  ParentId: z.string().min(1, 'Parent ID is required'),
  IsPublished: z.boolean(),
  ServiceProviderKey: z.string().min(1, 'Service provider key is required'),
  ServiceProviderName: z.string().min(1, 'Service provider name is required'),
  ParentCategoryKey: z.string().min(1, 'Parent category key is required'),
  SubCategoryKey: z.string().min(1, 'Sub-category key is required'),
  SubCategoryName: z.string().min(1, 'Sub-category name is required'),
  Info: z.string().optional(),
  Tags: z.array(z.string()).optional(),
  OpeningTimes: z
    .array(OpeningTimeSchema)
    .min(1, 'At least one opening time is required'),
  Address: AddressSchema,
  LocationDescription: z.string().optional(),
});

// Validation function
export function validateProvidedService(data: unknown): ValidationResult<z.infer<typeof ServiceSchema>> {
  const result = ServiceSchema.safeParse(data);
  return createValidationResult(result);
}
