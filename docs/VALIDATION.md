# Zod Validation System

This document describes the schema validation system using Zod for both Admin and API projects.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Validation Architecture](#validation-architecture)
3. [Admin-Side Validation](#admin-side-validation)
4. [API-Side Validation](#api-side-validation)
5. [Shared Schema Patterns](#shared-schema-patterns)
6. [Validation Flow](#validation-flow)
7. [Error Handling](#error-handling)
8. [Related Files](#related-files)

---

## Overview

The platform uses **Zod** for runtime type validation:
- **Admin**: Client-side form validation before submission
- **API**: Server-side request validation before processing

### Why Zod?

| Feature | Benefit |
|---------|---------|
| TypeScript-first | Automatic type inference |
| Composable schemas | Reuse across Admin and API |
| Detailed errors | User-friendly validation messages |
| Transform support | Data transformation during validation |

---

## Validation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Admin (Client)                           │
│  Form Input → Zod Schema → Validation → Submit to API           │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API (Server)                            │
│  Request → Pre-upload Validation → File Upload → Full Validation │
└─────────────────────────────────────────────────────────────────┘
```

### Schema Sharing

Core schemas are defined in `*SchemaCore.ts` files and imported by both projects:
- **Admin**: Uses schemas directly for client validation
- **API**: Extends schemas with preprocessing for FormData handling

---

## Admin-Side Validation

### When Validation Occurs

Validation happens **after form submission**, before sending data to the API:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. Validate form data
  const validation = validateBanner(formData);
  
  if (!validation.success) {
    // 2. Display validation errors
    setValidationErrors(validation.errors);
    return;
  }
  
  // 3. Submit to API
  await submitToApi(validation.data);
};
```

### Schema Structure

**`src/schemas/bannerSchemaCore.ts`**:

```typescript
import { z } from 'zod';

// Core CTA Button Schema
export const CTAButtonSchemaCore = z.object({
  Label: z.string()
    .min(1, 'Button label is required')
    .max(20, 'Button label must be 20 characters or less'),
  Url: z.string()
    .min(1, 'Button URL is required')
    .refine(
      (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
      'URL must be a valid URL or relative path'
    ),
  Variant: z.nativeEnum(CTAVariant).default(CTAVariant.PRIMARY),
  External: z.boolean().optional().default(false)
});

// Core Banner Schema
export const BannerSchemaCore = z.object({
  Title: z.string()
    .min(1, 'Title is required')
    .max(50, 'Title must be 50 characters or less'),
  Description: z.string()
    .max(200, 'Description must be 200 characters or less')
    .optional(),
  TemplateType: z.nativeEnum(BannerTemplateType),
  CtaButtons: z.array(CTAButtonSchemaCore)
    .max(3, 'Maximum 3 CTA buttons allowed'),
  // ... more fields
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
);
```

### Validation Function

**`src/schemas/bannerSchema.ts`**:

```typescript
import { BannerSchemaCore } from './bannerSchemaCore';
import { createValidationResult, ValidationResult } from './validationHelpers';

export function validateBanner(data: unknown): ValidationResult {
  const result = BannerSchemaCore.safeParse(data);
  return createValidationResult(result);
}
```

### Using in Components

```typescript
// BannerEditor.tsx
import { validateBanner } from '@/schemas/bannerSchema';

const BannerEditor = ({ onSave }) => {
  const [formData, setFormData] = useState<IBannerFormData>(initialData);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateBanner(formData);
    
    if (!validation.success) {
      setValidationErrors(validation.errors);
      errorToast.validation();
      return;
    }
    
    setValidationErrors([]);
    onSave(validation.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {validationErrors.length > 0 && (
        <ErrorDisplay ValidationErrors={validationErrors} />
      )}
    </form>
  );
};
```

---

## API-Side Validation

### Two-Phase Validation

The API uses a **two-phase validation** approach to prevent orphaned files:

```
Request → Pre-Upload Validation → File Upload → Full Validation → Database
```

#### Phase 1: Pre-Upload Validation

Validates non-file fields **before** uploading files to blob storage:

```typescript
// schemas/bannerSchema.ts
export const BannerPreUploadApiSchema = BannerSchemaCore.omit({
  Logo: true,
  BackgroundImage: true,
  MainImage: true,
  // ... other file fields
});

export function validateBannerPreUpload(data: unknown): ValidationResult {
  const result = BannerPreUploadApiSchema.safeParse(data);
  return createValidationResult(result);
}
```

#### Phase 2: Full Validation

Validates complete data **after** file upload:

```typescript
export function validateBanner(data: unknown): ValidationResult {
  const result = BannerApiSchema.safeParse(data);
  return createValidationResult(result);
}
```

### Preprocessing for FormData

API schemas include preprocessing to handle FormData string conversion:

```typescript
// schemas/bannerSchema.ts
import { z } from 'zod';

// Preprocess string to number
const preprocessNumber = (val: unknown) => {
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
};

// Preprocess string to boolean
const preprocessBoolean = (val: unknown) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
};

// Preprocess string to Date
const preprocessDate = (val: unknown) => {
  if (typeof val === 'string') {
    // Handle quoted date strings from FormData
    const cleanVal = val.replace(/^"|"$/g, '');
    const parsed = new Date(cleanVal);
    return isNaN(parsed.getTime()) ? val : parsed;
  }
  return val;
};

// Preprocess JSON string
const preprocessJSON = (val: unknown) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

// API-specific schema with preprocessing
export const BannerApiSchema = z.object({
  Title: z.string().min(1, 'Title is required'),
  Priority: z.preprocess(preprocessNumber, z.number().min(1).max(10)),
  IsActive: z.preprocess(preprocessBoolean, z.boolean()),
  StartDate: z.preprocess(preprocessDate, z.date().optional()),
  CtaButtons: z.preprocess(preprocessJSON, z.array(CTAButtonSchemaCore)),
  // ... more fields with preprocessing
});
```

### Controller Usage

```typescript
// controllers/bannerController.ts
import { validateBanner, validateBannerPreUpload } from '../schemas/bannerSchema.js';

export const createBanner = asyncHandler(async (req, res) => {
  // Pre-upload validation already done by middleware
  
  // Full validation after file upload
  const validation = validateBanner(req.body);
  
  if (!validation.success) {
    // Cleanup uploaded files on validation failure
    await cleanupUploadedFiles(req);
    return sendBadRequest(res, `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }
  
  const banner = await Banner.create(validation.data);
  return sendCreated(res, banner);
});
```

---

## Shared Schema Patterns

### Core Schemas (`*SchemaCore.ts`)

These are shared between Admin and API:

```typescript
// Both projects import from their own bannerSchemaCore.ts
// The schemas are identical for consistency

// Media Asset Schema
export const MediaAssetSchemaCore = z.object({
  Url: z.string().optional(),
  Alt: z.string().optional(),
  Width: z.number().optional(),
  Height: z.number().optional(),
  Filename: z.string().optional(),
  Size: z.number().positive().optional(),
  MimeType: z.string().optional()
}).nullable().optional();

// Background Schema
export const BannerBackgroundSchemaCore = z.object({
  Type: z.nativeEnum(BackgroundType),
  Value: z.string().min(1, 'Background value is required'),
  Overlay: z.object({
    Colour: z.string().optional(),
    Opacity: z.number().min(0).max(1).optional()
  }).optional()
});
```

### Validation Result Type

```typescript
// validationHelpers.ts
export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

export function createValidationResult<T>(
  result: z.SafeParseReturnType<unknown, T>
): ValidationResult<T> {
  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: []
    };
  }
  
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  };
}
```

### Refinement Patterns

Cross-field validation using `.refine()`:

```typescript
// Date range validation
.refine(
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
)

// Conditional field validation
.refine(
  (data) => {
    if (data.TemplateType === 'giving-campaign') {
      return data.GivingCampaign?.DonationGoal?.Target > 0;
    }
    return true;
  },
  {
    message: 'Donation target is required for giving campaigns',
    path: ['GivingCampaign', 'DonationGoal', 'Target']
  }
)
```

---

## Validation Flow

### Admin Flow

```
User fills form
       │
       ▼
User clicks Submit
       │
       ▼
validateForm() called
       │
       ▼
┌──────┴──────┐
│             │
▼             ▼
Success     Failure
│             │
▼             ▼
Send to    Show errors
API        to user
```

### API Flow

```
Request received
       │
       ▼
Pre-upload validation
       │
       ▼
┌──────┴──────┐
│             │
▼             ▼
Pass        Fail
│             │
▼             ▼
Upload      Return 400
files       (no files uploaded)
│
▼
Full validation
│
▼
┌──────┴──────┐
│             │
▼             ▼
Pass        Fail
│             │
▼             ▼
Save to    Cleanup files
database   Return 400
```

---

## Error Handling

### Error Display Component

```typescript
// components/ui/ErrorDisplay.tsx
interface ErrorDisplayProps {
  ValidationErrors: Array<{ Path: string; Message: string }>;
  ClassName?: string;
}

export const ErrorDisplay = ({ ValidationErrors, ClassName }: ErrorDisplayProps) => {
  if (ValidationErrors.length === 0) return null;
  
  return (
    <div className={`error-display ${ClassName}`}>
      <h4>Please fix the following errors:</h4>
      <ul>
        {ValidationErrors.map((error, index) => (
          <li key={index}>
            <strong>{error.Path}:</strong> {error.Message}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Toast Notifications

```typescript
// utils/toast.ts
export const errorToast = {
  validation: () => toast.error('Please fix the validation errors'),
  generic: (message: string) => toast.error(message)
};
```

### API Error Responses

```typescript
// utils/apiResponses.ts
export const sendBadRequest = (res: Response, message: string) => {
  return res.status(400).json({
    success: false,
    error: message
  });
};
```

---

## Schema Index

### Admin Schemas (`src/schemas/`)

| File | Schemas | Purpose |
|------|---------|---------|
| `bannerSchemaCore.ts` | BannerSchemaCore, CTAButtonSchemaCore | Core banner validation |
| `bannerSchema.ts` | validateBanner | Banner form validation |
| `organisationSchema.ts` | OrganisationSchema, AddressSchema | Organisation validation |
| `userSchema.ts` | UserSchema | User form validation |
| `accommodationSchema.ts` | AccommodationSchema | Accommodation validation |
| `groupedServiceSchema.ts` | GroupedServiceSchema | Service validation |
| `faqSchema.ts` | FaqSchema | FAQ validation |
| `swepBannerSchema.ts` | SwepBannerSchema | SWEP banner validation |
| `locationLogoSchema.ts` | LocationLogoSchema | Location logo validation |
| `resourceSchema.ts` | ResourceSchema | Resource validation |
| `validationHelpers.ts` | ValidationResult, createValidationResult | Helper utilities |

### API Schemas (`src/schemas/`)

| File | Schemas | Purpose |
|------|---------|---------|
| `bannerSchemaCore.ts` | BannerSchemaCore | Core banner validation (shared) |
| `bannerSchema.ts` | BannerApiSchema, validateBannerPreUpload | API-specific with preprocessing |
| `organisationSchema.ts` | OrganisationApiSchema | Organisation with preprocessing |
| `userSchema.ts` | UserApiSchema | User validation |
| `accommodationSchema.ts` | AccommodationApiSchema | Accommodation validation |
| `groupedServiceSchema.ts` | GroupedServiceApiSchema | Service validation |
| `faqSchema.ts` | FaqApiSchema | FAQ validation |
| `swepBannerSchema.ts` | SwepBannerApiSchema | SWEP banner validation |
| `locationLogoSchema.ts` | LocationLogoApiSchema | Location logo validation |
| `resourceSchema.ts` | ResourceApiSchema | Resource validation |
| `validationHelpers.ts` | ValidationResult, preprocessors | Helper utilities |

---

## Related Files

### Admin Side

| File | Description |
|------|-------------|
| `src/schemas/*.ts` | All validation schemas |
| `src/components/ui/ErrorDisplay.tsx` | Error display component |
| `src/utils/toast.ts` | Toast notifications |

### API Side

| File | Description |
|------|-------------|
| `src/schemas/*.ts` | All validation schemas |
| `src/utils/apiResponses.ts` | Standard API responses |
| `src/middleware/uploadMiddleware.ts` | Pre-upload validation |
| `src/controllers/*.ts` | Controller validation usage |
