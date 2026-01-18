'use client';

import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import AdviceManagement from '@/components/advice/AdviceManagement';

export default function AdvicePage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SUPER_ADMIN_PLUS, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/advice',
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

  return (
    <div className="min-h-screen bg-brand-q">
      <PageHeader 
        title="Advice"
        actions={
          <Link href="/advice/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Advice
            </Button>
          </Link>
        }
      />

      <div className="page-container section-spacing padding-top-zero">
        <AdviceManagement />
      </div>
    </div>
  );
}

