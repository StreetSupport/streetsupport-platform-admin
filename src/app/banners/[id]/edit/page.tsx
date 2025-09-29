'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BannerEditor, IBannerFormData } from '@/components/banners/BannerEditor';
import { BannerPreview } from '@/components/banners/BannerPreview';
import { BannerPageHeader } from '@/components/banners/BannerPageHeader';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/Button';
import { validateBannerForm } from '@/schemas/bannerSchema';
import { successToast, errorToast, loadingToast, toastUtils } from '@/utils/toast';
import { IBanner } from '@/types/IBanner';
import type { IAccentGraphic } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [banner, setBanner] = useState<IBanner | null>(null);
  const [bannerData, setBannerData] = useState<IBannerFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ path: string; message: string; code: string }>>([]);

  useEffect(() => {
    if (id) {
      fetchBanner();
    }
  }, [id]);

  const fetchBanner = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/banners/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Banner not found');
          return;
        }
        throw new Error('Failed to fetch banner');
      }

      const data: IBanner = await response.json();
      setBanner(data);
      
      // Transform IBanner to IBannerFormData for editing
      const formData = transformToFormData(data);
      setBannerData(formData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load banner';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Transform IBanner to IBannerFormData for editing
  const transformToFormData = (banner: IBanner): IBannerFormData => {
    return {
      // Core fields
      Title: banner.Title,
      Description: banner.Description,
      Subtitle: banner.Subtitle,
      TemplateType: banner.TemplateType,
      
      // Media - keep as IMediaAsset for existing assets
      Logo: banner.Logo,
      BackgroundImage: banner.BackgroundImage,
      MainImage: banner.MainImage,
      AccentGraphic: banner.AccentGraphic,
      
      // Actions
      CtaButtons: banner.CtaButtons,
      
      // Styling
      Background: banner.Background,
      TextColour: banner.TextColour,
      LayoutStyle: banner.LayoutStyle,
      
      // Scheduling
      ShowDates: banner.ShowDates,
      StartDate: banner.StartDate,
      EndDate: banner.EndDate,
      BadgeText: banner.BadgeText,
      
      // Template-specific fields
      GivingCampaign: banner.GivingCampaign,
      PartnershipCharter: banner.PartnershipCharter,
      ResourceProject: banner.ResourceProject,
      
      // CMS metadata
      IsActive: banner.IsActive,
      LocationSlug: banner.LocationSlug,
      Priority: banner.Priority,
      
      // ID for updates
      _id: banner._id
    };
  };

  const handleSave = async (data: IBannerFormData) => {
    const toastId = loadingToast.update('banner');
    
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
          } else if (value && typeof value === 'object' && 'Url' in value) {
            // Existing IMediaAsset - send as JSON
            formData.append(key, JSON.stringify(value));
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
          } else {
            // Existing AccentGraphic - send as JSON
            formData.append(key, JSON.stringify(value));
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
            } else {
              // Existing ResourceFile - send as JSON
              const resourceProjectData = { ...resourceProject };
              formData.append(key, JSON.stringify(resourceProjectData));
            }
          } else {
            // Add other ResourceProject fields as JSON (excluding ResourceFile)
            const resourceProjectData = { ...resourceProject };
            delete resourceProjectData.ResourceFile;
            formData.append(key, JSON.stringify(resourceProjectData));
          }
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update banner');
      }

      const result = await response.json();
      toastUtils.dismiss(toastId);
      successToast.update('Banner');
      router.push(`/banners/${result._id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toastUtils.dismiss(toastId);
      errorToast.update('banner', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/banners/${id}`);
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
        <div className="min-h-screen bg-brand-q">
          <div className="nav-container">
            <div className="page-container">
              <div className="flex items-center justify-between h-16">
                <h1 className="heading-4"></h1>
              </div>
            </div>
          </div>
          <div className="page-container section-spacing">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-a"></div>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error || !banner || !bannerData) {
    return (
      <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
        <div className="min-h-screen bg-brand-q">
          <div className="nav-container">
            <div className="page-container">
              <div className="flex items-center justify-between h-16">
                <h1 className="heading-4">Banner Not Found</h1>
              </div>
            </div>
          </div>
          <div className="page-container section-spacing">
            <div className="text-center py-12">
              <h2 className="heading-3 mb-4">Banner Not Found</h2>
              <p className="text-base text-brand-f mb-6">
                {error || 'The banner you are trying to edit does not exist or has been deleted.'}
              </p>
              <Link href="/banners">
                <Button variant="primary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Banners
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
      <div className="min-h-screen bg-brand-q">
        {/* Header */}
        <BannerPageHeader pageType='edit' banner={banner} />

        <div className="page-container section-spacing">
          {/* Full-width Preview at Top */}
          <div className="mb-8">
            {bannerData && (
              <BannerPreview data={bannerData} />
            )}
          </div>

          <div className="space-y-6">
            <BannerEditor
              initialData={bannerData}
              onDataChange={setBannerData}
              onSave={handleSave}
              onCancel={handleCancel}
              saving={saving}
              validationErrors={validationErrors}
            />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
