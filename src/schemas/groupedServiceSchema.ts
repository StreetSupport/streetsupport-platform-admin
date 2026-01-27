import { z } from 'zod';
import { isValidPostcodeFormat } from '@/utils/postcodeValidation';
import { preprocessNullableString } from './validationHelpers';

// Location Schema for services with conditional validation based on IsOutreachLocation
export const ServiceLocationSchema = z.object({
  IsOutreachLocation: z.boolean().optional(),
  Description: z.preprocess(preprocessNullableString, z.string().optional()),
  StreetLine1: z.preprocess(preprocessNullableString, z.string().optional()),
  StreetLine2: z.preprocess(preprocessNullableString, z.string().optional()),
  StreetLine3: z.preprocess(preprocessNullableString, z.string().optional()),
  StreetLine4: z.preprocess(preprocessNullableString, z.string().optional()),
  City: z.preprocess(preprocessNullableString, z.string().optional()),
  Postcode: z.preprocess(preprocessNullableString, z.string().optional()),
  Location: z.object({
    type: z.string(),
    coordinates: z.tuple([z.number(), z.number()])
  }).optional()
}).refine((data) => {
  // If IsOutreachLocation is true, Description is required
  if (data.IsOutreachLocation === true) {
    return data.Description && data.Description.trim().length > 0;
  }
  return true;
}, {
  message: 'Description is required for outreach locations',
  path: ['Description']
}).refine((data) => {
  // If IsOutreachLocation is false/undefined, StreetLine1 and Postcode are required
  if (!data.IsOutreachLocation) {
    return data.StreetLine1 && data.StreetLine1.trim().length > 0;
  }
  return true;
}, {
  message: 'Street address is required for fixed locations',
  path: ['StreetLine1']
}).refine((data) => {
  // If IsOutreachLocation is false/undefined, Postcode is required
  if (!data.IsOutreachLocation) {
    return data.Postcode && data.Postcode.trim().length > 0;
  }
  return true;
}, {
  message: 'Postcode is required for fixed locations',
  path: ['Postcode']
}).refine((data) => {
  // Validate postcode format for fixed locations
  if (!data.IsOutreachLocation && data.Postcode && data.Postcode.trim().length > 0) {
    return isValidPostcodeFormat(data.Postcode);
  }
  return true;
}, {
  message: 'Invalid postcode format',
  path: ['Postcode']
});

// Opening Time Schema (using string format for form inputs)
export const OpeningTimeFormSchema = z.object({
  Day: z.number().min(0).max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'),
  StartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  EndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
}).refine((data) => {
  const timeStringToNumber = (timeString: string): number => {
    return parseInt(timeString.replace(':', ''));
  };
  const startNum = timeStringToNumber(data.StartTime);
  const endNum = timeStringToNumber(data.EndTime);
  return startNum < endNum;
}, {
  message: 'End time must be after start time',
  path: ['EndTime']
});

// Service Sub Category Schema
export const ServiceSubCategorySchema = z.object({
  _id: z.string(),
  Name: z.string(),
  Synopsis: z.preprocess(preprocessNullableString, z.string().optional())
});

// Main Grouped Service Schema
export const GroupedServiceSchema = z.object({
  DocumentCreationDate: z.date().optional(),
  DocumentModifiedDate: z.date().optional(),
  CreatedBy: z.preprocess(preprocessNullableString, z.string().optional()),
  IsPublished: z.boolean().default(false),
  IsVerified: z.boolean().default(false),
  ProviderId: z.string().min(1, 'Provider ID is required'),
  ProviderName: z.preprocess(preprocessNullableString, z.string().optional()),
  CategoryId: z.string().min(1, 'Category is required'),
  CategoryName: z.preprocess(preprocessNullableString, z.string().optional()),
  CategorySynopsis: z.preprocess(preprocessNullableString, z.string().optional()),
  Info: z.preprocess(preprocessNullableString, z.string().optional()),
  Location: ServiceLocationSchema,
  IsOpen247: z.boolean().default(false),
  OpeningTimes: z.array(OpeningTimeFormSchema).optional(),
  SubCategories: z.array(ServiceSubCategorySchema).min(1, 'At least one subcategory is required'),
  IsTelephoneService: z.boolean().optional().default(false),
  IsAppointmentOnly: z.boolean().optional().default(false),
  Telephone: z.preprocess(preprocessNullableString, z.string().optional()),
  ClientGroupKeys: z.array(z.string()).optional()
}).refine((data) => {
  // If not open 24/7, not appointment only, and not outreach location, require opening times
  if (!data.IsOpen247 && !data.IsAppointmentOnly && !data.Location.IsOutreachLocation) {
    return data.OpeningTimes && data.OpeningTimes.length > 0;
  }
  return true;
}, {
  message: 'Opening times are required when service is not open 24/7, not appointment only, and not an outreach location',
  path: ['OpeningTimes']
});

// Form data interface for frontend
export interface IGroupedServiceFormData {
  _id?: string;
  ProviderId: string;
  ProviderName?: string;
  IsPublished: boolean;
  IsVerified: boolean;
  CategoryId: string;
  CategoryName?: string;
  CategorySynopsis?: string;
  Info?: string;
  Tags?: string[];
  Location: {
    IsOutreachLocation?: boolean;
    Description?: string; // Used as outreach description when IsOutreachLocation is true
    StreetLine1?: string;
    StreetLine2?: string;
    StreetLine3?: string;
    StreetLine4?: string;
    City?: string;
    Postcode?: string;
    Location?: {
      type?: string;
      coordinates?: [number, number];
    };
  };
  IsOpen247: boolean;
  OpeningTimes?: Array<{
    Day: number;
    StartTime: string;
    EndTime: string;
  }>;
  SubCategories: Array<{
    _id: string;
    Name: string;
    Synopsis?: string;
  }>;
  IsTelephoneService?: boolean;
  IsAppointmentOnly?: boolean;
  Telephone?: string;
  ClientGroupKeys?: string[];
}

// Helper function to transform error paths to user-friendly names
export function transformErrorPath(path: string): string {
  // Handle CategoryId
  if (path === 'CategoryId') {
    return 'Category';
  }
  
  // Handle SubCategories
  if (path.startsWith('SubCategories')) {
    return path.replace('SubCategories', 'Sub Categories');
  }
  
  // Handle Location.StreetLine1
  if (path === 'Location.StreetLine1') {
    return 'Street';
  }
  
  // Handle Location.Postcode
  if (path === 'Location.Postcode') {
    return 'Postcode';
  }
  
  // Handle OpeningTimes
  if (path.startsWith('OpeningTimes')) {
    return path.replace('OpeningTimes', 'Opening Times');
  }
  
  // Handle Location.Description
  if (path === 'Location.Description') {
    return 'Outreach Location Description';
  }
  
  // Return original path for fields without transformation
  return path;
}

// Validation function
export const validateGroupedService = (data: unknown) => {
  const result = GroupedServiceSchema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errors: result.error.issues.map((issue: any) => ({
        path: Array.isArray(issue.path) ? issue.path.join('.') : issue.path,
        message: issue.message
      }))
    };
  }
  
  return {
    success: true,
    data: result.data
  };
};
