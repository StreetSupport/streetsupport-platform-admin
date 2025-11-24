'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

/**
 * Reusable page header component used across all pages
 * Provides consistent header styling with title and optional action buttons
 * 
 * @param title - The page title to display on the left
 * @param actions - Optional action buttons to display on the right (e.g., Edit, Delete, Add New)
 */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="nav-container">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:h-16">
          <h1 className="heading-4 mb-3 sm:mb-0">{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
