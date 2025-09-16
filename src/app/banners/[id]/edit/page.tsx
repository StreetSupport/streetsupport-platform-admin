'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BannerEditor } from '@/components/banners/BannerEditor';
import { BannerPreview } from '@/components/banners/BannerPreview';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { BannerFormData } from '@/components/banners/BannerEditor';

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;
  
  const [bannerData, setBannerData] = useState<Partial<BannerFormData> | undefined>(undefined);
  const [originalData, setOriginalData] = useState<Partial<BannerFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bannerId) {
      fetchBanner();
    }
  }, [bannerId]);

  const fetchBanner = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/banners/${bannerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch banner');
      }
      
      const result = await response.json();
      if (result.success) {
        setBannerData(result.data);
        setOriginalData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch banner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banner');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bannerData) return;

    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      
      // Add banner data to form
      Object.entries(bannerData).forEach(([key, value]) => {
        if (key === 'ctaButtons' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'backgroundImage' && value instanceof File) {
          formData.append('backgroundImage', value);
        } else if (key === 'logoFile' && value instanceof File) {
          formData.append('logoFile', value);
        } else if (key === 'resourceFile' && value instanceof File) {
          formData.append('resourceFile', value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(`/api/banners/${bannerId}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        router.push('/banners');
      } else {
        throw new Error(result.message || 'Failed to update banner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update banner');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard requiredPage="/banners">
        <div className="page-container section-spacing flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
        </div>
      </RoleGuard>
    );
  }

  if (error && !bannerData) {
    return (
      <RoleGuard requiredPage="/banners">
        <div className="page-container section-spacing flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="heading-2 mb-4">Error</h1>
            <p className="text-body mb-4">{error}</p>
            <Link href="/banners">
              <Button>Back to Banners</Button>
            </Link>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredPage="/banners">
      <div className="min-h-screen bg-brand-q">
        <div className="nav-container">
          <div className="page-container">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="heading-4">
                  Edit Banner
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="page-container section-spacing">
          {error && (
            <div className="mb-6 card card-compact border-brand-g bg-red-50">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-small font-medium text-brand-g">Error</h3>
                  <div className="mt-2 text-small text-brand-g">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Full-width Preview at Top */}
          <div className="mb-8">
            <BannerPreview data={bannerData} />
          </div>

          <div className="space-y-6">
            <BannerEditor
              initialData={bannerData}
              onDataChange={(data) => setBannerData(data)}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

