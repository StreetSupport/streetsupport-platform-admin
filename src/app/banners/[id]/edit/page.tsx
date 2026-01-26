'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BannerEditor, IBannerFormData } from '@/components/banners/BannerEditor';
import { BannerPreview } from '@/components/banners/BannerPreview';
import { useAuthorization } from '@/hooks/useAuthorization';
import { validateBannerForm, transformErrorPath } from '@/schemas/bannerSchema';
import { successToast, errorToast, loadingToast, toastUtils } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { BannerPageHeader } from '@/components/banners/BannerPageHeader';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { IBanner, IUploadedFile } from '@/types';
import { ROLES } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { redirectToNotFound } from '@/utils/navigation';
import { MediaType } from '@/types/banners/IBanner';

function transformBannerToFormData(banner: IBanner): IBannerFormData {
  return {
    _id: banner._id,
    Title: banner.Title || '',
    Subtitle: banner.Subtitle || '',
    Description: banner.Description || '',
    MediaType: banner.MediaType || MediaType.IMAGE,
    YouTubeUrl: banner.YouTubeUrl || '',
    LayoutStyle: banner.LayoutStyle,
    TextColour: banner.TextColour,
    Background: banner.Background,
    CtaButtons: banner.CtaButtons || [],
    IsActive: banner.IsActive,
    Priority: banner.Priority,
    TrackingContext: banner.TrackingContext,
    LocationSlug: banner.LocationSlug || '',
    LocationName: banner.LocationName || '',
    StartDate: banner.StartDate ? new Date(banner.StartDate) : undefined,
    EndDate: banner.EndDate ? new Date(banner.EndDate) : undefined,
    Logo: banner.Logo || null,
    BackgroundImage: banner.BackgroundImage || null,
    MainImage: banner.MainImage || null,
    UploadedFile: banner.UploadedFile || null,
  };
}

export default function EditBannerPage() {
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SUPER_ADMIN_PLUS, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
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
  const { setBannerTitle } = useBreadcrumb();

  const fetchBanner = useCallback(async () => {
    let redirected = false;

    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`/api/banners/${bannerId}`);
      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        if (redirectToNotFound(response, router)) {
          redirected = true;
          return;
        }

        const errorMessage = (result && (result.error || result.message)) || 'Failed to fetch banner';
        throw new Error(errorMessage);
      }

      const banner = result.data as IBanner;

      const formData = transformBannerToFormData(banner);
      setInitialFormData(formData);
      setBannerData(formData);
      setBannerTitle(banner.Title);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load banner';
      setError(message);
      errorToast.generic(message);
    } finally {
      if (!redirected) {
        setLoading(false);
      }
    }
  }, [bannerId, router, setBannerTitle]);

  useEffect(() => {
    if (!isAuthorized) return;

    if (bannerId) {
      fetchBanner();
    }

    return () => {
      setBannerTitle(null);
    };
  }, [isAuthorized, bannerId, setBannerTitle, fetchBanner]);

  const handleSave = async (data: IBannerFormData) => {
    const toastId = loadingToast.update('banner');

    try {
      setSaving(true);
      setValidationErrors([]);

      const validation = validateBannerForm(data);
      if (!validation.success) {
        const transformedErrors = validation.errors.map(error => ({
          ...error,
          path: transformErrorPath(error.path)
        }));
        setValidationErrors(transformedErrors);
        toastUtils.dismiss(toastId);
        errorToast.validation('Please fix the validation errors below');
        return;
      }

      const formData = new FormData();

      Object.keys(data).forEach(key => {
        const typedKey = key as keyof IBannerFormData;
        const value = data[typedKey];

        if (key === 'Logo' || key === 'BackgroundImage' || key === 'MainImage') {
          if (value instanceof File) {
            formData.append(`newfile_${key}`, value);
          } else if (value && typeof value === 'object' && 'File' in value) {
            const mediaAsset = value as { File: File; Width?: number; Height?: number };
            formData.append(`newfile_${key}`, mediaAsset.File);

            const metadata = { ...mediaAsset };
            delete (metadata as { File?: unknown }).File;
            if (Object.keys(metadata).length > 0) {
              formData.append(`newmetadata_${key}`, JSON.stringify(metadata));
            }
          } else if (value && typeof value === 'object' && 'Url' in value) {
            formData.append(`existing_${key}`, JSON.stringify(value));
          }
        } else if (key === 'UploadedFile' && value) {
          type UploadedFileWithFile = IUploadedFile & { File: File };
          const uploadedFile = value as unknown;
          const hasEmbeddedFile = typeof uploadedFile === 'object' && uploadedFile !== null && 'File' in (uploadedFile as object) && (uploadedFile as UploadedFileWithFile).File instanceof File;

          if (hasEmbeddedFile) {
            formData.append('newfile_UploadedFile', (uploadedFile as UploadedFileWithFile).File);

            const metadata = { ...(uploadedFile as object) };
            delete (metadata as { File?: unknown }).File;
            formData.append('newmetadata_UploadedFile', JSON.stringify(metadata));
          } else if (typeof uploadedFile === 'object' && uploadedFile !== null && 'FileUrl' in (uploadedFile as object)) {
            formData.append('existing_UploadedFile', JSON.stringify(uploadedFile));
          }
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update banner';
      toastUtils.dismiss(toastId);
      errorToast.generic(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/banners');
  };

  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return null;
  }

  if (!bannerData || !initialFormData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ErrorState
          title="Error Loading Banner"
          message={error || 'Banner Not Found'}
          onRetry={fetchBanner}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader title="Edit Banner" />
      <BannerPageHeader pageType="edit" />

      <div className="mb-10">
        {bannerData && (
          <BannerPreview data={bannerData} />
        )}
      </div>

      <div className="page-container section-spacing padding-top-zero">
        <div className="space-y-6">
          <BannerEditor
            initialData={initialFormData}
            onDataChange={setBannerData}
            onSave={handleSave}
            saving={saving}
            validationErrors={validationErrors}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
