'use client';

import { useState, useEffect } from 'react';
import { ILocationLogo } from '@/types/ILocationLogo';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { FiltersSection } from '@/components/ui/FiltersSection';
import { ResultsSummary } from '@/components/ui/ResultsSummary';
import LocationLogoCard from './LocationLogoCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { errorToast, successToast } from '@/utils/toast';
import '@/styles/pagination.css';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function LocationLogoManagement() {
  const [logos, setLogos] = useState<ILocationLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
  const [selectedLogo, setSelectedLogo] = useState<ILocationLogo | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const limit = 9;

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchLocationLogos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, locationFilter]);

  const fetchLocations = async () => {
    try {
      const response = await authenticatedFetch('/api/cities');
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      errorToast.generic('Failed to load locations');
    }
  };

  const fetchLocationLogos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy: 'DocumentModifiedDate',
        sortOrder: 'desc'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (locationFilter) params.append('location', locationFilter);

      const response = await authenticatedFetch(`/api/location-logos?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch location logos');
      }

      const data = await response.json();
      setLogos(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load location logos';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    const logo = logos.find(l => l._id === id);
    if (logo) {
      setSelectedLogo(logo);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLogo) return;

    try {
      const response = await authenticatedFetch(`/api/location-logos/${selectedLogo._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete location logo');
      }

      successToast.delete('location logo');
      setShowDeleteModal(false);
      setSelectedLogo(null);
      
      // Refresh list
      if (logos.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchLocationLogos();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete location logo';
      errorToast.generic(errorMessage);
    }
  };


  return (
    <>
      {/* Filters */}
      <FiltersSection
        searchPlaceholder="Search by name..."
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
          }
        ]}
      />

      {/* Results Summary */}
      <ResultsSummary Loading={loading} Total={total} ItemName="location logo" />

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Error Loading Location Logos"
          message={error}
          onRetry={fetchLocationLogos}
        />
      )}

      {/* Empty State */}
      {!loading && !error && logos.length === 0 && (
        <EmptyState
          title="No Location Logos Found"
          message={
            searchTerm || locationFilter ? (
              <p>No location logos match your current filters. Try adjusting your search criteria.</p>
            ) : (
              <p>No location logos available.</p>
            )
          }
        />
      )}

      {/* Location Logos Grid */}
      {!loading && !error && logos.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logos.map((logo) => (
              <LocationLogoCard
                key={logo._id}
                logo={logo}
                onDelete={handleDeleteClick}
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

      {/* Delete Confirmation Modal */}
      {selectedLogo && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedLogo(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Location Logo"
          message={`Are you sure you want to delete "${selectedLogo.DisplayName}"? This action cannot be undone.`}
        />
      )}
    </>
  );
}
