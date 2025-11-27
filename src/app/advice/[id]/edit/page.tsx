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
import { Select } from '@/components/ui/Select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FormField } from '@/components/ui/FormField';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { redirectToNotFound } from '@/utils/navigation';

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
  const [showConfirmModal, setshowConfirmModal] = useState(false);
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
    let redirected = false;

    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/advice/${id}`);
      const responseData = await response.json();
      
      if (!response.ok) {
        if (redirectToNotFound(response, router)) {
          redirected = true;
          return;
        }
        
        throw new Error(responseData.error || 'Failed to fetch advice');
      }
      
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
      if (!redirected) {
        setLoading(false);
      }
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
      setshowConfirmModal(true);
    } else {
      router.push(`/advice`);
    }
  };

  const confirmCancel = () => {
    setshowConfirmModal(false);
    router.push('/advice');
  };

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
              <FormField label="Title" required>
                <Input
                  id="title"
                  type="text"
                  value={formData.Title}
                  onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                  placeholder="Enter advice title..."
                />
              </FormField>

              {/* Location Select */}
              <FormField label="Location" required>
                <Select
                  id="location"
                  value={formData.LocationKey}
                  onChange={(e) => setFormData({ ...formData, LocationKey: e.target.value })}
                  options={[
                    ...(canAccessGeneralAdvice ? [{ value: 'general', label: 'General Advice' }] : []),
                    ...locations.map(city => ({ value: city.Key, label: city.Name }))
                  ]}
                  placeholder="Select a location"
                />
              </FormField>

              {/* Sort Position */}
              <FormField label="Sort Position" required>
                <Input
                  id="sortPosition"
                  type="number"
                  min="0"
                  value={formData.SortPosition}
                  onChange={(e) => setFormData({ ...formData, SortPosition: parseInt(e.target.value) || 0 })}
                />
              </FormField>

              {/* Rich Text Editor */}
              <div>
                <RichTextEditor
                  label="Body Content"
                  value={formData.Body}
                  onChange={(value) => setFormData({ ...formData, Body: value })}
                  placeholder="Enter the advice content..."
                  minHeight="400px"
                  required
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
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setshowConfirmModal(false)}
        onConfirm={confirmCancel}
        title="Close without saving?"
        message="You may lose unsaved changes."
        variant="warning"
        confirmLabel="Close Without Saving"
        cancelLabel="Continue Editing"
      />
    </div>
  );
}
