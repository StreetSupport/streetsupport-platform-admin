import { z } from 'zod';
import { ROLE_VALIDATION_PATTERN } from '@/constants/roles';

// User creation schema for admin frontend
export const CreateUserSchema = z.object({
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
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Validation function
export function validateCreateUser(data: unknown): { success: boolean; data?: CreateUserInput; errors?: z.ZodError } {
  const result = CreateUserSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}
