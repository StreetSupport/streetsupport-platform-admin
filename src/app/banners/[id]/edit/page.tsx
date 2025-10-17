'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BannerEditor, IBannerFormData } from '@/components/banners/BannerEditor';
import { BannerPreview } from '@/components/banners/BannerPreview';
import { useAuthorization } from '@/hooks/useAuthorization';
import { validateBannerForm } from '@/schemas/bannerSchema';
import { successToast, errorToast, loadingToast, toastUtils } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { BannerPageHeader } from '@/components/banners/BannerPageHeader';
import { IBanner, IMediaAsset } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ROLES } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';

// Helper function to transform IBanner to IBannerFormData
function transformBannerToFormData(banner: IBanner): IBannerFormData {
  return {
    _id: banner._id,
    Title: banner.Title || '',
    Subtitle: banner.Subtitle || '',
    Description: banner.Description || '',
    TemplateType: banner.TemplateType,
    LayoutStyle: banner.LayoutStyle,
    TextColour: banner.TextColour,
    Background: banner.Background,
    CtaButtons: banner.CtaButtons || [],
    IsActive: banner.IsActive,
    Priority: banner.Priority,
    TrackingContext: banner.TrackingContext,
    LocationSlug: banner.LocationSlug || '',
    BadgeText: banner.BadgeText || '',
    StartDate: banner.StartDate ? new Date(banner.StartDate) : undefined,
    EndDate: banner.EndDate ? new Date(banner.EndDate) : undefined,
    ShowDates: banner.ShowDates || false,
    
    // Transform media fields - keep existing IMediaAsset objects as-is
    Logo: banner.Logo || null,
    BackgroundImage: banner.BackgroundImage || null,
    MainImage: banner.MainImage || null,
    
    // Transform template-specific fields
    GivingCampaign: banner.GivingCampaign ? {
      ...banner.GivingCampaign,
      CampaignEndDate: banner.GivingCampaign.CampaignEndDate ? new Date(banner.GivingCampaign.CampaignEndDate) : undefined
    } : undefined,
    
    PartnershipCharter: banner.PartnershipCharter ? {
      ...banner.PartnershipCharter,
      // Keep existing PartnerLogos as IMediaAsset[]
      PartnerLogos: banner.PartnershipCharter.PartnerLogos || []
    } : undefined,
    
    ResourceProject: banner.ResourceProject ? {
      ...banner.ResourceProject,
      // Keep existing ResourceFile as IResourceFile
      ResourceFile: banner.ResourceProject.ResourceFile || null
    } : undefined,
  };
}

export default function EditBannerPage() {
  // Check authorization FIRST
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/banners',
    autoRedirect: true
  });

  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;
  
  const [error, setError] = useState<string | null>(null);
  const [bannerData, setBannerData] = useState<IBannerFormData | null>(null);
  const [initialFormData, setInitialFormData] = useState<IBannerFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ path: string; message: string; code: string }>>([]);

  // Fetch banner data only if authorized
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchBanner = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedFetch(`/api/banners/${bannerId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch banner');
        }
        
        const result = await response.json();
        if (result.success && result.data) {
          const banner = result.data as IBanner;
          
          // Transform banner data for form
          const formData = transformBannerToFormData(banner);
          setInitialFormData(formData);
          setBannerData(formData);
        } else {
          throw new Error(result.message || 'Banner not found');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load banner';
        setError(errorMessage);
        errorToast.load(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (bannerId) {
      fetchBanner();
    }
  }, [isAuthorized, bannerId, router]);

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
    
    // Add text fields and handle file uploads (reuse logic from new banner page)
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
          // Existing IMediaAsset - send as JSON to preserve
          formData.append(`existing_${key}`, JSON.stringify(value));
        }
      }
      else if (key === 'PartnershipCharter' && value && typeof value === 'object') {
        // Handle nested PartnershipCharter with PartnerLogos
        const partnershipCharter = value as NonNullable<IBannerFormData['PartnershipCharter']>;
        if (partnershipCharter.PartnerLogos && Array.isArray(partnershipCharter.PartnerLogos)) {
          const existingLogos: IMediaAsset[] = [];
          partnershipCharter.PartnerLogos.forEach((item) => {
            if (item instanceof File) {
              formData.append('newfile_PartnerLogos', item);
            } else {
              // Existing IMediaAsset
              existingLogos.push(item as IMediaAsset);
            }
          });
          
          // Send existing logos as JSON
          if (existingLogos.length > 0) {
            formData.append('existing_PartnerLogos', JSON.stringify(existingLogos));
          }
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
          } else if (typeof rf === 'object' && rf !== null && 'FileUrl' in (rf as object)) {
            // Existing IResourceFile - send as JSON to preserve
            formData.append('existing_ResourceFile', JSON.stringify(rf));
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

    const response = await authenticatedFetch(`/api/banners/${bannerId}`, {
      method: HTTP_METHODS.PUT,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.errors) {
        setValidationErrors(errorData.errors);
      }
      throw new Error(errorData.error || 'Failed to update banner');
    }

    await response.json();
    toastUtils.dismiss(toastId);
    successToast.update('Banner');
    router.push(`/banners/${bannerId}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    toastUtils.dismiss(toastId);
    errorToast.update('banner', errorMessage);
  } finally {
    setSaving(false);
  }
};

// Show loading while checking authorization
if (isChecking) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
    </div>
  );
}

// Don't render anything if not authorized
if (!isAuthorized) {
  return null;
}

if (loading) {
  return (
    <div className="min-h-screen bg-brand-q flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-a mx-auto mb-4"></div>
          <p className="text-brand-k">Loading banner...</p>
        </div>
    </div>
  );
}

if (!bannerData || !initialFormData) {
  return (
    <div className="min-h-screen bg-brand-q">
        <div className="nav-container">
          <div className="page-container">
            <div className="flex items-center justify-between h-16">
              <h1 className="heading-4">Banner Not Found</h1>
            </div>
          </div>
        </div>
        <div className="page-container section-spacing padding-top-zero">
          <div className="text-center py-12">
            <h2 className="heading-3 mb-4">Banner Not Found</h2>
            <p className="text-base text-brand-f mb-6">
              {error || 'The banner you are looking for does not exist or has been deleted.'}
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
  );
}

return (
  <div className="min-h-screen bg-brand-q">
      <BannerPageHeader pageType="edit" />

      <div className="page-container section-spacing padding-top-zero">
        {/* Full-width Preview at Top */}
        <div className="mb-8">
          {bannerData && (
            <BannerPreview data={bannerData} />
          )}
        </div>

        <div className="space-y-6">
          <BannerEditor
            initialData={initialFormData}
            onDataChange={setBannerData}
            onSave={handleSave}
            saving={saving}
            validationErrors={validationErrors}
          />
        </div>
      </div>
  </div>
);
}