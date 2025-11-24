'use client';

import { ReactNode } from 'react';
import { useAuthorization } from '@/hooks/useAuthorization';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UserRole } from '@/types/auth';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPage?: string;
  fallbackPath?: string;
}

/**
 * RoleGuard Component
 * 
 * Prevents rendering of protected content until authorization is verified.
 * This ensures no API calls or UI rendering happens for unauthorized users.
 * 
 * @example
 * ```tsx
 * <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]} requiredPage="/users">
 *   <UsersPage />
 * </RoleGuard>
 * ```
 */
export default function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requiredPage,
  fallbackPath = '/access-denied'
}: RoleGuardProps) {
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles,
    requiredPage,
    fallbackPath,
    autoRedirect: true
  });

  // Show loading while checking authorization
  if (isChecking) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized (redirect handled by hook)
  if (!isAuthorized) {
    return null;
  }

  // User is authorized, render protected content
  return <>{children}</>;
}
