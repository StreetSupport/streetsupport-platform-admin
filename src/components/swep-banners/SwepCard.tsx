'use client';

import React from 'react';
import Image from 'next/image';
import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';
import { Button } from '@/components/ui/Button';
import { Edit, Calendar, MapPin, Eye, CheckCircle, XCircle, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface SwepCardProps {
  swep: ISwepBanner;
  onActivate: (swep: ISwepBanner) => void;
  isLoading?: boolean;
}

const SwepCard = React.memo(function SwepCard({ swep, onActivate, isLoading = false }: SwepCardProps) {
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleActivate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onActivate(swep);
  };

  return (
    <div className={`card card-compact ${isLoading ? 'loading-card' : ''}`}>
      {/* Image Preview */}
      {swep.Image && (
        <div className="w-full h-48 bg-brand-q overflow-hidden relative">
          <Image 
            src={swep.Image} 
            alt={swep.Title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Action Buttons - First Row */}
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/swep-banners/${swep.LocationSlug}`} className="flex-1">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              disabled={isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>
          
          <Link href={`/swep-banners/${swep.LocationSlug}/edit`}>
            <Button
              variant="secondary"
              size="sm"
              title="Edit SWEP banner"
              disabled={isLoading}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleActivate}
            disabled={isLoading}
            title={swep.IsActive ? 'Deactivate SWEP banner' : 'Activate SWEP banner'}
            className={swep.IsActive ? 'text-brand-g border-brand-g hover:bg-brand-g hover:text-white' : 'text-brand-b border-brand-b hover:bg-brand-b hover:text-white'}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : swep.IsActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Header */}
        <div className="mb-3">
          <h3 className="heading-5 mb-2 break-words">{swep.Title}</h3>
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="service-tag template-type">
              <MapPin className="w-3 h-3 mr-1" />
              {swep.LocationName}
            </span>
            <span className={`service-tag ${swep.IsActive ? 'verified' : 'inactive'}`}>
              {swep.IsActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Short Message */}
        <p className="text-sm text-brand-l mb-3 line-clamp-2">
          {swep.ShortMessage}
        </p>

        {/* Date Range Display - Only show if scheduled or SwepActiveUntil is in future */}
        {swep.SwepActiveFrom && swep.SwepActiveUntil && (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(swep.SwepActiveUntil);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        })() && (
          <div className="mb-4 p-3 bg-brand-q rounded-lg">
            <div className="flex items-center gap-2 text-xs text-brand-f mb-1">
              <Calendar className="w-3 h-3" />
              <span>Scheduled Activation</span>
            </div>
            <div className="text-sm font-medium text-brand-k">
              {formatDate(swep.SwepActiveFrom)}
            </div>
            <div className="text-xs text-brand-f">until</div>
            <div className="text-sm font-medium text-brand-k">
              {formatDate(swep.SwepActiveUntil)}
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-brand-f mb-1">Emergency Contact</div>
          <div className="text-sm font-medium text-brand-k">{swep.EmergencyContact.Phone}</div>
          <div className="text-xs text-brand-l">{swep.EmergencyContact.Email}</div>
          <div className="text-xs text-brand-f mt-1">{swep.EmergencyContact.Hours}</div>
        </div>

        {/* Created/Modified Dates */}
        <div className="text-xs text-brand-f space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created: {formatDate(swep.DocumentCreationDate)}</span>
          </div>
          {swep.DocumentModifiedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Modified: {formatDate(swep.DocumentModifiedDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SwepCard;
