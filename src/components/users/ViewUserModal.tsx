'use client';

import React from 'react';
import { X, Calendar, MapPin, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IUser } from '@/types/IUser';
import { parseAuthClaims } from '@/lib/userService';

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUser | null;
}

export default function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  if (!isOpen || !user) return null;

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

  // Parse auth claims to get roles
  const { roles, specificClaims } = parseAuthClaims(user.AuthClaims);

  // Get email as string
  const email = typeof user.Email === 'string' ? user.Email : '';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-brand-q px-6 py-4 flex items-center justify-between">
            <h2 className="heading-4">User Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-brand-q rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-brand-k" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Email Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-brand-f">
                <Mail className="w-4 h-4" />
                <span className="font-semibold">Email Address</span>
              </div>
              <div className="p-4 bg-brand-q rounded-lg">
                <p className="text-base text-brand-k break-all">{email}</p>
              </div>
            </div>
            
            {/* Status Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-brand-f">
                <span className="font-semibold">Status</span>
              </div>
              <div className="flex gap-2">
                <span className={`service-tag ${(user.IsActive ?? true) ? 'verified' : 'inactive'}`}>
                  {(user.IsActive ?? true) ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Roles Section */}
            {roles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-brand-f">
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold">Roles</span>
                </div>
                <div className="p-4 bg-brand-q rounded-lg">
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
                    {specificClaims.map((claim, index) => (
                      <span key={`claim-${index}`} className="service-tag location">
                        {claim}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Associated Provider Locations */}
            {user.AssociatedProviderLocationIds.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-brand-f">
                  <MapPin className="w-4 h-4" />
                  <span className="font-semibold">Associated Provider Locations</span>
                </div>
                <div className="p-4 bg-brand-q rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {user.AssociatedProviderLocationIds.map((location, index) => (
                      <span 
                        key={index} 
                        className="text-sm text-brand-k bg-white px-3 py-1.5 rounded border border-brand-f"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dates Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-brand-f">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">Activity Information</span>
              </div>
              <div className="p-4 bg-brand-q rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-brand-f mb-1">Created</p>
                  <p className="text-base text-brand-k">{formatDate(user.DocumentCreationDate)}</p>
                </div>
                {user.DocumentModifiedDate && (
                  <div>
                    <p className="text-xs text-brand-f mb-1">Last Modified</p>
                    <p className="text-base text-brand-k">{formatDate(user.DocumentModifiedDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-brand-q px-6 py-4 flex items-center justify-end">
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
