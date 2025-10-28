'use client';

import React, { useState, useEffect } from 'react';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';

interface DisableOrganisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (staffName: string, reason: string, disablingDate: Date) => void;
  organisation: IOrganisation | null;
}

export const DisableOrganisationModal: React.FC<DisableOrganisationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  organisation
}) => {
  const [staffName, setStaffName] = useState('');
  const [reason, setReason] = useState('');
  const [disablingDate, setDisablingDate] = useState('');
  const [errors, setErrors] = useState<{ staffName?: string; reason?: string; disablingDate?: string }>({});

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setStaffName('');
      setReason('');
      setDisablingDate(getTodayString()); // Default to today
      setErrors({});
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: { staffName?: string; reason?: string; disablingDate?: string } = {};

    if (!staffName.trim()) {
      newErrors.staffName = 'Staff name is required';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (!disablingDate) {
      newErrors.disablingDate = 'Disabling date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Convert string date to Date object
      const dateObj = new Date(disablingDate);
      onConfirm(staffName.trim(), reason.trim(), dateObj);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <h2 className="heading-4">Disable Organisation</h2>
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

          {/* Content - form wrapper */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <p className="text-base text-brand-l mb-4">
                You are about to disable <strong>{organisation?.Name}</strong>. Please provide the following information:
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="disablingDate" className="block text-sm font-medium text-brand-k mb-2">
                    Disabling Date <span className="text-brand-g">*</span>
                  </label>
                  <Input
                    id="disablingDate"
                    type="date"
                    value={disablingDate}
                    onChange={(e) => setDisablingDate(e.target.value)}
                    min={getTodayString()}
                    className={errors.disablingDate ? 'border-brand-g' : ''}
                  />
                  {errors.disablingDate && (
                    <p className="text-xs text-brand-g mt-1">{errors.disablingDate}</p>
                  )}
                  <p className="text-xs text-brand-f mt-1">
                    Select today to disable immediately, or a future date to schedule disabling
                  </p>
                </div>

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
            </div>

            {/* Footer - fixed at bottom */}
            <div className="border-t border-brand-q p-4 sm:p-6">
              <div className="flex flex-col-reverse sm:flex-row gap-3">
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
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
