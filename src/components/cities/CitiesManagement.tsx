'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface City {
  _id: string;
  key: string;
  name: string;
  isPublic: boolean;
  isOpenToRegistrations: boolean;
  latitude: number;
  longitude: number;
}

export default function CitiesManagement() {
  const { data: session } = useSession();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cities', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }

      const result = await response.json();
      setCities(result.success ? result.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  const userAuthClaims = session?.user?.authClaims;
  const isCityAdmin = userAuthClaims?.roles.includes('CityAdmin');
  const isSuperAdmin = userAuthClaims?.roles.includes('SuperAdmin');

  // Filter cities based on user permissions
  const filteredCities = cities.filter(city => {
    if (isSuperAdmin) return true;
    if (isCityAdmin) {
      // Check if user has specific city admin permissions
      const cityAdminClaims = userAuthClaims?.specificClaims.filter(claim => 
        claim.startsWith('CityAdminFor:')
      ) || [];
      
      return cityAdminClaims.some(claim => {
        const cityKey = claim.replace('CityAdminFor:', '');
        return city.key === cityKey;
      });
    }
    return false;
  });

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
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Cities</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchCities}
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
          <h2 className="text-lg font-medium text-gray-900">Cities Management</h2>
          {isSuperAdmin && (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-a hover:bg-brand-b focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-a"
            >
              Add New City
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {isCityAdmin && !isSuperAdmin 
            ? 'Manage cities you have administrative access to'
            : 'Manage all cities in the system'
          }
        </p>
      </div>

      {filteredCities.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Cities Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isCityAdmin && !isSuperAdmin 
              ? 'You don\'t have administrative access to any cities yet.'
              : 'No cities have been created yet.'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCities.map((city) => (
                <tr key={city._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{city.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{city.key}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      city.isPublic 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {city.isPublic ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      city.isOpenToRegistrations 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {city.isOpenToRegistrations ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-brand-a hover:text-brand-b mr-4"
                      onClick={() => {/* TODO: Implement edit functionality */}}
                    >
                      Edit
                    </button>
                    {isSuperAdmin && (
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {/* TODO: Implement delete functionality */}}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
