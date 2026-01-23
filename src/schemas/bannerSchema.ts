import { z } from 'zod';
import {
  BannerSchemaCore,
  createValidationResult,
  type ValidationResult
} from './bannerSchemaCore';
import { getFieldErrors } from './validationHelpers';

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  if (path.startsWith('UploadedFile.')) {
    const fieldName = path.replace('UploadedFile.', '');
    const fieldMap: Record<string, string> = {
      'FileUrl': 'File URL',
      'FileName': 'File Name',
      'FileType': 'File Type',
      'FileSize': 'File Size'
    };
    return fieldMap[fieldName] || path;
  }

  if (path.startsWith('Background.')) {
    const fieldName = path.replace('Background.', '');
    const fieldMap: Record<string, string> = {
      'Type': 'Background Type',
      'Value': 'Background Value'
    };
    return fieldMap[fieldName] || path;
  }

  if (path.startsWith('CtaButtons.')) {
    const match = path.match(/CtaButtons\.(\d+)\.(.+)/);
    if (match) {
      const buttonIndex = parseInt(match[1]) + 1;
      const fieldName = match[2];
      const fieldMap: Record<string, string> = {
        'Label': 'Button Label',
        'Url': 'Button URL',
        'Variant': 'Button Variant',
        'External': 'External Link'
      };
      return `CTA Button ${buttonIndex} - ${fieldMap[fieldName] || fieldName}`;
    }
    return path;
  }

  const fieldMap: Record<string, string> = {
    'Title': 'Title',
    'Subtitle': 'Subtitle',
    'Description': 'Description',
    'MediaType': 'Media Type',
    'YouTubeUrl': 'YouTube URL',
    'LocationSlug': 'Location',
    'LocationName': 'Location Name',
    'Priority': 'Priority',
    'TextColour': 'Text Colour',
    'LayoutStyle': 'Layout Style',
    'MainImage': 'Layout Image',
    'Logo': 'Logo',
    'BackgroundImage': 'Background Image',
    'IsActive': 'Active Status',
    'StartDate': 'Start Date',
    'EndDate': 'End Date',
    'UploadedFile': 'Uploaded File'
  };

  return fieldMap[path] || path;
}

// Validation function for frontend forms
export function validateBannerForm(data: unknown): ValidationResult<z.infer<typeof BannerSchemaCore>> {
  const result = BannerSchemaCore.safeParse(data);
  return createValidationResult(result);
}

// Re-export getFieldErrors for convenience
export { getFieldErrors };
