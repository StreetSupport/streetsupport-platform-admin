import { z } from 'zod';
import { ValidationResult, createValidationResult } from './validationHelpers';

// Core FAQ schema for validation (matches API side)
export const FaqSchemaCore = z.object({
  LocationKey: z.string().min(1, 'Location is required'),
  Title: z.string().min(1, 'Title is required').max(200, 'Title must not exceed 200 characters'),
  Body: z.string().min(1, 'Body content is required'),
  SortPosition: z.number().int('Sort position must be an integer').min(1, 'Sort position must be 1 or greater')
});

export type FaqSchemaType = z.infer<typeof FaqSchemaCore>;

// Form data interface (used in components)
export interface IFaqFormData {
  LocationKey: string;
  Title: string;
  Body: string;
  SortPosition: number;
}

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  const fieldMap: Record<string, string> = {
    'LocationKey': 'Location',
    'Body': 'Body Content',
    'SortPosition': 'Sort Position'
  };
  
  return fieldMap[path] || path;
}

// Validation function
export function validateFaq(data: unknown): ValidationResult<z.infer<typeof FaqSchemaCore>> {
  const result = FaqSchemaCore.safeParse(data);
  return createValidationResult(result);
}
