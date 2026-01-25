'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BannerPreview } from '@/components/banners/BannerPreview';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import ActivateBannerModal from '@/components/banners/ActivateBannerModal';
import { errorToast, successToast, loadingToast, toastUtils } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { redirectToNotFound } from '@/utils/navigation';
import { IBanner, IBannerFormData, MediaType } from '@/types/banners/IBanner';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { BannerPageHeader } from '@/components/banners/BannerPageHeader';
import { ROLES } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function BannerViewPage() {
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SUPER_ADMIN_PLUS, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/banners',
    autoRedirect: true
  });

  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [banner, setBanner] = useState<IBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const { setBannerTitle } = useBreadcrumb();

  const fetchBanner = useCallback(async () => {
    if (!id || !isAuthorized) return;
    let redirected = false;

    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(`/api/banners/${id}`);
      const data = await response.json();

      if (!response.ok) {
        if (redirectToNotFound(response, router)) {
          redirected = true;
          return;
        }
        throw new Error(data.error || 'Failed to fetch banner');
      }

      const bannerData = data.data || data;
      setBanner(bannerData);
      if (bannerData?.Title) {
        setBannerTitle(bannerData.Title);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load banner';
      setError(message);
      errorToast.generic(message);
    } finally {
      if (!redirected) {
        setLoading(false);
      }
    }
  }, [id, isAuthorized, router, setBannerTitle]);

  useEffect(() => {
    if (isAuthorized) {
      fetchBanner();
    }

    return () => {
      setBannerTitle(null);
    };
  }, [isAuthorized, fetchBanner, setBannerTitle]);

  const handleDelete = async () => {
    if (!banner) return;
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setShowConfirmModal(false);
    const toastId = loadingToast.delete('banner');

    try {
      setDeleting(true);

      const response = await authenticatedFetch(`/api/banners/${id}`, {
        method: HTTP_METHODS.DELETE
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete banner');
      }

      toastUtils.dismiss(toastId);
      successToast.delete('Banner');
      router.push('/banners');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete banner';
      toastUtils.dismiss(toastId);
      errorToast.generic(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (bannerId: string, isActive: boolean, startDate?: Date, endDate?: Date) => {
    if (!banner) return;

    const toastId = loadingToast.update('banner status');
    setToggling(true);

    try {
      const response = await authenticatedFetch(`/api/banners/${bannerId}`, {
        method: HTTP_METHODS.PATCH,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          IsActive: isActive,
          StartDate: startDate,
          EndDate: endDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update banner status');
      }

      const result = await response.json();
      setBanner(result.data);

      toastUtils.dismiss(toastId);
      successToast.update('Banner status');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update banner status';
      toastUtils.dismiss(toastId);
      errorToast.generic(message);
      throw error;
    } finally {
      setToggling(false);
    }
  };

  const handleOpenActivateModal = () => {
    setShowActivateModal(true);
  };

  const transformForPreview = (banner: IBanner): IBannerFormData => {
    return {
      ...banner,
    } as IBannerFormData;
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return null;
  }

  if (error || !banner) {
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
        <PageHeader
          title="View Banner"
          actions={
            <BannerPageHeader
              pageType='view'
              banner={banner}
              onDelete={handleDelete}
              onToggleActive={handleOpenActivateModal}
              isToggling={toggling}
              isDeleting={deleting}
            />
          }
        />

        <div className="mb-8">
          <BannerPreview data={transformForPreview(banner)} />
        </div>

        <div className="page-container section-spacing padding-top-zero">
          <div className="bg-white rounded-lg border border-brand-q p-6">
            <h2 className="heading-5 mb-6">Banner Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="heading-6 mb-4">Basic Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-small font-medium text-brand-k">Title</dt>
                    <dd className="text-base text-brand-l">{banner.Title}</dd>
                  </div>

                  {banner.Subtitle && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Subtitle</dt>
                      <dd className="text-base text-brand-l">{banner.Subtitle}</dd>
                    </div>
                  )}

                  {banner.Description && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Description</dt>
                      <dd className="text-base text-brand-l">{banner.Description}</dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-small font-medium text-brand-k">Media Type</dt>
                    <dd className="text-base text-brand-l capitalize">
                      {banner.MediaType === MediaType.YOUTUBE ? 'YouTube Video' : 'Image'}
                    </dd>
                  </div>

                  {banner.MediaType === MediaType.YOUTUBE && banner.YouTubeUrl && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">YouTube URL</dt>
                      <dd className="text-base text-brand-l break-all">{banner.YouTubeUrl}</dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-small font-medium text-brand-k">Layout Style</dt>
                    <dd className="text-base text-brand-l capitalize">{banner.LayoutStyle}</dd>
                  </div>

                  <div>
                    <dt className="text-small font-medium text-brand-k">Text Colour</dt>
                    <dd className="text-base text-brand-l capitalize">{banner.TextColour}</dd>
                  </div>

                  <div>
                    <dt className="text-small font-medium text-brand-k">Priority</dt>
                    <dd className="text-base text-brand-l">{banner.Priority}</dd>
                  </div>

                  {banner.LocationSlug && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Location</dt>
                      <dd className="text-base text-brand-l">{banner.LocationName}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="heading-6 mb-4">Scheduling & Status</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-small font-medium text-brand-k">Status</dt>
                    <dd className={`text-base font-medium ${
                      banner.IsActive ? 'text-brand-b' : 'text-brand-f'
                    }`}>
                      {banner.IsActive ? 'Active' : 'Inactive'}
                    </dd>
                  </div>

                  {banner.StartDate && banner.EndDate && (
                    <>
                      <div>
                        <dt className="text-small font-medium text-brand-k">Start Date</dt>
                        <dd className="text-base text-brand-l">{formatDate(banner.StartDate)}</dd>
                      </div>

                      <div>
                        <dt className="text-small font-medium text-brand-k">End Date</dt>
                        <dd className="text-base text-brand-l">{formatDate(banner.EndDate)}</dd>
                      </div>
                    </>
                  )}

                  <div>
                    <dt className="text-small font-medium text-brand-k">Created</dt>
                    <dd className="text-base text-brand-l">{formatDate(banner.DocumentCreationDate)}</dd>
                  </div>

                  <div>
                    <dt className="text-small font-medium text-brand-k">Last Modified</dt>
                    <dd className="text-base text-brand-l">{formatDate(banner.DocumentModifiedDate)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {banner.UploadedFile && (
              <div className="mt-8 pt-6 border-t border-brand-q">
                <h3 className="heading-6 mb-4">Attached File</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-small font-medium text-brand-k">File Name</dt>
                    <dd className="text-base text-brand-l">{banner.UploadedFile.FileName}</dd>
                  </div>

                  {banner.UploadedFile.FileType && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">File Type</dt>
                      <dd className="text-base text-brand-l">{banner.UploadedFile.FileType}</dd>
                    </div>
                  )}

                  {banner.UploadedFile.FileSize && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">File Size</dt>
                      <dd className="text-base text-brand-l">{banner.UploadedFile.FileSize}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {banner.CtaButtons && banner.CtaButtons.length > 0 && (
              <div className="mt-8 pt-6 border-t border-brand-q">
                <h3 className="heading-6 mb-4">Call-to-Action Buttons</h3>
                <div className="space-y-4">
                  {banner.CtaButtons.map((cta, index) => (
                    <div key={index} className="bg-brand-q p-4 rounded-lg">
                      <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <dt className="text-small font-medium text-brand-k">Label</dt>
                          <dd className="text-base text-brand-l">{cta.Label}</dd>
                        </div>

                        <div>
                          <dt className="text-small font-medium text-brand-k">URL</dt>
                          <dd className="text-base text-brand-l break-all">{cta.Url}</dd>
                        </div>

                        <div>
                          <dt className="text-small font-medium text-brand-k">Variant</dt>
                          <dd className="text-base text-brand-l capitalize">{cta.Variant}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmDelete}
            title="Delete Banner"
            message="Are you sure you want to delete this banner? This action cannot be undone."
            variant="danger"
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />

          <ActivateBannerModal
            banner={banner}
            isOpen={showActivateModal}
            onClose={() => setShowActivateModal(false)}
            onActivate={handleToggleActive}
          />
      </div>
    </div>
  );
}
