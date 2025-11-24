'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { PageHeader } from '@/components/ui/PageHeader';
import SwepManagement from '@/components/swep-banners/SwepManagement';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SwepsPage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN, ROLES.SWEP_ADMIN],
    requiredPage: '/swep-banners',
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
      <PageHeader title="SWEP" />

      <div className="page-container section-spacing padding-top-zero">
        <SwepManagement />
      </div>
    </div>
  );
}
