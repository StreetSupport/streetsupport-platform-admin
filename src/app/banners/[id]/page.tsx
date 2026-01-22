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
import { IBanner, IBannerFormData, BannerTemplateType } from '@/types/banners/IBanner';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { BannerPageHeader } from '@/components/banners/BannerPageHeader';
import { ROLES } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function BannerViewPage() {
  // Check authorization FIRST
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
  const [downloadCount, setDownloadCount] = useState<number | undefined>(undefined);
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
      // Set banner title for breadcrumbs
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
    
    // Cleanup: Clear banner title when component unmounts
    return () => {
      setBannerTitle(null);
    };
  }, [isAuthorized, fetchBanner, setBannerTitle]);

  // Fetch download count from Google Analytics for resource-project banners
  useEffect(() => {
    const fetchDownloadCount = async () => {
      if (!banner || banner.TemplateType !== BannerTemplateType.RESOURCE_PROJECT) {
        return;
      }
      
      try {
        const resourceFile = banner.ResourceProject?.ResourceFile;
        const ctaButtons = banner.CtaButtons;
        const downloadButton = ctaButtons?.[0];
        
        if (downloadButton) {
          const params = new URLSearchParams({
            banner_analytics_id: banner._id,
            fileName: banner.Title,
            ...(resourceFile?.FileType && { fileType: resourceFile.FileType }),
            ...(resourceFile?.ResourceType && { resourceType: resourceFile.ResourceType }),
          });

          const response = await fetch(`/api/analytics/download-count?${params.toString()}`);
          
          if (response.ok) {
            const data = await response.json();
            setDownloadCount(data.count);
          }
        }
      } catch (error) {
        console.error('Error fetching download count:', error);
      }
    };

    fetchDownloadCount();
  }, [banner]);

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
      throw error; // Re-throw for modal error handling
    } finally {
      setToggling(false);
    }
  };

  const handleOpenActivateModal = () => {
    setShowActivateModal(true);
  };
  
  // Transform IBanner to IBannerFormData for preview
  const transformForPreview = (banner: IBanner): IBannerFormData => {
    return {
      ...banner,
      // Remove audit fields that aren't in IBannerFormData
    } as IBannerFormData;
  };

  const getTemplateTypeLabel = (type: BannerTemplateType): string => {
    switch (type) {
      case BannerTemplateType.GIVING_CAMPAIGN:
        return 'Giving Campaign';
      case BannerTemplateType.PARTNERSHIP_CHARTER:
        return 'Partnership Charter';
      case BannerTemplateType.RESOURCE_PROJECT:
        return 'Resource Project';
      default:
        return type;
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Show loading while checking authorization or fetching data
  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized
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

        {/* Full-width Preview at Top - Outside page-container */}
        <div className="mb-8">
          <BannerPreview data={transformForPreview(banner)} />
        </div>

        <div className="page-container section-spacing padding-top-zero">
          {/* Banner Details */}
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
                    <dt className="text-small font-medium text-brand-k">Template Type</dt>
                    <dd className="text-base text-brand-l">{getTemplateTypeLabel(banner.TemplateType)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-small font-medium text-brand-k">Layout Style</dt>
                    <dd className="text-base text-brand-l capitalize">{banner.LayoutStyle}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-small font-medium text-brand-k">Text Color</dt>
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
                  
                  {banner.BadgeText && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Badge Text</dt>
                      <dd className="text-base text-brand-l">{banner.BadgeText}</dd>
                    </div>
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

            {/* Template-specific details */}
            {banner.GivingCampaign && (
              <div className="mt-8 pt-6 border-t border-brand-q">
                <h3 className="heading-6 mb-4">Giving Campaign Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {banner.GivingCampaign.UrgencyLevel && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Urgency Level</dt>
                      <dd className="text-base text-brand-l capitalize">{banner.GivingCampaign.UrgencyLevel}</dd>
                    </div>
                  )}
                  
                  {banner.GivingCampaign.CampaignEndDate && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Campaign End Date</dt>
                      <dd className="text-base text-brand-l">{formatDate(banner.GivingCampaign.CampaignEndDate)}</dd>
                    </div>
                  )}
                  
                  {banner.GivingCampaign.DonationGoal && (
                    <>
                      <div>
                        <dt className="text-small font-medium text-brand-k">Donation Target</dt>
                        <dd className="text-base text-brand-l">£{banner.GivingCampaign.DonationGoal.Target?.toLocaleString()}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-small font-medium text-brand-k">Current Amount</dt>
                        <dd className="text-base text-brand-l">£{banner.GivingCampaign.DonationGoal.Current?.toLocaleString()}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            )}

            {banner.PartnershipCharter && (
              <div className="mt-8 pt-6 border-t border-brand-q">
                <h3 className="heading-6 mb-4">Partnership Charter Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {banner.PartnershipCharter.CharterType && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Charter Type</dt>
                      <dd className="text-base text-brand-l capitalize">{banner.PartnershipCharter.CharterType.replace('-', ' ')}</dd>
                    </div>
                  )}
                  
                  {banner.PartnershipCharter.SignatoriesCount !== undefined && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Signatories Count</dt>
                      <dd className="text-base text-brand-l">{banner.PartnershipCharter.SignatoriesCount}</dd>
                    </div>
                  )}
                  
                  {banner.PartnershipCharter.PartnerLogos && banner.PartnershipCharter.PartnerLogos.length > 0 && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Partner Logos</dt>
                      <dd className="text-base text-brand-l">{banner.PartnershipCharter.PartnerLogos.length} logo(s)</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {banner.ResourceProject && banner.ResourceProject.ResourceFile && (
              <div className="mt-8 pt-6 border-t border-brand-q">
                <h3 className="heading-6 mb-4">Resource Project Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-small font-medium text-brand-k">Resource File</dt>
                    <dd className="text-base text-brand-l">{banner.ResourceProject.ResourceFile.FileName}</dd>
                  </div>
                  
                  {banner.ResourceProject.ResourceFile.FileType && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">File Type</dt>
                      <dd className="text-base text-brand-l">{banner.ResourceProject.ResourceFile.FileType}</dd>
                    </div>
                  )}
                  
                  {banner.ResourceProject.ResourceFile.FileSize && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">File Size</dt>
                      <dd className="text-base text-brand-l">{banner.ResourceProject.ResourceFile.FileSize}</dd>
                    </div>
                  )}
                  
                  {downloadCount !== undefined && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Download Count (GA4)</dt>
                      <dd className="text-base text-brand-l">{downloadCount.toLocaleString('en-GB')}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* CTA Buttons */}
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

          {/* Confirmation Modal */}
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

          {/* Activate/Deactivate Modal */}
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
