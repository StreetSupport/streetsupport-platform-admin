'use client';

import { useState, useEffect, useCallback } from 'react';
// import { useSession } from 'next-auth/react';
// import { ROLES } from '@/constants/roles';

// interface City {
//   _id: string;
//   key: string;
//   name: string;
//   isPublic: boolean;
//   isOpenToRegistrations: boolean;
//   latitude: number;
//   longitude: number;
// }

export default function SwepManagement() {
  // const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: handle error response. Take example from users
      // const response = await authenticatedFetch('/api/cities', {
      //   headers: {
      //     'Authorization': `Bearer ${session?.accessToken}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to fetch locations');
      // }

      // const result = await response.json();
      // setCities(result.success ? result.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // const userAuthClaims = session?.user?.authClaims;
  // const isCityAdmin = userAuthClaims?.roles.includes(ROLES.CITY_ADMIN);
  // const isSuperAdmin = userAuthClaims?.roles.includes(ROLES.SUPER_ADMIN);
  // const isSwepAdmin = userAuthClaims?.roles.includes(ROLES.SWEP_ADMIN);

  // Filter cities based on user permissions
  // const filteredCities = cities.filter(city => {
  //   if (isSuperAdmin) return true;
  //   if (isCityAdmin || isSwepAdmin) {
  //     // Check if user has specific city admin permissions
  //     const cityAdminClaims = userAuthClaims?.specificClaims.filter(claim => 
  //       claim.startsWith(ROLE_PREFIXES.CITY_ADMIN_FOR) || claim.startsWith(ROLE_PREFIXES.SWEP_ADMIN_FOR)
  //     ) || [];
      
  //     return cityAdminClaims.some(claim => {
  //       const cityKey = claim.replace(ROLE_PREFIXES.CITY_ADMIN_FOR, '');
  //       return city.key === cityKey;
  //     });
  //   }
  //   return false;
  // });

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-red-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading SWEP banners</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchLocations}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-a hover:bg-brand-b focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-a"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">SWEP banners management</h2>
        </div>
      </div>
    </div>
  );
}
