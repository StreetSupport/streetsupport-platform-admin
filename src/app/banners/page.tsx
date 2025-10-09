'use client';
import { useState, useEffect } from 'react';
import '@/styles/pagination.css';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Search, Plus } from 'lucide-react';
import { ICity } from '@/types';
import { IBanner, BannerTemplateType } from '@/types/banners/IBanner';
import BannerCard from '@/components/banners/BannerCard';
import Link from 'next/link';
import toastUtils, { errorToast, loadingToast, successToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { useSession } from 'next-auth/react';
import { UserAuthClaims } from '@/types/auth';
import { getAvailableLocations } from '@/utils/locationUtils';

export default function BannersListPage() {
  const { data: session } = useSession();
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [bannerToDelete, setBannerToDelete] = useState<IBanner | null>(null);
  
  const limit = 5;
  
  // Get user auth claims
  const userAuthClaims = (session?.user?.authClaims || { roles: [], specificClaims: [] }) as UserAuthClaims;
  
  // Filter locations based on user permissions
  const availableLocations = getAvailableLocations(userAuthClaims, locations);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchBanners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, templateFilter, statusFilter, locationFilter, limit]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (templateFilter) params.append('templateType', templateFilter);
      if (statusFilter) params.append('isActive', statusFilter);
      if (locationFilter) params.append('location', locationFilter);
      
      const response = await fetch(`/api/banners?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch banners');
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
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
      const response = await fetch('/api/cities');
      const result = await response.json();
      if (result.success) {
        setLocations(result.data);
      } else {
        console.error('Failed to fetch cities');
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err);
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
      const response = await fetch(`/api/banners/${bannerToDelete._id}`, {
        method: HTTP_METHODS.DELETE
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete banner');
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

  const handleToggleActive = async (banner: IBanner) => {
    const toastId = loadingToast.update('banner status');
    setTogglingId(banner._id);
    
    try {
      const response = await fetch(`/api/banners/${banner._id}/toggle`, {
        method: HTTP_METHODS.PATCH,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update banner status');
      }

      const result = await response.json();
      
      // Update the banner in the local state
      setBanners(prevBanners => 
        prevBanners.map(b => b._id === banner._id ? result.data : b)
      );
      
      toastUtils.dismiss(toastId);
      successToast.update('Banner status');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update banner status';
      toastUtils.dismiss(toastId);
      errorToast.update('banner status', errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN]}>
      <div className="min-h-screen bg-brand-q">
        {/* Header */}
        <div className="nav-container">
          <div className="page-container">
            <div className="flex items-center justify-between h-16">
              <h1 className="heading-4">Banners</h1>
              <Link href="/banners/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Banner
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="page-container section-spacing padding-top-zero">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-brand-q p-6 mb-6 mt-[5px]">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-f w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search banners by title, subtitle and description."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={locationFilter}
                  onChange={(e) => handleLocationFilter(e.target.value)}
                  className="form-input border border-brand-q text-brand-k bg-white min-w-48"
                >
                  <option value="" className="text-brand-k">All Locations</option>
                  {availableLocations.map(city => (
                    <option key={city.Key} value={city.Key} className="text-brand-k">{city.Name}</option>
                  ))}
                </select>

                <select
                  value={templateFilter}
                  onChange={(e) => handleTemplateFilter(e.target.value)}
                  className="form-input border border-brand-q text-brand-k bg-white min-w-48"
                >
                  <option value="">All Templates</option>
                  <option value={BannerTemplateType.GIVING_CAMPAIGN}>Giving Campaign</option>
                  <option value={BannerTemplateType.PARTNERSHIP_CHARTER}>Partnership Charter</option>
                  <option value={BannerTemplateType.RESOURCE_PROJECT}>Resource Project</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="form-input border border-brand-q text-brand-k bg-white min-w-32"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-base text-brand-f">
              {loading ? '' : `${total} banner${total !== 1 ? 's' : ''} found`}
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
              <h2 className="heading-5 mb-4 text-brand-g">Error Loading Banners</h2>
              <p className="text-base text-brand-f mb-6">{error}</p>
              <Button variant="primary" onClick={fetchBanners}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && banners.length === 0 && (
            <div className="text-center py-12">
              <h2 className="heading-5 mb-4">No Banners Found</h2>
              <p className="text-base text-brand-f mb-6">
                {searchTerm || templateFilter || statusFilter
                  ? 'No banners match your current filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first banner.'}
              </p>
              <Link href="/banners/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Banner
                </Button>
              </Link>
            </div>
          )}

          {/* Banners Grid */}
          {!loading && !error && banners.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <BannerCard
                  key={banner._id}
                  banner={banner}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
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
      </div>
    </RoleGuard>
  );
}
