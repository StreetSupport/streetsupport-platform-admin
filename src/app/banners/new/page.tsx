'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BannerEditor, IBannerFormData } from '@/components/banners/BannerEditor';
import { BannerPreview } from '@/components/banners/BannerPreview';
import { useAuthorization } from '@/hooks/useAuthorization';
import { validateBannerForm, transformErrorPath } from '@/schemas/bannerSchema';
import toastUtils, { successToast, errorToast, loadingToast } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { BannerPageHeader } from '@/components/banners/BannerPageHeader';
import { ROLES } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { IUploadedFile } from '@/types';

export default function NewBannerPage() {
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SUPER_ADMIN_PLUS, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/banners',
    autoRedirect: true
  });

  const router = useRouter();
  const [bannerData, setBannerData] = useState<IBannerFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ path: string; message: string; code: string }>>([]);

  const handleSave = async (data: IBannerFormData) => {
    const toastId = loadingToast.create('banner');

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
          }
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await authenticatedFetch('/api/banners', {
        method: HTTP_METHODS.POST,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          setValidationErrors(errorData.errors);
        }
        throw new Error(errorData.error || 'Failed to create banner');
      }

      const result = await response.json();
      toastUtils.dismiss(toastId);
      successToast.create('Banner');
      const newId = result?.data?._id || result?._id || result?.data?.id || result?.id;
      router.push(newId ? `/banners/${newId}` : '/banners');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create banner';
      toastUtils.dismiss(toastId);
      errorToast.generic(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/banners');
  };

  if (isChecking) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader title="Create New Banner" />
      <BannerPageHeader pageType="new" />

      <div className="mb-10">
        {bannerData && (
          <BannerPreview data={bannerData} />
        )}
      </div>

      <div className="page-container section-spacing padding-top-zero">
        <div className="space-y-6">
          <BannerEditor
            initialData={{}}
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
