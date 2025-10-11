/**
 * withAuthorization Higher-Order Component
 * 
 * Wraps page components to enforce authorization before rendering.
 * Prevents API calls and UI rendering for unauthorized users.
 * 
 * This is an alternative to using RoleGuard component, providing
 * the same functionality with better TypeScript inference.
 */

'use client';

import { ComponentType } from 'react';
import { useAuthorization, UseAuthorizationOptions } from '@/hooks/useAuthorization';

/**
 * HOC that adds authorization checking to a component
 * 
 * @example
 * ```tsx
 * function UsersPage() {
 *   // Component logic here
 *   return <div>Users Page Content</div>;
 * }
 * 
 * export default withAuthorization(UsersPage, {
 *   allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
 *   requiredPage: '/users'
 * });
 * ```
 */
export function withAuthorization<P extends object>(
  Component: ComponentType<P>,
  options: UseAuthorizationOptions
) {
  return function AuthorizedComponent(props: P) {
    const { isChecking, isAuthorized } = useAuthorization({
      ...options,
      autoRedirect: true
    });

    // Show loading while checking authorization
    if (isChecking) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
        </div>
      );
    }

    // Don't render anything if not authorized (redirect handled by hook)
    if (!isAuthorized) {
      return null;
    }

    // User is authorized, render component
    return <Component {...props} />;
  };
}
