'use client';

import { withAuthorization } from '@/components/auth/withAuthorization';
import SwepManagement from '@/components/sweps/SwepManagement';
import { ROLES } from '@/constants/roles';

function SwepsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SWEP banners</h1>
        <p className="mt-2 text-gray-600">Manage SWEP banners</p>
      </div>

      <SwepManagement />
    </div>
  );
}

export default withAuthorization(SwepsPage, {
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN, ROLES.SWEP_ADMIN],
  requiredPage: '/swep-banners'
});
