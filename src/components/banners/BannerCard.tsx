'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IBanner, BannerTemplateType } from '@/types/banners/IBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Eye, Edit, Trash2, Calendar, Target, Users, Download, EyeOff } from 'lucide-react';
import { BackgroundType } from '@/types';

interface BannerCardProps {
  banner: IBanner;
  isLoading?: boolean;
  onDelete?: (banner: IBanner) => void;
  onToggleActive?: (bannerId: string) => void;
  isToggling?: boolean;
}

const BannerCard = React.memo(function BannerCard({ 
  banner, 
  isLoading = false,
  onDelete,
  onToggleActive,
  isToggling = false
}: BannerCardProps) {
  // const [showConfirmModal, setShowConfirmModal] = useState(false);
  // const [confirmConfig, setConfirmConfig] = useState<{
  //   message: string;
  //   onConfirm: () => void;
  // } | null>(null);

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

  const handleOpenActivateModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleActive) {
      onToggleActive(banner._id);
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
      <div 
        className="banner-thumbnail relative h-32 flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: banner.Background?.Type === BackgroundType.SOLID ? banner.Background.Value : undefined,
          backgroundImage: banner.Background?.Type === BackgroundType.GRADIENT ? `${banner.Background.Value}` : undefined
        }}
      >
        {banner.Logo?.Url && (
          <div className="relative h-16 w-32 z-10">
            <Image
              src={banner.Logo.Url}
              alt={banner.Logo.Alt || 'Banner logo'}
              fill
              className="object-contain"
            />
          </div>
        )}
        
        {/* Background Image if available */}
        {banner.Background?.Type === BackgroundType.IMAGE && (banner.BackgroundImage?.Url || banner.Background?.Value) && (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.BackgroundImage?.Url || banner.Background?.Value})` }}
            />
            {/* Overlay for image background */}
            {banner.Background?.Overlay && (
              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: banner.Background.Overlay.Colour,
                  opacity: banner.Background.Overlay.Opacity
                }}
                aria-hidden="true"
              />
            )}
          </>
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
        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/banners/${banner._id}`} className="flex-1">
            <Button variant="primary" size="sm" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>

          <Link href={`/banners/${banner._id}/edit`}>
            <Button variant="secondary" size="sm" title="Edit banner">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenActivateModal}
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

        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="heading-5 line-clamp-1">{banner.Title}</h3>
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
          <p className="text-small text-brand-l mb-3 line-clamp-1" title={banner.Description}>
            {banner.Description}
          </p>
        )}

        {/* Template-specific Stats */}
        {renderTemplateStats() && (
          <div className="mb-4 p-3 bg-brand-q rounded-lg">
            {renderTemplateStats()}
          </div>
        )}

        {/* Date Range Display - Only show if scheduled or EndDate is in future */}
        {banner.StartDate && banner.EndDate && (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(banner.EndDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        })() && (
          <div className="mb-4 p-3 bg-brand-q rounded-lg">
            <div className="flex items-center gap-2 text-xs text-brand-f mb-1">
              <Calendar className="w-3 h-3" />
              <span>Scheduled Activation</span>
            </div>
            <div className="text-sm font-medium text-brand-k">
              {formatDate(banner.StartDate)}
            </div>
            <div className="text-xs text-brand-f">until</div>
            <div className="text-sm font-medium text-brand-k">
              {formatDate(banner.EndDate)}
            </div>
          </div>
        )}

        <div className="text-xs text-brand-f space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created: {formatDate(banner.DocumentCreationDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Modified: {formatDate(banner.DocumentModifiedDate)}</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {/* {showConfirmModal && confirmConfig && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmConfig?.onConfirm || (() => {})}
          title="Confirm Action"
          message={confirmConfig?.message || ''}
          variant="danger"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
        />
      )} */}

    </div>
  );
});

export default BannerCard;
