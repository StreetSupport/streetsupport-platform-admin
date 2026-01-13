# File Uploading and Azure Blob Storage

This document describes the file upload system and Azure Blob Storage integration in the API.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Azure Blob Storage Configuration](#azure-blob-storage-configuration)
4. [Upload Middleware](#upload-middleware)
5. [Container Configuration](#container-configuration)
6. [File Handling Flow](#file-handling-flow)
7. [File Cleanup](#file-cleanup)
8. [Environment Variables](#environment-variables)
9. [Related Files](#related-files)

---

## Overview

The API uses:
- **Multer** for handling multipart/form-data uploads
- **Azure Blob Storage** for persistent file storage
- **Two-phase validation** to prevent orphaned files

### Supported File Types

| Category | MIME Types |
|----------|------------|
| **Images** | JPEG, PNG, WebP, SVG, GIF, TIFF, AVIF, BMP, HEIC, HEIF |
| **Documents** | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX |
| **Data** | CSV, TXT, RTF, JSON, XML |
| **Archives** | ZIP, RAR, 7Z |

### File Size Limits

| Limit | Value |
|-------|-------|
| Per file | 10 MB |
| Total files | 10 files per request |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client (Admin)                              │
│  FormData with files → API Request                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Upload Middleware                           │
│  1. Parse multipart data (Multer)                               │
│  2. Pre-upload validation                                        │
│  3. Upload to Azure Blob Storage                                 │
│  4. Attach URLs to request body                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Controller                                  │
│  1. Full validation                                              │
│  2. Save to database with blob URLs                              │
│  3. Cleanup old files if updating                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Azure Blob Storage Configuration

### Initial Setup

```typescript
// uploadMiddleware.ts
import { BlobServiceClient } from '@azure/storage-blob';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

let blobServiceClient: BlobServiceClient | null = null;

if (AZURE_STORAGE_CONNECTION_STRING) {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    console.log('Azure Blob Storage configured successfully');
  } catch (error) {
    console.error('Failed to initialize Azure Blob Storage:', error);
  }
} else {
  throw Error("Azure Storage connection string not provided");
}
```

### Upload Function

```typescript
async function uploadToAzure(
  file: Express.Multer.File, 
  containerName: string
): Promise<string> {
  if (!blobServiceClient) {
    throw new Error('Azure Blob Storage not configured');
  }

  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Ensure container exists with public blob access
  await containerClient.createIfNotExists({
    access: 'blob'
  });

  // Generate unique filename
  const fileExtension = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtension}`;

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  // Upload with metadata
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype
    },
    metadata: {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString()
    }
  });

  return blockBlobClient.url;
}
```

---

## Upload Middleware

### Multer Configuration

```typescript
import multer from 'multer';

// Memory storage (files buffered in memory)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const imageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml',
      'image/tiff', 'image/avif', 'image/bmp', 'image/heic', 'image/heif'
    ];
    const resourceFileTypes = Object.keys(SUPPORTED_RESOURCE_FILE_TYPES);
    const allowedMimeTypes = [...new Set([...imageTypes, ...resourceFileTypes])];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});
```

### Banner Upload Middleware

```typescript
// Field configuration for banner uploads
const handleMultipartData = upload.fields([
  { name: 'newfile_Logo', maxCount: 1 },
  { name: 'newfile_BackgroundImage', maxCount: 1 },
  { name: 'newfile_MainImage', maxCount: 1 },
  { name: 'newfile_PartnerLogos', maxCount: 5 },
  { name: 'newfile_ResourceFile', maxCount: 1 }
]);

