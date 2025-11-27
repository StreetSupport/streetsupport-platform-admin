import { z } from 'zod';
import { LinkListType } from '../types/resources/ILinkList';
import { createValidationResult, validateNonEmptyHtml } from './validationHelpers';

// No need for custom regex - using Zod's built-in URL validator

// Link Schema for link list items
export const LinkSchema = z.object({
  Title: z.string().min(1, 'Link name is required'),
  Link: z.union([
    z.string().min(1, 'Link URL is required'),
    z.instanceof(File, { message: 'Invalid file upload' })
  ]),
  Description: z.string().optional(), // For file-link type
  Header: z.string().optional() // For file-link type
});

// LinkList Schema with File support
export const LinkListSchema = z.object({
  Name: z.string().optional(),
  Type: z.nativeEnum(LinkListType, {
    message: 'Invalid link list type'
  }),
  Priority: z.number().min(1, 'Priority must be at least 1').max(10, 'Priority must be at most 10'),
  Links: z.array(LinkSchema).min(1, 'At least one link is required')
});

// Main Resource Schema for admin validation
export const ResourceFormSchema = z.object({
  Key: z.string()
    .min(1, 'Resource key is required'),
  Name: z.string().min(1, 'Resource name is required'),
  Header: z.string().min(1, 'Resource header is required'),
  ShortDescription: z.string().min(1, 'Short description is required'),
  Body: z.string().min(1, 'Resource body content is required').refine(validateNonEmptyHtml, {
    message: 'Resource body content is required'
  }),
  LinkList: z.array(LinkListSchema).default([])
});

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  // Handle LinkList nested errors
  if (path.startsWith('LinkList.')) {
    const parts = path.split('.');
    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
      const listIndex = Number(parts[1]);
      const remaining = parts.slice(2).join('.');
      
      if (remaining.startsWith('Links.')) {
        const listParts = remaining.split('.');
        if (listParts.length >= 2 && !isNaN(Number(listParts[1]))) {
          const field = listParts.slice(2).join('.');
          const fieldName = field === 'Title' ? 'Link Name' : field === 'Link' ? 'Link URL/File' : field;
          return `${fieldName}`;
        }
        return `Link List #${listIndex + 1} → ${remaining}`;
      }
      
      const fieldName = remaining === 'Name' ? 'Name' 
        : remaining === 'Type' ? 'Type'
        : remaining === 'Priority' ? 'Priority'
        : remaining;
      return `Link List #${listIndex + 1} → ${fieldName}`;
    }
  }
  
  // Handle top-level fields
  const fieldMap: Record<string, string> = {
    'Name': 'Name',
    'Header': 'Header',
    'ShortDescription': 'Short Description',
    'Body': 'Body Content',
    'LinkList': 'Link Lists'
  };
  
  return fieldMap[path] || path;
}

// Validation function
export function validateResourceForm(data: unknown) {
  const result = ResourceFormSchema.safeParse(data);
  
  return createValidationResult(result);
}
