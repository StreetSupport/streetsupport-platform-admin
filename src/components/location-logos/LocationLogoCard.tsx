'use client';

import React from 'react';
import { ILocationLogo } from '@/types/ILocationLogo';
import { Button } from '@/components/ui/Button';
import { Eye, Edit, Trash2, ExternalLink, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';

interface LocationLogoCardProps {
  logo: ILocationLogo;
  onDelete: (id: string) => void;
}

const LocationLogoCard = React.memo(function LocationLogoCard({ logo, onDelete }: LocationLogoCardProps) {
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
    onDelete(logo._id);
  };

  return (
    <div className="card card-compact">
      {/* Logo Preview */}
      {logo.LogoPath && (
        <div className="w-full h-48 bg-brand-q overflow-hidden">
          <img 
            src={logo.LogoPath} 
            alt={logo.DisplayName}
            className="w-full h-full object-contain p-4"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/location-logos/${logo._id}`} className="flex-1">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>
          
          <Link href={`/location-logos/${logo._id}/edit`}>
            <Button
              variant="secondary"
              size="sm"
              title="Edit location logo"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            title="Delete location logo"
            className="text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="mb-3">
          <h3 className="heading-5 mb-2 break-words">{logo.DisplayName}</h3>
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="service-tag template-type">
              <MapPin className="w-3 h-3 mr-1" />
              {logo.LocationName}
            </span>
          </div>
        </div>

        {/* URL */}
        {logo.Url && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-brand-f mb-1">Website</div>
            <a
              href={logo.Url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-a hover:text-brand-b hover:underline flex items-center gap-2 break-all"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              {logo.Url}
            </a>
          </div>
        )}

        {/* Created/Modified Dates */}
        <div className="text-xs text-brand-f space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created: {formatDate(logo.DocumentCreationDate)}</span>
          </div>
          {logo.DocumentModifiedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Modified: {formatDate(logo.DocumentModifiedDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default LocationLogoCard;