export const bannersUploadMiddleware = (req, res, next) => {
  handleMultipartData(req, res, (err) => {
    if (err) {
      return sendBadRequest(res, `File upload error: ${err.message}`);
    }

    // Pre-upload validation
    const validation = validateBannerPreUpload(req.body);
    if (!validation.success) {
      const errorMessages = validation.errors.map(err => err.message).join(', ');
      return sendBadRequest(res, `Validation failed: ${errorMessages}`);
    }

    req.preValidatedData = validation.data;

    // Process and upload files
    processUploads(req, res, next);
  });
};
```

### Process Uploads Function

```typescript
async function processUploads(req, res, next) {
  try {
    const files = req.files;
    
    if (!files) {
      return next();
    }

    const uploadedAssets = {};

    for (const [fieldName, fileArray] of Object.entries(files)) {
      for (const file of fileArray) {
        // Upload to Azure
        const fileUrl = await uploadToAzure(file, BANNERS_CONTAINER_NAME);

        // Create asset object
        const asset = {
          Url: fileUrl,
          Alt: file.originalname.replace(/\.[^/.]+$/, ''),
          Filename: file.originalname,
          Size: file.size,
          MimeType: file.mimetype
        };

        // Store based on field type
        if (fieldName === 'newfile_Logo' || 
            fieldName === 'newfile_BackgroundImage' || 
            fieldName === 'newfile_MainImage') {
          uploadedAssets[fieldName] = asset;
        } else if (fieldName === 'newfile_PartnerLogos') {
          if (!uploadedAssets[fieldName]) {
            uploadedAssets[fieldName] = [];
          }
          uploadedAssets[fieldName].push(asset);
        } else if (fieldName === 'newfile_ResourceFile') {
          uploadedAssets[fieldName] = {
            FileUrl: fileUrl
          };
        }
      }
    }

    // Merge into request body
    req.body = { ...req.body, ...uploadedAssets };

    next();
  } catch (error) {
    console.error('Upload error:', error);
    sendInternalError(res, 'File upload failed');
  }
}
```

---

## Container Configuration

### Container Names

| Container | Environment Variable | Purpose |
|-----------|---------------------|---------|
| `banners` | `AZURE_BANNERS_CONTAINER_NAME` | Banner images |
| `sweps` | `AZURE_SWEPS_CONTAINER_NAME` | SWEP banner images |
| `resources` | `AZURE_RESOURCES_CONTAINER_NAME` | Downloadable resources |
| `location-logos` | `AZURE_LOCATION_LOGOS_CONTAINER_NAME` | City/location logos |

### Container Access Levels

All containers are configured with **blob-level public access**:
- Files can be accessed directly via URL
- Container listing is not public
- Upload/delete requires authentication

### Staging vs Production

Separate storage accounts or containers for each environment:

```
Production:
  - Storage Account: streetsupportprod
  - Containers: banners, sweps, resources, location-logos

Staging:
  - Storage Account: streetsupportstaging
  - Containers: banners, sweps, resources, location-logos
```

---

## File Handling Flow

### Create Operation

```
1. Client sends FormData with files
2. Multer parses multipart data
3. Pre-upload validation runs
4. Files uploaded to Azure
5. URLs attached to request body
6. Full validation runs
7. Data saved to MongoDB
```

### Update Operation

```
1. Client sends FormData (may include new files)
2. Multer parses multipart data
3. Pre-upload validation runs
4. New files uploaded to Azure
5. Controller compares old vs new data
6. Replaced files identified
7. Data updated in MongoDB
8. Old files deleted from Azure
```

### Delete Operation

```
1. Controller fetches existing record
2. Extract all file URLs from record
3. Delete record from MongoDB
4. Delete files from Azure (non-blocking)
```

### Admin-Side FormData Handling

```typescript
// Admin: Building FormData for upload
const submitBanner = async (formData: IBannerFormData) => {
  const data = new FormData();
  
  // Add text fields
  data.append('Title', formData.Title);
  data.append('TemplateType', formData.TemplateType);
  data.append('CtaButtons', JSON.stringify(formData.CtaButtons));
  
  // Add new files with newfile_ prefix
  if (formData.Logo?.File) {
    data.append('newfile_Logo', formData.Logo.File);
  }
  
  // Add existing files with existing_ prefix
  if (formData.Logo?.Url && !formData.Logo?.File) {
    data.append('existing_Logo', JSON.stringify({
      Url: formData.Logo.Url,
      Alt: formData.Logo.Alt,
      // ... other metadata
    }));
  }
  
  await fetch('/api/banners', {
    method: 'POST',
    body: data
  });
};
```

---

## File Cleanup

### Cleanup Uploaded Files (On Validation Failure)

```typescript
// bannerController.ts
async function cleanupUploadedFiles(req: Request): Promise<void> {
  const filesToCleanup: string[] = [];
  
  // Check for uploaded files in request body
  const fileFields = ['newfile_Logo', 'newfile_BackgroundImage', 'newfile_MainImage'];
  
  for (const field of fileFields) {
    if (req.body[field]?.Url) {
      filesToCleanup.push(req.body[field].Url);
    }
  }
  
  // Handle partner logos array
  if (Array.isArray(req.body.newfile_PartnerLogos)) {
    for (const logo of req.body.newfile_PartnerLogos) {
      if (logo?.Url) {
        filesToCleanup.push(logo.Url);
      }
    }
  }
  
  // Delete files
  for (const url of filesToCleanup) {
    try {
      await deleteFile(url);
    } catch (error) {
      console.error(`Failed to cleanup file ${url}:`, error);
    }
  }
}
```

### Cleanup Unused Files (On Update)

```typescript
async function cleanupUnusedFiles(
  oldBanner: IBanner, 
  newBanner: IBanner
): Promise<void> {
  const oldUrls = extractFileUrls(oldBanner);
  const newUrls = extractFileUrls(newBanner);
  
  // Find URLs that were in old but not in new
  const urlsToDelete = oldUrls.filter(url => !newUrls.includes(url));
  
  for (const url of urlsToDelete) {
    try {
      await deleteFile(url);
      console.log(`Deleted unused file: ${url}`);
    } catch (error) {
      console.error(`Failed to delete file ${url}:`, error);
    }
  }
}

