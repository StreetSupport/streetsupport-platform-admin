'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IResource } from '@/types/resources/IResource';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

export default function ResourcesPage() {
  // Check authorization FIRST
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
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
        : Array.isArray((data as any).data)
          ? (data as any).data
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
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

  // Organize resources by section
  const everyoneResources = resources.filter(r => 
    ['alternative-giving', 'effective-volunteering', 'charters', 'street-feeding-groups'].includes(r.Key)
  );
  
  const networkResources = resources.filter(r => 
    ['branding', 'partnership-comms', 'marketing', 'user-guides'].includes(r.Key)
  );

  // Show loading while checking authorization
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 brand-a"></div>
      </div>
    );
  }

  // Don't render anything if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-q">
      {/* Header */}
      <div className="nav-container">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            <h1 className="heading-4">Resources</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-[6px] pb-12">

      {/* Filters */}
      <div className="bg-white rounded-lg border border-brand-q p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-f w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e);
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleSearch}
                className="whitespace-nowrap"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-a"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <h2 className="heading-5 mb-4 text-brand-g">Error Loading Resources</h2>
          <p className="text-base text-brand-f mb-6">{error}</p>
          <Button variant="primary" onClick={fetchResources}>
            Try Again
          </Button>
        </div>
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
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!loading && !error && resources.length === 0 && (
            <div className="text-center py-12">
              <h2 className="heading-5 mb-4">No Resources Found</h2>
              <div className="text-base text-brand-f mb-6 space-y-2">
                {searchTerm ? (
                  <p>No resources match your search criteria. Try different keywords.</p>
                ) : (
                  <p>No resources available.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>
  );
}
