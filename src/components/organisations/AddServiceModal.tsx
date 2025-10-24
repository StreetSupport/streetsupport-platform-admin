'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { OpeningTimesManager } from '@/components/organisations/OpeningTimesManager';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import ErrorDisplay, { ValidationError } from '@/components/ui/ErrorDisplay';
import { IOrganisation } from '@/types/organisations/IOrganisation';
import { IGroupedService } from '@/types/organisations/IGroupedService';
import { IServiceCategory } from '@/types/organisations/IServiceCategory';
import { IOpeningTimeFormData } from '@/types/organisations/IOrganisation';
import { IGroupedServiceFormData, validateGroupedService, OpeningTimeFormSchema, transformErrorPath } from '@/schemas/groupedServiceSchema';
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
    ProviderName: organisation.Name,
    IsPublished: true,
    CategoryId: '',
    Location: {
      IsOutreachLocation: false,
      Description: '',
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
  const [showCancelConfirm, setShowConfirmModal] = useState(false);
  const [originalData, setOriginalData] = useState<IGroupedServiceFormData | null>(null);

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

      const initialData: IGroupedServiceFormData = {
        _id: service._id,
        ProviderId: service.ProviderId,
        ProviderName: service.ProviderName || organisation.Name,
        IsPublished: service.IsPublished,
        CategoryId: service.CategoryId,
        CategoryName: decodeText(service.CategoryName || ''),
        CategorySynopsis: decodeText(service.CategorySynopsis || ''),
        Info: decodeText(service.Info || ''),
        Tags: service.Tags,
        Location: {
          IsOutreachLocation: service.Location.IsOutreachLocation || false,
          Description: decodeText(service.Location.Description || ''),
          StreetLine1: decodeText(service.Location.StreetLine1 || ''),
          StreetLine2: service.Location.StreetLine2 || '',
          StreetLine3: service.Location.StreetLine3 || '',
          StreetLine4: service.Location.StreetLine4 || '',
          City: service.Location.City || '',
          Postcode: service.Location.Postcode || '',
          Location: service.Location.Location ? {
            type: service.Location.Location.type,
            coordinates: service.Location.Location.coordinates
          } : undefined
        },
        IsOpen247: service.IsOpen247,
        OpeningTimes: openingTimes,
        SubCategories: service.SubCategories?.map(sub => ({
          ...sub,
          Name: sub.Name || '',
          Synopsis: sub.Synopsis || ''
        })) || [],
        SubCategoryIds: service.SubCategoryIds || [],
        IsTelephoneService: service.IsTelephoneService,
        IsAppointmentOnly: service.IsAppointmentOnly,
        Telephone: service.Telephone || ''
      };
      setFormData(initialData);
      setOriginalData(JSON.parse(JSON.stringify(initialData)));
    } else {
      // Reset form for new service
      const initialData: IGroupedServiceFormData = {
        ProviderId: organisation.Key,
        ProviderName: organisation.Name,
        IsPublished: organisation.IsPublished,
        CategoryId: '',
        Location: {
          IsOutreachLocation: false,
          Description: '',
          StreetLine1: '',
          Postcode: ''
        },
        IsOpen247: false,
        SubCategories: [],
        SubCategoryIds: [],
        IsTelephoneService: false,
        IsAppointmentOnly: false,
        Telephone: ''
      };
      setFormData(initialData);
      setOriginalData(JSON.parse(JSON.stringify(initialData)));
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

  const handleIsOpen247Change = (checked: boolean) => {
    let openingTimes: IOpeningTimeFormData[] = [];
    
    if (checked) {
      // Generate 24/7 opening times for all days (Sunday=0 to Saturday=6)
      // IsOpen247 has priority - even if IsAppointmentOnly is also checked
      openingTimes = Array.from({ length: 7 }, (_, day) => ({
        Day: day,
        StartTime: '00:00',
        EndTime: '23:59'
      }));
    } else if (formData.IsAppointmentOnly) {
      // If unchecking IsOpen247 but IsAppointmentOnly is still checked, keep empty array
      openingTimes = [];
    }
    
    setFormData(prev => ({
      ...prev,
      IsOpen247: checked,
      OpeningTimes: openingTimes
    }));
    // Clear validation errors
    setValidationErrors(prev => prev.filter(error => !error.Path.startsWith('Opening Times')));
  };

  const handleIsAppointmentOnlyChange = (checked: boolean) => {
    let openingTimes: IOpeningTimeFormData[];
    
    if (formData.IsOpen247) {
      // IsOpen247 has priority - keep 7 opening times even if IsAppointmentOnly is checked
      openingTimes = Array.from({ length: 7 }, (_, day) => ({
        Day: day,
        StartTime: '00:00',
        EndTime: '23:59'
      }));
    } else if (checked) {
      // Only clear opening times if IsOpen247 is not checked
      openingTimes = [];
    } else {
      // Keep existing opening times when unchecking
      openingTimes = formData.OpeningTimes || [];
    }
    
    setFormData(prev => ({
      ...prev,
      IsAppointmentOnly: checked,
      OpeningTimes: openingTimes
    }));
    // Clear validation errors
    setValidationErrors(prev => prev.filter(error => !error.Path.startsWith('Opening Times')));
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    if (category) {
      setFormData(prev => ({
        ...prev,
        CategoryId: categoryId,
        CategoryName: category.Name,
        CategorySynopsis: category.Synopsis,
        SubCategories: [],
        SubCategoryIds: []
      }));
      // Clear validation errors
      setValidationErrors(prev => prev.filter(error => 
        !error.Path.startsWith('Category') && !error.Path.startsWith('Sub Categories')
      ));
    }
  };

  const handleSubCategoriesChange = (selectedIds: string[]) => {
    if (!selectedCategory) return;

    const selectedSubCategories = selectedCategory.SubCategories.filter(sub => 
      selectedIds.includes(sub.Key)
    ).map(sub => ({
      _id: sub.Key,
      Name: sub.Name,
      Synopsis: sub.Synopsis
    }));

    setFormData(prev => ({
      ...prev,
      SubCategories: selectedSubCategories,
      SubCategoryIds: selectedIds
    }));

    // Clear validation errors for subcategories
    setValidationErrors(prev => prev.filter(error => !error.Path.startsWith('Sub Categories')));
  };

  const handleIsOutreachLocationChange = (isOutreach: boolean) => {
    setFormData(prev => ({
      ...prev,
      Location: {
        ...prev.Location,
        IsOutreachLocation: isOutreach,
        // Clear fields based on type
        Description: isOutreach ? prev.Location.Description : '',
        StreetLine1: isOutreach ? '' : prev.Location.StreetLine1,
        StreetLine2: isOutreach ? '' : prev.Location.StreetLine2,
        StreetLine3: isOutreach ? '' : prev.Location.StreetLine3,
        StreetLine4: isOutreach ? '' : prev.Location.StreetLine4,
        City: isOutreach ? '' : prev.Location.City,
        Postcode: isOutreach ? '' : prev.Location.Postcode,
        Location: isOutreach ? undefined : prev.Location.Location
      },
      // Clear opening times when switching to outreach or fixed location
      IsOpen247: false,
      IsAppointmentOnly: false,
      OpeningTimes: []
    }));
  };

  const handleAddressSelect = (addressIndex: string) => {
    if (addressIndex === '') {
      // Clear address fields
      setFormData(prev => ({
        ...prev,
        Location: {
          ...prev.Location,
          StreetLine1: '',
          StreetLine2: '',
          StreetLine3: '',
          StreetLine4: '',
          City: '',
          Postcode: '',
          Location: undefined
        },
        IsOpen247: false,
        IsAppointmentOnly: false,
        OpeningTimes: []
      }));
      return;
    }

    const index = parseInt(addressIndex);
    const address = organisation.Addresses[index];
    if (address) {
      // Auto-populate location fields AND opening times from selected address
      const openingTimes = address.OpeningTimes?.map(ot => ({
        Day: ot.Day,
        StartTime: typeof ot.StartTime === 'number' ? 
          `${Math.floor(ot.StartTime / 100).toString().padStart(2, '0')}:${(ot.StartTime % 100).toString().padStart(2, '0')}` : 
          String(ot.StartTime),
        EndTime: typeof ot.EndTime === 'number' ? 
          `${Math.floor(ot.EndTime / 100).toString().padStart(2, '0')}:${(ot.EndTime % 100).toString().padStart(2, '0')}` : 
          String(ot.EndTime)
      })) || [];

      setFormData(prev => ({
        ...prev,
        Location: {
          ...prev.Location,
          StreetLine1: address.Street || '',
          StreetLine2: address.Street1 || '',
          StreetLine3: address.Street2 || '',
          StreetLine4: address.Street3 || '',
          City: address.City || '',
          Postcode: address.Postcode || '',
          Location: address.Location ? {
            type: address.Location.type,
            coordinates: address.Location.coordinates
          } : undefined
        },
        IsOpen247: address.IsOpen247 || false,
        IsAppointmentOnly: address.IsAppointmentOnly || false,
        OpeningTimes: openingTimes
      }));
    }
  };

  const handleOpeningTimesChange = (openingTimes: IOpeningTimeFormData[]) => {
    updateFormData('OpeningTimes', openingTimes);
  };

  // Helper function to convert time string (HH:MM) to number (HHMM)
  const timeStringToNumber = (timeString: string): number => {
    return parseInt(timeString.replace(':', ''));
  };

  const validateForm = (): boolean => {

    // Then validate the rest using GroupedServiceSchema
    const result = validateGroupedService(formData);
    
    // Combine all errors
    const allErrors = [];
    if (!result.success) {
      const serviceErrors = (result.errors || []).map((error: any) => {
        const originalPath = Array.isArray(error.path) ? error.path.join('.') : error.path;
        return {
          Path: transformErrorPath(originalPath),
          Message: error.message
        };
      });
      allErrors.push(...serviceErrors);
    }
    
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
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
          StartTime: timeStringToNumber(ot.StartTime),
          EndTime: timeStringToNumber(ot.EndTime)
        }))
      };

      const url = service 
        ? `/api/organisations/${service.ProviderId}/services/${service._id}`
        : `/api/organisations/${submissionData.ProviderId}/services`;
      
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
      onClose(); // Close the modal
      onServiceSaved(); // Trigger parent refresh
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${service ? 'update' : 'create'} service`;
      errorToast.generic(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCancel = () => {
    setValidationErrors([]);
    setShowConfirmModal(false);
    if (originalData) {
      setFormData(JSON.parse(JSON.stringify(originalData)));
    }
    onClose();
  };

  if (!isOpen) return null;

  const isOutreachLocation = formData.Location.IsOutreachLocation === true;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <h3 className="heading-3 text-brand-k">
              {service ? 'Edit Service' : 'Add Service'}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              className="p-2"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content - scrollable */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Category Selection */}
                <div>
                  <h4 className="heading-4 pb-2 border-b border-brand-q mb-4">Category</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Service Category <span className="text-brand-g">*</span>
                      </label>
                      <select
                        value={formData.CategoryId}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white"
                      >
                        <option value="" className="text-brand-k">Select a category...</option>
                        {categories.map(category => (
                          <option key={category._id} value={category._id} className="text-brand-k">
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
                            value: sub.Key,
                            label: sub.Name
                          }))}
                          value={formData.SubCategoryIds || []}
                          onChange={handleSubCategoriesChange}
                          placeholder="Select subcategories..."
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Details */}
                <div>
                  <h4 className="heading-4 pb-2 border-b border-brand-q mb-4">Service Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Description
                      </label>
                      <Textarea
                        value={formData.Info || ''}
                        onChange={(e) => updateFormData('Info', e.target.value)}
                        placeholder="Service description"
                        rows={4}
                      />
                    </div>

                    <Checkbox
                      id="isTelephoneService"
                      checked={formData.IsTelephoneService || false}
                      onChange={(e) => updateFormData('IsTelephoneService', e.target.checked)}
                      label="Is Telephone Service"
                    />

                    <div>
                      <label className="block text-sm font-medium text-brand-k mb-2">
                        Telephone
                      </label>
                      <Input
                        value={formData.Telephone || ''}
                        onChange={(e) => updateFormData('Telephone', e.target.value)}
                        placeholder="Telephone number"
                        type="tel"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="heading-4 pb-2 border-b border-brand-q mb-4">Location</h4>
                  <div className="space-y-4">
                    <p className="text-sm text-brand-f">
                      Enter a location for this service, either by selecting an existing address, or entering new details. 
                      For outreach services with no fixed address, check the box below and enter a description.
                    </p>

                    {/* Is Outreach Location Checkbox */}
                    <Checkbox
                      id="isOutreachLocation"
                      checked={isOutreachLocation}
                      onChange={(e) => handleIsOutreachLocationChange(e.target.checked)}
                      label="Is Outreach Location (no fixed address)"
                    />

                    {/* Outreach Description - shown only if IsOutreachLocation is true */}
                    {isOutreachLocation && (
                      <div>
                        <label className="block text-sm font-medium text-brand-k mb-2">
                          Outreach Location Description <span className="text-brand-g">*</span>
                        </label>
                        <Textarea
                          value={formData.Location.Description || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            Location: {
                              ...prev.Location,
                              Description: e.target.value
                            }
                          }))}
                          rows={4}
                        />
                      </div>
                    )}

                    {/* Fixed Location Fields - shown only if IsOutreachLocation is false */}
                    {!isOutreachLocation && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-brand-k mb-2">
                            Use Existing Address
                          </label>
                          <select
                            onChange={(e) => handleAddressSelect(e.target.value)}
                            className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white"
                          >
                            <option value="" className="text-brand-k">Select an existing address...</option>
                            {organisation.Addresses.map((address, index) => (
                              <option key={index} value={index.toString()} className="text-brand-k">
                                {address.Street} - {address.Postcode}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-brand-f mt-1">
                            Selecting an existing address will auto-populate the fields below including opening times
                          </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-brand-k mb-2">
                              Street <span className="text-brand-g">*</span>
                            </label>
                            <Input
                              type="text"
                              value={formData.Location.StreetLine1 || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                Location: {
                                  ...prev.Location,
                                  StreetLine1: e.target.value
                                }
                              }))}
                              placeholder="Main street address"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-brand-k mb-2">
                              Street Line 2
                            </label>
                            <Input
                              type="text"
                              value={formData.Location.StreetLine2 || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                Location: {
                                  ...prev.Location,
                                  StreetLine2: e.target.value
                                }
                              }))}
                              placeholder="Building name, floor, etc."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-brand-k mb-2">
                              Street Line 3
                            </label>
                            <Input
                              type="text"
                              value={formData.Location.StreetLine3 || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                Location: {
                                  ...prev.Location,
                                  StreetLine3: e.target.value
                                }
                              }))}
                              placeholder="Additional address info"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-brand-k mb-2">
                              Street Line 4
                            </label>
                            <Input
                              type="text"
                              value={formData.Location.StreetLine4 || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                Location: {
                                  ...prev.Location,
                                  StreetLine4: e.target.value
                                }
                              }))}
                              placeholder="Additional address info"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-brand-k mb-2">
                              City
                            </label>
                            <Input
                              type="text"
                              value={formData.Location.City || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                Location: {
                                  ...prev.Location,
                                  City: e.target.value
                                }
                              }))}
                              placeholder="City"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-brand-k mb-2">
                              Postcode <span className="text-brand-g">*</span>
                            </label>
                            <Input
                              type="text"
                              value={formData.Location.Postcode || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                Location: {
                                  ...prev.Location,
                                  Postcode: e.target.value
                                }
                              }))}
                              placeholder="M1 1AA"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Opening Times - shown only for fixed locations */}
                {!isOutreachLocation && (
                  <div>
                    <h4 className="heading-4 pb-2 border-b border-brand-q mb-4">Opening Times</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Checkbox
                          id="isOpen247"
                          checked={formData.IsOpen247}
                          onChange={(e) => handleIsOpen247Change(e.target.checked)}
                          label="Open 24/7"
                        />
                        <Checkbox
                          id="isAppointmentOnly"
                          checked={formData.IsAppointmentOnly || false}
                          onChange={(e) => handleIsAppointmentOnlyChange(e.target.checked)}
                          label="Appointment Only"
                        />
                      </div>

                      {!formData.IsOpen247 && !formData.IsAppointmentOnly && (
                        <OpeningTimesManager
                          openingTimes={formData.OpeningTimes || []}
                          onChange={handleOpeningTimesChange}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {validationErrors.length > 0 && (
              <div className="px-4 sm:px-6 pb-4">
                <ErrorDisplay
                  ValidationErrors={validationErrors}
                  ClassName="mb-0"
                />
              </div>
            )}

            {/* Footer - fixed at bottom */}
            <div className="border-t border-brand-q p-4 sm:p-6">
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmModal(true)}
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmCancel}
        title="Close without saving?"
        message="You may lose unsaved changes."
        confirmLabel="Close Without Saving"
        cancelLabel="Continue Editing"
        variant="warning"
      />
    </>
  );
};

export default AddServiceModal;
