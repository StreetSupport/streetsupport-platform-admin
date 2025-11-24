'use client';

import React from 'react';
import { X, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserAuthClaims } from '@/types/auth';
import { formatRoleDisplay, formatClaimDisplay } from '@/constants/roles';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  authClaims: UserAuthClaims;
}

export default function UserProfileModal({ isOpen, onClose, email, authClaims }: UserProfileModalProps) {
  if (!isOpen) return null;

  // Extract roles and specific claims
  const { roles, specificClaims } = authClaims;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <h2 className="heading-4">User Profile</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
                        {formatRoleDisplay(role)}
                      </span>
                    ))}
                    {specificClaims.map((claim, index) => (
                      <span key={`claim-${index}`} className="service-tag location">
                        {formatClaimDisplay(claim)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - fixed at bottom */}
          <div className="border-t border-brand-q p-4 sm:p-6 flex items-center justify-end">
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
