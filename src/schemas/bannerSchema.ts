import { z } from 'zod';
import {
  BannerSchemaCore,
  createValidationResult,
  type ValidationResult
} from './bannerSchemaCore';
import { getFieldErrors } from './validationHelpers';

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  // Handle nested template-specific errors
  if (path.startsWith('GivingCampaign.DonationGoal.')) {
    const fieldName = path.replace('GivingCampaign.DonationGoal.', '');
    const fieldMap: Record<string, string> = {
      'Target': 'Donation Target',
      'Current': 'Current Amount',
      'Currency': 'Currency'
    };
    return fieldMap[fieldName] || path;
  }

  // Handle nested template-specific errors
  if (path.startsWith('GivingCampaign.')) {
    const fieldName = path.replace('GivingCampaign.', '');
    const fieldMap: Record<string, string> = {
      'CampaignEndDate': 'Campaign End Date',
      'UrgencyLevel': 'Urgency Level'
    };
    return fieldMap[fieldName] || path;
  }

  if (path.startsWith('ResourceProject.ResourceFile.') || path.startsWith('ResourceFile.')) {
    const fieldName = path.replace('ResourceProject.ResourceFile.', '').replace('ResourceFile.', '');
    const fieldMap: Record<string, string> = {
      'FileUrl': 'Resource File URL',
      'FileName': 'Resource File Name',
      'FileType': 'Resource File Type',
      'FileSize': 'Resource File Size',
      'LastUpdated': 'Last Updated'
    };
    return fieldMap[fieldName] || path;
  }
  
  if (path === 'ResourceProject.ResourceFile') {
    return 'Resource File';
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
    // Handle CTA button array errors (e.g., "CtaButtons.0.Label")
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
  
  // Handle main field names
  const fieldMap: Record<string, string> = {
    'TemplateType': 'Banner Type',
    'Title': 'Title',
    'Subtitle': 'Subtitle',
    'Description': 'Description',
    'LocationSlug': 'Location',
    'LocationName': 'Location Name',
    'Priority': 'Priority',
    'TextColour': 'Text Color',
    'LayoutStyle': 'Layout Style',
    'MainImage': 'Layout Image',
    'Logo': 'Logo',
    'BackgroundImage': 'Background Image',
    'IsActive': 'Active Status',
    'StartDate': 'Start Date',
    'EndDate': 'End Date',
    'BadgeText': 'Badge Text',
    'UrgencyLevel': 'Urgency Level',
    'CampaignEndDate': 'Campaign End Date',
    'SignatoriesCount': 'Signatories Count',
    'CharterType': 'Charter Type',
    'PartnerLogos': 'Partner Logos',
    'ResourceType': 'Resource Type'
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
