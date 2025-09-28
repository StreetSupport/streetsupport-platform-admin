'use client';

import React from 'react';
import Link from 'next/link';
import { IBanner, BannerTemplateType } from '@/types/IBanner';
import { Button } from '@/components/ui/Button';
import { Eye, Edit, Trash2, Calendar, Target, Users, Download, EyeOff } from 'lucide-react';

interface BannerCardProps {
  banner: IBanner;
  isLoading?: boolean;
  onDelete?: (banner: IBanner) => void;
  onToggleActive?: (banner: IBanner) => void;
  isToggling?: boolean;
}

const BannerCard = React.memo(function BannerCard({ 
  banner, 
  isLoading = false,
  onDelete,
  onToggleActive,
  isToggling = false
}: BannerCardProps) {

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

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(banner);
    }
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const today = new Date();
    const startDate = banner.StartDate ? new Date(banner.StartDate) : null;
    const endDate = banner.EndDate ? new Date(banner.EndDate) : null;
    const activating = !banner.IsActive;

    let alertMessage = '';

    if (activating) {
      // Warn if activating outside the allowed window (only when that boundary exists)
      const beforeStart = startDate && today < startDate;
      const afterEnd = endDate && today > endDate;
      if (beforeStart || afterEnd) {
        alertMessage = 'You are activating a banner that is outside its scheduled date range. Are you sure you want to activate it now?';
      }
    } else {
      // Deactivating: warn if currently within the effective active window
      const notBeforeStart = !startDate || today >= startDate;
      const notAfterEnd = !endDate || today <= endDate;
      if (notBeforeStart && notAfterEnd) {
        alertMessage = 'You are deactivating a banner that is currently within its scheduled date range. Are you sure?';
      }
    }

    if (alertMessage) {
      if (window.confirm(alertMessage)) {
        onToggleActive?.(banner);
      }
    } else {
      onToggleActive?.(banner);
    }
  };

  // Template-specific stats
  const renderTemplateStats = () => {
    switch (banner.TemplateType) {
      case BannerTemplateType.GIVING_CAMPAIGN:
        if (banner.GivingCampaign?.DonationGoal) {
          const current = banner.GivingCampaign.DonationGoal.Current || 0;
          const target = banner.GivingCampaign.DonationGoal.Target || 0;
          const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
          
          return (
            <div className="template-stats giving-campaign">
              <div className="flex items-center gap-2 text-xs text-brand-f mb-1">
                <Target className="w-3 h-3" />
                <span>Donation Progress</span>
              </div>
              <div className="text-sm font-medium text-brand-k">
                £{current.toLocaleString()} / £{target.toLocaleString()}
              </div>
              <div className="w-full bg-brand-q rounded-full h-2 mt-1">
                <div 
                  className="bg-brand-b h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-brand-f mt-1">{percentage}% funded</div>
            </div>
          );
        }
        break;
        
      case BannerTemplateType.PARTNERSHIP_CHARTER:
        if (banner.PartnershipCharter?.SignatoriesCount !== undefined) {
          return (
            <div className="template-stats partnership-charter">
              <div className="flex items-center gap-2 text-xs text-brand-f mb-1">
                <Users className="w-3 h-3" />
                <span>Signatories</span>
              </div>
              <div className="text-sm font-medium text-brand-k">
                {banner.PartnershipCharter.SignatoriesCount} signatures
              </div>
              {banner.PartnershipCharter.PartnerLogos && banner.PartnershipCharter.PartnerLogos.length > 0 && (
                <div className="text-xs text-brand-f mt-1">
                  {banner.PartnershipCharter.PartnerLogos.length} partner logo(s)
                </div>
              )}
            </div>
          );
        }
        break;
        
      case BannerTemplateType.RESOURCE_PROJECT:
        if (banner.ResourceProject?.ResourceFile) {
          return (
            <div className="template-stats resource-project">
              <div className="flex items-center gap-2 text-xs text-brand-f mb-1">
                <Download className="w-3 h-3" />
                <span>Resource File</span>
              </div>
              <div className="text-sm font-medium text-brand-k truncate" title={banner.ResourceProject.ResourceFile.FileName}>
                {banner.ResourceProject.ResourceFile.FileName || 'Resource file available'}
              </div>
              <div className="text-xs text-brand-f mt-1">
                Downloads: {banner.ResourceProject.ResourceFile.DownloadCount || 0}
              </div>
            </div>
          );
        }
        break;
    }
    return null;
  };

  return (
    <div className={`card card-compact ${isLoading ? 'loading-card' : ''}`}>
      {/* Banner Preview/Thumbnail */}
      <div className="banner-thumbnail relative h-32 bg-gradient-to-r from-brand-a to-brand-b flex items-center justify-center overflow-hidden rounded-t-lg">
        {banner.Logo?.Url && (
          <img
            src={banner.Logo.Url}
            alt={banner.Logo.Alt || 'Banner logo'}
            className="h-16 w-auto object-contain z-10"
          />
        )}
        
        {/* Background Image if available */}
        {banner.BackgroundImage?.Url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${banner.BackgroundImage.Url})` }}
          />
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2 flex gap-2">
          <span className={`service-tag ${banner.IsActive ? 'verified' : 'inactive'}`}>
            {banner.IsActive ? 'Active' : 'Inactive'}
          </span>
          
          {banner.GivingCampaign?.UrgencyLevel && (
            <span className={`service-tag urgent ${banner.GivingCampaign.UrgencyLevel}`}>
              {banner.GivingCampaign.UrgencyLevel.toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Priority Badge */}
        <div className="absolute top-2 left-2">
          <span className="service-tag priority">
            Priority {banner.Priority}
          </span>
        </div>
      </div>

      {/* Banner Info */}
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="heading-5 line-clamp-2">{banner.Title}</h3>
          </div>
        </div>

        {/* Template Type */}
        <div className="flex items-center gap-2 mb-3">
          <span className="service-tag template-type">
            {getTemplateTypeLabel(banner.TemplateType)}
          </span>
          
          {banner.LocationSlug && (
            <span className="service-tag location">
              {banner.LocationSlug}
            </span>
          )}
        </div>

        {/* Description */}
        {banner.Description && (
          <p className="text-small text-brand-l mb-3 line-clamp-2">
            {banner.Description}
          </p>
        )}

        {/* Template-specific Stats */}
        {renderTemplateStats() && (
          <div className="mb-4 p-3 bg-brand-q rounded-lg">
            {renderTemplateStats()}
          </div>
        )}

        {/* Dates */}
        {(banner.StartDate || banner.EndDate) && (
          <div className="text-xs text-brand-f mb-4 space-y-1">
            {banner.StartDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-b" />
                <span>Starts: {formatDate(banner.StartDate)}</span>
              </div>
            )}
            {banner.EndDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-g" />
                <span>Ends: {formatDate(banner.EndDate)}</span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-brand-f mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Modified: {formatDate(banner.DocumentModifiedDate)}</span>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link href={`/banners/${banner._id}`} className="flex-1">
            <Button variant="primary" size="sm" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={isToggling}
            title={banner.IsActive ? 'Deactivate banner' : 'Activate banner'}
            className={banner.IsActive ? 'text-brand-g border-brand-g hover:bg-brand-g hover:text-white' : 'text-brand-b border-brand-b hover:bg-brand-b hover:text-white'}
          >
            {isToggling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : banner.IsActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          
          <Link href={`/banners/${banner._id}/edit`}>
            <Button variant="secondary" size="sm" title="Edit banner">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            title="Delete banner"
            className="text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default BannerCard;
