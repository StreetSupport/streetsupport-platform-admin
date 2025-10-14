'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';

export default function SwepBannersPage() {
  // Check authorization FIRST
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN, ROLES.SWEP_ADMIN],
    requiredPage: '/swep-banners',
    autoRedirect: true
  });

  // Show loading while checking authorization
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
      </div>
    );
  }

  // Don't render anything if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SWEP banners</h1>
        <p className="mt-2 text-gray-600">Access and manage all available SWEP banners</p>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <p className="text-gray-600">SWEP banners content will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}
