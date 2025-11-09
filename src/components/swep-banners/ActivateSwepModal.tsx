'use client';

import { useState } from 'react';
import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface ActivateSwepModalProps {
  swep: ISwepBanner;
  isOpen: boolean;
  onClose: () => void;
  onActivate: (locationSlug: string, isActive: boolean, swepActiveFrom?: Date, swepActiveUntil?: Date) => Promise<void>;
}

export default function ActivateSwepModal({ swep, isOpen, onClose, onActivate }: ActivateSwepModalProps) {
  const [activationType, setActivationType] = useState<'immediate' | 'scheduled'>('immediate');
  const [swepActiveFrom, setSwepActiveFrom] = useState<string>('');
  const [swepActiveUntil, setSwepActiveUntil] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Handle deactivation confirmation
  const handleDeactivateConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onActivate(swep.LocationSlug, false, undefined, undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate SWEP banner');
      setIsSubmitting(false);
    }
  };

  // Show deactivate confirm modal if banner is active
  if (isOpen && swep.IsActive) {
    return (
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate SWEP Banner"
        message={`${swep.LocationName} - ${swep.Title}.\n\nAre you sure you want to deactivate this SWEP banner? The banner will no longer be visible to users seeking help.`}
        variant="warning"
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        isLoading={isSubmitting}
      />
    );
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (activationType === 'scheduled') {
      if (!swepActiveFrom || !swepActiveUntil) {
        setError('Please select both start and end dates for scheduled activation');
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const fromDate = new Date(swepActiveFrom);
      fromDate.setHours(0, 0, 0, 0);
      
      const untilDate = new Date(swepActiveUntil);
      untilDate.setHours(0, 0, 0, 0);
      
      if (fromDate < today) {
        setError('Start date cannot be in the past');
        return;
      }
      
      if (untilDate < today) {
        setError('End date cannot be in the past');
        return;
      }
      
      if (fromDate >= untilDate) {
        setError('End date must be after start date');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      if (activationType === 'immediate') {
        // Immediate activation: isActive = true, clear date range
        await onActivate(swep.LocationSlug, true, undefined, undefined);
      } else {
        // Scheduled activation: isActive = false, set date range
        await onActivate(
          swep.LocationSlug,
          false,
          new Date(swepActiveFrom),
          new Date(swepActiveUntil)
        );
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate SWEP banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setActivationType('immediate');
      setSwepActiveFrom('');
      setSwepActiveUntil('');
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <h2 className="heading-4">
              {swep.IsActive ? 'Deactivate' : 'Activate'} SWEP Banner
            </h2>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <p className="text-sm text-brand-l mb-4">
              {swep.LocationName} - {swep.Title}
            </p>

            {swep.IsActive ? null : (
            // Activation form
            <form onSubmit={handleSubmit}>
              {/* Activation Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activation Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="immediate"
                      checked={activationType === 'immediate'}
                      onChange={(e) => setActivationType(e.target.value as 'immediate')}
                      className="h-4 w-4 text-brand-a border-gray-300 focus:ring-brand-a"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Activate Immediately
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="scheduled"
                      checked={activationType === 'scheduled'}
                      onChange={(e) => setActivationType(e.target.value as 'scheduled')}
                      className="h-4 w-4 text-brand-a border-gray-300 focus:ring-brand-a"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Schedule Activation (Date Range)
                    </span>
                  </label>
                </div>
              </div>

              {/* Date Range Fields - Only show for scheduled */}
              {activationType === 'scheduled' && (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Active From <span className="text-brand-g">*</span>
                    </label>
                    <input
                      type="date"
                      value={swepActiveFrom}
                      onChange={(e) => setSwepActiveFrom(e.target.value)}
                      min={getTodayString()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-a"
                      required={activationType === 'scheduled'}
                    />
                    <p className="text-xs text-brand-f mt-1">
                      Select today to activate immediately, or a future date to schedule activation
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Active Until <span className="text-brand-g">*</span>
                    </label>
                    <input
                      type="date"
                      value={swepActiveUntil}
                      onChange={(e) => setSwepActiveUntil(e.target.value)}
                      min={getTodayString()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-a"
                      required={activationType === 'scheduled'}
                    />
                    <p className="text-xs text-brand-f mt-1">
                      The banner will automatically deactivate on this date
                    </p>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Info Message */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  {activationType === 'immediate' 
                    ? 'The SWEP banner will be visible immediately and remain active until manually deactivated.'
                    : 'The SWEP banner will automatically activate and deactivate based on the selected date range.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Activating...' : 'Activate'}
                </Button>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
