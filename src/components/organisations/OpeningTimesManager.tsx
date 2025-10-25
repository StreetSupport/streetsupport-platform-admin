'use client';

import { useState } from 'react';
import { Plus, Trash, Edit, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { IOpeningTimeFormData, DAYS_OF_WEEK } from '@/types/organisations/IOrganisation';
import { ValidationError } from '@/components/ui/ErrorDisplay';

interface OpeningTimesManagerProps {
  openingTimes: IOpeningTimeFormData[];
  onChange: (openingTimes: IOpeningTimeFormData[]) => void;
  validationErrors?: ValidationError[];
  viewMode?: boolean; // When true, hide add/edit/delete actions
}

export function OpeningTimesManager({ openingTimes, onChange, validationErrors = [], viewMode = false }: OpeningTimesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<IOpeningTimeFormData>({
    Day: 1, // Monday
    StartTime: '09:00',
    EndTime: '17:00'
  });

  const handleAdd = () => {
    if (editingIndex !== null) {
      // Update existing opening time
      const updated = [...openingTimes];
      updated[editingIndex] = { ...formData };
      onChange(updated);
      setEditingIndex(null);
    } else {
      // Add new opening time
      onChange([...openingTimes, { ...formData }]);
    }
    
    // Reset form
    setFormData({
      Day: 1,
      StartTime: '09:00',
      EndTime: '17:00'
    });
    setShowForm(false);
  };

  const handleRemove = (index: number) => {
    const updated = openingTimes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleEdit = (index: number) => {
    setFormData({ ...openingTimes[index] });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDuplicate = (index: number) => {
    const itemToDuplicate = openingTimes[index];
    onChange([...openingTimes, { ...itemToDuplicate }]);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIndex(null);
    setFormData({
      Day: 1,
      StartTime: '09:00',
      EndTime: '17:00'
    });
  };

  const getDayLabel = (dayNumber: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayNumber)?.label || 'Unknown';
  };

  const formatTime = (time: string) => {
    // Convert 24-hour format (HH:MM) to 12-hour format with AM/PM
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-4">
      {!viewMode && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Opening Time
          </Button>
        </div>
      )}

      {/* Opening Times List */}
      {openingTimes.length > 0 && (
        <div className="space-y-2">
          {openingTimes.map((time, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-brand-q rounded-lg border"
            >
              <div className="flex-1">
                <span className="text-sm font-medium text-brand-k">
                  {getDayLabel(time.Day)}
                </span>
                <span className="text-sm text-brand-f ml-2">
                  {formatTime(time.StartTime)} - {formatTime(time.EndTime)}
                </span>
              </div>
              {!viewMode && (
                <div className="flex items-center gap-2">
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
                    onClick={() => handleDuplicate(index)}
                    className="p-2"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="p-2 text-brand-g border-brand-g hover:bg-brand-g hover:text-white"
                    title="Remove"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Opening Time Form */}
      {showForm && (
        <div className="p-4 bg-brand-i rounded-lg border border-brand-a">
          <h5 className="heading-6 mb-4">
            {editingIndex !== null ? 'Edit Opening Time' : 'Add Opening Time'}
          </h5>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-k mb-2">
                Day of Week
              </label>
              <Select
                value={formData.Day.toString()}
                onChange={(e) => setFormData({
                  ...formData,
                  Day: parseInt(e.target.value)
                })}
                options={DAYS_OF_WEEK.map(day => ({
                  value: day.value.toString(),
                  label: day.label
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-k mb-2">
                Opening Time
              </label>
              <Input
                type="time"
                value={formData.StartTime}
                onChange={(e) => setFormData({
                  ...formData,
                  StartTime: e.target.value
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-k mb-2">
                Closing Time
              </label>
              <Input
                type="time"
                value={formData.EndTime}
                onChange={(e) => setFormData({
                  ...formData,
                  EndTime: e.target.value
                })}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAdd}
              className="flex-1"
            >
              {editingIndex !== null ? 'Update Opening Time' : 'Add Opening Time'}
            </Button>
          </div>
        </div>
      )}

      {openingTimes.length === 0 && !showForm && (
        <div className="text-center py-8 text-brand-f">
          <p className="text-sm">No opening times added yet</p>
          <p className="text-xs mt-1">Click "Add Opening Time" to get started</p>
        </div>
      )}
    </div>
  );
}
