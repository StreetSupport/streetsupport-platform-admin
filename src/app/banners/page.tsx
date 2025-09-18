'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, Pencil, Trash } from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Banner {
  _id: string;
  title: string;
  templateType: string;
  isActive: boolean;
  priority: number;
  locationSlug?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    UserName: string;
    Email: string;
  };
}

interface BannerStats {
  overview: {
    totalBanners: number;
    activeBanners: number;
    inactiveBanners: number;
  };
  byTemplate: Array<{
    _id: string;
    count: number;
    active: number;
  }>;
}

export default function BannersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    templateType: '',
    isActive: '',
    location: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/banners?${params}`);
      if (!response.ok) throw new Error('Failed to fetch banners');
      
      const data = await response.json();
      setBanners(data.data);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/banners/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Toggle banner status
  const toggleBannerStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/banners/${id}/toggle`, {
        method: 'PATCH'
      });
      
      if (!response.ok) throw new Error('Failed to toggle banner status');
      
      await fetchBanners();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  // Delete banner
  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete banner');
      
      await fetchBanners();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete banner');
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchStats();
  }, [pagination.page, filters]);

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'giving-campaign': return 'service-tag open';
      case 'partnership-charter': return 'service-tag verified';
      case 'resource-project': return 'service-tag limited';
      default: return 'service-tag closed';
    }
  };

  const formatTemplateType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
      <div className="page-container section-spacing space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="heading-2">Banner Management</h1>
            <p className="text-body">
              Create and manage promotional banners across the platform
            </p>
          </div>
          <Link href="/banners/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Banner
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="card-grid cols-4">
            <div className="card card-compact">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-small text-brand-f">Total Banners</p>
                  <p className="heading-3 text-brand-k">{stats?.overview?.totalBanners}</p>
                </div>
              </div>
            </div>
            <div className="card card-compact">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-small text-brand-f">Active</p>
                  <p className="heading-3 text-brand-b">{stats?.overview?.activeBanners}</p>
                </div>
              </div>
            </div>
            <div className="card card-compact">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-small text-brand-f">Inactive</p>
                  <p className="heading-3 text-brand-g">{stats?.overview?.inactiveBanners}</p>
                </div>
              </div>
            </div>
            <div className="card card-compact">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-small text-brand-f">Templates</p>
                  <p className="heading-3 text-brand-h">{stats?.byTemplate?.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card card-compact">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-small text-brand-k font-medium mb-1">
                Template Type
              </label>
              <select
                value={filters.templateType}
                onChange={(e) => setFilters(prev => ({ ...prev, templateType: e.target.value }))}
                className="w-full px-3 py-2 border border-brand-q rounded-md focus:ring-2 focus:ring-brand-a focus:border-brand-a text-brand-k"
              >
                <option value="">All Types</option>
                <option value="giving-campaign">Giving Campaign</option>
                <option value="partnership-charter">Partnership Charter</option>
                <option value="resource-project">Resource Project</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-brand-k font-medium mb-1">
                Status
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                className="w-full px-3 py-2 border border-brand-q rounded-md focus:ring-2 focus:ring-brand-a focus:border-brand-a text-brand-k"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-brand-k font-medium mb-1">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-brand-q rounded-md focus:ring-2 focus:ring-brand-a focus:border-brand-a text-brand-k"
              >
                <option value="">All Locations</option>
                <option value="manchester">Manchester</option>
                <option value="birmingham">Birmingham</option>
                <option value="leeds">Leeds</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ templateType: '', isActive: '', location: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card card-compact border-brand-g bg-red-50">
            <p className="text-small text-brand-g">{error}</p>
          </div>
        )}

        {/* Banners Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : banners.length === 0 ? (
            <div className="card-content text-center">
              <p className="text-body text-brand-f">No banners found</p>
              <Link href="/banners/new" className="mt-2 inline-block">
                <Button>Create your first banner</Button>
              </Link>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-brand-q">
                <thead className="bg-brand-q">
                  <tr>
                    <th className="px-6 py-3 text-left text-caption font-medium text-brand-f uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-brand-f uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-brand-f uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-brand-f uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-brand-f uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-caption font-medium text-brand-f uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-caption font-medium text-brand-f uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-q">
                  {banners.map((banner) => (
                    <tr key={banner._id} className="hover:bg-brand-i transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-small font-medium text-brand-k">
                            {banner.title}
                          </div>
                          <div className="text-caption text-brand-f">
                            by {banner.createdBy.UserName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getTemplateTypeColor(banner.templateType)}>
                          {formatTemplateType(banner.templateType)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={banner.isActive ? 'service-tag open' : 'service-tag closed'}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-small text-brand-k">
                        {banner.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-small text-brand-k">
                        {banner.locationSlug || 'All Locations'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-small text-brand-f">
                        {new Date(banner.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/banners/${banner._id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/banners/${banner._id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBannerStatus(banner._id)}
                            className={banner.isActive ? 'text-brand-g hover:text-red-700' : 'text-brand-b hover:text-brand-c'}
                          >
                            {banner.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBanner(banner._id)}
                            className="text-brand-g hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="card-footer">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-small text-brand-l">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setPagination(prev => ({ ...prev, page }))}
                            className={`relative inline-flex items-center px-4 py-2 border text-small font-medium transition-colors duration-200 ${
                              page === pagination.page
                                ? 'z-10 bg-brand-i border-brand-a text-brand-a'
                                : 'bg-white border-brand-q text-brand-f hover:bg-brand-i'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
