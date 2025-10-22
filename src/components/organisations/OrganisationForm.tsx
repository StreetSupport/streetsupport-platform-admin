'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { IOrganisationFormData, IAddressFormData, ORGANISATION_TAGS } from '@/types/organisations/IOrganisation';
import { ICity } from '@/types';
import { validateOrganisation, transformErrorPath } from '@/schemas/organisationSchema';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast } from '@/utils/toast';
import { ValidationError } from '@/components/ui/ErrorDisplay';
import { LocationManager } from './LocationManager';


export interface OrganisationFormRef {
  validate: () => boolean;
  getFormData: () => IOrganisationFormData;
  resetForm: () => void;
}

interface OrganisationFormProps {
  initialData?: Partial<IOrganisationFormData>;
  onFormDataChange?: (formData: IOrganisationFormData, isValid: boolean) => void;
  onValidationChange?: (errors: ValidationError[]) => void;
}

export const OrganisationForm = React.forwardRef<OrganisationFormRef, OrganisationFormProps>(({
  initialData,
  onFormDataChange,
  onValidationChange
}, ref) => {
  const [locations, setLocations] = useState<ICity[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState<IOrganisationFormData>({
    Key: '',
    AssociatedLocationIds: [],
    Name: '',
    ShortDescription: '',
    Description: '',
    Tags: [],
    IsVerified: false,
    IsPublished: false,
    Telephone: '',
    Email: '',
    Website: '',
    Facebook: '',
    Twitter: '',
    Addresses: [],
    Notes: [],
    ...initialData
  });

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Memoize the validation function to prevent unnecessary re-renders
  const validateFormMemoized = useCallback((setErrors: boolean = true): boolean => {
    const result = validateOrganisation(formData);
    
    const allErrors = [];
    
    if (!result.success) {
      const organisationErrors = result.errors.map((error: any) => {
        const originalPath = Array.isArray(error.path) ? error.path.join('.') : error.path;
        return {
          Path: transformErrorPath(originalPath),
          Message: error.message
        };
      });
      allErrors.push(...organisationErrors);
    }
    
    if (setErrors) {
      setValidationErrors(allErrors);
    }
    
    return allErrors.length === 0;
  }, [formData]);

  // Update parent when form data changes
  useEffect(() => {
    if (onFormDataChange) {
      const isValid = validateFormMemoized(false); // Don't set errors, just check validity
      onFormDataChange(formData, isValid);
    }
  }, [formData, onFormDataChange, validateFormMemoized]);

  // Update parent when validation errors change
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validationErrors);
    }
  }, [validationErrors, onValidationChange]);

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
      errorToast.generic(errorMessage);
    }
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

  // Public method to validate form
  const validate = () => {
    return validateFormMemoized(true);
  };

  // Public method to get form data
  const getFormData = () => {
    return formData;
  };

  // Public method to reset form
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
      Telephone: '',
      Email: '',
      Website: '',
      Facebook: '',
      Twitter: '',
      Addresses: [],
      Notes: [],
      ...initialData
    });
    setValidationErrors([]);
  };

  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    validate,
    getFormData,
    resetForm
  }));

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

  return (
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
  );
});

OrganisationForm.displayName = 'OrganisationForm';
