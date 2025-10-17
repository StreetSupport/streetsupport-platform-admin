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
      <div 
        className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-brand-q px-6 py-4 flex items-center justify-between">
            <h2 className="heading-4">User Profile</h2>
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
