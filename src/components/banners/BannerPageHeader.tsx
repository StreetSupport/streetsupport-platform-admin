'use client';

import Link from 'next/link';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BackLink from '@/components/common/BackLink';
import { IBanner } from '@/types/IBanner';

interface BannerPageHeaderProps {
  pageType: 'view' | 'edit' | 'new';
  banner?: IBanner | null;
  onDelete?: () => void;
  onToggleActive?: () => void;
  isToggling?: boolean;
  isDeleting?: boolean;
}

export function BannerPageHeader({
  pageType,
  banner,
  onDelete,
  onToggleActive,
  isToggling,
  isDeleting,
}: BannerPageHeaderProps) {
  const id = banner?._id;
  const title = pageType === 'new' ? 'Create New Banner' : banner?.Title || 'Banner';

  return (
    <div className="page-container border-b border-brand-q">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
        <div>
          <BackLink href="/banners" text="Back to Banners" />
          <h1 className="heading-4">{title}</h1>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
            {pageType === 'view' && banner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleActive}
                  title={banner.IsActive ? 'Deactivate banner' : 'Activate banner'}
                  disabled={isToggling}
                  className={banner.IsActive ? 'text-brand-g border-brand-g hover:bg-brand-g hover:text-white' : 'text-brand-b border-brand-b hover:bg-brand-b hover:text-white'}
                >
                  {isToggling ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : banner.IsActive ? (
                    <EyeOff className="w-4 h-4 mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {banner.IsActive ? 'Deactivate' : 'Activate'}
                   <span className={`ml-2 px-2 py-1 rounded-full text-white text-xs ${banner.IsActive ? 'bg-brand-b' : 'bg-brand-f'}`}>
                    {banner.IsActive ? 'Active' : 'Inactive'}
                  </span>
                </Button>

                <Link href={`/banners/${id}/edit`}>
                  <Button variant="primary" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                  title="Delete banner"
                  className="text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
  );
}
