import { Metadata } from 'next';
import RoleGuard from '@/components/auth/RoleGuard';
import CitiesManagement from '@/components/cities/CitiesManagement';

export const metadata: Metadata = {
  title: 'Cities | Street Support Admin',
  description: 'Manage cities and locations in the Street Support platform',
};

export default function CitiesPage() {
  return (
    <RoleGuard allowedRoles={['CityAdmin', 'SuperAdmin']} requiredPage="/cities">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cities</h1>
          <p className="mt-2 text-gray-600">Manage cities and locations</p>
        </div>

        <CitiesManagement />
      </div>
    </RoleGuard>
  );
}
