'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast } from '@/utils/toast';
import { validateFaq, transformErrorPath } from '@/schemas/faqSchema';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ValidationError {
  Path: string;
  Message: string;
}

export default function AdviceEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Check authorization FIRST
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/advice',
    autoRedirect: true
  });

  const { data: session } = useSession();
  const userRoles = session?.user?.authClaims?.roles || [];
  const canAccessGeneralAdvice = userRoles.includes(ROLES.SUPER_ADMIN) || userRoles.includes(ROLES.VOLUNTEER_ADMIN);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
  const { setAdviceTitle } = useBreadcrumb();

  // Form state
  const [formData, setFormData] = useState({
    LocationKey: '',
    Title: '',
    Body: '',
    SortPosition: 0,
  });

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (isAuthorized && id) {
      fetchAdvice();
    }
    
    // Cleanup: Clear advice title when component unmounts
    return () => {
      setAdviceTitle(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, id]);

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

  const fetchAdvice = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/advice/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch advice');
      }
      
      const responseData = await response.json();
      const data = responseData.data || responseData;

      const initialFormData = {
        LocationKey: data.LocationKey || '',
        Title: data.Title || '',
        Body: data.Body || '',
        SortPosition: data.SortPosition || 0,
      };
      
      setFormData(initialFormData);
      setOriginalData(initialFormData);
      setAdviceTitle(data.Title);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load advice';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateFaq(formData);
    if (!validation.success) {
      const errors = validation.errors.map(err => ({
        Path: transformErrorPath(err.path),
        Message: err.message
      }));
      setValidationErrors(errors);
      errorToast.validation();
      return;
    }
    
    try {
      setSaving(true);
      setValidationErrors([]);
      
      const response = await authenticatedFetch(`/api/advice/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update advice');
      }
      
      successToast.update('Advice');
      router.push(`/advice/${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update advice';
      errorToast.generic(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (JSON.stringify(formData) !== JSON.stringify(originalData)) {
      setShowCancelModal(true);
    } else {
      router.push(`/advice/${id}`);
    }
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    router.push(`/advice/${id}`);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Show loading while checking authorization or fetching data
  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized (redirect handled by hook)
  if (!isAuthorized) {
    return null;
  }

  // Show error if fetch failed
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ErrorState
          title="Error Loading Advice"
          message={error || 'Advice not found'}
          onRetry={fetchAdvice}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader title="Edit Advice" />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="mb-8">
          {/* All Form Fields in One Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-brand-k mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  type="text"
                  value={formData.Title}
                  onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                  placeholder="Enter advice title..."
                />
              </div>

              {/* Location Select */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-brand-k mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <select
                  id="location"
                  value={formData.LocationKey}
                  onChange={(e) => setFormData({ ...formData, LocationKey: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a location</option>
                  {canAccessGeneralAdvice && <option value="general">General Advice</option>}
                  {locations.map((city) => (
                    <option key={city.Key} value={city.Key}>
                      {city.Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Position */}
              <div>
                <label htmlFor="sortPosition" className="block text-sm font-medium text-brand-k mb-2">
                  Sort Position <span className="text-red-500">*</span>
                </label>
                <Input
                  id="sortPosition"
                  type="number"
                  min="0"
                  value={formData.SortPosition}
                  onChange={(e) => setFormData({ ...formData, SortPosition: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-brand-f mt-1">
                  Lower numbers appear first in the list
                </p>
              </div>

              {/* Rich Text Editor */}
              <div>
                <RichTextEditor
                  label="Body Content"
                  value={formData.Body}
                  onChange={(value) => setFormData({ ...formData, Body: value })}
                  placeholder="Enter the advice content..."
                  minHeight="400px"
                />
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mt-4">
                  <ErrorDisplay ValidationErrors={validationErrors} />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-6 border-t border-brand-q mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || !hasChanges}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to leave without saving?"
        confirmLabel="Discard Changes"
        variant="danger"
      />
    </div>
  );
}
