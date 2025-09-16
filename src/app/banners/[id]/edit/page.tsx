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
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </RoleGuard>
    );
  }

  if (error && !bannerData) {
    return (
      <RoleGuard requiredPage="/banners">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/banners">
                  <Button variant="ghost" size="sm">
                    ← Back
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">
                  Edit Banner
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Banner Editor
                </h2>
                <BannerEditor
                  initialData={bannerData}
                  onDataChange={(data) => setBannerData(data)}
                  onSave={() => { /* Save handled by header button */ }}
                  saving={saving}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Live Preview
                </h2>
                <BannerPreview data={bannerData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

