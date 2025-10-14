'use client';

import React from 'react';
import { IUser } from '@/types/IUser';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Calendar, MapPin, Shield, Eye, EyeOff } from 'lucide-react';
import { parseAuthClaims } from '@/lib/userService';

interface UserCardProps {
  user: IUser;
  isLoading?: boolean;
  onView?: (user: IUser) => void;
  onEdit?: (user: IUser) => void;
  onDelete?: (user: IUser) => void;
  onToggleActive?: (user: IUser) => void;
  onDeactivateClick?: (user: IUser) => void;
  isToggling?: boolean;
}

const UserCard = React.memo(function UserCard({ 
  user, 
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  onDeactivateClick,
  isToggling = false
}: UserCardProps) {

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onView) {
      onView(user);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(user);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(user);
    }
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isCurrentlyActive = user.IsActive ?? true;
    
    // Show confirmation modal for deactivation only
    if (isCurrentlyActive) {
      onDeactivateClick?.(user);
    } else {
      // Activate without confirmation
      onToggleActive?.(user);
    }
  };

  // Parse auth claims to get roles
  const { roles, specificClaims } = parseAuthClaims(user.AuthClaims);

  // Get email as string
  const email = typeof user.Email === 'string' ? user.Email : '';

  // Format locations - show first 5 and then "..."
  const displayLocations = user.AssociatedProviderLocationIds.slice(0, 5);
  const hasMoreLocations = user.AssociatedProviderLocationIds.length > 5;

  return (
    <div className={`card card-compact ${isLoading ? 'loading-card' : ''}`}>
      {/* User Header */}
      <div className="p-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
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
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={isToggling}
            title={(user.IsActive ?? true) ? 'Deactivate user' : 'Activate user'}
            className={(user.IsActive ?? true) ? 'text-brand-g border-brand-g hover:bg-brand-g hover:text-white' : 'text-brand-b border-brand-b hover:bg-brand-b hover:text-white'}
          >
            {isToggling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (user.IsActive ?? true) ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
            title="Edit user"
            disabled={isLoading}
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            title="Delete user"
            className="text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="mb-3">
          <h3 className="heading-5 mb-2 break-words">{email}</h3>
          {/* Status Badge on separate line */}
          <div>
            <span className={`service-tag ${(user.IsActive ?? true) ? 'verified' : 'inactive'}`}>
              {(user.IsActive ?? true) ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Roles */}
        {roles.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-xs text-brand-f mb-2">
              <Shield className="w-3 h-3" />
              <span>Roles</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map((role, index) => (
                <span 
                  key={index} 
                  className={`service-tag ${
                    role === 'SuperAdmin' ? 'urgent' : 
                    role === 'CityAdmin' ? 'verified' : 
                    'template-type'
                  }`}
                >
                  {role}
                </span>
              ))}
              {specificClaims.slice(0, 3).map((claim, index) => (
                <span key={`claim-${index}`} className="service-tag location">
                  {claim}
                </span>
              ))}
              {specificClaims.length > 3 && (
                <span className="service-tag">+{specificClaims.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Provider Locations */}
        {user.AssociatedProviderLocationIds.length > 0 && (
          <div className="mb-4 p-3 bg-brand-q rounded-lg">
            <div className="flex items-center gap-2 text-xs text-brand-f mb-2">
              <MapPin className="w-3 h-3" />
              <span>Provider Locations</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {displayLocations.map((location, index) => (
                <span key={index} className="text-xs text-brand-k bg-white px-2 py-1 rounded">
                  {location}
                </span>
              ))}
              {hasMoreLocations && (
                <span className="text-xs text-brand-f px-2 py-1">
                  ... +{user.AssociatedProviderLocationIds.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Created/Modified Dates */}
        <div className="text-xs text-brand-f space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created: {formatDate(user.DocumentCreationDate)}</span>
          </div>
          {user.DocumentModifiedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Modified: {formatDate(user.DocumentModifiedDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default UserCard;
