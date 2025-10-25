'use client';

import { useState } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IAddressFormData } from '@/types/organisations/IOrganisation';
import { ValidationError } from '@/components/ui/ErrorDisplay';
import { AddLocationModal } from './AddLocationModal';

interface LocationManagerProps {
  locations: IAddressFormData[];
  onChange: (locations: IAddressFormData[]) => void;
  validationErrors?: ValidationError[];
  viewMode?: boolean; // When true, hide add/edit/delete actions
}

export function LocationManager({ locations, onChange, validationErrors = [], viewMode = false }: LocationManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLocation, setEditingLocation] = useState<IAddressFormData | null>(null);

  const handleAddLocation = () => {
    setEditingLocation(null);
    setEditingIndex(null);
    setShowModal(true);
  };

  const handleSaveLocation = (location: IAddressFormData) => {
    if (editingIndex !== null) {
      const updated = [...locations];
      updated[editingIndex] = location;
      onChange(updated);
    } else {
      onChange([...locations, location]);
    }
    
    setEditingIndex(null);
    setEditingLocation(null);
  };

  const handleEdit = (index: number) => {
    setEditingLocation({ ...locations[index] });
    setEditingIndex(index);
    setShowModal(true);
  };

  const handleView = (index: number) => {
    setEditingLocation({ ...locations[index] });
    setEditingIndex(index);
    setShowModal(true);
  };

  const handleRemove = (index: number) => {
    const updated = locations.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIndex(null);
    setEditingLocation(null);
  };

  const formatLocationDisplay = (location: IAddressFormData): string => {
    const parts = [
      location.Street,
      location.Street1,
      location.Street2,
      location.Street3,
      location.City,
      location.Postcode
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-brand-q pb-3">
        <h4 className="heading-4">Locations</h4>
        {!viewMode && (
          <Button
            type="button"
            variant="primary"
            onClick={handleAddLocation}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </Button>
        )}
      </div>

      {/* Locations List */}
      {locations.length > 0 && (
        <div className="space-y-3">
          <h5 className="heading-5">Added Locations:</h5>
          {locations.map((location, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-brand-q rounded-lg border"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-k">
                  {formatLocationDisplay(location)}
                </p>
                {location.Telephone && (
                  <p className="text-xs text-brand-f mt-1">
                    Tel: {location.Telephone}
                  </p>
                )}
                <div className="flex gap-4 mt-2">
                  {location.IsOpen247 && (
                    <span className="text-xs bg-brand-b text-white px-2 py-1 rounded">
                      24/7
                    </span>
                  )}
                  {location.IsAppointmentOnly && (
                    <span className="text-xs bg-brand-j text-brand-k px-2 py-1 rounded">
                      Appointment Only
                    </span>
                  )}
                  {!location.IsOpen247 && !location.IsAppointmentOnly && location.OpeningTimes.length > 0 && (
                    <span className="text-xs bg-brand-a text-white px-2 py-1 rounded">
                      {location.OpeningTimes.length} Opening Times
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
                    onClick={() => handleView(index)}
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
                      onClick={() => handleEdit(index)}
                      className="p-2"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(index)}
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

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveLocation}
        editingLocation={editingLocation}
        validationErrors={validationErrors}
        viewMode={viewMode}
      />

      {locations.length === 0 && (
        <div className="text-center py-8 text-brand-f border-2 border-dashed border-brand-q rounded-lg">
          <p className="text-sm">No locations added yet</p>
          <p className="text-xs mt-1">Click "Add Location" to get started</p>
        </div>
      )}
    </div>
  );
}
