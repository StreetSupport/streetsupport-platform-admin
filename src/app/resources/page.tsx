'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IResource } from '@/types/resources/IResource';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast } from '@/utils/toast';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { FiltersSection } from '@/components/ui/FiltersSection';
import { ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ResourcesPage() {
  // Check authorization FIRST
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SUPER_ADMIN_PLUS, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/resources',
    autoRedirect: true
  });

  const [resources, setResources] = useState<IResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAuthorized) {
      fetchResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, searchTerm]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const url = searchTerm 
        ? `/api/resources?search=${encodeURIComponent(searchTerm)}`
        : '/api/resources';
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch resources');
      }
      
      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as { data?: unknown[] }).data)
          ? (data as { data: unknown[] }).data
          : [];

      if (!Array.isArray(list)) {
        throw new Error('Unexpected API response format for resources');
      }

      setResources(list);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load resources';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Get resource icon path
  const getResourceIcon = (key: string) => {
    const iconMap: { [key: string]: string } = {
      'alternative-giving': '/assets/img/resource-icons/alternative-giving-icon.png',
      'effective-volunteering': '/assets/img/resource-icons/volunteering-icon.png',
      'charters': '/assets/img/resource-icons/charters-icon.png',
      'street-feeding-groups': '/assets/img/resource-icons/streetfeeding-icon.png',
      'branding': '/assets/img/resource-icons/branding-icon.png',
      'partnership-comms': '/assets/img/resource-icons/partnership-comms-icon.png',
      'marketing': '/assets/img/resource-icons/marketing-icon.png',
      'user-guides': '/assets/img/resource-icons/user-guides-icon.png',
    };
    return iconMap[key] || '/assets/img/resource-icons/alternative-giving-icon.png';
  };

  // Get public website URL
  const getPublicResourceUrl = (key: string) => {
    return `${process.env.NEXT_PUBLIC_WEB_URL}/resources/${key}`;
  };

  // Organize resources by section
  const everyoneResources = resources.filter(r => 
    ['alternative-giving', 'effective-volunteering', 'charters', 'street-feeding-groups'].includes(r.Key)
  );
  
  const networkResources = resources.filter(r => 
    ['branding', 'partnership-comms', 'marketing', 'user-guides'].includes(r.Key)
  );

  // Show loading while checking authorization
  if (isChecking) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader title="Resources" />

      <div className="max-w-7xl mx-auto px-6 pt-[6px] pb-12">

      {/* Filters */}
      <FiltersSection
        searchPlaceholder="Search..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => setSearchTerm(searchInput)}
      />

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Error Loading Resources"
          message={error}
          onRetry={fetchResources}
        />
      )}

      {/* Resources Content */}
      {!loading && !error && (
        <>
          {/* Resources for Everyone */}
          {everyoneResources.length > 0 && (
            <section className="mb-16">
              <h2 className="heading-2">Resources for Everyone</h2>
              <p className="text-base mb-8">This section is for anyone looking to make a difference. Whether you&apos;re an individual, a business, or part of a community group, you&apos;ll find best practice guides and information to help support people experiencing homelessness.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {everyoneResources.map((resource) => (
                  <article key={resource._id.toString()} className="card card-compact flex flex-col h-full p-8 shadow-lg">
                    <div className="flex items-center mb-6">
                      <Image
                        src={getResourceIcon(resource.Key)}
                        alt={resource.Name}
                        width={70}
                        height={70}
                        className="mr-4"
                      />
                      <h3 className="heading-5">{resource.Name}</h3>
                    </div>
                    <p className="text-small mb-6 flex-grow">{resource.ShortDescription}</p>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Link 
                          href={`/resources/${resource.Key}/edit`} 
                          className="btn-base btn-primary btn-md flex-1"
                        >
                          Edit
                        </Link>
                      </div>
                      <Link 
                        href={getPublicResourceUrl(resource.Key)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-base btn-tertiary btn-md w-full flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Website
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Resources for Our Network */}
          {networkResources.length > 0 && (
            <section>
              <h2 className="heading-2">Resources for Our Network</h2>
              <p className="text-base mb-8">This section is for our Street Support Network Partners, designed to help you promote your location, customise the SSN brand for your area, and benefit from being part of our Network.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {networkResources.map((resource) => (
                  <article key={resource._id.toString()} className="card card-compact flex flex-col h-full p-8 shadow-lg">
                    <div className="flex items-center mb-6">
                      <Image
                        src={getResourceIcon(resource.Key)}
                        alt={resource.Name}
                        width={70}
                        height={70}
                        className="mr-4"
                      />
                      <h3 className="heading-5">{resource.Name}</h3>
                    </div>
                    <p className="text-small mb-6 flex-grow">{resource.ShortDescription}</p>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Link 
                          href={`/resources/${resource.Key}`} 
                          className="btn-base btn-secondary btn-md flex-1"
                        >
                          View
                        </Link>
                        <Link 
                          href={`/resources/${resource.Key}/edit`} 
                          className="btn-base btn-primary btn-md flex-1"
                        >
                          Edit
                        </Link>
                      </div>
                      <Link 
                        href={getPublicResourceUrl(resource.Key)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-base btn-tertiary btn-md w-full flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Website
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!loading && !error && resources.length === 0 && (
            <EmptyState
              title="No Resources Found"
              message={
                searchTerm ? (
                  <p>No resources match your search criteria. Try adjusting your search criteria.</p>
                ) : (
                  <p>No resources available.</p>
                )
              }
            />
          )}
        </>
      )}
    </div>
  </div>
  );
}
