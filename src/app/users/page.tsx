'use client';
import { useState, useEffect } from 'react';
import '@/styles/pagination.css';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Search, Plus } from 'lucide-react';
import { IUser } from '@/types/IUser';
import UserCard from '@/components/users/UserCard';
import AddUserModal from '@/components/users/AddUserModal';
import ViewUserModal from '@/components/users/ViewUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import { errorToast, successToast, loadingToast, toastUtils } from '@/utils/toast';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ROLES, getRoleOptions } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';

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
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
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
      
      if (searchEmail) params.append('search', searchEmail);
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
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
  
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-f w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="Search by email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleSearchClick}
                    className="whitespace-nowrap"
                  >
                    Search
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white min-w-48"
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
                  className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white min-w-48"
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
              <div className="text-base text-brand-f mb-6 space-y-2">
                {searchEmail ? (
                  <>
                    <p>No users match your current search.</p>
                    <p className="text-sm">Search requires a complete email address (e.g., name@example.com).</p>
                  </>
                ) : roleFilter || locationFilter ? (
                  <p>No users match your current filters. Try adjusting your search criteria.</p>
                ) : (
                  <p>Get started by adding your first user.</p>
                )}
              </div>
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
