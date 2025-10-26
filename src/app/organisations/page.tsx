'use client';

import { useState, useEffect } from 'react';
import '@/styles/pagination.css';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Plus, Search } from 'lucide-react';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import OrganisationCard from '@/components/organisations/OrganisationCard';
import AddUserToOrganisationModal from '@/components/organisations/AddUserToOrganisationModal';
import { AddOrganisationModal } from '@/components/organisations/AddOrganisationModal';
import EditOrganisationModal from '@/components/organisations/EditOrganisationModal';
import { NotesModal } from '@/components/organisations/NotesModal';
import { DisableOrganisationModal } from '@/components/organisations/DisableOrganisationModal';
import toastUtils, { errorToast, loadingToast, successToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { useSession } from 'next-auth/react';
import { UserAuthClaims } from '@/types/auth';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

export default function OrganisationsPage() {
  // Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN, ROLES.ORG_ADMIN],
    requiredPage: '/organisations',
    autoRedirect: true
  });

  const { data: session } = useSession();
  const [organisations, setOrganisations] = useState<IOrganisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(''); // Name input field value
  const [searchName, setSearchName] = useState(''); // Actual search term sent to API
  const [isVerifiedFilter, setIsVerifiedFilter] = useState<string>(''); // '', 'true', 'false'
  const [isPublishedFilter, setIsPublishedFilter] = useState<string>(''); // '', 'true', 'false'
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [locations, setLocations] = useState<Array<{ Key: string; Name: string }>>([]);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showClearNotesConfirmModal, setShowClearNotesConfirmModal] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddOrganisationModalOpen, setIsAddOrganisationModalOpen] = useState(false);
  const [isEditOrganisationModalOpen, setIsEditOrganisationModalOpen] = useState(false);
  const [isViewOrganisationModalOpen, setIsViewOrganisationModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedOrganisation, setSelectedOrganisation] = useState<IOrganisation | null>(null);
  const [organisationToDisable, setOrganisationToDisable] = useState<IOrganisation | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);
  const [togglingVerifyId, setTogglingVerifyId] = useState<string | null>(null);
  
  const limit = 9;

  // Get user auth claims
  const userAuthClaims = (session?.user?.authClaims || { roles: [], specificClaims: [] }) as UserAuthClaims;
  
  // Check if user is OrgAdmin (without other admin roles)
  const isOrgAdmin = userAuthClaims.roles.includes(ROLES.ORG_ADMIN) && 
                     !userAuthClaims.roles.includes(ROLES.SUPER_ADMIN) &&
                     !userAuthClaims.roles.includes(ROLES.VOLUNTEER_ADMIN) &&
                     !userAuthClaims.roles.includes(ROLES.CITY_ADMIN);

  // Get organisation keys from AdminFor: claims for OrgAdmin users
  const orgAdminKeys = isOrgAdmin 
    ? userAuthClaims.specificClaims
        .filter((claim: string) => claim.startsWith('AdminFor:'))
        .map((claim: string) => claim.replace('AdminFor:', ''))
    : [];

  // Only run effects if authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchLocations();
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchOrganisations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, currentPage, searchName, isVerifiedFilter, isPublishedFilter, locationFilter, limit]);

  const fetchLocations = async () => {
    try {
      const response = await authenticatedFetch('/api/cities');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchOrganisations = async () => {
    try {
      setLoading(true);
      setError(null);

      // OrgAdmin users: Fetch organisations by key (currently only first org, but supports multiple in future)
      if (isOrgAdmin && orgAdminKeys.length > 0) {
        // TODO: In the future, we can extend this to fetch multiple organisations by keys
        // For now, fetch the first organisation the user administers
        const orgKey = orgAdminKeys[0];
        
        const response = await authenticatedFetch(`/api/organisations/${orgKey}`);
        if (!response.ok) {
          throw new Error('Failed to fetch organisation');
        }

        const result = await response.json();
        // API returns single organisation, wrap in array for consistent display
        setOrganisations(result.data ? [result.data] : []);
        setTotal(1);
        setTotalPages(1);
      } else {
        // All other roles: Fetch organisations with pagination and filters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
        });
        
        if (searchName) params.append('search', searchName);
        if (isVerifiedFilter) params.append('isVerified', isVerifiedFilter);
        if (isPublishedFilter) params.append('isPublished', isPublishedFilter);
        if (locationFilter) params.append('location', locationFilter);
        
        const response = await authenticatedFetch(`/api/organisations?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch organisations');
        }

        const result = await response.json();
        setOrganisations(result.data || []);
        setTotal(result.pagination?.total || 0);
        setTotalPages(result.pagination?.pages || 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organisations';
      setError(errorMessage);
      errorToast.generic(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    setSearchName(nameInput.trim());
    setCurrentPage(1);
  };
  
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleIsVerifiedFilter = (value: string) => {
    setIsVerifiedFilter(value);
    setCurrentPage(1);
  };

  const handleIsPublishedFilter = (value: string) => {
    setIsPublishedFilter(value);
    setCurrentPage(1);
  };

  const handleLocationFilter = (value: string) => {
    setLocationFilter(value);
    setCurrentPage(1);
  };

  const handleView = (organisation: IOrganisation) => {
    setSelectedOrganisation(organisation);
    setIsViewOrganisationModalOpen(true);
  };

  const handleEdit = (organisation: IOrganisation) => {
    setSelectedOrganisation(organisation);
    setIsEditOrganisationModalOpen(true);
  };

  const handleDisableClick = (organisation: IOrganisation) => {
    setOrganisationToDisable(organisation);
    setShowDisableModal(true);
  };

  const handleTogglePublished = async (organisation: IOrganisation, staffName?: string, reason?: string) => {
    setTogglingPublishId(organisation._id);
    const isCurrentlyPublished = organisation.IsPublished;
    const action = isCurrentlyPublished ? 'disable' : 'publish';
    const toastId = loadingToast.process(action === 'publish' ? 'Publishing organisation' : 'Disabling organisation');
    
    try {
      const body: any = {};
      
      // If disabling, include note information
      if (isCurrentlyPublished && staffName && reason) {
        body.note = {
          StaffName: staffName,
          Reason: reason
        };
      }

      const response = await authenticatedFetch(`/api/organisations/${organisation._id}/toggle-published`, {
        method: HTTP_METHODS.PATCH,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} organisation`);
      }

      toastUtils.dismiss(toastId);
      if (action === 'publish') {
        toastUtils.custom('Organisation published successfully', { type: 'success' });
      } else {
        toastUtils.custom('Organisation disabled successfully', { type: 'success' });
      }
      
      // Refresh the list
      fetchOrganisations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} organisation`;
      toastUtils.dismiss(toastId);
      errorToast.generic(errorMessage);
    } finally {
      setTogglingPublishId(null);
    }
  };

  const handleToggleVerified = async (organisation: IOrganisation) => {
    setTogglingVerifyId(organisation._id);
    const isCurrentlyVerified = organisation.IsVerified;
    const action = isCurrentlyVerified ? 'unverify' : 'verify';
    const toastId = loadingToast.process(action === 'verify' ? 'Verifying organisation' : 'Unverifying organisation');
    
    try {
      const response = await authenticatedFetch(`/api/organisations/${organisation._id}/toggle-verified`, {
        method: HTTP_METHODS.PATCH
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} organisation`);
      }

      toastUtils.dismiss(toastId);
      if (action === 'verify') {
        toastUtils.custom('Organisation verified successfully', { type: 'success' });
      } else {
        toastUtils.custom('Organisation unverified successfully', { type: 'success' });
      }
      
      // Refresh the list
      fetchOrganisations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} organisation`;
      toastUtils.dismiss(toastId);
      errorToast.generic(errorMessage);
    } finally {
      setTogglingVerifyId(null);
    }
  };

  const handleAddUser = (organisation: IOrganisation) => {
    setSelectedOrganisation(organisation);
    setIsAddUserModalOpen(true);
  };

  const handleViewNotes = (organisation: IOrganisation) => {
    setSelectedOrganisation(organisation);
    setIsNotesModalOpen(true);
  };

  const handleClearNotesClick = () => {
    setShowClearNotesConfirmModal(true);
  };

  const confirmClearNotes = async () => {
    if (!selectedOrganisation) return;

    setShowClearNotesConfirmModal(false);
    const toastId = loadingToast.process('Clearing notes');
    
    try {
      const response = await authenticatedFetch(`/api/organisations/${selectedOrganisation._id}/notes`, {
        method: HTTP_METHODS.DELETE
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear notes');
      }

      toastUtils.dismiss(toastId);
      toastUtils.custom('Notes cleared successfully', { type: 'success' });
      
      // Close the notes modal
      setIsNotesModalOpen(false);
      
      // Refresh the list
      fetchOrganisations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear notes';
      toastUtils.dismiss(toastId);
      errorToast.generic(errorMessage);
    }
  };


  const confirmDisable = (staffName: string, reason: string) => {
    if (!organisationToDisable) return;
    
    setShowDisableModal(false);
    handleTogglePublished(organisationToDisable, staffName, reason);
    setOrganisationToDisable(null);
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
        {/* Header - Always show but with conditional content */}
        <div className="nav-container">
          <div className="page-container">
            <div className={`flex items-center justify-between h-16 ${isOrgAdmin ? 'mb-6' : ''}`}>
              <h1 className="heading-4">{isOrgAdmin ? 'My Organisation' : 'Organisations'}</h1>
              {!isOrgAdmin && (
                <Button variant="primary" onClick={() => setIsAddOrganisationModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Organisation
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="page-container section-spacing padding-top-zero">
          {/* Filters - Hidden for OrgAdmin */}
          {!isOrgAdmin && (
            <div className="bg-white rounded-lg border border-brand-q p-6 mb-6 mt-[5px]">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-f w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search by name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
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
                    value={locationFilter}
                    onChange={(e) => handleLocationFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white min-w-48"
                  >
                    <option value="" className="text-brand-k">All Locations</option>
                    {locations.map(city => (
                      <option key={city.Key} value={city.Key} className="text-brand-k">{city.Name}</option>
                    ))}
                  </select>

                  <select
                    value={isVerifiedFilter}
                    onChange={(e) => handleIsVerifiedFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white min-w-48"
                  >
                    <option value="">Verified: Either</option>
                    <option value="true">Verified: Yes</option>
                    <option value="false">Verified: No</option>
                  </select>

                  <select
                    value={isPublishedFilter}
                    onChange={(e) => handleIsPublishedFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white min-w-48"
                  >
                    <option value="">Published: Either</option>
                    <option value="true">Published: Yes</option>
                    <option value="false">Published: No</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results Summary - Hidden for OrgAdmin */}
          {!isOrgAdmin && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-base text-brand-f">
                {loading ? '' : `${total} organisation${total !== 1 ? 's' : ''} found`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-a"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <h2 className="heading-5 mb-4 text-brand-g">Error Loading Organisations</h2>
              <p className="text-base text-brand-f mb-6">{error}</p>
              <Button variant="primary" onClick={fetchOrganisations}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && organisations.length === 0 && (
            <div className="text-center py-12">
              <h2 className="heading-5 mb-4">No Organisations Found</h2>
              <div className="text-base text-brand-f mb-6 space-y-2">
                {searchName || isVerifiedFilter || isPublishedFilter || locationFilter ? (
                  <p>No organisations match your current filters. Try adjusting your search criteria.</p>
                ) : (
                  <p>No organisations available.</p>
                )}
              </div>
            </div>
          )}

          {/* Organisations Grid */}
          {!loading && !error && organisations.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {organisations.map((organisation) => (
                <OrganisationCard
                  key={organisation._id}
                  organisation={organisation}
                  onView={handleView}
                  onEdit={handleEdit}
                  onTogglePublished={handleTogglePublished}
                  onToggleVerified={handleToggleVerified}
                  onAddUser={handleAddUser}
                  onViewNotes={handleViewNotes}
                  onDisableClick={handleDisableClick}
                  isTogglingPublish={togglingPublishId === organisation._id}
                  isTogglingVerify={togglingVerifyId === organisation._id}
                  isOrgAdmin={isOrgAdmin}
                />
              ))}
            </div>
          )}

          {/* Pagination - Hidden for OrgAdmin */}
          {!isOrgAdmin && !loading && !error && totalPages > 1 && (
            <div className="flex flex-col items-center mt-12 space-y-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              <p className="text-sm text-brand-f mt-5">
                Showing {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} of {total} organisations
              </p>
            </div>
          )}
        </div>

        {/* Add User to Organisation Modal */}
        <AddUserToOrganisationModal
          isOpen={isAddUserModalOpen}
          onClose={() => {
            setIsAddUserModalOpen(false);
            setSelectedOrganisation(null);
          }}
          onSuccess={() => {
            // Refresh the organisations list
            fetchOrganisations();
          }}
          organisation={selectedOrganisation}
        />

        {/* Add Organisation Modal */}
        <AddOrganisationModal
          isOpen={isAddOrganisationModalOpen}
          onClose={() => setIsAddOrganisationModalOpen(false)}
          onSuccess={() => {
            // Refresh the organisations list
            fetchOrganisations();
          }}
        />

        {/* Edit Organisation Modal */}
        {selectedOrganisation && (
          <EditOrganisationModal
            isOpen={isEditOrganisationModalOpen}
            onClose={() => {
              setIsEditOrganisationModalOpen(false);
              setSelectedOrganisation(null);
            }}
            organisation={selectedOrganisation}
            onOrganisationUpdated={() => {
              // Refresh the organisations list
              fetchOrganisations();
            }}
          />
        )}

        {/* View Organisation Modal (Read-only) */}
        {selectedOrganisation && (
          <EditOrganisationModal
            isOpen={isViewOrganisationModalOpen}
            onClose={() => {
              setIsViewOrganisationModalOpen(false);
              setSelectedOrganisation(null);
            }}
            organisation={selectedOrganisation}
            onOrganisationUpdated={() => {
              // Refresh the organisations list
              fetchOrganisations();
            }}
            viewMode={true}
          />
        )}

        {/* Notes Modal */}
        <NotesModal
          isOpen={isNotesModalOpen}
          onClose={() => {
            setIsNotesModalOpen(false);
            setSelectedOrganisation(null);
          }}
          onClearNotes={handleClearNotesClick}
          organisation={selectedOrganisation}
        />

        {/* Disable Organisation Modal */}
        <DisableOrganisationModal
          isOpen={showDisableModal}
          onClose={() => {
            setShowDisableModal(false);
            setOrganisationToDisable(null);
          }}
          onConfirm={confirmDisable}
          organisation={organisationToDisable}
        />

        {/* Clear Notes Confirmation Modal */}
        <ConfirmModal
          isOpen={showClearNotesConfirmModal}
          onClose={() => setShowClearNotesConfirmModal(false)}
          onConfirm={confirmClearNotes}
          title="Clear All Notes"
          message={`Are you sure you want to clear all notes for "${selectedOrganisation?.Name}"? This action cannot be undone.`}
          variant="warning"
          confirmLabel="Clear Notes"
          cancelLabel="Cancel"
        />
    </div>
  );
}
