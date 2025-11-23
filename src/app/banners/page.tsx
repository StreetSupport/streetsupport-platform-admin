'use client';
import { useState, useEffect } from 'react';
import '@/styles/pagination.css';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import ActivateBannerModal from '@/components/banners/ActivateBannerModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { FiltersSection } from '@/components/ui/FiltersSection';
import { Plus } from 'lucide-react';
import { ICity } from '@/types';
import { IBanner, BannerTemplateType } from '@/types/banners/IBanner';
import BannerCard from '@/components/banners/BannerCard';
import Link from 'next/link';
import { errorToast, successToast, loadingToast, toastUtils } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ROLES } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ResultsSummary } from '@/components/ui/ResultsSummary';

export default function BannersListPage() {
  // Check authorization FIRST
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/banners',
    autoRedirect: true
  });

  const [banners, setBanners] = useState<IBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [locations, setLocations] = useState<ICity[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<IBanner | null>(null);
  const [bannerToActivate, setBannerToActivate] = useState<IBanner | null>(null);

  const limit = 9;
  
  // Only run effects if authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchLocations();
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchBanners();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, currentPage, searchTerm, templateFilter, statusFilter, locationFilter]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (searchInput?.trim()) params.append('search', searchInput.trim());
      if (templateFilter) params.append('templateType', templateFilter);
      if (statusFilter) params.append('isActive', statusFilter);
      if (locationFilter) params.append('location', locationFilter);
      
      const response = await authenticatedFetch(`/api/banners?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch banners');
      }

      const result = await response.json();
      setBanners(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load banners';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleTemplateFilter = (value: string) => {
    setTemplateFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleLocationFilter = (value: string) => {
    setLocationFilter(value);
    setCurrentPage(1);
  };

  const fetchLocations = async () => {
    try {
      const response = await authenticatedFetch('/api/cities');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch locations');
      }
      const result = await response.json();
      if (result.success) {
        setLocations(result.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch locations';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    }
  };

  // Duplicate functionality removed

  const handleDelete = async (banner: IBanner) => {
    setBannerToDelete(banner);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;

    setShowConfirmModal(false);
    const toastId = loadingToast.delete('banner');
    
    try {
      const response = await authenticatedFetch(`/api/banners/${bannerToDelete._id}`, {
        method: HTTP_METHODS.DELETE
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete banner');
      }

      toastUtils.dismiss(toastId);
      successToast.delete('Banner');
      
      // Refresh the list
      fetchBanners();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete banner';
      toastUtils.dismiss(toastId);
      errorToast.delete('banner', errorMessage);
    } finally {
      setBannerToDelete(null);
    }
  };

  const handleOpenActivateModal = (bannerId: string) => {
    const banner = banners.find(b => b._id === bannerId);
    if (banner) {
      setBannerToActivate(banner);
      setShowActivateModal(true);
    }
  };

  const handleToggleActive = async (bannerId: string, isActive: boolean, startDate?: Date, endDate?: Date) => {
    const toastId = loadingToast.update('banner status');
    setTogglingId(bannerId);
    
    try {
      const response = await authenticatedFetch(`/api/banners/${bannerId}`, {
        method: HTTP_METHODS.PATCH,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          IsActive: isActive,
          StartDate: startDate,
          EndDate: endDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update banner status');
      }

      const result = await response.json();
      
      // Update the banner in the local state
      setBanners(prevBanners => 
        prevBanners.map(b => b._id === bannerId ? result.data : b)
      );
      
      toastUtils.dismiss(toastId);
      successToast.update('Banner status');
      setShowActivateModal(false);
      setBannerToActivate(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update banner status';
      toastUtils.dismiss(toastId);
      errorToast.update('banner status', errorMessage);
      throw err; // Re-throw for modal error handling
    } finally {
      setTogglingId(null);
    }
  };

  // Show loading while checking authorization or fetching data
  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-q">
        <PageHeader 
          title="Banners"
          actions={
            <Link href="/banners/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Banner
              </Button>
            </Link>
          }
        />

        <div className="page-container section-spacing padding-top-zero">
          {/* Filters */}
          <FiltersSection
            searchPlaceholder="Search"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={handleSearchSubmit}
            filters={[
              {
                id: 'location-filter',
                value: locationFilter,
                onChange: handleLocationFilter,
                placeholder: 'All Locations',
                options: locations.map(city => ({
                  label: city.Name,
                  value: city.Key
                }))
              },
              {
                id: 'template-filter',
                value: templateFilter,
                onChange: handleTemplateFilter,
                placeholder: 'All Templates',
                options: [
                  { label: 'Giving Campaign', value: BannerTemplateType.GIVING_CAMPAIGN },
                  { label: 'Partnership Charter', value: BannerTemplateType.PARTNERSHIP_CHARTER },
                  { label: 'Resource Project', value: BannerTemplateType.RESOURCE_PROJECT }
                ]
              },
              {
                id: 'status-filter',
                value: statusFilter,
                onChange: handleStatusFilter,
                placeholder: 'All Status',
                options: [
                  { label: 'Active', value: 'true' },
                  { label: 'Inactive', value: 'false' }
                ]
              }
            ]}
          />

          {/* Results Summary */}
          <ResultsSummary Loading={loading} Total={total} ItemName="banner" />

          {/* Error State */}
          {error && !loading && (
            <ErrorState
              title="Error Loading Banners"
              message={error}
              onRetry={fetchBanners}
            />
          )}

          {/* Empty State */}
          {!loading && !error && banners.length === 0 && (
            <EmptyState
              title="No Banners Found"
              message={
                searchTerm || templateFilter || statusFilter ? (
                  <p>No banners match your current filters. Try adjusting your search criteria.</p>
                ) : (
                  <p>Get started by creating your first banner.</p>
                )
              }
              action={{
                label: 'Create Your First Banner',
                icon: <Plus className="w-4 h-4 mr-2" />,
                href: '/banners/new',
                variant: 'primary'
              }}
            />
          )}

          {/* Banners Grid */}
          {!loading && !error && banners.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <BannerCard
                  key={banner._id}
                  banner={banner}
                  onDelete={handleDelete}
                  onToggleActive={handleOpenActivateModal}
                  isToggling={togglingId === banner._id}
                />
              ))}
            </div>
          )}
          {!loading && !error && totalPages > 1 && (
            <div className="flex flex-col items-center mt-12 space-y-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              <p className="text-sm text-brand-f mt-5">
                Showing {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} of {total} banners
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setBannerToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Banner"
          message={`Are you sure you want to delete "${bannerToDelete?.Title}"? This action cannot be undone.`}
          variant="danger"
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />

        {/* Activate/Deactivate Modal */}
        {bannerToActivate && (
          <ActivateBannerModal
            banner={bannerToActivate}
            isOpen={showActivateModal}
            onClose={() => {
              setShowActivateModal(false);
              setBannerToActivate(null);
            }}
            onActivate={handleToggleActive}
          />
        )}
    </div>
  );
}
