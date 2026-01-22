/**
 * useAuthorization Hook
 * 
 * Provides immediate authorization check before component rendering.
 * Returns authorization status to prevent API calls and UI rendering
 * for unauthorized users.
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasPageAccess } from '@/lib/userService';
import { UserRole } from '@/types/auth';

export interface AuthorizationResult {
  /** Whether authorization check is complete */
  isChecking: boolean;
  /** Whether user is authorized to access the resource */
  isAuthorized: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

export interface UseAuthorizationOptions {
  /** Required roles to access the resource */
  allowedRoles?: UserRole[];
  /** Page path for page-specific access control (e.g., '/users') */
  requiredPage?: string;
  /** Where to redirect if unauthorized */
  fallbackPath?: string;
  /** Whether to automatically redirect unauthorized users */
  autoRedirect?: boolean;
}

/**
 * Hook to check user authorization before rendering content
 * 
 * @example
 * ```tsx
 * function UsersPage() {
 *   const { isChecking, isAuthorized } = useAuthorization({
 *     allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
 *     requiredPage: '/users',
 *     autoRedirect: true
 *   });
 * 
 *   // Don't render anything until authorization is checked
 *   if (isChecking || !isAuthorized) {
 *     return null;
 *   }
 * 
 *   // Now safe to render content and make API calls
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useAuthorization(options: UseAuthorizationOptions = {}): AuthorizationResult {
  const {
    allowedRoles = [],
    requiredPage,
    fallbackPath = '/access-denied',
    autoRedirect = true
  } = options;

  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Still loading session
    if (status === 'loading') {
      setIsChecking(true);
      return;
    }

    // Not authenticated
    if (!session?.user) {
      setIsChecking(false);
      setIsAuthorized(false);
      if (autoRedirect) {
        router.push('/api/auth/signin/auth0');
      }
      return;
    }

    const userAuthClaims = session.user.authClaims;
    let hasAccess = true;

    // Check role-based access
    if (allowedRoles.length > 0) {
      const hasAllowedRole = allowedRoles.some(role => 
        userAuthClaims.roles.includes(role)
      );
      if (!hasAllowedRole) {
        hasAccess = false;
      }
    }

    // Check page-specific access
    if (hasAccess && requiredPage) {
      hasAccess = hasPageAccess(userAuthClaims, requiredPage);
    }

    setIsAuthorized(hasAccess);
    setIsChecking(false);

    // Redirect if not authorized
    if (!hasAccess && autoRedirect) {
      router.push(fallbackPath);
    }
  }, [session, status, router, allowedRoles, requiredPage, fallbackPath, autoRedirect]);

  return {
    isChecking,
    isAuthorized,
    isAuthenticated: !!session?.user
  };
}
