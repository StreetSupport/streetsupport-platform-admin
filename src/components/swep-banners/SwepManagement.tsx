'use client';

import { useState, useEffect } from 'react';
import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Search } from 'lucide-react';
import SwepCard from './SwepCard';
import ActivateSwepModal from './ActivateSwepModal';
import { errorToast, successToast } from '@/utils/toast';
import toast from 'react-hot-toast';
import '@/styles/pagination.css';

export default function SwepManagement() {
  const [swepBanners, setSwepBanners] = useState<ISwepBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>(''); // '', 'true', 'false'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
  const [selectedSwep, setSelectedSwep] = useState<ISwepBanner | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  
  const limit = 9;

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchSwepBanners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, isActiveFilter, locationFilter]);

  const fetchLocations = async () => {
    try {
      const response = await authenticatedFetch('/api/cities');
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchSwepBanners = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (isActiveFilter) params.append('isActive', isActiveFilter);
      if (locationFilter) params.append('location', locationFilter);

      const response = await authenticatedFetch(`/api/swep-banners?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch SWEP banners');
      }

      const data = await response.json();
      setSwepBanners(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load SWEP banners';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };
  
  const handleActivateClick = (swep: ISwepBanner) => {
    setSelectedSwep(swep);
    setShowActivateModal(true);
  };

  const handleActivate = async (
    locationSlug: string,
    isActive: boolean,
    swepActiveFrom?: Date,
    swepActiveUntil?: Date
  ) => {
    try {
      const body: {
        IsActive: boolean;
        SwepActiveFrom: Date | null;
        SwepActiveUntil: Date | null;
      } = {
        IsActive: isActive,
        SwepActiveFrom: swepActiveFrom || null,
        SwepActiveUntil: swepActiveUntil || null
      };

      const response = await authenticatedFetch(`/api/swep-banners/${locationSlug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update SWEP banner');
      }

      // Only show success toast if no error occurred
      // Check if this is scheduled activation (has dates but isActive is false)
      if (swepActiveFrom && swepActiveUntil && !isActive) {
        toast.success('SWEP banner activation scheduled successfully!');
      } else if (isActive) {
        successToast.activate('SWEP banner');
      } else {
        successToast.deactivate('SWEP banner');
      }
      await fetchSwepBanners();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update SWEP banner';
      errorToast.update('SWEP banner', errorMessage);
      throw err; // Re-throw to prevent modal from closing
    }
  };

  // Don't render loading/error states here - handle them inline in the main return

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-brand-q p-6 mb-6 mt-[5px]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-f w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by title, message..."
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

          
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white min-w-48"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location.Key} value={location.Key}>
                  {location.Name}
                </option>
              ))}
            </select>

            <select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white min-w-48"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <p className="text-base text-brand-f">
          {loading ? '' : `${total} SWEP banner${total !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-a"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <h2 className="heading-5 mb-4 text-brand-g">Error Loading SWEP Banners</h2>
          <p className="text-base text-brand-f mb-6">{error}</p>
          <Button variant="primary" onClick={fetchSwepBanners}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && swepBanners.length === 0 && (
        <div className="text-center py-12">
          <h2 className="heading-5 mb-4">No SWEP Banners Found</h2>
          <div className="text-base text-brand-f mb-6 space-y-2">
            {searchTerm || isActiveFilter || locationFilter ? (
              <p>No SWEP banners match your current filters. Try adjusting your search criteria.</p>
            ) : (
              <p>No SWEP banners available.</p>
            )}
          </div>
        </div>
      )}

      {/* SWEP Banners Grid */}
      {!loading && !error && swepBanners.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {swepBanners.map((swep) => (
              <SwepCard
                key={swep._id}
                swep={swep}
                onActivate={handleActivateClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center mt-12 space-y-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Activate Modal */}
      {selectedSwep && (
        <ActivateSwepModal
          swep={selectedSwep}
          isOpen={showActivateModal}
          onClose={() => {
            setShowActivateModal(false);
            setSelectedSwep(null);
          }}
          onActivate={handleActivate}
        />
      )}
    </>
  );
}
