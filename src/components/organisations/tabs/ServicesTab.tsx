'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import ErrorDisplay, { ValidationError } from '@/components/ui/ErrorDisplay';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import { IGroupedService } from '@/types/organisations/IGroupedService';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast } from '@/utils/toast';
import AddServiceModal from '@/components/organisations/AddServiceModal';
import { decodeText } from '@/utils/htmlDecode';

interface ServicesTabProps {
  organisation: IOrganisation;
  viewMode?: boolean; // When true, hide add/edit/delete actions
}

const ServicesTab: React.FC<ServicesTabProps> = ({ organisation, viewMode = false }) => {
  const [services, setServices] = useState<IGroupedService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<IGroupedService | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<IGroupedService | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Fetch services for the organisation
  useEffect(() => {
    fetchServices();
  }, [organisation.Key]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/organisations/${organisation.Key}/services`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch services');
      }
      const data = await response.json();
      setServices(data.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load services';
      errorToast.generic(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setIsAddModalOpen(true);
  };

  const handleEditService = (service: IGroupedService) => {
    setEditingService(service);
    setIsAddModalOpen(true);
  };

  const handleViewService = (service: IGroupedService) => {
    setEditingService(service);
    setIsAddModalOpen(true);
  };

  const handleDeleteService = (service: IGroupedService) => {
    setServiceToDelete(service);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      const response = await authenticatedFetch(
        `/api/organisations/${organisation.Key}/services/${serviceToDelete._id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }

      successToast.delete('Service');
      fetchServices();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete service';
      errorToast.generic(errorMessage);
    } finally {
      setShowDeleteConfirm(false);
      setServiceToDelete(null);
    }
  };

  const handleServiceSaved = () => {
    setIsAddModalOpen(false);
    setEditingService(null);
    fetchServices();
  };

  const formatServiceDisplay = (service: IGroupedService): string => {
    const parts: string[] = [];
    
    if (service.CategoryName) {
      parts.push(service.CategoryName);
    }
    
    if (service.Location?.Postcode) {
      parts.push(service.Location.Postcode);
    }
    
    return parts.join(' - ');
  };

  const formatSubCategories = (service: IGroupedService): string => {
    if (!service.SubCategories || service.SubCategories.length === 0) {
      return 'No subcategories';
    }
    
    return service.SubCategories.map(sub => decodeText(sub.Name)).join(', ');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Error Display */}
      {validationErrors.length > 0 && (
        <div className="px-4 sm:px-6 pt-4">
          <ErrorDisplay
            ValidationErrors={validationErrors}
            ClassName="mb-4"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="heading-3">Services</h3>
            {!viewMode && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddService}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </Button>
            )}
          </div>

          {/* Services List */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-brand-f">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-brand-f mb-4">No services found for this organisation.</p>
              {!viewMode && (
                <Button
                  variant="primary"
                  onClick={handleAddService}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Service
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h5 className="heading-5">Services:</h5>
              {services.map((service, index) => (
                <div
                  key={service._id || index}
                  className="flex items-center justify-between p-4 bg-brand-q rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-k">
                      {formatServiceDisplay(service)}
                    </p>
                    <p className="text-xs text-brand-f mt-1">
                      Subcategories: {formatSubCategories(service)}
                    </p>
                    {service.Info && (
                      <p className="text-xs text-brand-f mt-1">
                        {decodeText(service.Info).substring(0, 100)}
                        {service.Info.length > 100 ? '...' : ''}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2">
                      {service.IsOpen247 && (
                        <span className="text-xs bg-brand-b text-white px-2 py-1 rounded">
                          24/7
                        </span>
                      )}
                      {service.IsAppointmentOnly && (
                        <span className="text-xs bg-brand-j text-brand-k px-2 py-1 rounded">
                          Appointment Only
                        </span>
                      )}
                      {service.IsTelephoneService && (
                        <span className="text-xs bg-brand-h text-white px-2 py-1 rounded">
                          Telephone Service
                        </span>
                      )}
                      {!service.IsOpen247 && !service.IsAppointmentOnly && service.OpeningTimes && service.OpeningTimes.length > 0 && (
                        <span className="text-xs bg-brand-a text-white px-2 py-1 rounded">
                          {service.OpeningTimes.length} Opening Times
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewService(service)}
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
                          onClick={() => handleEditService(service)}
                          className="p-2"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteService(service)}
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

      {/* Add/Edit Service Modal */}
      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingService(null);
        }}
        organisation={organisation}
        service={editingService}
        viewMode={viewMode}
        onServiceSaved={handleServiceSaved}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setServiceToDelete(null);
        }}
        onConfirm={confirmDeleteService}
        title="Delete Service"
        message={`Are you sure you want to delete the service "${serviceToDelete?.CategoryName || 'this service'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ServicesTab;
