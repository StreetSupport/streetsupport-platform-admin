import { z } from 'zod';
import {
  CharterType,
  MediaAssetSchemaCore,
  AccentGraphicSchemaCore,
  ResourceFileSchemaCore,
  BannerSchemaCore,
  applySharedRefinements,
  createValidationResult,
  type ValidationResult
} from './bannerSchemaCore';


// Admin-specific preprocessing is not needed - we work with proper types from forms

// // Use shared schemas from core
// export const MediaAssetSchema = MediaAssetSchemaCore;
// export const AccentGraphicSchema = AccentGraphicSchemaCore;
// export const ResourceFileSchema = ResourceFileSchemaCore;

// // Frontend-specific template schemas with File support
// export const PartnershipCharterFormSchema = z.object({
//   PartnerLogos: z.union([
//     z.array(MediaAssetSchema).max(5, 'Maximum 5 partner logos allowed'),
//     z.array(z.instanceof(File)).max(5, 'Maximum 5 partner logos allowed'),
//     z.array(z.union([MediaAssetSchema, z.instanceof(File)])).max(5, 'Maximum 5 partner logos allowed')
//   ]).optional(),
//   CharterType: z.nativeEnum(CharterType).optional(),
//   SignatoriesCount: z.number().min(0, 'Signatories count must be non-negative').optional(),
// }).optional();

// export const ResourceProjectFormSchema = z.object({
//   ResourceFile: z.union([ResourceFileSchemaCore, z.instanceof(File)]),
// });

// // Frontend Banner Form Schema - extends core schema to handle File objects and form inputs
// const BannerFormBaseSchema = BannerSchemaCore.extend({
//   // Media - can be File objects (not true, because for new uploaded files we add prefix newfile_ to original property name, and prefix newmeta_ to additional metadata. For example for newmetadata_AccentGraphic or newmetadata_ResourceFile) 
//   // or existing media assets (not true, because for existing files we add prefix existing_ to original property name) 
//   // Fields described above aren't files, they contain information about file.
//   Logo: z.union([MediaAssetSchema, z.instanceof(File)]).optional(),
//   BackgroundImage: z.union([MediaAssetSchema, z.instanceof(File)]).optional(),
//   SplitImage: z.union([MediaAssetSchema, z.instanceof(File)]).optional(),
//   AccentGraphic: z.union([AccentGraphicSchema, z.instanceof(File)]).optional(),

//   PartnershipCharter: PartnershipCharterFormSchema,
//   ResourceProject: ResourceProjectFormSchema.optional(),
// });

// export const BannerFormSchema = applySharedRefinements(BannerFormBaseSchema);

// Type exports
export type BannerFormData = z.infer<typeof BannerSchemaCore>;

// Validation function for frontend forms
export function validateBannerForm(data: unknown): ValidationResult<BannerFormData> {
  const result = BannerSchemaCore.safeParse(data);
  return createValidationResult(result);
}

// Helper function to get field-specific errors (moved from bannerSchemaCore)
export function getFieldErrors(
  errors: Array<{ path: string; message: string; code: string }>,
  fieldPath: string
) {
  return errors
    .filter(error => error.path === fieldPath || error.path.startsWith(`${fieldPath}.`))
    .map(error => error.message);
}
