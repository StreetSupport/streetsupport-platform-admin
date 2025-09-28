'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { errorToast, successToast, loadingToast, toastUtils } from '@/utils/toast';
import { ICity } from '@/types';
import { IBanner, BannerTemplateType } from '@/types/IBanner';
import BannerCard from '@/components/banners/BannerCard';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface BannerListResponse {
  banners: IBanner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function BannersListPage() {
  const router = useRouter();
  
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
  
  const limit = 20;

  useEffect(() => {
    fetchBanners();
    fetchLocations();
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
      if (locationFilter) params.append('locationSlug', locationFilter);
      
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

  const getTemplateTypeLabel = (type: BannerTemplateType): string => {
    switch (type) {
      case BannerTemplateType.GIVING_CAMPAIGN:
        return 'Giving Campaign';
      case BannerTemplateType.PARTNERSHIP_CHARTER:
        return 'Partnership Charter';
      case BannerTemplateType.RESOURCE_PROJECT:
        return 'Resource Project';
      default:
        return type;
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Duplicate functionality removed

  const handleDelete = async (banner: IBanner) => {
    if (!confirm(`Are you sure you want to delete "${banner.Title}"? This action cannot be undone.`)) {
      return;
    }

    const toastId = loadingToast.delete('banner');
    
    try {
      const response = await fetch(`/api/banners/${banner._id}`, {
        method: 'DELETE'
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
    }
  };

  const handleToggleActive = async (banner: IBanner) => {
    const toastId = loadingToast.update('banner status');
    setTogglingId(banner._id);
    
    try {
      const response = await fetch(`/api/banners/${banner._id}/toggle`, {
        method: 'PATCH',
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
    <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
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
                    placeholder="Search banners by title, description..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={locationFilter}
                  onChange={(e) => handleLocationFilter(e.target.value)}
                  className="form-input border border-brand-q text-brand-k bg-white min-w-48"
                >
                  <option value="general" className="text-brand-k">All Locations</option>
                  {locations.map(city => (
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
              {loading ? 'Loading...' : `${total} banner${total !== 1 ? 's' : ''} found`}
            </p>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="text-small text-brand-f px-3">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
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
            <div className="flex items-center justify-center mt-8 gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
