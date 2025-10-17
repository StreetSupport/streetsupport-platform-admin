'use client';

import React, { useState, useEffect } from 'react';
import { IServiceProvider } from '@/types/serviceProviders/IServiceProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';

interface DisableOrganisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (staffName: string, reason: string) => void;
  organisation: IServiceProvider | null;
}

export const DisableOrganisationModal: React.FC<DisableOrganisationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  organisation
}) => {
  const [staffName, setStaffName] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ staffName?: string; reason?: string }>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setStaffName('');
      setReason('');
      setErrors({});
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: { staffName?: string; reason?: string } = {};

    if (!staffName.trim()) {
      newErrors.staffName = 'Staff name is required';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onConfirm(staffName.trim(), reason.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-brand-q">
          <h2 className="heading-4">Disable Organisation</h2>
          <button
            onClick={onClose}
            className="text-brand-f hover:text-brand-k transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-base text-brand-l mb-4">
            You are about to disable <strong>{organisation?.Name}</strong>. Please provide the following information:
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="staffName" className="block text-sm font-medium text-brand-k mb-2">
                Staff Name <span className="text-brand-g">*</span>
              </label>
              <Input
                id="staffName"
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Enter your name"
                className={errors.staffName ? 'border-brand-g' : ''}
              />
              {errors.staffName && (
                <p className="text-xs text-brand-g mt-1">{errors.staffName}</p>
              )}
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-brand-k mb-2">
                Reason for Disabling <span className="text-brand-g">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for disabling this organisation"
                rows={4}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-brand-a text-brand-k ${
                  errors.reason ? 'border-brand-g' : 'border-brand-q'
                }`}
              />
              {errors.reason && (
                <p className="text-xs text-brand-g mt-1">{errors.reason}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="flex-1 text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
            >
              Disable Organisation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
