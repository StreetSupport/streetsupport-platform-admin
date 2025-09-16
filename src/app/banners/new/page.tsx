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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/banners">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Banners
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Banner</h1>
            <p className="mt-1 text-sm text-gray-500">
              Design and configure a new promotional banner
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Editor and Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="order-2 lg:order-1">
            <BannerEditor
              initialData={{}}
              onDataChange={setBannerData}
              onSave={handleSave}
              saving={saving}
            />
          </div>
          
          <div className="order-1 lg:order-2">
            <BannerPreview data={bannerData} />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
