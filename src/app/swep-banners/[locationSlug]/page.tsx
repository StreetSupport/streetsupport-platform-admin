'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { formatSwepActivePeriod, parseSwepBody } from '@/utils/swep';
import { ErrorState } from '@/components/ui/ErrorState';
import { errorToast } from '@/utils/toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SwepViewPage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN, ROLES.SWEP_ADMIN],
    requiredPage: '/swep-banners',
    autoRedirect: true
  });

  const params = useParams();
  const locationSlug = params.locationSlug as string;

  const [swepData, setSwepData] = useState<ISwepBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      fetchSwepData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSlug, isAuthorized]);

  const fetchSwepData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`/api/swep-banners/${locationSlug}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch SWEP banner');
      }

      const data = await response.json();
      const swepBanner = data.data || data;
      setSwepData(swepBanner);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load SWEP banner';
      setError(errorMessage);
      errorToast.load('SWEP banner', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authorization or fetching data
  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized (redirect handled by hook)
  if (!isAuthorized) {
    return null;
  }

  // Error state
  if (error || !swepData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ErrorState
          title="Error Loading SWEP Banner"
          message={error || `No SWEP banner found for ${locationSlug}`}
          onRetry={fetchSwepData}
        />
      </div>
    );
  }

  const activePeriodText = formatSwepActivePeriod(swepData);
  const parsedBody = parseSwepBody(swepData.Body);

  return (
    <>
      {/* SWEP Header Section - Full width matching public website */}
      <div className="bg-red-50 border-b-4 border-brand-g py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-brand-g rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <h1 className="text-3xl font-bold text-red-800 mb-0">
              {swepData.Title}
            </h1>
          </div>
          <p className="text-lg text-red-700 mb-4">
            {activePeriodText}
          </p>
          <div className="bg-brand-g text-white px-4 py-2 rounded-md inline-block">
            <strong>Emergency Support Available</strong>
          </div>
        </div>
      </div>

      {/* Content Section - matching public website */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          {swepData.Image && (
            <div className="mb-8">
              <img 
                src={swepData.Image} 
                alt={`SWEP information for ${swepData.LocationName || locationSlug}`}
                className="w-full h-auto object-contain rounded-lg shadow-md"
              />
            </div>
          )}
          
          {/* Body content with prose styling */}
          <div 
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: parsedBody }}
          />
          
          {/* Emergency Contacts Section */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <h3 className="text-xl font-semibold mb-3 text-blue-800">Emergency Contacts</h3>
            <div className="space-y-2">
              <p className="text-blue-700">
                <strong>Immediate danger:</strong>{' '}
                <a href="tel:999" className="text-blue-600 hover:text-blue-800 underline font-semibold">
                  Call 999
                </a>
              </p>
              <p className="text-blue-700">
                <strong>Someone sleeping rough:</strong>{' '}
                <a 
                  href="https://thestreetlink.org.uk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  Report via StreetLink
                </a>
              </p>
              {swepData.EmergencyContact && swepData.EmergencyContact.Phone && (
                <p className="text-blue-700">
                  <strong>Local SWEP Support:</strong>{' '}
                  <a 
                    href={`tel:${swepData.EmergencyContact.Phone}`}
                    className="text-blue-600 hover:text-blue-800 underline font-semibold"
                  >
                    {swepData.EmergencyContact.Phone}
                  </a>
                  {swepData.EmergencyContact.Hours && (
                    <>
                      <br />
                      <small className="text-blue-600">
                        {swepData.EmergencyContact.Hours}
                      </small>
                    </>
                  )}
                  {swepData.EmergencyContact.Email && (
                    <>
                      <br />
                      <a 
                        href={`mailto:${swepData.EmergencyContact.Email}`}
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        {swepData.EmergencyContact.Email}
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
