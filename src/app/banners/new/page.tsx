'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BannerEditor, IBannerFormData } from '@/components/banners/BannerEditor';
import { BannerPreview } from '@/components/banners/BannerPreview';
import RoleGuard from '@/components/auth/RoleGuard';
import { validateBannerForm } from '@/schemas/bannerSchema';
import { successToast, errorToast, loadingToast, toastUtils } from '@/utils/toast';
import type { IAccentGraphic } from '@/types';

export default function NewBannerPage() {
  const router = useRouter();
  const [bannerData, setBannerData] = useState<IBannerFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ path: string; message: string; code: string }>>([]);

  const handleSave = async (data: IBannerFormData) => {
    const toastId = loadingToast.create('banner');
    
    try {
      setSaving(true);
      setValidationErrors([]);

      // Client-side validation using Zod
      const validation = validateBannerForm(data);
      if (!validation.success) {
        setValidationErrors(validation.errors);
        toastUtils.dismiss(toastId);
        errorToast.validation('Please fix the validation errors below');
        return;
      }

      const formData = new FormData();
      
      // Add text fields
      Object.keys(data).forEach(key => {
        const typedKey = key as keyof IBannerFormData;
        const value = data[typedKey];
        
        if (key === 'Logo' || key === 'BackgroundImage' || key === 'MainImage') {
          // Handle media uploads with optional metadata
          if (value instanceof File) {
            // Single new file
            formData.append(`newfile_${key}`, value);
          } else if (value && typeof value === 'object' && 'File' in value) {
            // IMediaAssetFileMeta object with File and metadata
            const mediaAsset = value as { File: File; Width?: number; Height?: number };
            formData.append(`newfile_${key}`, mediaAsset.File);
            
            // Send metadata (Width, Height) if present
            const metadata = { ...mediaAsset };
            delete (metadata as { File?: unknown }).File; // Remove File from metadata
            if (Object.keys(metadata).length > 0) {
              formData.append(`newmetadata_${key}`, JSON.stringify(metadata));
            }
          }
        } else if (key === 'AccentGraphic' && value && typeof value === 'object') {
          const accentGraphic = value as (Partial<IAccentGraphic> & { File?: File });
          // Handle AccentGraphic with metadata
          if (accentGraphic.File instanceof File) {
            // 1. AccentGraphic object with File and metadata
            formData.append('newfile_AccentGraphic', accentGraphic.File);
            
            // 2. Send the complete AccentGraphic metadata (excluding the File property)
            const accentGraphicMetadata = { ...accentGraphic };
            delete accentGraphicMetadata.File; // Remove the File object from metadata
            formData.append('newmetadata_AccentGraphic', JSON.stringify(accentGraphicMetadata));
          }
        } else if (key === 'PartnershipCharter' && value && typeof value === 'object') {
          // Handle nested PartnershipCharter with PartnerLogos
          const partnershipCharter = value as NonNullable<IBannerFormData['PartnershipCharter']>;
          if (partnershipCharter.PartnerLogos && Array.isArray(partnershipCharter.PartnerLogos)) {
            partnershipCharter.PartnerLogos.forEach((item) => {
              if (item instanceof File) {
                formData.append('newfile_PartnerLogos', item);
              }
            });
          }
          // Add other PartnershipCharter fields as JSON
          const partnershipCharterData = { ...partnershipCharter };
          delete partnershipCharterData.PartnerLogos; // Remove files from JSON
          formData.append(key, JSON.stringify(partnershipCharterData));
        } else if (key === 'ResourceProject' && value && typeof value === 'object') {
          // Handle nested ResourceProject with ResourceFile
          const resourceProject = value as NonNullable<IBannerFormData['ResourceProject']>;
          if (resourceProject.ResourceFile) {
            // Type guard to detect metadata object with embedded File
            type ResourceFileWithUpload = { File: File } & Record<string, unknown>;
            const rf = resourceProject.ResourceFile as unknown;
            const hasEmbeddedFile = typeof rf === 'object' && rf !== null && 'File' in (rf as object) && (rf as ResourceFileWithUpload).File instanceof File;
            if (hasEmbeddedFile) {
              // 1. Append the actual file for upload
              formData.append('newfile_ResourceFile', (rf as ResourceFileWithUpload).File);

              // 2. Send the metadata as a separate JSON string (excluding the File)
              const metadata = { ...(rf as object) };
              delete (metadata as { File?: unknown }).File; // Don't send the file object in the JSON
              formData.append('newmetadata_ResourceFile', JSON.stringify(metadata));
            }
          }
          // Add other ResourceProject fields as JSON (excluding ResourceFile)
          const resourceProjectData = { ...resourceProject };
          delete resourceProjectData.ResourceFile;
          formData.append(key, JSON.stringify(resourceProjectData));
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch('/api/banners', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create banner');
      }

      const result = await response.json();
      toastUtils.dismiss(toastId);
      successToast.create('Banner');
      router.push(`/banners/${result._id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toastUtils.dismiss(toastId);
      errorToast.create('banner', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
      <div className="min-h-screen bg-brand-q">
        <div className="nav-container">
          <div className="page-container">
            <div className="flex items-center justify-between h-16">
                <h1 className="heading-4">
                  Create New Banner
                </h1>
              </div>
            </div>
        </div>

        <div className="page-container section-spacing">
          {/* Full-width Preview at Top */}
          <div className="mb-8">
            {bannerData && (
              <BannerPreview data={bannerData} />
            )}
          </div>

          <div className="space-y-6">
            <BannerEditor
              initialData={{}}
              onDataChange={setBannerData}
              onSave={handleSave}
              saving={saving}
              validationErrors={validationErrors}
            />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
