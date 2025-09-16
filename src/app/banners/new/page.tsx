'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BannerEditor, BannerFormData } from '@/components/banners/BannerEditor';
import { BannerPreview } from '@/components/banners/BannerPreview';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBannerPage() {
  const router = useRouter();
  const [bannerData, setBannerData] = useState<BannerFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: BannerFormData) => {
    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      
      // Add text fields
      Object.keys(data).forEach(key => {
        const typedKey = key as keyof BannerFormData;
        const value = data[typedKey];
        
        if (key === 'logo' || key === 'image' || key === 'partnerLogos') {
          // Handle file uploads separately
          if (value && typeof value === 'object' && 'file' in value) {
            formData.append(key, (value as any).file);
          }
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch('/api/banners', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create banner');
      }

      const result = await response.json();
      router.push(`/banners/${result.data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin']}>
      <div className="min-h-screen bg-brand-q">
        <div className="nav-container">
          <div className="page-container">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="heading-4">
                  Create New Banner
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="page-container section-spacing">
          {/* Error Message */}
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
              initialData={{}}
              onDataChange={setBannerData}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
