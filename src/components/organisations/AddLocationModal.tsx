'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FormField } from '@/components/ui/FormField';
import { IAddressFormData, IOpeningTimeFormData } from '@/types/organisations/IOrganisation';
import { OpeningTimeFormSchema, AddressSchema } from '@/schemas/organisationSchema';
import { OpeningTimesManager } from './OpeningTimesManager';
import { errorToast } from '@/utils/toast';
import ErrorDisplay, { ValidationError } from '@/components/ui/ErrorDisplay';
import { decodeText } from '@/utils/htmlDecode';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: IAddressFormData) => void;
  editingLocation?: IAddressFormData | null;
  validationErrors?: ValidationError[];
  viewMode?: boolean; // When true, all inputs are disabled and save button hidden
}

export function AddLocationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingLocation = null,
  validationErrors: _validationErrors = [],
  viewMode = false
}: AddLocationModalProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [locationErrors, setLocationErrors] = useState<ValidationError[]>([]);
  const [currentLocation, setCurrentLocation] = useState<IAddressFormData>({
    Street: '',
    Street1: '',
    Street2: '',
    Street3: '',
    City: '',
    Postcode: '',
    Telephone: '',
    IsOpen247: false,
    IsAppointmentOnly: false,
    OpeningTimes: []
  });
  const [initialLocation, setInitialLocation] = useState<IAddressFormData | null>(null);

  // Initialize form when modal opens or editing location changes
  useEffect(() => {
    if (isOpen) {
      if (editingLocation) {
        const decodedLocation = {
          ...editingLocation,
          Street: decodeText(editingLocation.Street || ''),
          Street1: decodeText(editingLocation.Street1 || ''),
          Street2: decodeText(editingLocation.Street2 || ''),
          Street3: decodeText(editingLocation.Street3 || '')
        };
        setCurrentLocation(decodedLocation);
        setInitialLocation(JSON.parse(JSON.stringify(decodedLocation)));
      } else {
        resetForm();
        const defaultLocation = {
          Street: '',
          Street1: '',
          Street2: '',
          Street3: '',
          City: '',
          Postcode: '',
          Telephone: '',
          IsOpen247: false,
          IsAppointmentOnly: false,
          OpeningTimes: []
        };
        setInitialLocation(JSON.parse(JSON.stringify(defaultLocation)));
      }
    }
  }, [isOpen, editingLocation]);

  const resetForm = () => {
    setCurrentLocation({
      Street: '',
      Street1: '',
      Street2: '',
      Street3: '',
      City: '',
      Postcode: '',
      Telephone: '',
      IsOpen247: false,
      IsAppointmentOnly: false,
      OpeningTimes: []
    });
    setLocationErrors([]);
  };

  const generateLocationKey = (location: IAddressFormData): string => {
    const parts = [location.Street, location.City, location.Postcode].filter(part => part && part.trim());
    return parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  };

  const validateLocation = (): boolean => {
    const errors: ValidationError[] = [];
    
    // Validate using AddressSchema for comprehensive validation including Postcode format
    const addressValidation = AddressSchema.safeParse(currentLocation);
    
    if (!addressValidation.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addressValidation.error.issues.forEach((issue: any) => {
        const fieldName = issue.path[0] as string;
        // Skip Key validation errors since it's auto-generated
        if (fieldName !== 'Key') {
          errors.push({ 
            Path: fieldName,
            Message: issue.message 
          });
        }
      });
    }
    
    // Validate opening times if not 24/7 and not appointment only
    if (!currentLocation.IsOpen247 && !currentLocation.IsAppointmentOnly) {
      if (currentLocation.OpeningTimes.length === 0) {
        errors.push({ Path: 'Opening Times', Message: 'At least one opening time is required when location is not open 24/7 and not appointment only' });
      } else {
        // Validate each opening time using OpeningTimeFormSchema
        for (const openingTime of currentLocation.OpeningTimes) {
          const result = OpeningTimeFormSchema.safeParse(openingTime);
          if (!result.success) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.error.issues.forEach((issue: any) => {
              errors.push({ Path: 'Opening Times', Message: issue.message });
            });
          }
        }
      }
    }

    if (errors.length > 0) {
      setLocationErrors(errors);
      return false;
    }

    setLocationErrors([]);
    return true;
  };

  const handleSave = () => {
    if (!validateLocation()) {
      errorToast.validation();
      return;
    }

    const locationWithKey = {
      ...currentLocation,
      Key: generateLocationKey(currentLocation)
    };
    
    onSave(locationWithKey);
    onClose();
  };

  const handleCancel = () => {
    if (viewMode) {
      onClose();
      return;
    }
    
    // Check if data has changed
    if (initialLocation && JSON.stringify(currentLocation) !== JSON.stringify(initialLocation)) {
      setShowConfirmModal(true);
    } else {
      onClose();
    }
  };

  const confirmCancel = () => {
    setShowConfirmModal(false);
    resetForm();
    onClose();
  };

  const handleOpeningTimesChange = (openingTimes: IOpeningTimeFormData[]) => {
    setCurrentLocation({
      ...currentLocation,
      OpeningTimes: openingTimes
    });
    // Clear errors when opening times change to give immediate feedback
    if (locationErrors.length > 0) {
      setLocationErrors([]);
    }
  };

  const handle24x7Change = (checked: boolean) => {
    let openingTimes: IOpeningTimeFormData[] = [];
    
    if (checked) {
      // Generate 24/7 opening times for all days
      // IsOpen247 has priority - even if IsAppointmentOnly is also checked
      openingTimes = Array.from({ length: 7 }, (_, day) => ({
        Day: day,
        StartTime: '00:00',
        EndTime: '23:59'
      }));
    } else if (currentLocation.IsAppointmentOnly) {
      // Keep existing opening times when unchecking
      openingTimes = currentLocation.OpeningTimes;
    }
    
    setCurrentLocation({
      ...currentLocation,
      IsOpen247: checked,
      OpeningTimes: openingTimes
    });
  };

  const handleAppointmentOnlyChange = (checked: boolean) => {
    // IsAppointmentOnly can now coexist with opening times - don't clear them
    setCurrentLocation({
      ...currentLocation,
      IsAppointmentOnly: checked
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-q">
            <h2 className="heading-3">
              {viewMode ? 'View Location' : (editingLocation ? 'Edit Location' : 'Add New Location')}
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
              {/* Address Fields */}
              <div className="space-y-6">
                <h4 className="heading-4 border-b border-brand-q pb-3">Address Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Street" required>
                    {viewMode ? (
                      <p className="text-base text-brand-k bg-brand-q px-4 py-2 rounded-md break-words">
                        {currentLocation.Street || '-'}
                      </p>
                    ) : (
                      <Input
                        id="location-street"
                        value={currentLocation.Street}
                        onChange={(e) => setCurrentLocation({
                          ...currentLocation,
                          Street: e.target.value
                        })}
                        placeholder="Main street address"
                        autoComplete="off"
                      />
                    )}
                  </FormField>

                  <FormField label="Street Line 1">
                    {viewMode ? (
                      <p className="text-base text-brand-k bg-brand-q px-3 py-2 rounded-md break-words">
                        {currentLocation.Street1 || '-'}
                      </p>
                    ) : (
                      <Input
                        id="location-street1"
                        value={currentLocation.Street1}
                        onChange={(e) => setCurrentLocation({
                          ...currentLocation,
                          Street1: e.target.value
                        })}
                        placeholder="Building name, floor, etc."
                        autoComplete="off"
                      />
                    )}
                  </FormField>

                  <FormField label="Street Line 2">
                    {viewMode ? (
                      <p className="text-base text-brand-k bg-brand-q px-3 py-2 rounded-md break-words">
                        {currentLocation.Street2 || '-'}
                      </p>
                    ) : (
                      <Input
                        id="location-street2"
                        value={currentLocation.Street2}
                        onChange={(e) => setCurrentLocation({
                          ...currentLocation,
                          Street2: e.target.value
                        })}
                        placeholder="Additional address info"
                        autoComplete="off"
                      />
                    )}
                  </FormField>

                  <FormField label="Street Line 3">
                    {viewMode ? (
                      <p className="text-base text-brand-k bg-brand-q px-3 py-2 rounded-md break-words">
                        {currentLocation.Street3 || '-'}
                      </p>
                    ) : (
                      <Input
                        id="location-street3"
                        value={currentLocation.Street3}
                        onChange={(e) => setCurrentLocation({
                          ...currentLocation,
                          Street3: e.target.value
                        })}
                        placeholder="Additional address info"
                        autoComplete="off"
                      />
                    )}
                  </FormField>

                  <FormField label="City">
                    <Input
                      id="location-city"
                      value={currentLocation.City}
                      onChange={(e) => setCurrentLocation({
                        ...currentLocation,
                        City: e.target.value
                      })}
                      placeholder={viewMode ? '' : 'City'}
                      disabled={viewMode}
                      autoComplete="off"
                    />
                  </FormField>

                  <FormField label="Postcode" required>
                    <Input
                      id="location-postcode"
                      value={currentLocation.Postcode}
                      onChange={(e) => setCurrentLocation({
                        ...currentLocation,
                        Postcode: e.target.value
                      })}
                      placeholder={viewMode ? '' : 'Postcode'}
                      disabled={viewMode}
                      autoComplete="off"
                    />
                  </FormField>

                  <FormField label="Telephone" className="md:col-span-2">
                    <Input
                      id="location-telephone"
                      value={currentLocation.Telephone}
                      onChange={(e) => setCurrentLocation({
                        ...currentLocation,
                        Telephone: e.target.value
                      })}
                      placeholder={viewMode ? '' : 'Telephone number'}
                      type="tel"
                      disabled={viewMode}
                    />
                  </FormField>
                </div>
              </div>

              {/* Opening Times Section */}
              <div className="space-y-6">
                <h4 className="heading-4 border-b border-brand-q pb-3">Opening Times</h4>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Checkbox
                    id="isOpen247"
                    checked={currentLocation.IsOpen247}
                    onChange={(e) => handle24x7Change(e.target.checked)}
                    label="Open 24/7"
                    disabled={viewMode}
                  />
                  
                  <Checkbox
                    id="isAppointmentOnly"
                    checked={currentLocation.IsAppointmentOnly}
                    onChange={(e) => handleAppointmentOnlyChange(e.target.checked)}
                    label="Appointment Only"
                    disabled={viewMode}
                  />
                </div>

                {!currentLocation.IsOpen247 && !currentLocation.IsAppointmentOnly && (
                  <OpeningTimesManager
                    openingTimes={currentLocation.OpeningTimes}
                    onChange={handleOpeningTimesChange}
                    viewMode={viewMode}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer - fixed at bottom */}
          {!viewMode && (
            <div className="border-t border-brand-q p-4 sm:p-6">
              {/* Error Display */}
              {locationErrors.length > 0 && (
                <ErrorDisplay
                  ValidationErrors={locationErrors}
                  ClassName="mb-6"
                />
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:w-auto sm:min-w-24 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  className="w-full sm:w-auto sm:min-w-24 order-1 sm:order-2"
                >
                  {editingLocation ? 'Update Location' : 'Add Location'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCancel}
        title="Close without saving?"
        message="You may lose unsaved changes."
        confirmLabel="Close Without Saving"
        cancelLabel="Continue Editing"
        variant="warning"
      />
    </>
  );
}
