'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import { IAccommodation } from '@/types/organisations/IAccommodation';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast } from '@/utils/toast';
import { AddAccommodationModal } from '../AddAccommodationModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AccommodationsTabProps {
  organisation: IOrganisation;
  viewMode?: boolean; // When true, hide add/edit/delete actions
}

const AccommodationsTab: React.FC<AccommodationsTabProps> = ({ organisation, viewMode = false }) => {
  const [accommodations, setAccommodations] = useState<IAccommodation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState<IAccommodation | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accommodationToDelete, setAccommodationToDelete] = useState<IAccommodation | null>(null);
  const [availableCities, setAvailableCities] = useState<Array<{ _id: string; Name: string; Key: string }>>([]);

  const fetchOrganisationCities = useCallback(async () => {
    try {
      // Fetch all cities
      const response = await authenticatedFetch('/api/cities');
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      const data = await response.json();
      const allCities = data.data || [];
      
      // Filter cities based on organisation's AssociatedLocationIds
      const organisationCityIds = organisation.AssociatedLocationIds || [];
      const filteredCities = allCities.filter((city: { _id: string; Name: string; Key: string }) => 
        organisationCityIds.includes(city.Key)
      );
      
      setAvailableCities(filteredCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  }, [organisation.AssociatedLocationIds]);

  const fetchAccommodations = useCallback(async () => {
    if (!organisation.Key) return;
    
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/organisations/${organisation.Key}/accommodations`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch accommodations');
      }
      const data = await response.json();
      setAccommodations(data.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load accommodations';
      errorToast.generic(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organisation.Key]);

  useEffect(() => {
    fetchAccommodations();
    fetchOrganisationCities();
  }, [fetchAccommodations, fetchOrganisationCities]);

  const handleAddAccommodation = () => {
    setEditingAccommodation(null);
    setIsAddModalOpen(true);
  };

  const handleEditAccommodation = (accommodation: IAccommodation) => {
    setEditingAccommodation(accommodation);
    setIsAddModalOpen(true);
  };

  const handleViewAccommodation = (accommodation: IAccommodation) => {
    setEditingAccommodation(accommodation);
    setIsAddModalOpen(true);
  };

  const handleDeleteAccommodation = (accommodation: IAccommodation) => {
    setAccommodationToDelete(accommodation);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccommodation = async () => {
    if (!accommodationToDelete) return;

    try {
      const response = await authenticatedFetch(
        `/api/organisations/${organisation.Key}/accommodations/${accommodationToDelete._id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete accommodation');
      }

      successToast.delete('Accommodation');
      fetchAccommodations();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete accommodation';
      errorToast.generic(errorMessage);
    } finally {
      setShowDeleteConfirm(false);
      setAccommodationToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="heading-3">Accommodations</h3>
            {!viewMode && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddAccommodation}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add Accommodation
              </Button>
            )}
          </div>

          {/* Accommodations List */}
          {isLoading ? (
            <LoadingSpinner />
          ) : accommodations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-brand-f mb-4">No accommodations found for this organisation.</p>
              {!viewMode && (
                <Button
                  variant="primary"
                  onClick={handleAddAccommodation}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Accommodation
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h5 className="heading-5">Accommodations:</h5>
              {accommodations.map((accommodation, index) => (
                <div
                  key={accommodation._id || index}
                  className="flex items-center justify-between p-4 bg-brand-q rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-k">
                      {accommodation.GeneralInfo.Name}
                    </p>
                    <p className="text-xs text-brand-f mt-1">
                      Type: {accommodation.GeneralInfo.AccommodationType}
                    </p>
                    {accommodation.GeneralInfo.Synopsis && (
                      <p className="text-xs text-brand-f mt-1">
                        {accommodation.GeneralInfo.Synopsis.substring(0, 100)}
                        {accommodation.GeneralInfo.Synopsis.length > 100 ? '...' : ''}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {accommodation.GeneralInfo.IsOpenAccess && (
                        <span className="text-xs bg-brand-b text-white px-2 py-1 rounded">
                          Open Access
                        </span>
                      )}
                      {accommodation.GeneralInfo.IsPublished && (
                        <span className="text-xs bg-brand-a text-white px-2 py-1 rounded">
                          Published
                        </span>
                      )}
                      <span className="text-xs bg-brand-f text-white px-2 py-1 rounded">
                        {accommodation.Address.City}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAccommodation(accommodation)}
                        title="View"
                      >
                        View
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAccommodation(accommodation)}
                          className="p-2"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAccommodation(accommodation)}
                          className="p-2 text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
                          title="Delete"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && accommodationToDelete && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Accommodation"
          message={`Are you sure you want to delete "${accommodationToDelete.GeneralInfo.Name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDeleteAccommodation}
          onClose={() => {
            setShowDeleteConfirm(false);
            setAccommodationToDelete(null);
          }}
          variant="danger"
        />
      )}

      {/* Add/Edit Accommodation Modal */}
      {isAddModalOpen && (
        <AddAccommodationModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingAccommodation(null);
          }}
          onSuccess={fetchAccommodations}
          organisationId={organisation.Key}
          providerId={organisation.Key}
          availableCities={availableCities}
          accommodation={editingAccommodation}
          viewMode={viewMode}
        />
      )}
    </div>
  );
};

export default AccommodationsTab;
