'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BannerPreview } from '@/components/banners/BannerPreview';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/Button';
import { successToast, errorToast, loadingToast, toastUtils } from '@/utils/toast';
import { IBanner, IBannerFormData, BannerTemplateType } from '@/types/IBanner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BannerPageHeader } from '@/components/banners/BannerPageHeader';

export default function BannerViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [banner, setBanner] = useState<IBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const data = await response.json();
      setBanner(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load banner';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!banner || !confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      return;
    }

    const toastId = loadingToast.delete('banner');
    
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/banners/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete banner');
      }

      toastUtils.dismiss(toastId);
      successToast.delete('Banner');
      router.push('/banners');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete banner';
      toastUtils.dismiss(toastId);
      errorToast.delete('banner', errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!banner) return;

    const toastId = loadingToast.update('banner status');
    setToggling(true);
    
    try {
      const response = await fetch(`/api/banners/${id}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update banner status');
      }

      const result = await response.json();
      setBanner(result.data);
      
      toastUtils.dismiss(toastId);
      successToast.update('Banner status');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update banner status';
      toastUtils.dismiss(toastId);
      errorToast.update('banner status', errorMessage);
    } finally {
      setToggling(false);
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
        <div className="min-h-screen bg-brand-q">
          <div className="nav-container">
            <div className="page-container">
              <div className="flex items-center justify-between h-16">
                <h1 className="heading-4">Loading Banner...</h1>
              </div>
            </div>
          </div>
          <div className="page-container section-spacing padding-top-zero">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-a"></div>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error || !banner) {
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
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
      <div className="min-h-screen bg-brand-q">
        <BannerPageHeader 
          pageType='view'
          banner={banner}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          isToggling={toggling}
          isDeleting={deleting}
        />

        <div className="page-container section-spacing padding-top-zero">
          {/* Banner Preview */}
          <div className="mb-8">
            <BannerPreview data={transformForPreview(banner)} />
          </div>

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
                      <dd className="text-base text-brand-l">{banner.LocationSlug}</dd>
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
                  
                  {banner.ShowDates && (
                    <>
                      {banner.StartDate && (
                        <div>
                          <dt className="text-small font-medium text-brand-k">Start Date</dt>
                          <dd className="text-base text-brand-l">{formatDate(banner.StartDate)}</dd>
                        </div>
                      )}
                      
                      {banner.EndDate && (
                        <div>
                          <dt className="text-small font-medium text-brand-k">End Date</dt>
                          <dd className="text-base text-brand-l">{formatDate(banner.EndDate)}</dd>
                        </div>
                      )}
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
                  
                  {banner.ResourceProject.ResourceFile.DownloadCount !== undefined && (
                    <div>
                      <dt className="text-small font-medium text-brand-k">Download Count</dt>
                      <dd className="text-base text-brand-l">{banner.ResourceProject.ResourceFile.DownloadCount}</dd>
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
        </div>
      </div>
    </RoleGuard>
  );
}
