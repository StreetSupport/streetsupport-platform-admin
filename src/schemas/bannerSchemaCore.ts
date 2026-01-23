import { z } from 'zod';
import { ValidationResult, createValidationResult } from './validationHelpers';
import {
  TextColour,
  LayoutStyle,
  MediaType,
  BackgroundType,
  CTAVariant,
} from '@/types/index';

// YouTube URL validation regex
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+(&[\w-]+=[\w-]+)*$/;

// Core Media Asset Schema - shared structure
export const MediaAssetSchemaCore = z.object({
  Url: z.string().optional(),
  Alt: z.string().optional(),
  Width: z.number().optional(),
  Height: z.number().optional(),
  Filename: z.string().optional(),
  Size: z.number().positive().optional(),
  MimeType: z.string().optional()
}).nullable().optional();

// Core Banner Background Schema - shared validation rules
export const BannerBackgroundSchemaCore = z.object({
  Type: z.nativeEnum(BackgroundType),
  Value: z.string().min(1, 'Background value is required'),
  Overlay: z.object({
    Colour: z.string().optional(),
    Opacity: z.number().min(0).max(1).optional()
  }).optional()
});

// Core CTA Button Schema - shared validation rules
export const CTAButtonSchemaCore = z.object({
  Label: z.string().min(1, 'Button label is required').max(30, 'Button label must be 30 characters or less'),
  Url: z
    .string()
    .min(1, 'Button URL is required')
    .refine(
      (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
      'URL must be a valid URL or relative path'
    ),
  Variant: z.nativeEnum(CTAVariant).default(CTAVariant.PRIMARY),
  External: z.boolean().optional().default(false)
}).optional();

// Uploaded File Schema - for general file uploads (PDFs, images, etc.)
export const UploadedFileSchemaCore = z.object({
  FileUrl: z.string().min(1, 'File URL is required'),
  FileName: z.string().min(1, 'File name is required'),
  FileSize: z.string().min(1, 'File size is required'),
  FileType: z.string().min(1, 'File type is required')
}).nullable().optional();

// Core Banner Schema - simplified structure without templates
export const BannerSchemaCore = z.object({
  // Core content
  Title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  Description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  Subtitle: z.string().max(100, 'Subtitle must be 100 characters or less').optional(),

  // Media - flexible: either image or YouTube
  MediaType: z.nativeEnum(MediaType).default(MediaType.IMAGE),
  YouTubeUrl: z.string().regex(YOUTUBE_URL_REGEX, 'Please enter a valid YouTube URL').optional().or(z.literal('')),

  // Actions
  CtaButtons: z.array(CTAButtonSchemaCore)
    .max(3, 'Maximum 3 CTA buttons allowed'),

  // Media Assets
  Logo: MediaAssetSchemaCore,
  BackgroundImage: MediaAssetSchemaCore,
  MainImage: MediaAssetSchemaCore,

  // Uploaded file for CTA links
  UploadedFile: UploadedFileSchemaCore,

  // Styling
  Background: BannerBackgroundSchemaCore,
  TextColour: z.nativeEnum(TextColour),
  LayoutStyle: z.nativeEnum(LayoutStyle),

  // Scheduling
  StartDate: z.date().optional(),
  EndDate: z.date().optional(),

  // CMS metadata
  IsActive: z.boolean().default(true),
  LocationSlug: z.string().min(1, 'Location slug is required'),
  LocationName: z.string().optional(),
  Priority: z.number().min(1).max(10, 'Priority must be between 1 and 10').default(1),
  TrackingContext: z.string().optional(),
}).refine(
  (data) => {
    if (data.StartDate && data.EndDate) {
      return data.StartDate <= data.EndDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['EndDate']
  }
).refine(
  (data) => {
    // If MediaType is YouTube, YouTubeUrl is required
    if (data.MediaType === MediaType.YOUTUBE) {
      return data.YouTubeUrl && data.YouTubeUrl.length > 0;
    }
    return true;
  },
  {
    message: 'YouTube URL is required when media type is YouTube',
    path: ['YouTubeUrl']
  }
);

// Strong types for shared refinements and validation utilities
type BannerCore = z.infer<typeof BannerSchemaCore>;
interface RefinementEntry<T> {
  refinement: (data: T) => boolean;
  message: string;
  path: (string | number)[];
}

// Shared cross-field validation refinements
export const sharedBannerRefinements: RefinementEntry<BannerCore>[] = [
];

// Helper function to apply shared refinements to a schema
export function applySharedRefinements<T extends z.ZodTypeAny>(
  schema: T,
  refinements: Array<RefinementEntry<z.infer<T>>> = sharedBannerRefinements as unknown as Array<RefinementEntry<z.infer<T>>>
): T {
  let refinedSchema = schema;

  for (const { refinement, message, path } of refinements) {
    refinedSchema = refinedSchema.refine(refinement, { message, path }) as T;
  }

  return refinedSchema;
}

export type { ValidationResult };
export { createValidationResult };
export { TextColour, LayoutStyle, MediaType, BackgroundType, CTAVariant };
