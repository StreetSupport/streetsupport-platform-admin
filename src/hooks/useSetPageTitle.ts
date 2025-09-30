import { useEffect } from 'react';
import { usePageMetadata } from '@/contexts/PageMetadataContext';

/**
 * Custom hook to set page title for breadcrumbs
 * 
 * @param id - Entity ID (e.g., banner ID, user ID)
 * @param type - Entity type (e.g., 'banners', 'users', 'organisations')
 * @param title - Display title for breadcrumbs
 * 
 * @example
 * ```tsx
 * // In your page component after fetching data:
 * useSetPageTitle(bannerId, 'banners', banner.Title);
 * ```
 */
export function useSetPageTitle(id: string | undefined, type: string, title: string | undefined) {
  const { setPageMetadata } = usePageMetadata();

  useEffect(() => {
    if (id && title) {
      setPageMetadata({
        id,
        type,
        title
      });
    }
  }, [id, type, title, setPageMetadata]);
}
