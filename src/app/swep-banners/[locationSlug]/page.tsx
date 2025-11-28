'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ErrorState } from '@/components/ui/ErrorState';
import { errorToast } from '@/utils/toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { redirectToNotFound } from '@/utils/navigation';

export default function SwepViewPage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN, ROLES.SWEP_ADMIN],
    requiredPage: '/swep-banners',
    autoRedirect: true
  });

  const params = useParams();
  const router = useRouter();
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
    let redirected = false;

    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`/api/swep-banners/${locationSlug}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        if (redirectToNotFound(response, router)) {
          redirected = true;
          return;
        }

        throw new Error(data.error || 'Failed to fetch SWEP banner');
      }

      const swepBanner = data.data || data;
      setSwepData(swepBanner);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load SWEP banner';
      setError(errorMessage);
      errorToast.load('SWEP banner', errorMessage);
    } finally {
      if (!redirected) {
        setLoading(false);
      }
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

  return (
    <>
      {/* SWEP Header Section - Full width matching public website */}
      {!swepData.IsActive && (
        <div className="bg-brand-d py-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-brand-l mb-4">
              Severe Weather Emergency Accommodation is not currently active in {swepData.LocationName}
            </h2>
            <p className="text-brand-k mb-4">
              This page provides information about emergency accommodation during severe weather. The service is activated when temperatures drop below freezing.
            </p>
            <p className="text-brand-k mb-6">If you need help right now, please visit:</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`${process.env.NEXT_PUBLIC_WEB_URL}/${swepData.LocationSlug}/advice/`}
                className="inline-flex items-center justify-center px-6 py-3 bg-brand-g text-white font-semibold rounded-md hover:bg-opacity-90 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                See emergency advice
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_WEB_URL}/find-help/`}
                className="inline-flex items-center justify-center px-6 py-3 bg-brand-e text-brand-l font-semibold rounded-md hover:bg-opacity-90 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Find Help
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Content Section - matching public website */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          {swepData.Image && (
            <div className="bg-white rounded-lg overflow-hidden relative w-full mb-8" style={{minHeight: '400px'}}>
              <Image 
                src={swepData.Image} 
                alt={`SWEP information for ${swepData.LocationName || locationSlug}`}
                fill
                className="rounded-lg shadow-md"
              />
            </div>
          )}
          
          {/* Body content with prose styling */}
          <div 
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: swepData.Body }}
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
