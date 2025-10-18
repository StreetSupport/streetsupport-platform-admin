import { z } from 'zod';
import { ROLE_VALIDATION_PATTERN } from '@/constants/roles';
import { ValidationResult, createValidationResult } from './validationHelpers';

// User schema for admin frontend (works for both create and update)
export const UserSchema = z.object({
  Email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  UserName: z
    .string().optional(),
  AuthClaims: z
    .array(z.string())
    .min(1, 'At least one role is required')
    .refine(
      (claims) => {
        // Ensure AuthClaims contains valid role formats
        return claims.every(claim => ROLE_VALIDATION_PATTERN.test(claim));
      },
      { message: 'Invalid role format in AuthClaims' }
    ),
  AssociatedProviderLocationIds: z
    .array(z.string())
    .optional(),
  IsActive: z
    .boolean()
    .optional(),
});

// Validation function
export function validateUser(data: unknown): ValidationResult<z.infer<typeof UserSchema>> {
  const result = UserSchema.safeParse(data);
  return createValidationResult(result);
}
