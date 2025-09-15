'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { hasPageAccess } from '@/lib/userService';
import { UserRole } from '@/types/auth';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPage?: string;
  fallbackPath?: string;
}

export default function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requiredPage,
  fallbackPath = '/' 
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session?.user) {
      router.push('/api/auth/signin');
      return;
    }

    const userAuthClaims = session.user.authClaims;

    // Check if user has any of the allowed roles
    if (allowedRoles.length > 0) {
      const hasAllowedRole = allowedRoles.some(role => 
        userAuthClaims.roles.includes(role)
      );
      
      if (!hasAllowedRole) {
        router.push('/access-denied');
        return;
      }
    }

    // Check page-specific access
    if (requiredPage) {
      if (!hasPageAccess(userAuthClaims, requiredPage)) {
        router.push('/access-denied');
        return;
      }
    }
  }, [session, status, router, allowedRoles, requiredPage, fallbackPath]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
      </div>
    );
  }

  return <>{children}</>;
}
