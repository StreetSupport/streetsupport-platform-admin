'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BannerPreview } from '@/components/banners/BannerPreview';
import RoleGuard from '@/components/auth/RoleGuard';
import { ArrowLeft, Edit, Trash, Eye, EyeOff } from 'lucide-react';
import { IBanner } from '@/types';

export default function BannerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bannerId = params.id as string;
  
  const [banner, setBanner] = useState<IBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (bannerId) {
      fetchBanner();
    }
  }, [bannerId]);

  const fetchBanner = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/banners/${bannerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch banner');
      }
      
      const result = await response.json();
      if (result.success) {
        setBanner(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch banner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banner');
    } finally {
      setLoading(false);
    }
  };

  const toggleBannerStatus = async () => {
    if (!banner) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/banners/${bannerId}/toggle`, {
        method: 'PATCH'
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle banner status');
      }
      
      setBanner(prev => prev ? { ...prev, IsActive: !prev.IsActive } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteBanner = async () => {
    if (!banner || !confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete banner');
      }
      
      router.push('/banners');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete banner');
      setActionLoading(false);
    }
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'giving-campaign': return 'service-tag open';
      case 'partnership-charter': return 'service-tag verified';
      case 'resource-project': return 'service-tag limited';
      default: return 'service-tag closed';
    }
  };

  const formatTemplateType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
        <div className="page-container section-spacing flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </RoleGuard>
    );
  }

  if (error || !banner) {
    return (
      <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
        <div className="page-container section-spacing flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="heading-2 mb-4">Error</h1>
            <p className="text-body mb-4">{error || 'Banner not found'}</p>
            <Link href="/banners">
              <Button>Back to Banners</Button>
            </Link>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
      <div className="page-container section-spacing space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={toggleBannerStatus}
              disabled={actionLoading}
              className={`flex items-center gap-2 ${
                banner.IsActive ? 'text-brand-g hover:text-red-700' : 'text-brand-b hover:text-brand-c'
              }`}
            >
              {banner.IsActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {banner.IsActive ? 'Deactivate' : 'Activate'}
            </Button>
            
            <Link href={`/banners/${bannerId}/edit`}>
              <Button
                className="flex items-center gap-2"
                onClick={() => {
                  try {
                    console.log(sessionStorage);
                    // Persist full banner payload for edit page prefill
                    sessionStorage.setItem('editBannerPrefill', JSON.stringify(banner));
                  } catch (e) {
                    // Non-fatal: if storage fails, edit page will fetch
                    console.warn('Failed to persist banner prefill to sessionStorage', e);
                  }
                }}
              >
                <Edit className="h-4 w-4" />
                Edit Banner
              </Button>
            </Link>
            
            <Button
              variant="outline"
              onClick={deleteBanner}
              disabled={actionLoading}
              className="text-brand-g hover:text-red-700 flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card card-compact border-brand-g bg-red-50">
            <p className="text-small text-brand-g">{error}</p>
          </div>
        )}

        {/* Banner Details and Preview */}
        <div className="card-grid cols-2">
          {/* Banner Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="card">
              <div className="card-header">
                <h2 className="heading-5">Banner Information</h2>
              </div>
              <div className="card-content space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-small font-medium text-brand-k">Template Type</label>
                    <div className="mt-1">
                      <Badge className={getTemplateTypeColor(banner.TemplateType)}>
                        {formatTemplateType(banner.TemplateType)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-small font-medium text-brand-k">Status</label>
                    <div className="mt-1">
                      <Badge className={banner.IsActive ? 'service-tag open' : 'service-tag closed'}>
                        {banner.IsActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-small font-medium text-brand-k">Priority</label>
                    <p className="text-body">{banner.Priority}</p>
                  </div>
                  <div>
                    <label className="text-small font-medium text-brand-k">Location</label>
                    <p className="text-body">{banner.LocationSlug || 'All Locations'}</p>
                  </div>
                  <div>
                    <label className="text-small font-medium text-brand-k">Layout Style</label>
                    <p className="text-body">{banner.LayoutStyle}</p>
                  </div>
                  <div>
                    <label className="text-small font-medium text-brand-k">Text Color</label>
                    <p className="text-body">{banner.TextColour}</p>
                  </div>
                </div>

                {banner.Subtitle && (
                  <div>
                    <label className="text-small font-medium text-brand-k">Subtitle</label>
                    <p className="text-body">{banner.Subtitle}</p>
                  </div>
                )}

                {banner.Description && (
                  <div>
                    <label className="text-small font-medium text-brand-k">Description</label>
                    <p className="text-body">{banner.Description}</p>
                  </div>
                )}

                {banner.BadgeText && (
                  <div>
                    <label className="text-small font-medium text-brand-k">Badge Text</label>
                    <p className="text-body">{banner.BadgeText}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Template-specific Information */}
            {banner.TemplateType === 'giving-campaign' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="heading-5">Campaign Details</h2>
                </div>
                <div className="card-content space-y-4">
                  {banner.UrgencyLevel && (
                    <div>
                      <label className="text-small font-medium text-brand-k">Urgency Level</label>
                      <div className="mt-1">
                        <Badge className={
                          banner.UrgencyLevel === 'critical' ? 'service-tag emergency' :
                          banner.UrgencyLevel === 'high' ? 'service-tag emergency' :
                          banner.UrgencyLevel === 'medium' ? 'service-tag limited' :
                          'service-tag open'
                        }>
                          {banner.UrgencyLevel.charAt(0).toUpperCase() + banner.UrgencyLevel.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {banner.DonationGoal && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-small font-medium text-brand-k">Target Amount</label>
                        <p className="text-body">£{(banner.DonationGoal.Target ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-small font-medium text-brand-k">Current Amount</label>
                        <p className="text-body">£{(banner.DonationGoal.Current ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {banner.CampaignEndDate && (
                    <div>
                      <label className="text-small font-medium text-brand-k">Campaign End Date</label>
                      <p className="text-body">{new Date(banner.CampaignEndDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {banner.TemplateType === 'partnership-charter' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="heading-5">Charter Details</h2>
                </div>
                <div className="card-content space-y-4">
                  {banner.CharterType && (
                    <div>
                      <label className="text-small font-medium text-brand-k">Charter Type</label>
                      <p className="text-body">{banner.CharterType.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}</p>
                    </div>
                  )}
                  
                  {banner.SignatoriesCount !== undefined && (
                    <div>
                      <label className="text-small font-medium text-brand-k">Signatories Count</label>
                      <p className="text-body">{banner.SignatoriesCount}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {banner.TemplateType === 'resource-project' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="heading-5">Resource Details</h2>
                </div>
                <div className="card-content space-y-4">
                  {banner.ResourceFile?.ResourceType && (
                    <div>
                      <label className="text-small font-medium text-brand-k">Resource Type</label>
                      <p className="text-body">{banner.ResourceFile.ResourceType.charAt(0).toUpperCase() + banner.ResourceFile.ResourceType.slice(1)}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {banner.ResourceFile?.FileSize && (
                      <div>
                        <label className="text-small font-medium text-brand-k">File Size</label>
                        <p className="text-body">{banner.ResourceFile.FileSize}</p>
                      </div>
                    )}
                    
                    {banner.ResourceFile?.FileType && (
                      <div>
                        <label className="text-small font-medium text-brand-k">File Type</label>
                        <p className="text-body">{banner.ResourceFile.FileType}</p>
                      </div>
                    )}
                  </div>
                  
                  {banner.ResourceFile?.DownloadCount !== undefined && (
                    <div>
                      <label className="text-small font-medium text-brand-k">Download Count</label>
                      <p className="text-body">{banner.ResourceFile.DownloadCount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            {banner.CtaButtons && banner.CtaButtons.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="heading-5">Call-to-Action Buttons</h2>
                </div>
                <div className="card-content space-y-3">
                  {banner.CtaButtons.map((button, index) => (
                    <div key={index} className="p-3 border border-brand-q rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-small font-medium text-brand-k">{button.Label}</p>
                          <p className="text-caption text-brand-f">{button.Url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="service-tag closed">{button.Variant}</Badge>
                          {button.External && (
                            <Badge className="service-tag limited">External</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Banner Preview */}
          <div className="space-y-6">
            <BannerPreview data={banner} />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
