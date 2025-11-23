'use client';

import { useState, useEffect, useRef } from 'react';
import { LocationLogoFormData, validateLocationLogo, transformErrorPath } from '@/schemas/locationLogoSchema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MediaUpload } from '@/components/ui/MediaUpload';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

interface LocationLogoFormProps {
  initialData?: Partial<LocationLogoFormData> & { LogoPath?: string; _id?: string };
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  saving?: boolean;
}

export default function LocationLogoForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  saving = false
}: LocationLogoFormProps) {
  const [formData, setFormData] = useState<LocationLogoFormData>({
    Name: initialData?.Name || '',
    DisplayName: initialData?.DisplayName || '',
    LocationSlug: initialData?.LocationSlug || '',
    LocationName: initialData?.LocationName || '',
    LogoPath: initialData?.LogoPath || '',
    Url: initialData?.Url || ''
  });
  
  const [originalData] = useState<LocationLogoFormData>({
    Name: initialData?.Name || '',
    DisplayName: initialData?.DisplayName || '',
    LocationSlug: initialData?.LocationSlug || '',
    LocationName: initialData?.LocationName || '',
    LogoPath: initialData?.LogoPath || '',
    Url: initialData?.Url || ''
  });
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.LogoPath || null
  );
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
  const [validationErrors, setValidationErrors] = useState<Array<{ Path: string; Message: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await authenticatedFetch('/api/cities');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  // Generate Name from DisplayName (similar to OrganisationForm)
  const generateName = (displayName: string): string => {
    return displayName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate Name from DisplayName
    if (name === 'DisplayName') {
      setFormData((prev) => ({
        ...prev,
        Name: generateName(value)
      }));
    }

    // Update location name when location slug changes
    if (name === 'LocationSlug') {
      const selectedLocation = locations.find((loc) => loc.Key === value);
      if (selectedLocation) {
        setFormData((prev) => ({
          ...prev,
          LocationName: selectedLocation.Name
        }));
      }
    }
  };

  const handleLogoUpload = (file: File) => {
    setLogoFile(file);
    setLogoRemoved(false);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(true);
    // Clear LogoPath in form data to trigger validation
    setFormData(prev => ({
      ...prev,
      LogoPath: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validationResult = validateLocationLogo(formData);
    
    if (!validationResult.success) {
      const transformedErrors = validationResult.errors.map(err => ({
        Path: transformErrorPath(err.path),
        Message: err.message
      }));
      setValidationErrors(transformedErrors);
      return;
    }

    setValidationErrors([]);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('Name', formData.Name);
      formDataToSend.append('DisplayName', formData.DisplayName);
      formDataToSend.append('LocationSlug', formData.LocationSlug);
      formDataToSend.append('LocationName', formData.LocationName);
      formDataToSend.append('Url', formData.Url);

      if (logoFile) {
        formDataToSend.append('newfile_logo', logoFile);
      } else if (isEdit && !logoRemoved && initialData?.LogoPath) {
        formDataToSend.append('LogoPath', initialData.LogoPath || '');
      } else if (isEdit && logoRemoved) {
        // Send empty LogoPath to indicate logo removal
        formDataToSend.append('LogoPath', '');
      }

      await onSubmit(formDataToSend);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Display Name */}
      <FormField label="Display Name" required>
        <Input
          id="DisplayName"
          name="DisplayName"
          type="text"
          value={formData.DisplayName}
          onChange={handleInputChange}
          placeholder="How the name appears on the website"
          disabled={saving}
        />
        <p className="text-xs text-brand-f mt-1">
          This is the public-facing name shown on the website
        </p>
      </FormField>

      {/* Location */}
      <FormField label="Location" required>
        <Select
          id="LocationSlug"
          name="LocationSlug"
          value={formData.LocationSlug}
          onChange={handleInputChange}
          options={locations.map(location => ({ value: location.Key, label: location.Name }))}
          placeholder="Select a location"
          disabled={saving}
        />
        <p className="text-xs text-brand-f mt-1">
          The location/city where this supporter is active
        </p>
      </FormField>

      {/* URL */}
      <FormField label="Website URL" required>
        <Input
          id="Url"
          name="Url"
          type="url"
          value={formData.Url}
          onChange={handleInputChange}
          placeholder="https://example.com"
          disabled={saving}
        />
        <p className="text-xs text-brand-f mt-1">
          The organisation&apos;s website URL (must start with https:// or http://)
        </p>
      </FormField>

      {/* Logo Upload */}
      <MediaUpload
        value={logoFile || (logoPreview && !logoRemoved ? { Url: logoPreview, Filename: 'Logo', Alt: 'Logo', Size: 0 } : null)}
        onUpload={handleLogoUpload}
        onRemove={handleRemoveLogo}
        accept="image/*"
        maxSize={5 * 1024 * 1024}
        label="Logo"
        description="Upload a logo image for the location supporter"
        required={true}
      />

      {/* Validation Errors */}
      <ErrorDisplay ValidationErrors={validationErrors} />

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-6 border-t border-brand-q mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Check if logo file was uploaded - that's automatically a change
            if (logoFile) {
              setShowCancelModal(true);
              return;
            }
            
            // Check if logo was removed - that's a change
            if (logoRemoved) {
              setShowCancelModal(true);
              return;
            }
            
            // No file changes, check if form data has changed
            if (JSON.stringify(formData) !== JSON.stringify(originalData)) {
              setShowCancelModal(true);
            } else {
              onCancel();
            }
          }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : isEdit ? 'Update Logo' : 'Create Logo'}
        </Button>
      </div>
    </form>
    
    <ConfirmModal
      isOpen={showCancelModal}
      onClose={() => setShowCancelModal(false)}
      onConfirm={() => {
        setShowCancelModal(false);
        // Reset form to original data before calling onCancel
        setFormData(originalData);
        setLogoFile(null);
        setLogoPreview(initialData?.LogoPath || null);
        setLogoRemoved(false);
        setValidationErrors([]);
        onCancel();
      }}
      title="Close without saving?"
      message="You may lose unsaved changes."
      confirmLabel="Discard changes"
      cancelLabel="Continue Editing"
      variant="warning"
    />
    </>
  );
}
