import React, { ReactNode } from 'react';
import { Button } from './Button';
import Link from 'next/link';

interface EmptyStateProps {
  /** Title displayed at the top */
  title: string;
  
  /** Message content - can be string, JSX, or conditional rendering */
  message: ReactNode;
  
  /** Optional action button configuration */
  action?: {
    /** Button label */
    label: string;
    /** Icon component (e.g., Plus from lucide-react) */
    icon?: ReactNode;
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  } & (
    | { onClick: () => void; href?: never }  // Either onClick
    | { href: string; onClick?: never }      // Or href for Link
  );
  
  /** Optional className for container */
  className?: string;
}

/**
 * Reusable empty state component for displaying "no results" messages
 * with optional call-to-action button.
 * 
 * @example
 * ```tsx
 * // With filter-based conditional message
 * <EmptyState
 *   title="No Banners Found"
 *   message={
 *     searchTerm || templateFilter ? (
 *       <p>No banners match your current filters. Try adjusting your search criteria.</p>
 *     ) : (
 *       <p>Get started by creating your first banner.</p>
 *     )
 *   }
 *   action={{
 *     label: 'Create Your First Banner',
 *     icon: <Plus className="w-4 h-4 mr-2" />,
 *     href: '/banners/new',
 *     variant: 'primary'
 *   }}
 * />
 * 
 * // With onClick handler
 * <EmptyState
 *   title="No Users Found"
 *   message={<p>Get started by adding your first user.</p>}
 *   action={{
 *     label: 'Add User',
 *     icon: <Plus className="w-4 h-4 mr-2" />,
 *     onClick: () => setIsAddModalOpen(true),
 *     variant: 'primary'
 *   }}
 * />
 * 
 * // Without action button
 * <EmptyState
 *   title="No Resources Found"
 *   message={<p>No resources available.</p>}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <h2 className="heading-5 mb-4">{title}</h2>
      
      <div className="text-base text-brand-f mb-6">
        {message}
      </div>
      
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button variant={action.variant || 'primary'}>
              {action.icon}
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button 
            variant={action.variant || 'primary'} 
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        )
      )}
    </div>
  );
};
