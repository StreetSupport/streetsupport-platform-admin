"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

/**
 * Page Metadata Context
 * 
 * Provides a way for pages to share metadata (like titles, IDs) with components
 * like Breadcrumbs without requiring additional API fetches.
 * 
 * Usage:
 * 1. Wrap your page content with PageMetadataProvider
 * 2. Call setPageMetadata() when you have the data
 * 3. Components can access metadata via usePageMetadata()
 */

export interface PageMetadata {
  /** Entity ID (e.g., banner ID, user ID) */
  id?: string;
  /** Display title for breadcrumbs */
  title?: string;
  /** Entity type (e.g., 'banner', 'user', 'organisation') */
  type?: string;
  /** Additional custom metadata */
  [key: string]: unknown;
}

interface PageMetadataContextValue {
  metadata: PageMetadata;
  setPageMetadata: (metadata: PageMetadata) => void;
  clearPageMetadata: () => void;
}

const PageMetadataContext = createContext<PageMetadataContextValue | undefined>(undefined);

export function PageMetadataProvider({ children }: { children: ReactNode }) {
  const [metadata, setMetadata] = useState<PageMetadata>({});

  const setPageMetadata = useCallback((newMetadata: PageMetadata) => {
    setMetadata(prev => ({ ...prev, ...newMetadata }));
  }, []);

  const clearPageMetadata = useCallback(() => {
    setMetadata({});
  }, []);

  const value = useMemo(
    () => ({ metadata, setPageMetadata, clearPageMetadata }),
    [metadata, setPageMetadata, clearPageMetadata]
  );

  return (
    <PageMetadataContext.Provider value={value}>
      {children}
    </PageMetadataContext.Provider>
  );
}

export function usePageMetadata() {
  const context = useContext(PageMetadataContext);
  if (context === undefined) {
    throw new Error('usePageMetadata must be used within a PageMetadataProvider');
  }
  return context;
}
