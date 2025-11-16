'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ROLES } from '@/constants/roles';
import { IFaq } from '@/types/IFaq';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { FiltersSection } from '@/components/ui/FiltersSection';
import { Plus } from 'lucide-react';
import AdviceCard from './AdviceCard';
import { ResultsSummary } from '@/components/ui/ResultsSummary';
import { errorToast, successToast } from '@/utils/toast';
import '@/styles/pagination.css';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AdviceManagement() {
  const { data: session } = useSession();
  const userRoles = session?.user?.authClaims?.roles || [];
  const canAccessGeneralAdvice = userRoles.includes(ROLES.SUPER_ADMIN) || userRoles.includes(ROLES.VOLUNTEER_ADMIN);

  const [adviceItems, setAdviceItems] = useState<IFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
  
  const limit = 9;

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchAdviceItems();
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
    }
  };

  const fetchAdviceItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (locationFilter) params.append('location', locationFilter);

      const response = await authenticatedFetch(`/api/advice?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch advice items');
      }

      const data = await response.json();
      setAdviceItems(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load advice items';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (advice: IFaq) => {
    // Confirmation is now handled by the AdviceCard component
    try {
      const response = await authenticatedFetch(`/api/advice/${advice._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete advice');
      }

      successToast.delete('Advice');
      fetchAdviceItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete advice';
      errorToast.generic(errorMessage);
    }
  };

  const getLocationName = (locationKey: string): string => {
    if (locationKey === 'general') return 'General Advice';
    const location = locations.find(loc => loc.Key === locationKey);
    return location?.Name || locationKey;
  };

  return (
    <div>
      {/* Filters */}
      <FiltersSection
        searchPlaceholder="Search by title or body..."
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
            options: [
              ...(canAccessGeneralAdvice ? [{ label: 'General Advice', value: 'general' }] : []),
              ...locations.map((location) => ({
                label: location.Name,
                value: location.Key
              }))
            ]
          }
        ]}
      />

      {/* Results Summary */}
      <ResultsSummary Loading={loading} Total={total} ItemName="advice item" />

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Error Loading Advice Items"
          message={error}
          onRetry={fetchAdviceItems}
        />
      )}

      {/* Empty State */}
      {!loading && !error && adviceItems.length === 0 && (
        <EmptyState
          title="No Advice Items Found"
          message={
            searchTerm || locationFilter ? (
              <p>No advice items match your current filters. Try adjusting your search criteria.</p>
            ) : (
              <p>No advice items available.</p>
            )
          }
          action={{
            label: 'Add New Advice',
            icon: <Plus className="w-4 h-4 mr-2" />,
            href: '/advice/new',
            variant: 'primary'
          }}
        />
      )}

      {/* Advice Cards Grid */}
      {!loading && !error && adviceItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adviceItems.map((advice) => (
            <AdviceCard
              key={advice._id}
              advice={advice}
              locationName={getLocationName(advice.LocationKey)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex flex-col items-center mt-12 space-y-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
