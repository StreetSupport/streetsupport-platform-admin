'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SupportedByPage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.VOLUNTEER_ADMIN, ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
    requiredPage: '/supported-by',
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
    <div>
      <h1>Supported By</h1>
    </div>
  );
}

