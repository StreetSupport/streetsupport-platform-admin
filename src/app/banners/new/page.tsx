'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BannerEditor, IBannerFormData } from '@/components/banners/BannerEditor';
import { BannerPreview } from '@/components/banners/BannerPreview';
import RoleGuard from '@/components/auth/RoleGuard';
import { validateBannerForm } from '@/schemas/bannerSchema';
import { successToast, errorToast, loadingToast, toastUtils } from '@/utils/toast';

export default function NewBannerPage() {
  const router = useRouter();
  const [bannerData, setBannerData] = useState<IBannerFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ path: string; message: string; code: string }>>([]);

  const handleSave = async (data: IBannerFormData) => {
    const toastId = loadingToast.create('banner');
    
    try {
      setSaving(true);
      setError(null);
      setValidationErrors([]);

      // Client-side validation using Zod
      const validation = validateBannerForm(data);
      if (!validation.success) {
        setValidationErrors(validation.errors);
        setError('Please fix the validation errors below');
        toastUtils.dismiss(toastId);
        errorToast.validation();
        return;
      }

      const formData = new FormData();
      
      // Add text fields
      Object.keys(data).forEach(key => {
        const typedKey = key as keyof IBannerFormData;
        const value = data[typedKey];
        
        if (key === 'Logo' || key === 'BackgroundImage' || key === 'SplitImage') {
          // Handle simple file uploads
          if (value instanceof File) {
            // Single new file
            formData.append(`newfile_${key}`, value);
          }
        } else if (key === 'AccentGraphic' && value && typeof value === 'object') {
          const accentGraphic = value as any;
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
          const partnershipCharter = value as any;
          if (partnershipCharter.PartnerLogos && Array.isArray(partnershipCharter.PartnerLogos)) {
            partnershipCharter.PartnerLogos.forEach((file: File) => {
              if (file instanceof File) {
                formData.append('newfile_PartnerLogos', file);
              }
            });
          }
          // Add other PartnershipCharter fields as JSON
          const partnershipCharterData = { ...partnershipCharter };
          delete partnershipCharterData.PartnerLogos; // Remove files from JSON
          formData.append(key, JSON.stringify(partnershipCharterData));
        } else if (key === 'ResourceProject' && value && typeof value === 'object') {
          // Handle nested ResourceProject with ResourceFile
          const resourceProject = value as any;
          if (resourceProject.ResourceFile) {
            // Check for the nested File object, which indicates a new upload
            if (resourceProject.ResourceFile.File instanceof File) {
              // 1. Append the actual file for upload
              formData.append('newfile_ResourceFile', resourceProject.ResourceFile.File);

              // 2. Send the metadata as a separate JSON string
              const resourceFileMetadata = { ...resourceProject.ResourceFile };
              delete resourceFileMetadata.File; // Don't send the file object in the JSON
              formData.append('newmetadata_ResourceFile', JSON.stringify(resourceFileMetadata));
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
      router.push(`/banners/${result.data._id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
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
