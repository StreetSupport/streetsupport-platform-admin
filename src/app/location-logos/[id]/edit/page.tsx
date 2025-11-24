'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import LocationLogoForm from '@/components/location-logos/LocationLogoForm';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { successToast, errorToast } from '@/utils/toast';
import { ErrorState } from '@/components/ui/ErrorState';
import { ILocationLogo } from '@/types/ILocationLogo';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { redirectToNotFound } from '@/utils/navigation';

export default function EditLocationLogoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [logo, setLogo] = useState<ILocationLogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLogoTitle } = useBreadcrumb();

  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.VOLUNTEER_ADMIN, ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
    requiredPage: `/location-logos/${id}/edit`,
    autoRedirect: true
  });

  useEffect(() => {
    if (isAuthorized && id) {
      fetchLogo();
    }
    
    // Cleanup: Clear logo title when component unmounts
    return () => {
      setLogoTitle(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, id]);

  const fetchLogo = async () => {
    let redirected = false;

    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/location-logos/${id}`);
      const data = await response.json();

      if (!response.ok) {
        if (redirectToNotFound(response, router)) {
          redirected = true;
          return;
        }

        throw new Error(data.error || 'Failed to fetch location logo');
      }

      const logoData = data.data || data;
      setLogo(logoData);
      setLogoTitle(logoData.DisplayName);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load location logo';
      setError(errorMessage);
    } finally {
      if (!redirected) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/location-logos/${id}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update location logo');
      }

      successToast.update('Location logo');
      router.push(`/location-logos/${id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update location logo';
      errorToast.generic(message);
    } finally {
      setSaving(false);
    }
  };

  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return null;
  }

  if (error || !logo) {
    return (
      <div className="min-h-screen bg-brand-q">
        <div className="page-container section-spacing padding-top-zero">
          <ErrorState
            title="Failed to Load Location Logo"
            message={error || 'Location logo not found'}
            onRetry={fetchLogo}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader title="Edit Location Logo" />

      <div className="page-container section-spacing padding-top-zero">
        <div className="max-w-3xl mx-auto py-8">
          <LocationLogoForm
            initialData={logo}
            onSubmit={handleSubmit}
            onCancel={() => {}}
            isEdit={true}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}
