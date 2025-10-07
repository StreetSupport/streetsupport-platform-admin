'use client';
import { useState, useEffect } from 'react';
import '@/styles/pagination.css';
import RoleGuard from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Search, Plus } from 'lucide-react';
import { IUser } from '@/types/IUser';
import UserCard from '@/components/users/UserCard';
import AddUserModal from '@/components/users/AddUserModal';
import toastUtils, { errorToast, loadingToast, successToast } from '@/utils/toast';

export default function UsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  
  const limit = 9;

  // Available roles for filtering
  const availableRoles = [
    { value: 'SuperAdmin', label: 'Super Admin' },
    { value: 'CityAdmin', label: 'City Admin' },
    { value: 'VolunteerAdmin', label: 'Volunteer Admin' },
    { value: 'OrgAdmin', label: 'Organisation Admin' },
    { value: 'SwepAdmin', label: 'SWEP Admin' }
  ];

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, roleFilter, locationFilter, limit]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/cities');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (locationFilter) params.append('location', locationFilter);
      
      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleLocationFilter = (value: string) => {
    setLocationFilter(value);
    setCurrentPage(1);
  };

  const handleEdit = (user: IUser) => {
    // TODO: Implement edit functionality
    console.log('Edit user:', user);
    // Navigate to edit modal or page
  };

  const handleDelete = async (user: IUser) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setShowConfirmModal(false);
    const toastId = loadingToast.delete('user');
    
    try {
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      toastUtils.dismiss(toastId);
      successToast.delete('User');
      
      // Refresh the list
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      toastUtils.dismiss(toastId);
      errorToast.delete('user', errorMessage);
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['SuperAdmin', 'CityAdmin', 'VolunteerAdmin']} requiredPage="/users">
      <div className="min-h-screen bg-brand-q">
        {/* Header */}
        <div className="nav-container">
          <div className="page-container">
            <div className="flex items-center justify-between h-16">
              <h1 className="heading-4">Users</h1>
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        <div className="page-container section-spacing padding-top-zero">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-brand-q p-6 mb-6 mt-[5px]">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-f w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by email or username..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilter(e.target.value)}
                  className="form-input border border-brand-q text-brand-k bg-white min-w-48"
                >
                  <option value="">All Roles</option>
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value} className="text-brand-k">
                      {role.label}
                    </option>
                  ))}
                </select>

                <select
                  value={locationFilter}
                  onChange={(e) => handleLocationFilter(e.target.value)}
                  className="form-input border border-brand-q text-brand-k bg-white min-w-48"
                >
                  <option value="" className="text-brand-k">All Locations</option>
                  {locations.map(city => (
                    <option key={city.Key} value={city.Key} className="text-brand-k">{city.Name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-base text-brand-f">
              {loading ? '' : `${total} user${total !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-a"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <h2 className="heading-5 mb-4 text-brand-g">Error Loading Users</h2>
              <p className="text-base text-brand-f mb-6">{error}</p>
              <Button variant="primary" onClick={fetchUsers}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && users.length === 0 && (
            <div className="text-center py-12">
              <h2 className="heading-5 mb-4">No Users Found</h2>
              <p className="text-base text-brand-f mb-6">
                {searchTerm || roleFilter || locationFilter
                  ? 'No users match your current filters. Try adjusting your search criteria.'
                  : 'Get started by adding your first user.'}
              </p>
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          )}

          {/* Users Grid */}
          {!loading && !error && users.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {users.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex flex-col items-center mt-12 space-y-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              <p className="text-sm text-brand-f mt-5">
                Showing {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} of {total} users
              </p>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            fetchUsers();
          }}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setUserToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete user "${userToDelete?.UserName}"? This action cannot be undone.`}
          variant="danger"
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      </div>
    </RoleGuard>
  );
}
