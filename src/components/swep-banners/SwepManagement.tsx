'use client';

import { useState, useEffect } from 'react';
import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { FiltersSection } from '@/components/ui/FiltersSection';
import { ResultsSummary } from '@/components/ui/ResultsSummary';
import SwepCard from './SwepCard';
import ActivateSwepModal from './ActivateSwepModal';
import { errorToast, successToast } from '@/utils/toast';
import toast from 'react-hot-toast';
import '@/styles/pagination.css';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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

      if (searchInput?.trim()) params.append('search', searchInput.trim());
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
      <FiltersSection
        searchPlaceholder="Search by title, message..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => {
          setSearchTerm(searchInput);
          setCurrentPage(1);
        }}
        filters={[
          {
            id: 'location-filter',
            value: locationFilter,
            onChange: (value) => {
              setLocationFilter(value);
              setCurrentPage(1);
            },
            placeholder: 'All Locations',
            options: locations.map((location) => ({
              label: location.Name,
              value: location.Key
            }))
          },
          {
            id: 'status-filter',
            value: isActiveFilter,
            onChange: (value) => {
              setIsActiveFilter(value);
              setCurrentPage(1);
            },
            placeholder: 'All Status',
            options: [
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' }
            ]
          }
        ]}
      />

      {/* Results Summary */}
      <ResultsSummary Loading={loading} Total={total} ItemName="SWEP banner" />

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Error Loading SWEP Banners"
          message={error}
          onRetry={fetchSwepBanners}
        />
      )}

      {/* Empty State */}
      {!loading && !error && swepBanners.length === 0 && (
        <EmptyState
          title="No SWEP Banners Found"
          message={
            searchTerm || isActiveFilter || locationFilter ? (
              <p>No SWEP banners match your current filters. Try adjusting your search criteria.</p>
            ) : (
              <p>No SWEP banners available.</p>
            )
          }
        />
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
