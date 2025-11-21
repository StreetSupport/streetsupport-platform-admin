'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExternalLink, MapPin, Calendar } from 'lucide-react';
import { LocationLogoPageActions } from '@/components/location-logos/LocationLogoPageActions';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { successToast, errorToast } from '@/utils/toast';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ILocationLogo } from '@/types/ILocationLogo';

export default function ViewLocationLogoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [logo, setLogo] = useState<ILocationLogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { setLogoTitle } = useBreadcrumb();

  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.VOLUNTEER_ADMIN, ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
    requiredPage: `/location-logos/${id}`,
    autoRedirect: true
  });

  useEffect(() => {
    if (isAuthorized && id) {
      fetchLogo();
    }
    
    // Cleanup: Clear logo title when component unmounts
    return () => {
      setLogoTitle(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, id]);

  const fetchLogo = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/location-logos/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch location logo');
      }

      const data = await response.json();
      const logoData = data.data || data;
      setLogo(logoData);
      setLogoTitle(logoData.DisplayName);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load location logo';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await authenticatedFetch(`/api/location-logos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete location logo');
      }

      successToast.delete('Location logo');
      router.push('/location-logos');
    } catch {
      errorToast.delete('Location logo');
    }
  };

  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return null;
  }

  if (error || !logo) {
    return (
      <div className="min-h-screen bg-brand-q">
        <PageHeader title="Location Logo" />
        <div className="page-container section-spacing padding-top-zero">
          <ErrorState
            title="Failed to Load Location Logo"
            message={error || 'Location logo not found'}
            onRetry={fetchLogo}
          />
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader 
        title="View Location Logo"
        actions={
          <LocationLogoPageActions 
            logoId={id}
            onDelete={() => setShowDeleteModal(true)}
          />
        }
      />

      {/* Main Content */}
      <div className="page-container py-8">
        <div className="space-y-6">
          {/* Logo Preview */}
          <div className="bg-white rounded-lg border border-brand-q p-6">
            <h2 className="heading-5 mb-6 border-b border-brand-q pb-4">Logo Preview</h2>
            <div className="bg-brand-q p-8 flex items-center justify-center rounded-lg">
              <div className="relative w-full max-w-md h-64">
                <Image 
                  src={logo.LogoPath} 
                  alt={logo.DisplayName}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Logo Details */}
          <div className="bg-white rounded-lg border border-brand-q p-6">
            <h2 className="heading-5 mb-6 border-b border-brand-q pb-4">Basic Information</h2>
            
            <div className="space-y-6">
              
              {/* Display Name */}
              <div>
                <h3 className="text-sm font-medium text-brand-f mb-2">Display Name</h3>
                <p className="text-base text-brand-k font-semibold">{logo.DisplayName}</p>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-brand-f mb-2">Location</h3>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-a" />
                  <span className="text-base text-brand-k">{logo.LocationName}</span>
                </div>
              </div>

              {/* Website URL */}
              <div>
                <h3 className="text-sm font-medium text-brand-f mb-2">Website URL</h3>
                <a
                  href={logo.Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-a hover:text-brand-b hover:underline flex items-center gap-2 break-all"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  {logo.Url}
                </a>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-brand-q p-6">
            <h2 className="heading-5 mb-6 border-b border-brand-q pb-4">Metadata</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-brand-f mb-2">Created By</h3>
                <p className="text-base text-brand-k">{logo.CreatedBy || 'System'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-brand-f mb-2">Created Date</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-f" />
                  <span className="text-base text-brand-k">{formatDate(logo.DocumentCreationDate)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-brand-f mb-2">Last Modified</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-f" />
                  <span className="text-base text-brand-k">{formatDate(logo.DocumentModifiedDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Location Logo"
        message={`Are you sure you want to delete "${logo.DisplayName}"? This action cannot be undone.`}
      />
    </div>
  );
}
