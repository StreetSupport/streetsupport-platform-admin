'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import ErrorDisplay, { ValidationError } from '@/components/ui/ErrorDisplay';
import { IOrganisation, IOrganisationFormData } from '@/types/organisations/IOrganisation';
import { timeNumberToString } from '@/schemas/organisationSchema';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast } from '@/utils/toast';
import { OrganisationForm, OrganisationFormRef } from '../OrganisationForm';
import { decodeText } from '@/utils/htmlDecode';

interface OrganisationTabProps {
  organisation: IOrganisation;
  onOrganisationUpdated: () => void;
  onClose: () => void; // Called after successful update (no confirmation)
  onCancel: () => void; // Called when user clicks Cancel (shows confirmation)
}


const OrganisationTab: React.FC<OrganisationTabProps> = ({
  organisation,
  onOrganisationUpdated,
  onClose,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const formRef = React.useRef<OrganisationFormRef>(null);

  // Prepare initial data for the form - decode HTML entities
  const initialData: Partial<IOrganisationFormData> = {
    Key: organisation.Key || '',
    Name: decodeText(organisation.Name || ''),
    ShortDescription: decodeText(organisation.ShortDescription || ''),
    Description: decodeText(organisation.Description || ''),
    AssociatedLocationIds: organisation.AssociatedLocationIds || [],
    Tags: organisation.Tags ? organisation.Tags.split(',').filter(tag => tag.trim()) : [],
    IsVerified: organisation.IsVerified || false,
    IsPublished: organisation.IsPublished || false,
    Telephone: organisation.Telephone || '',
    Email: organisation.Email || '',
    Website: organisation.Website || '',
    Facebook: organisation.Facebook || '',
    Twitter: organisation.Twitter || '',
    Addresses: (organisation.Addresses || []).map(address => ({
      ...address,
      Street: decodeText(address.Street || ''),
      Street1: decodeText(address.Street1 || ''),
      Street2: decodeText(address.Street2 || ''),
      Street3: decodeText(address.Street3 || ''),
      OpeningTimes: address.OpeningTimes.map(openingTime => ({
        Day: openingTime.Day,
        StartTime: timeNumberToString(openingTime.StartTime),
        EndTime: timeNumberToString(openingTime.EndTime)
      }))
    }))
  };

  const handleValidationChange = useCallback((errors: ValidationError[]) => {
    setValidationErrors(errors);
  }, []);

  // Helper function to convert time string (HH:MM) to number (HHMM)
  const timeStringToNumber = (timeString: string): number => {
    return parseInt(timeString.replace(':', ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    setIsLoading(true);

    try {
      // Convert tags array to comma-separated string for API
      const submissionData = {
        ...formData,
        Tags: Array.isArray(formData.Tags) ? formData.Tags.join(',') : formData.Tags,
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

      const response = await authenticatedFetch(`/api/organisations/${organisation._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organisation');
      }

      successToast.update('Organisation');
      onOrganisationUpdated();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update organisation';
      errorToast.generic(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValidationErrors([]);
    onCancel(); // Trigger confirmation modal
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <OrganisationForm
            ref={formRef}
            initialData={initialData}
            onValidationChange={handleValidationChange}
          />
        </div>

        {/* Error Display */}
        {validationErrors.length > 0 && (
          <div className="px-4 sm:px-6">
            <ErrorDisplay
              ValidationErrors={validationErrors}
              ClassName="mb-4"
            />
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-brand-q p-4 sm:p-6">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? 'Updating...' : 'Update Organisation'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrganisationTab;
