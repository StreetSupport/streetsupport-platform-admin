'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import LocationLogoManagement from '@/components/location-logos/LocationLogoManagement';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function LocationLogosPage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.VOLUNTEER_ADMIN, ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
    requiredPage: '/location-logos',
    autoRedirect: true
  });

  // Show loading while checking authorization
  if (isChecking) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized (redirect handled by hook)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader 
        title="Location Logos"
        actions={
          <Link href="/location-logos/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Logo
            </Button>
          </Link>
        }
      />

      <div className="page-container section-spacing padding-top-zero">
        <LocationLogoManagement />
      </div>
    </div>
  );
}

