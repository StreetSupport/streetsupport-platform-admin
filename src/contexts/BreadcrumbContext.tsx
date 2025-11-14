'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface BreadcrumbContextType {
  bannerTitle: string | null;
  setBannerTitle: (title: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [bannerTitle, setBannerTitle] = useState<string | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ bannerTitle, setBannerTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}
