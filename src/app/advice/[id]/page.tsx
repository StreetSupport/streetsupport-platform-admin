'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IFaq } from '@/types/IFaq';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast } from '@/utils/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { AdvicePageActions } from '@/components/advice/AdvicePageActions';
import { Calendar, MapPin } from 'lucide-react';
import { sanitizeHtmlForDisplay } from '@/components/ui/RichTextEditor';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

export default function AdviceViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Check authorization FIRST
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/advice',
    autoRedirect: true
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<IFaq | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
  const { setAdviceTitle } = useBreadcrumb();

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (isAuthorized && id) {
      fetchAdvice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, id]);

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

  const fetchAdvice = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/advice/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch advice');
      }
      
      const responseData = await response.json();
      const adviceData = responseData.data || responseData;
      setAdvice(adviceData);
      setAdviceTitle(adviceData.Title);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load advice';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!advice) return;

    try {
      setDeleting(true);
      const response = await authenticatedFetch(`/api/advice/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete advice');
      }

      successToast.delete('Advice');
      router.push('/advice');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete advice';
      errorToast.generic(errorMessage);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationName = (locationKey: string): string => {
    if (locationKey === 'general') return 'General Advice';
    const location = locations.find(loc => loc.Key === locationKey);
    return location?.Name || locationKey;
  };

  // Show loading while checking authorization or fetching data
  if (isChecking || loading) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized (redirect handled by hook)
  if (!isAuthorized) {
    return null;
  }

  // Show error if fetch failed
  if (error || !advice) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ErrorState
          title="Error Loading Advice"
          message={error || 'Advice not found'}
          onRetry={fetchAdvice}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader 
        title="View Advice"
        actions={
          <AdvicePageActions 
            adviceId={id}
            onDelete={() => setShowDeleteModal(true)}
          />
        }
      />

      {/* Main Content */}
      <div className="page-container py-8">
        <div className="space-y-6">
          {/* Banner Details */}
          <div className="bg-white rounded-lg border border-brand-q p-6">
            <h2 className="heading-5 mb-6 border-b border-brand-q pb-4">Basic Information</h2>
            
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-sm font-medium text-brand-f mb-2">Title</h3>
                <p className="text-base text-brand-k">{advice.Title}</p>
              </div>

              {/* Location & Sort Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-brand-f mb-2">Location</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-a" />
                    <p className="text-base text-brand-k">{getLocationName(advice.LocationKey)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-brand-f mb-2">Sort Position</h3>
                  <p className="text-base text-brand-k">{advice.SortPosition}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-brand-f mb-2">Created</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-a" />
                    <p className="text-sm text-brand-k">{formatDate(advice.DocumentCreationDate)}</p>
                  </div>
                </div>
                {advice.DocumentModifiedDate && (
                  <div>
                    <h3 className="text-sm font-medium text-brand-f mb-2">Last Modified</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-a" />
                      <p className="text-sm text-brand-k">{formatDate(advice.DocumentModifiedDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="bg-white rounded-lg border border-brand-q p-6">
            <h2 className="heading-5 mb-6 border-b border-brand-q pb-4">Body Content</h2>
            
            <div 
              className="prose max-w-none text-brand-l"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(advice.Body) }}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Advice?"
        message={`Are you sure you want to delete "${advice.Title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
