'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { OpeningTimesManager } from '@/components/organisations/OpeningTimesManager';
import ErrorDisplay, { ValidationError } from '@/components/ui/ErrorDisplay';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import { IGroupedService } from '@/types/organisations/IGroupedService';
import { IServiceCategory } from '@/types/organisations/IServiceCategory';
import { IOpeningTimeFormData } from '@/types/organisations/IOrganisation';
import { IGroupedServiceFormData, validateGroupedService } from '@/schemas/groupedServiceSchema';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { errorToast, successToast } from '@/utils/toast';
import { decodeText } from '@/utils/htmlDecode';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organisation: IOrganisation;
  service?: IGroupedService | null;
  onServiceSaved: () => void;
}


const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  organisation,
  service,
  onServiceSaved
}) => {
  const [formData, setFormData] = useState<IGroupedServiceFormData>({
    ProviderId: organisation._id,
    CategoryId: '',
    Location: {
      StreetLine1: '',
      Postcode: ''
    },
    IsOpen247: false,
    SubCategories: [],
    IsTelephoneService: false,
    IsAppointmentOnly: false
  });

  const [categories, setCategories] = useState<IServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IServiceCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Initialize form data when service prop changes
  useEffect(() => {
    if (service) {
      // Convert existing service to form data format
      const openingTimes = service.OpeningTimes?.map(ot => ({
        Day: ot.Day,
        StartTime: typeof ot.StartTime === 'number' ? 
          `${Math.floor(ot.StartTime / 100).toString().padStart(2, '0')}:${(ot.StartTime % 100).toString().padStart(2, '0')}` : 
          ot.StartTime,
        EndTime: typeof ot.EndTime === 'number' ? 
          `${Math.floor(ot.EndTime / 100).toString().padStart(2, '0')}:${(ot.EndTime % 100).toString().padStart(2, '0')}` : 
          ot.EndTime
      })) || [];

      setFormData({
        _id: service._id,
        ProviderId: service.ProviderId,
        CategoryId: service.CategoryId,
        CategoryName: decodeText(service.CategoryName || ''),
        CategorySynopsis: decodeText(service.CategorySynopsis || ''),
        Info: decodeText(service.Info || ''),
        Tags: service.Tags,
        Location: {
          OutreachLocationDescription: decodeText(service.Location.Description || ''),
          StreetLine1: decodeText(service.Location.StreetLine1 || ''),
          StreetLine2: decodeText(service.Location.StreetLine2 || ''),
          StreetLine3: decodeText(service.Location.StreetLine3 || ''),
          StreetLine4: decodeText(service.Location.StreetLine4 || ''),
          City: service.Location.City,
          Postcode: service.Location.Postcode,
          Location: service.Location.Location ? {
            Latitude: service.Location.Location.coordinates[1],
            Longitude: service.Location.Location.coordinates[0]
          } : undefined
        },
        IsOpen247: service.IsOpen247,
        OpeningTimes: openingTimes,
        SubCategories: service.SubCategories?.map(sub => ({
          ...sub,
          Name: decodeText(sub.Name || ''),
          Synopsis: decodeText(sub.Synopsis || '')
        })),
        SubCategoriesIds: service.SubCategoriesIds,
        IsTelephoneService: service.IsTelephoneService,
        IsAppointmentOnly: service.IsAppointmentOnly
      });
    } else {
      // Reset form for new service
      setFormData({
        ProviderId: organisation._id,
        CategoryId: '',
        Location: {
          StreetLine1: '',
          Postcode: ''
        },
        IsOpen247: false,
        SubCategories: [],
        IsTelephoneService: false,
        IsAppointmentOnly: false
      });
    }
  }, [service, organisation._id]);

  // Fetch service categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authenticatedFetch('/api/service-categories');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch service categories');
        }
        const data = await response.json();
        setCategories(data.data || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load service categories';
        errorToast.generic(errorMessage);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Update selected category when category ID changes
  useEffect(() => {
    if (formData.CategoryId && categories.length > 0) {
      const category = categories.find(cat => cat._id === formData.CategoryId);
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [formData.CategoryId, categories]);

  const updateFormData = (field: keyof IGroupedServiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => !error.Path.startsWith(field)));
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    if (category) {
      updateFormData('CategoryId', categoryId);
      updateFormData('CategoryName', category.Name);
      updateFormData('CategorySynopsis', category.Synopsis);
      // Reset subcategories when category changes
      updateFormData('SubCategories', []);
      updateFormData('SubCategoriesIds', []);
    }
  };

  const handleSubCategoriesChange = (selectedIds: string[]) => {
    if (!selectedCategory) return;

    const selectedSubCategories = selectedCategory.SubCategories.filter(sub => 
      selectedIds.includes(sub._id)
    );

    updateFormData('SubCategories', selectedSubCategories);
    updateFormData('SubCategoriesIds', selectedIds);
  };

  const handleAddressSelect = (addressIndex: string) => {
    if (addressIndex === '') {
      // Clear address fields
      updateFormData('Location', {
        OutreachLocationDescription: formData.Location.OutreachLocationDescription,
        StreetLine1: '',
        StreetLine2: '',
        StreetLine3: '',
        StreetLine4: '',
        City: '',
        Postcode: '',
        Location: undefined
      });
      return;
    }

    const index = parseInt(addressIndex);
    const address = organisation.Addresses[index];
    if (address) {
      updateFormData('Location', {
        OutreachLocationDescription: formData.Location.OutreachLocationDescription,
        StreetLine1: address.Street,
        StreetLine2: address.Street1,
        StreetLine3: address.Street2,
        StreetLine4: address.Street3,
        City: address.City,
        Postcode: address.Postcode,
        Location: address.Location ? {
          Latitude: address.Location.coordinates[1],
          Longitude: address.Location.coordinates[0]
        } : undefined
      });
    }
  };

  const handleOpeningTimesChange = (openingTimes: IOpeningTimeFormData[]) => {
    updateFormData('OpeningTimes', openingTimes);
  };

  const validateForm = (): boolean => {
    const result = validateGroupedService(formData);
    
    if (!result.success) {
      const errors = (result.errors || []).map((error: any) => ({
        Path: Array.isArray(error.path) ? error.path.join('.') : error.path,
        Message: error.message
      }));
      setValidationErrors(errors);
      return false;
    }
    
    setValidationErrors([]);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      errorToast.validation();
      return;
    }

    setIsLoading(true);

    try {
      // Convert opening times from string format to number format for API
      const submissionData = {
        ...formData,
        OpeningTimes: formData.OpeningTimes?.map(ot => ({
          Day: ot.Day,
          StartTime: parseInt(ot.StartTime.replace(':', '')),
          EndTime: parseInt(ot.EndTime.replace(':', ''))
        }))
      };

      const url = service 
        ? `/api/organisations/${organisation._id}/services/${service._id}`
        : `/api/organisations/${organisation._id}/services`;
      
      const method = service ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${service ? 'update' : 'create'} service`);
      }

      service ? successToast.update('Service') : successToast.create('Service');
      onServiceSaved();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${service ? 'update' : 'create'} service`;
      errorToast.generic(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValidationErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
          <h2 className="heading-2 text-brand-k">
            {service ? 'Edit Service' : 'Add Service'}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="p-2"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

          {/* Content - scrollable */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <h3 className="heading-3 mb-4">Category</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-brand-k mb-2">
                      Service Category <span className="text-brand-g">*</span>
                    </label>
                    <select
                      value={formData.CategoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">Select a category...</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && selectedCategory.SubCategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Sub Categories <span className="text-brand-g">*</span>
                      </label>
                      <MultiSelect
                        options={selectedCategory.SubCategories.map(sub => ({
                          value: sub._id,
                          label: sub.Name
                        }))}
                        value={formData.SubCategoriesIds || []}
                        onChange={handleSubCategoriesChange}
                        placeholder="Select subcategories..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="heading-3 mb-4">Service Details</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-brand-k mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.Info || ''}
                      onChange={(e) => updateFormData('Info', e.target.value)}
                      className="input-field"
                      placeholder="Service description"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isTelephoneService"
                      checked={formData.IsTelephoneService || false}
                      onChange={(e) => updateFormData('IsTelephoneService', e.target.checked)}
                      className="checkbox-field"
                    />
                    <label htmlFor="isTelephoneService" className="text-sm text-brand-k ml-2">
                      Is Telephone Service
                    </label>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="heading-3 mb-4">Location</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-brand-k mb-2">
                      Outreach Locations Description
                    </label>
                    <textarea
                      value={formData.Location.OutreachLocationDescription || ''}
                      onChange={(e) => updateFormData('Location', {
                        ...formData.Location,
                        OutreachLocationDescription: e.target.value
                      })}
                      className="input-field"
                      placeholder="Enter a description for outreach services with no fixed address"
                      rows={2}
                    />
                    <p className="text-xs text-brand-f mt-1">
                      Enter a location for this service, either by selecting an existing address, or entering new details. 
                      For outreach services with no fixed address, enter a description in the field above.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-k mb-2">
                      Use Existing Address
                    </label>
                    <select
                      onChange={(e) => handleAddressSelect(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select an existing address...</option>
                      {organisation.Addresses.map((address, index) => (
                        <option key={index} value={index.toString()}>
                          {address.Street} - {address.Postcode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Street Line 1 <span className="text-brand-g">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.Location.StreetLine1}
                        onChange={(e) => updateFormData('Location', {
                          ...formData.Location,
                          StreetLine1: e.target.value
                        })}
                        className="input-field"
                        placeholder="Street address"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Postcode <span className="text-brand-g">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.Location.Postcode}
                        onChange={(e) => updateFormData('Location', {
                          ...formData.Location,
                          Postcode: e.target.value
                        })}
                        className="input-field"
                        placeholder="Postcode"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Street Line 2
                      </label>
                      <input
                        type="text"
                        value={formData.Location.StreetLine2 || ''}
                        onChange={(e) => updateFormData('Location', {
                          ...formData.Location,
                          StreetLine2: e.target.value
                        })}
                        className="input-field"
                        placeholder="Street line 2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.Location.City || ''}
                        onChange={(e) => updateFormData('Location', {
                          ...formData.Location,
                          City: e.target.value
                        })}
                        className="input-field"
                        placeholder="City"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Opening Times */}
              <div>
                <h3 className="heading-3 mb-4">Opening Times</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isOpen247"
                      checked={formData.IsOpen247}
                      onChange={(e) => updateFormData('IsOpen247', e.target.checked)}
                      className="checkbox-field"
                    />
                    <label htmlFor="isOpen247" className="text-sm text-brand-k ml-2">
                      Open 24/7
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isAppointmentOnly"
                      checked={formData.IsAppointmentOnly || false}
                      onChange={(e) => updateFormData('IsAppointmentOnly', e.target.checked)}
                      className="checkbox-field"
                    />
                    <label htmlFor="isAppointmentOnly" className="text-sm text-brand-k ml-2">
                      Appointment Only
                    </label>
                  </div>

                  {!formData.IsOpen247 && !formData.IsAppointmentOnly && (
                    <OpeningTimesManager
                      openingTimes={formData.OpeningTimes || []}
                      onChange={handleOpeningTimesChange}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

            {/* Error Display */}
            {validationErrors.length > 0 && (
              <div className="px-4 sm:px-6">
              <ErrorDisplay
                ValidationErrors={validationErrors}
                ClassName="mb-4"
              />
            </div>
          )}

            {/* Footer - fixed at bottom */}
            <div className="border-t border-brand-q p-4 sm:p-6">
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (service ? 'Updating...' : 'Creating...') : (service ? 'Update Service' : 'Create Service')}
              </Button>
            </div>
          </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddServiceModal;
