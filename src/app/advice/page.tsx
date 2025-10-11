'use client';

import { withAuthorization } from '@/components/auth/withAuthorization';
import { ROLES } from '@/constants/roles';

function AdvicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advice</h1>
        <p className="mt-2 text-gray-600">Manage content pages and FAQs</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Content Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page will allow you to manage content pages and FAQs.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-a hover:bg-brand-b focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-a"
            >
              Add New Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuthorization(AdvicePage, {
  allowedRoles: [ROLES.VOLUNTEER_ADMIN, ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
  requiredPage: '/advice'
});