function extractFileUrls(banner: IBanner): string[] {
  const urls: string[] = [];
  
  if (banner.Logo?.Url) urls.push(banner.Logo.Url);
  if (banner.BackgroundImage?.Url) urls.push(banner.BackgroundImage.Url);
  if (banner.MainImage?.Url) urls.push(banner.MainImage.Url);
  
  banner.PartnershipCharter?.PartnerLogos?.forEach(logo => {
    if (logo?.Url) urls.push(logo.Url);
  });
  
  if (banner.ResourceProject?.ResourceFile?.FileUrl) {
    urls.push(banner.ResourceProject.ResourceFile.FileUrl);
  }
  
  return urls;
}
```

### Delete File Function

```typescript
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    if (blobServiceClient && fileUrl.includes('blob.core.windows.net')) {
      // Parse URL to get container and blob name
      const url = new URL(fileUrl);
      let pathname = url.pathname;
      if (pathname.startsWith('/')) pathname = pathname.slice(1);

      const pathParts = pathname.split('/');
      const containerName = pathParts[0];
      const blobName = pathParts.slice(1).join('/');

      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      const result = await blockBlobClient.deleteIfExists();
      
      if (!result.succeeded) {
        console.warn(`Blob not found: ${blobName}`);
      }
    }
  } catch (error) {
    console.error('File deletion error:', error);
    // Don't throw - file deletion shouldn't break the application
  }
}
```

---

## Specialised Upload Handlers

### SWEP Banner Upload

```typescript
export const uploadSwepImage = async (req, res, next) => {
  const uploadSingle = upload.single('newfile_image');
  
  uploadSingle(req, res, async (err) => {
    if (err) {
      return sendBadRequest(res, `File upload error: ${err.message}`);
    }

    const file = req.file;
    
    if (!file) {
      return next(); // No file uploaded, continue
    }

    // Upload to SWEP container
    const fileUrl = await uploadToAzure(file, SWEPS_CONTAINER_NAME);

    req.body.newfile_image = {
      Url: fileUrl,
      Alt: file.originalname,
      Filename: file.originalname,
      Size: file.size,
      MimeType: file.mimetype
    };

    next();
  });
};
```

### Location Logo Upload

```typescript
export const uploadLocationLogo = async (req, res, next) => {
  const uploadSingle = upload.single('newfile_logo');
  
  uploadSingle(req, res, async (err) => {
    if (err) {
      return sendBadRequest(res, `File upload error: ${err.message}`);
    }

    const file = req.file;
    
    if (!file) {
      return next();
    }

    const fileUrl = await uploadToAzure(file, LOCATION_LOGOS_CONTAINER_NAME);
    req.body.LogoPath = fileUrl;

    next();
  });
};
```

### Resource Files Upload

```typescript
export const uploadResourceFiles = async (req, res, next) => {
  const uploadAny = upload.any();
  
  uploadAny(req, res, async (err) => {
    if (err) {
      return sendBadRequest(res, `File upload error: ${err.message}`);
    }

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return next();
    }

    // Process each file
    for (const file of files) {
      const fileUrl = await uploadToAzure(file, RESOURCES_CONTAINER_NAME);
      req.body[file.fieldname] = fileUrl;
    }

    next();
  });
};
```

---

## Environment Variables

### API Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `AZURE_STORAGE_CONNECTION_STRING` | Full connection string | Azure Portal → Storage Account → Access keys |
| `AZURE_BANNERS_CONTAINER_NAME` | Banner container name (default: `banners`) | Your naming convention |
| `AZURE_SWEPS_CONTAINER_NAME` | SWEP container name (default: `sweps`) | Your naming convention |
| `AZURE_RESOURCES_CONTAINER_NAME` | Resources container name (default: `resources`) | Your naming convention |
| `AZURE_LOCATION_LOGOS_CONTAINER_NAME` | Location logos container name (default: `location-logos`) | Your naming convention |

### Admin Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `BLOB_STORAGE_HOSTNAME` | Blob storage hostname for image URLs | `youraccount.blob.core.windows.net` |

### Getting Connection String

1. Go to **Azure Portal**
2. Navigate to your **Storage Account**
3. Click **Access keys** under Security + networking
4. Copy **Connection string** (key1 or key2)

---

## Related Files

### API Side

| File | Description |
|------|-------------|
| `src/middleware/uploadMiddleware.ts` | All upload logic |
| `src/controllers/bannerController.ts` | Banner file handling |
| `src/controllers/swepBannerController.ts` | SWEP file handling |
| `src/controllers/locationLogoController.ts` | Location logo handling |
| `src/controllers/resourceController.ts` | Resource file handling |
| `src/types/banners/IResourceFile.ts` | Supported file types |

### Admin Side

| File | Description |
|------|-------------|
| `src/components/ui/MediaUpload.tsx` | File upload component |
| `src/components/banners/BannerEditor.tsx` | Banner form with uploads |
