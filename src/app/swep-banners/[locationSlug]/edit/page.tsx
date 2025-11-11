'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { ISwepBanner, ISwepBannerFormData } from '@/types/swep-banners/ISwepBanner';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast, loadingToast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { validateSwepBanner, transformErrorPath } from '@/schemas/swepBannerSchema';
import toast from 'react-hot-toast';
import { useRef } from 'react';

export default function SwepEditPage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN, ROLES.SWEP_ADMIN],
    requiredPage: '/swep-banners',
    autoRedirect: true
  });

  const params = useParams();
  const router = useRouter();
  const locationSlug = params.locationSlug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swep, setSwep] = useState<ISwepBanner | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ Path: string; Message: string }>>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ISwepBannerFormData>({
    LocationSlug: '',
    Title: '',
    Body: '',
    ShortMessage: '',
    IsActive: false,
    EmergencyContact: {
      Phone: '',
      Email: '',
      Hours: ''
    },
    Image: ''
  });

  useEffect(() => {
    fetchSwep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSlug]);

  const fetchSwep = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`/api/swep-banners/${locationSlug}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch SWEP banner');
      }

      const data = await response.json();
      const swepData = data.data || data;
      setSwep(swepData);
      
      // Initialize form with existing data
      const initialData: ISwepBannerFormData = {
        LocationSlug: swepData.LocationSlug,
        Title: swepData.Title,
        Body: swepData.Body,
        ShortMessage: swepData.ShortMessage,
        SwepActiveFrom: swepData.SwepActiveFrom ? new Date(swepData.SwepActiveFrom) : undefined,
        SwepActiveUntil: swepData.SwepActiveUntil ? new Date(swepData.SwepActiveUntil) : undefined,
        IsActive: swepData.IsActive,
        EmergencyContact: swepData.EmergencyContact || { Phone: '', Email: '', Hours: '' },
        Image: ''
      };
      setFormData(initialData);
      setImageRemoved(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load SWEP banner';
      setError(errorMessage);
      errorToast.load('SWEP banner', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    // Validate form data
    const validation = validateSwepBanner(formData);
    if (!validation.success) {
      const errors = validation.errors.map(err => {
        const pathString = Array.isArray(err.path) ? err.path.join('.') : err.path;
        return {
          Path: transformErrorPath(pathString),
          Message: err.message
        };
      });
      setValidationErrors(errors);
      errorToast.validation();
      return;
    }

    const toastId = loadingToast.update('SWEP banner');
    setSaving(true);

    try {
      // ALWAYS use FormData (like Banner approach) - cleaner and more consistent
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('LocationSlug', formData.LocationSlug);
      formDataToSend.append('Title', formData.Title);
      formDataToSend.append('Body', formData.Body);
      formDataToSend.append('ShortMessage', formData.ShortMessage);
      formDataToSend.append('EmergencyContact', JSON.stringify(formData.EmergencyContact));
      
      // Handle image field using Banner approach (newfile_ / existing_ prefixes)
      if (imageFile) {
        // New image file uploaded
        formDataToSend.append('newfile_image', imageFile);
      } else if (imageRemoved) {
        // User explicitly removed the image - send empty Image property to signal removal
        formDataToSend.append('Image', '');
      } else if (swep?.Image) {
        // No new file, preserve existing image URL
        formDataToSend.append('existing_image', JSON.stringify({ url: swep.Image }));
      }
      // If neither imageFile nor swep.Image exists, Image will be empty (removed)

      const response = await authenticatedFetch(`/api/swep-banners/${locationSlug}`, {
        method: 'PUT',
        body: formDataToSend,
        // Don't set Content-Type header - browser will set it automatically with boundary
      });

      if (!response.ok) {
        // Dismiss loading toast before showing error
        toast.dismiss(toastId);
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update SWEP banner');
      }

      toast.dismiss(toastId);
      successToast.update('SWEP banner');
      router.push('/swep-banners');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update SWEP banner';
      errorToast.update('SWEP banner', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // TODO: handle cancelling action
    // setShowConfirmModal(true);
    confirmCancel();
  };

  const confirmCancel = () => {
    setShowConfirmModal(false);
    router.push('/swep-banners');
  };

  // Show loading while checking authorization
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
      </div>
    );
  }

  // Don't render anything if not authorized (redirect handled by hook)
  if (!isAuthorized) {
    return null;
  }

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-a"></div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="heading-5 mb-4 text-brand-g">Error Loading SWEP Banner</h2>
          <p className="text-base text-brand-f mb-6">{error}</p>
          <Button variant="primary" onClick={fetchSwep}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit SWEP Banner</h1>
        <p className="mt-2 text-gray-600 text-lg font-medium">{swep?.LocationName || locationSlug}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Image Upload Section */}
        <div className="border-b border-brand-q pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Banner Image</h3>
          
          {/* Current Image Preview */}
          {(imagePreview || (swep?.Image && !imageRemoved)) && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Image:</p>
              <div className="relative w-full aspect-[16/9] border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={imagePreview || swep?.Image}
                  alt="SWEP Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Remove Existing Image Button */}
              {!imageFile && swep?.Image && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageRemoved(true);
                    setImagePreview(null);
                  }}
                  className="mt-2"
                >
                  Remove Existing Image
                </Button>
              )}
            </div>
          )}
          
          {/* Image Upload Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {swep?.Image ? 'Change Image' : 'Upload Image'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-brand-a file:text-white
                hover:file:bg-brand-b
                cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-500">
              Accepted formats: JPG, PNG, GIF, WebP. Maximum file size: 5MB.
            </p>
            {imageFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setImageRemoved(false);
                  // Reset file input to allow re-uploading the same file
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="mt-2"
              >
                Remove New Upload
              </Button>
            )}
            {imageRemoved && !imageFile && (
              <div className="mt-2 text-sm text-orange-600 font-medium">
                ⚠️ Image will be removed when you save changes
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.Title}
            onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
          />
        </div>

        {/* Short Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Message <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.ShortMessage}
            onChange={(e) => setFormData({ ...formData, ShortMessage: e.target.value })}
          />
        </div>

        {/* Body (Rich Text Editor) */}
        <RichTextEditor
          label="Body Content"
          value={formData.Body}
          onChange={(value) => setFormData({ ...formData, Body: value })}
          placeholder="Enter the SWEP banner body content..."
          required
          minHeight="300px"
        />

        {/* Emergency Contact Section */}
        <div className="border-t border-brand-q pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.EmergencyContact?.Phone || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  EmergencyContact: { ...formData.EmergencyContact, Phone: e.target.value }
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.EmergencyContact?.Email || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  EmergencyContact: { ...formData.EmergencyContact, Email: e.target.value }
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours
              </label>
              <Input
                type="text"
                value={formData.EmergencyContact?.Hours || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  EmergencyContact: { ...formData.EmergencyContact, Hours: e.target.value }
                })}
              />
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <ErrorDisplay ValidationErrors={validationErrors} />
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-brand-q">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCancel}
        title="Close without saving?"
        message="You may lose unsaved changes."
        variant="warning"
        confirmLabel="Discard changes"
        cancelLabel="Continue Editing"
      />
    </div>
  );
}

