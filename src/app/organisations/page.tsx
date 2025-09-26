import { Metadata } from 'next';
import RoleGuard from '@/components/auth/RoleGuard';

export const metadata: Metadata = {
  title: 'Organisations | Street Support Admin',
  description: 'Manage service providers and organisations in the Street Support platform',
};

export default function OrganisationsPage() {
  return (
    <RoleGuard allowedRoles={['OrgAdmin', 'SuperAdmin']} requiredPage="/organisations">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Organisations</h1>
        <p className="mt-2 text-gray-600">Manage service providers and organisations</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Organisations Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page will allow you to manage service providers and organisations.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-a hover:bg-brand-b focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-a"
            >
              Add New Organisation
            </button>
          </div>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
