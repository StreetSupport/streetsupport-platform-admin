'use client';

import React from 'react';
import { IUser } from '@/types/IUser';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Calendar, MapPin, Shield } from 'lucide-react';
import { parseAuthClaims } from '@/lib/userService';

interface UserCardProps {
  user: IUser;
  isLoading?: boolean;
  onEdit?: (user: IUser) => void;
  onDelete?: (user: IUser) => void;
}

const UserCard = React.memo(function UserCard({ 
  user, 
  isLoading = false,
  onEdit,
  onDelete
}: UserCardProps) {

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
            onClick={handleEdit}
            className="flex-1"
            disabled={isLoading}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
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
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="heading-5 mb-1">{email}</h3>
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
