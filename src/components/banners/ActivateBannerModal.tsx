'use client';

import { useState } from 'react';
import { IBanner } from '@/types/banners/IBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FormField } from '@/components/ui/FormField';

interface ActivateBannerModalProps {
  banner: IBanner;
  isOpen: boolean;
  onClose: () => void;
  onActivate: (bannerId: string, isActive: boolean, startDate?: Date, endDate?: Date) => Promise<void>;
}

export default function ActivateBannerModal({ banner, isOpen, onClose, onActivate }: ActivateBannerModalProps) {
  const [activationType, setActivationType] = useState<'immediate' | 'scheduled'>('immediate');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
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
      await onActivate(banner._id, false, undefined, undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate banner');
      setIsSubmitting(false);
    }
  };

  // Show deactivate confirm modal if banner is active
  if (isOpen && banner.IsActive) {
    return (
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Banner"
        message={`${banner.Title}.\n\nAre you sure you want to deactivate this banner? The banner will no longer be visible to users.`}
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
      if (!startDate || !endDate) {
        setError('Please select both start and end dates for scheduled activation');
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const fromDate = new Date(startDate);
      fromDate.setHours(0, 0, 0, 0);
      
      const untilDate = new Date(endDate);
      untilDate.setHours(0, 0, 0, 0);
      
      if (fromDate < today) {
        setError('Start date cannot be in the past');
        return;
      }
      
      if (untilDate < today) {
        setError('End date cannot be in the past');
        return;
      }
      
      if (fromDate > untilDate) {
        setError('End date must be after start date');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      if (activationType === 'immediate') {
        // Immediate activation: isActive = true, clear date range
        await onActivate(banner._id, true, undefined, undefined);
      } else {
        // Scheduled activation: isActive = false, set date range
        await onActivate(
          banner._id,
          false,
          new Date(startDate),
          new Date(endDate)
        );
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setActivationType('immediate');
      setStartDate('');
      setEndDate('');
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
              {banner.IsActive ? 'Deactivate' : 'Activate'} Banner
            </h2>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <h3 className="heading-6 text-brand-k mb-4">
              {banner.Title}
            </h3>

            {banner.IsActive ? null : (
            // Activation form
            <form onSubmit={handleSubmit}>
              {/* Activation Type Selection */}
              <div className="mb-4">
                <FormField label="Activation Type">
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
                </FormField>
              </div>

              {/* Date Range Fields - Only show for scheduled */}
              {activationType === 'scheduled' && (
                <div className="space-y-4 mb-4">
                  <FormField label="Start Date" required>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={getTodayString()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-a"
                    />
                    <p className="text-xs text-brand-f mt-1">
                      Select today to activate immediately, or a future date to schedule activation
                    </p>
                  </FormField>
                  <FormField label="End Date" required>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={getTodayString()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-a"
                    />
                    <p className="text-xs text-brand-f mt-1">
                      The banner will automatically deactivate on this date
                    </p>
                  </FormField>
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
                    ? 'The banner will be visible immediately and remain active until manually deactivated.'
                    : 'The banner will automatically activate and deactivate based on the selected date range.'}
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
