'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IBanner, MediaType } from '@/types/banners/IBanner';
import { Button } from '@/components/ui/Button';
import { Eye, Edit, Trash2, Calendar, EyeOff, Youtube } from 'lucide-react';
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

  return (
    <div className={`card card-compact ${isLoading ? 'loading-card' : ''}`}>
      <div
        className="banner-thumbnail relative h-32 flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: banner.Background?.Type === BackgroundType.SOLID ? banner.Background.Value : undefined,
          backgroundImage: banner.Background?.Type === BackgroundType.GRADIENT ? `${banner.Background.Value}` : undefined,
          borderTop: banner.Border?.ShowBorder ? `6px solid ${banner.Border.Colour}` : undefined,
          borderBottom: banner.Border?.ShowBorder ? `6px solid ${banner.Border.Colour}` : undefined
        }}
      >
        {banner.MediaType === MediaType.YOUTUBE ? (
          <div className="flex items-center justify-center z-10">
            <Youtube className="w-12 h-12 text-white opacity-80" />
          </div>
        ) : banner.MainImage?.Url ? (
          <div className="relative h-full w-full z-10 flex items-center justify-center">
            <Image
              src={banner.MainImage.Url}
              alt={banner.MainImage.Alt || 'Banner image'}
              fill
              className="object-contain p-2"
            />
          </div>
        ) : null}

        {banner.Background?.Type === BackgroundType.IMAGE && (banner.BackgroundImage?.Url || banner.Background?.Value) && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.BackgroundImage?.Url || banner.Background?.Value})` }}
            />
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

        <div className="absolute top-2 right-2 flex gap-2">
          <span className={`service-tag ${banner.IsActive ? 'verified' : 'inactive'}`}>
            {banner.IsActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="absolute top-2 left-2">
          <span className="service-tag priority">
            Priority {banner.Priority}
          </span>
        </div>
      </div>

      <div className="p-4">
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

        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="heading-5 line-clamp-1">{banner.Title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {banner.MediaType === MediaType.YOUTUBE && (
            <span className="service-tag flex items-center gap-1">
              <Youtube className="w-3 h-3" />
              YouTube
            </span>
          )}

          {banner.LocationSlug && (
            <span className="service-tag location">
              {banner.LocationSlug}
            </span>
          )}
        </div>

        {banner.Description && (
          <p className="text-small text-brand-l mb-3 line-clamp-1" title={banner.Description}>
            {banner.Description}
          </p>
        )}

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
    </div>
  );
});

export default BannerCard;
