'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { IOrganisationFormData, IAddressFormData, ORGANISATION_TAGS } from '@/types/organisations/IOrganisation';
import { ICity } from '@/types';
import { validateOrganisation, OpeningTimeFormSchema, transformErrorPath } from '@/schemas/organisationSchema';
import { LocationManager } from './LocationManager';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast, loadingToast } from '@/utils/toast';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

interface AddOrganisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}


interface ValidationError {
  path: string;
  message: string;
}

export function AddOrganisationModal({ isOpen, onClose, onSuccess }: AddOrganisationModalProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [locations, setLocations] = useState<ICity[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<IOrganisationFormData>({
    Key: '',
    AssociatedLocationIds: [],
    Name: '',
    ShortDescription: '',
    Description: '',
    Tags: [],
    IsVerified: false,
    IsPublished: false,
    RegisteredCharity: undefined,
    Telephone: '',
    Email: '',
    Website: '',
    Facebook: '',
    Twitter: '',
    Addresses: [],
    Notes: []
  });

  // Fetch locations on mount
  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      resetForm();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      const response = await authenticatedFetch('/api/cities');
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch locations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch locations';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      Key: '',
      AssociatedLocationIds: [],
      Name: '',
      ShortDescription: '',
      Description: '',
      Tags: [],
      IsVerified: false,
      IsPublished: false,
      RegisteredCharity: undefined,
      Telephone: '',
      Email: '',
      Website: '',
      Facebook: '',
      Twitter: '',
      Addresses: [],
      Notes: []
    });
    setValidationErrors([]);
    setError('');
  };

  const generateOrganisationKey = (name: string): string => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const updateFormData = (field: keyof IOrganisationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate key when name changes
      ...(field === 'Name' && { Key: generateOrganisationKey(value) })
    }));
  };

  const handleTagChange = (tagValue: string, checked: boolean) => {
    const updatedTags = checked
      ? [...formData.Tags, tagValue]
      : formData.Tags.filter(tag => tag !== tagValue);
    
    updateFormData('Tags', updatedTags);
  };


  const handleAddressesChange = (addresses: IAddressFormData[]) => {
    updateFormData('Addresses', addresses);
  };

  // Helper function to convert time string (HH:MM) to number (HHMM)
  const timeStringToNumber = (timeString: string): number => {
    return parseInt(timeString.replace(':', ''));
  };

  const validateForm = (): boolean => {
    // Then validate the rest using OrganisationSchema
    const result = validateOrganisation(formData);
    
    const allErrors = [];
    
    if (!result.success) {
      const organisationErrors = result.errors.map((error: any) => {
        // return {
        //   path: Array.isArray(error.path) ? error.path.join('.') : error.path,
        //   message: error.message
        // }
        const originalPath = Array.isArray(error.path) ? error.path.join('.') : error.path;
        return {
          path: transformErrorPath(originalPath),
          message: error.message
        };
      });
      allErrors.push(...organisationErrors);
    }
    
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      return false;
    }
    
    setValidationErrors([]);
    return true;
  };

  const handleSave = async () => {
    setError('');
    
    if (!validateForm()) {
      errorToast.validation();
      return;
    }

    setSaving(true);
    const toastId = loadingToast.create('organisation');

    try {
      // Convert Tags array to comma-separated string for API
      const apiData = {
        ...formData,
        Key: generateOrganisationKey(formData.Name),
        Tags: formData.Tags.join(','),
        // Convert opening times from form format (string) to API format (number)
        Addresses: formData.Addresses.map(address => ({
          ...address,
          OpeningTimes: address.OpeningTimes.map(time => ({
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

  const handleCancel = () => {
    // Check if form has been modified
    const hasChanges = formData.Name || formData.Description || formData.Addresses.length > 0;
    
    if (hasChanges) {
      setShowConfirmModal(true);
    } else {
      onClose();
    }
  };

  const confirmCancel = () => {
    setShowConfirmModal(false);
    resetForm();
    onClose();
  };

  // Filter tags based on selected locations
  const getAvailableTags = () => {
    const hasManchesterLocation = formData.AssociatedLocationIds.some(locationId => {
      const location = locations.find(c => c._id === locationId);
      return location?.Key === 'manchester';
    });

    return ORGANISATION_TAGS.filter(tag => {
      // Show mcr-only tags only if manchester is selected
      if (tag.value === 'coalition-of-relief' || tag.value === 'big-change') {
        return hasManchesterLocation;
      }
      return true;
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-brand-q">
            <h3 className="heading-3">Add Organisation</h3>
            <button
              onClick={handleCancel}
              className="text-brand-f hover:text-brand-k transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-8">
              {/* General Details Section */}
              <div className="space-y-6">
                <h4 className="heading-4 border-b border-brand-q pb-3">General Details</h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Name <span className="text-brand-g">*</span>
                      </label>
                      <Input
                        value={formData.Name}
                        onChange={(e) => updateFormData('Name', e.target.value)}
                        placeholder="Organisation name"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Associated Locations <span className="text-brand-g">*</span>
                      </label>
                      <MultiSelect
                        options={locations?.map(location => ({
                          value: location.Key,
                          label: location.Name
                        })) || []}
                        value={formData.AssociatedLocationIds || []}
                        onChange={(selectedIds) => updateFormData('AssociatedLocationIds', selectedIds)}
                        placeholder={locations.length === 0 ? "Loading locations..." : "Select locations..."}
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Short Description <span className="text-brand-g">*</span>
                      </label>
                      <Input
                        value={formData.ShortDescription}
                        onChange={(e) => updateFormData('ShortDescription', e.target.value)}
                        placeholder="Short description"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Description <span className="text-brand-g">*</span>
                      </label>
                      <Textarea
                        value={formData.Description}
                        onChange={(e) => updateFormData('Description', e.target.value)}
                        placeholder="Detailed description of the organisation"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div>
                    <h4 className="heading-5 mb-4">Tags</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getAvailableTags().map((tag) => (
                        <Checkbox
                          key={tag.value}
                          id={`tag-${tag.value}`}
                          checked={formData.Tags.includes(tag.value)}
                          onChange={(e) => handleTagChange(tag.value, e.target.checked)}
                          label={tag.label}
                        />
                      ))}
                    </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-6">
                <h4 className="heading-4 border-b border-brand-q pb-3">Contact Information</h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Telephone
                      </label>
                      <Input
                        value={formData.Telephone}
                        onChange={(e) => updateFormData('Telephone', e.target.value)}
                        placeholder="0161 123 4567"
                        type="tel"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Email
                      </label>
                      <Input
                        value={formData.Email}
                        onChange={(e) => updateFormData('Email', e.target.value)}
                        placeholder="contact@organisation.org"
                        type="email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Website
                      </label>
                      <Input
                        value={formData.Website}
                        onChange={(e) => updateFormData('Website', e.target.value)}
                        placeholder="https://www.organisation.org"
                        type="url"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Facebook
                      </label>
                      <Input
                        value={formData.Facebook}
                        onChange={(e) => updateFormData('Facebook', e.target.value)}
                        placeholder="https://facebook.com/organisation"
                        type="url"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Twitter
                      </label>
                      <Input
                        value={formData.Twitter}
                        onChange={(e) => updateFormData('Twitter', e.target.value)}
                        placeholder="https://twitter.com/organisation"
                        type="url"
                      />
                    </div>

                </div>
              </div>

              {/* Locations Section */}
              <div className="space-y-6">
                <LocationManager
                  locations={formData.Addresses}
                  onChange={handleAddressesChange}
                  validationErrors={validationErrors}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-brand-q p-4 sm:p-6">
            {/* Error Display */}
            <ErrorDisplay
              ErrorMessage={error || undefined}
              ValidationErrors={validationErrors.map(e => ({ Path: e.path, Message: e.message }))}
              ClassName="mb-4"
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
      />
    </>
  );
}
