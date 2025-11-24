'use client';
import { useState, useEffect } from 'react';
import '@/styles/pagination.css';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FiltersSection } from '@/components/ui/FiltersSection';
import { Plus } from 'lucide-react';
import { IUser } from '@/types/IUser';
import UserCard from '@/components/users/UserCard';
import AddUserModal from '@/components/users/AddUserModal';
import ViewUserModal from '@/components/users/ViewUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import { errorToast, successToast, loadingToast, toastUtils } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ROLES, getRoleOptions } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { ICity } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ResultsSummary } from '@/components/ui/ResultsSummary';

export default function UsersPage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
    requiredPage: '/users',
    autoRedirect: true
  });

  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState(''); // Email input field value
  const [searchEmail, setSearchEmail] = useState(''); // Actual search term sent to API
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [locations, setLocations] = useState<ICity[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeactivateConfirmModal, setShowDeactivateConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<IUser | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  
  const limit = 9;

  // Available roles for filtering
  const availableRoles = getRoleOptions();

  // Only run effects if authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchLocations();
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, currentPage, searchEmail, roleFilter, locationFilter, limit]);

  const fetchLocations = async () => {
    try {
      // IMPORTANT: Pass restrictVolunteerAdmin=true to restrict VolunteerAdmin on Users page
      const response = await authenticatedFetch('/api/cities?restrictVolunteerAdmin=true');
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch locations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch locations';
      setError(errorMessage);
      errorToast.generic(errorMessage);
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
      
      if (emailInput?.trim()) params.append('search', emailInput.trim());
      if (roleFilter) params.append('role', roleFilter);
      if (locationFilter) params.append('location', locationFilter);
      
      const response = await authenticatedFetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    setSearchEmail(emailInput.trim());
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

  const handleView = (user: IUser) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEdit = (user: IUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (user: IUser) => {
    setUserToDelete(user);
    setShowDeleteConfirmModal(true);
  };

  const handleDeactivateClick = (user: IUser) => {
    setUserToDeactivate(user);
    setShowDeactivateConfirmModal(true);
  };

  const handleToggleActive = async (user: IUser) => {
    setTogglingUserId(user._id);
    const isCurrentlyActive = user.IsActive ?? true;
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    const toastId = loadingToast.process(action === 'activate' ? 'Activating user' : 'Deactivating user');
    
    try {
      const response = await authenticatedFetch(`/api/users/${user._id}/toggle-active`, {
        method: HTTP_METHODS.PATCH
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} user`);
      }

      toastUtils.dismiss(toastId);
      if (action === 'activate') {
        successToast.activate('User');
      } else {
        successToast.deactivate('User');
      }
      
      // Refresh the list
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} user`;
      toastUtils.dismiss(toastId);
      errorToast.generic(errorMessage);
    } finally {
      setTogglingUserId(null);
    }
  };

  const confirmDeactivate = () => {
    if (!userToDeactivate) return;
    setShowDeactivateConfirmModal(false);
    handleToggleActive(userToDeactivate);
    setUserToDeactivate(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setShowDeleteConfirmModal(false);
    const toastId = loadingToast.delete('user');
    
    try {
      const response = await authenticatedFetch(`/api/users/${userToDelete._id}`, {
        method: HTTP_METHODS.DELETE
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
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

  // Show loading while checking authorization
  if (isChecking) {
    return <LoadingSpinner />;
  }

  // Don't render anything if not authorized (redirect handled by hook)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-q">
        <PageHeader 
          title="Users"
          actions={
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          }
        />

        <div className="page-container section-spacing padding-top-zero">
          {/* Filters */}
          <FiltersSection
            searchPlaceholder="Search by email"
            searchValue={emailInput}
            onSearchChange={setEmailInput}
            onSearchSubmit={handleSearchClick}
            filters={[
              {
                id: 'role-filter',
                value: roleFilter,
                onChange: handleRoleFilter,
                placeholder: 'All Roles',
                options: availableRoles.map(role => ({
                  label: role.label,
                  value: role.value
                }))
              },
              {
                id: 'location-filter',
                value: locationFilter,
                onChange: handleLocationFilter,
                placeholder: 'All Locations',
                options: locations.map(city => ({
                  label: city.Name,
                  value: city.Key
                }))
              }
            ]}
          />

          {/* Results Summary */}
          <ResultsSummary Loading={loading} Total={total} ItemName="user" />

          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Error State */}
          {error && !loading && (
            <ErrorState
              title="Error Loading Users"
              message={error}
              onRetry={fetchUsers}
            />
          )}

          {/* Empty State */}
          {!loading && !error && users.length === 0 && (
            <EmptyState
              title="No Users Found"
              message={
                searchEmail ? (
                    <p>No users match your current search. Try adjusting your search criteria.</p>
                ) : roleFilter || locationFilter ? (
                  <p>No users match your current filters. Try adjusting your search criteria.</p>
                ) : (
                  <p>Get started by adding your first user.</p>
                )
              }
              action={{
                label: 'Add User',
                icon: <Plus className="w-4 h-4 mr-2" />,
                onClick: () => setIsAddModalOpen(true),
                variant: 'primary'
              }}
            />
          )}

          {/* Users Grid */}
          {!loading && !error && users.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {users.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onDeactivateClick={handleDeactivateClick}
                  isToggling={togglingUserId === user._id}
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

        {/* View User Modal */}
        <ViewUserModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            fetchUsers();
          }}
          user={selectedUser}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteConfirmModal}
          onClose={() => {
            setShowDeleteConfirmModal(false);
            setUserToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete user "${userToDelete?.Email}"? This action cannot be undone.`}
          variant="danger"
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />

        {/* Deactivate Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeactivateConfirmModal}
          onClose={() => {
            setShowDeactivateConfirmModal(false);
            setUserToDeactivate(null);
          }}
          onConfirm={confirmDeactivate}
          title="Deactivate User"
          message={`Are you sure you want to deactivate user "${typeof userToDeactivate?.Email === 'string' ? userToDeactivate.Email : ''}"? The user will not be able to access the system until reactivated.`}
          variant="warning"
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
        />
    </div>
  );
}
