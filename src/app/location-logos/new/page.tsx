'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import LocationLogoForm from '@/components/location-logos/LocationLogoForm';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { successToast, errorToast } from '@/utils/toast';

export default function CreateLocationLogoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.VOLUNTEER_ADMIN, ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
    requiredPage: '/location-logos/new',
    autoRedirect: true
  });

  if (isChecking) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return null;
  }

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/location-logos', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create location logo');
      }

      successToast.create('Location logo');
      router.push('/location-logos');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create location logo';
      errorToast.generic(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/location-logos');
  };

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader title="Add New Location Logo" />

      <div className="page-container section-spacing padding-top-zero">
        <div className="max-w-3xl mx-auto py-8">
          <LocationLogoForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}
