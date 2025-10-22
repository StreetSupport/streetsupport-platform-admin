'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { OrganisationForm, OrganisationFormRef } from './OrganisationForm';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast, loadingToast } from '@/utils/toast';
import ErrorDisplay, { ValidationError } from '@/components/ui/ErrorDisplay';

interface AddOrganisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddOrganisationModal({ isOpen, onClose, onSuccess }: AddOrganisationModalProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const formRef = useRef<OrganisationFormRef>(null);

  const handleValidationChange = (errors: ValidationError[]) => {
    setValidationErrors(errors);
  };

  // Helper function to convert time string (HH:MM) to number (HHMM)
  const timeStringToNumber = (timeString: string): number => {
    return parseInt(timeString.replace(':', ''));
  };

  const handleSave = async () => {
    setError('');
    
    // Validate form using ref
    if (!formRef.current?.validate()) {
      errorToast.validation();
      return;
    }

    // Get form data using ref
    const formData = formRef.current?.getFormData();
    if (!formData) {
      errorToast.generic('Failed to get form data');
      return;
    }

    setSaving(true);
    const toastId = loadingToast.create('organisation');

    try {
      // Convert Tags array to comma-separated string for API
      const apiData = {
        ...formData,
        Tags: formData.Tags.join(','),
        // Convert opening times from form format (string) to API format (number)
        Addresses: formData.Addresses.map((address: any) => ({
          ...address,
          OpeningTimes: address.OpeningTimes.map((time: any) => ({
            Day: time.Day,
            StartTime: timeStringToNumber(time.StartTime),
            EndTime: timeStringToNumber(time.EndTime)
          }))
        }))
      };

      const response = await authenticatedFetch('/api/organisations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organisation');
      }

      successToast.create('Organisation');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create organisation';
      setError(errorMessage);
      errorToast.create('organisation', errorMessage);
    } finally {
      setSaving(false);
      if (toastId) {
        // Dismiss loading toast if it exists
      }
    }
  };

  const confirmCancel = () => {
    setShowConfirmModal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <h3 className="heading-3">Add Organisation</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              className="p-2"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <OrganisationForm
              ref={formRef}
              onValidationChange={handleValidationChange}
            />
          </div>

          {/* Footer - fixed at bottom */}
          <div className="border-t border-brand-q p-4 sm:p-6">
            {/* Error Display */}
            <ErrorDisplay
              ErrorMessage={error || undefined}
              ValidationErrors={validationErrors}
              ClassName="mb-4"
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmModal(true)}
                disabled={saving}
                className="w-full sm:w-auto sm:min-w-24 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto sm:min-w-24 order-1 sm:order-2"
              >
                {saving ? 'Saving...' : 'Save Organisation'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCancel}
        title="Close without saving?"
        message="You may lose unsaved changes."
        confirmLabel="Close Without Saving"
        cancelLabel="Continue Editing"
        variant="warning"
      />
    </>
  );
}
