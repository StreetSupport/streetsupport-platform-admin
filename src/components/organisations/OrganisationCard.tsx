'use client';

import React from 'react';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import { Button } from '@/components/ui/Button';
import { Edit, Calendar, MapPin, Eye, CheckCircle, XCircle, UserPlus, FileText } from 'lucide-react';
import { decodeText } from '@/utils/htmlDecode';

interface OrganisationCardProps {
  organisation: IOrganisation;
  isLoading?: boolean;
  onView?: (organisation: IOrganisation) => void;
  onEdit?: (organisation: IOrganisation) => void;
  onTogglePublished?: (organisation: IOrganisation) => void;
  onToggleVerified?: (organisation: IOrganisation) => void;
  onAddUser?: (organisation: IOrganisation) => void;
  onViewNotes?: (organisation: IOrganisation) => void;
  onDisableClick?: (organisation: IOrganisation) => void;
  isTogglingPublish?: boolean;
  isTogglingVerify?: boolean;
  isOrgAdmin?: boolean;
}

const OrganisationCard = React.memo(function OrganisationCard({ 
  organisation, 
  isLoading = false,
  onView,
  onEdit,
  onTogglePublished,
  onToggleVerified,
  onAddUser,
  onViewNotes,
  onDisableClick,
  isTogglingPublish = false,
  isTogglingVerify = false,
  isOrgAdmin = false
}: OrganisationCardProps) {

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate days since last update
  const daysSinceUpdate = React.useMemo(() => {
    if (!organisation.DocumentModifiedDate) return 0;
    const lastUpdate = new Date(organisation.DocumentModifiedDate);
    const today = new Date();
    return Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  }, [organisation.DocumentModifiedDate]);

  // Get warning level
  const getWarningLevel = () => {
    if (daysSinceUpdate >= 100) return 'expired';
    if (daysSinceUpdate >= 90) return 'warning';
    if (daysSinceUpdate >= 75) return 'info';
    return 'ok';
  };

  const warningLevel = getWarningLevel();

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onView) {
      onView(organisation);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(organisation);
    }
  };


  const handleTogglePublished = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Show disable modal only when disabling
    if (organisation.IsPublished) {
      onDisableClick?.(organisation);
    } else {
      // Publish without confirmation
      onTogglePublished?.(organisation);
    }
  };

  const handleToggleVerified = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleVerified) {
      onToggleVerified(organisation);
    }
  };

  const handleAddUser = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddUser) {
      onAddUser(organisation);
    }
  };

  const handleViewNotes = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewNotes) {
      onViewNotes(organisation);
    }
  };

  // Format locations - show first 3 and then "..."
  const displayLocations = organisation.AssociatedLocationIds.slice(0, 3);
  const hasMoreLocations = organisation.AssociatedLocationIds.length > 3;

  return (
    <div className={`card card-compact ${isLoading ? 'loading-card' : ''}`}>
      {/* Organisation Header */}
      <div className="p-4">
        {/* Action Buttons - First Row */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleView}
            className="flex-1"
            disabled={isLoading}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
            title="Edit organisation"
            disabled={isLoading}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons - Second Row */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePublished}
            disabled={isTogglingPublish}
            title={organisation.IsPublished ? 'Disable organisation' : 'Publish organisation'}
            className={`flex-1 ${organisation.IsPublished ? 'text-brand-g border-brand-g hover:bg-brand-g hover:text-white' : 'text-brand-b border-brand-b hover:bg-brand-b hover:text-white'}`}
          >
            {isTogglingPublish ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : organisation.IsPublished ? (
              <XCircle className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {organisation.IsPublished ? 'Disable' : 'Publish'}
          </Button>
          
          {/* Hide verify button for OrgAdmin-only users */}
          {!isOrgAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleVerified}
              disabled={isTogglingVerify}
              title={organisation.IsVerified ? 'Unverify organisation' : 'Verify organisation'}
              className={organisation.IsVerified ? 'text-brand-j border-brand-j hover:bg-brand-j hover:text-white' : 'text-brand-b border-brand-b hover:bg-brand-b hover:text-white'}
            >
              {isTogglingVerify ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : organisation.IsVerified ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddUser}
            title="Add user to organisation"
            className="text-brand-a border-brand-a hover:bg-brand-a hover:text-white"
            disabled={isLoading}
          >
            <UserPlus className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleViewNotes}
            title={`View notes (${organisation.Notes.length})`}
            className="text-brand-h border-brand-h hover:bg-brand-h hover:text-white"
            disabled={isLoading}
          >
            <FileText className="w-4 h-4" />
            {organisation.Notes.length > 0 && (
              <span className="ml-1">{organisation.Notes.length}</span>
            )}
          </Button>
        </div>

        {/* Header */}
        <div className="mb-3">
          <h3 className="heading-5 mb-2 break-words">{decodeText(organisation.Name)}</h3>
          {/* Status Badges on separate line */}
          <div className="flex flex-wrap gap-2">
            <span className={`service-tag ${organisation.IsVerified ? 'verified' : 'template-type'}`}>
              {organisation.IsVerified ? 'Verified' : 'Under Review'}
            </span>
            <span className={`service-tag ${organisation.IsPublished ? 'verified' : 'inactive'}`}>
              {organisation.IsPublished ? 'Published' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Verification Warning Messages */}
        {warningLevel !== 'ok' && (
          <div className={`p-3 rounded-md mb-3 ${
            warningLevel === 'expired' ? 'bg-red-50 border border-brand-g' :
            warningLevel === 'warning' ? 'bg-yellow-50 border border-brand-j' :
            'bg-blue-50 border border-blue-300'
          }`}>
            <p className={`text-xs font-medium ${
              warningLevel === 'expired' ? 'text-brand-g' :
              warningLevel === 'warning' ? 'text-brand-j' :
              'text-blue-700'
            }`}>
              {warningLevel === 'expired' && (
                <>⚠️ Unverified - No update for {daysSinceUpdate} days</>
              )}
              {warningLevel === 'warning' && (
                <>⚠️ Reminder sent - {100 - daysSinceUpdate} days until unverified</>
              )}
              {warningLevel === 'info' && (
                <>ℹ️ Review due soon - {daysSinceUpdate} days since last update</>
              )}
            </p>
          </div>
        )}

        {/* Short Description */}
        {organisation.ShortDescription && (
          <p className="text-sm text-brand-l mb-3 line-clamp-2">
            {decodeText(organisation.ShortDescription)}
          </p>
        )}

        {/* Locations */}
        {organisation.AssociatedLocationIds.length > 0 && (
          <div className="mb-4 p-3 bg-brand-q rounded-lg">
            <div className="flex items-center gap-2 text-xs text-brand-f mb-2">
              <MapPin className="w-3 h-3" />
              <span>Locations</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {displayLocations.map((location, index) => (
                <span key={index} className="text-xs text-brand-k bg-white px-2 py-1 rounded">
                  {location}
                </span>
              ))}
              {hasMoreLocations && (
                <span className="text-xs text-brand-f px-2 py-1">
                  ... +{organisation.AssociatedLocationIds.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Created/Modified Dates */}
        <div className="text-xs text-brand-f space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created: {formatDate(organisation.DocumentCreationDate)}</span>
          </div>
          {organisation.DocumentModifiedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Modified: {formatDate(organisation.DocumentModifiedDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default OrganisationCard;
