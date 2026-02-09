'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { IOpeningTimeFormData, DAYS_OF_WEEK } from '@/types/organisations/IOrganisation';

interface OpeningTimesManagerProps {
  openingTimes: IOpeningTimeFormData[];
  onChange: (openingTimes: IOpeningTimeFormData[]) => void;
  viewMode?: boolean;
}

export function OpeningTimesManager({ openingTimes, onChange, viewMode = false }: OpeningTimesManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<IOpeningTimeFormData>({
    Day: 1,
    StartTime: '09:00',
    EndTime: '17:00'
  });
  const [addFormData, setAddFormData] = useState<IOpeningTimeFormData>({
    Day: 1,
    StartTime: '09:00',
    EndTime: '17:00'
  });
  const addFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showAddForm]);

  const handleAddNew = () => {
    onChange([...openingTimes, { ...addFormData }]);
    setAddFormData({
      Day: 1,
      StartTime: '09:00',
      EndTime: '17:00'
    });
    setShowAddForm(false);
  };

  const handleRemove = (index: number) => {
    const updated = openingTimes.filter((_, i) => i !== index);
    onChange(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditFormData({ ...openingTimes[index] });
    setEditingIndex(index);
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...openingTimes];
    updated[editingIndex] = { ...editFormData };
    onChange(updated);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleDuplicate = (index: number) => {
    const itemToDuplicate = openingTimes[index];
    onChange([...openingTimes, { ...itemToDuplicate }]);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddFormData({
      Day: 1,
      StartTime: '09:00',
      EndTime: '17:00'
    });
  };

  const getDayLabel = (dayNumber: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayNumber)?.label || 'Unknown';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const renderEditableRow = (formData: IOpeningTimeFormData, setFormData: (data: IOpeningTimeFormData) => void, onSave: () => void, onCancel: () => void, saveLabel: string) => (
    <div className="p-3 bg-brand-i rounded-lg border border-brand-a">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
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
        <div className="flex gap-2 flex-1">
          <Input
            type="time"
            value={formData.StartTime}
            onChange={(e) => setFormData({
              ...formData,
              StartTime: e.target.value
            })}
            className="flex-1"
          />
          <span className="self-center text-brand-f">to</span>
          <Input
            type="time"
            value={formData.EndTime}
            onChange={(e) => setFormData({
              ...formData,
              EndTime: e.target.value
            })}
            className="flex-1"
          />
        </div>
        <div className="flex gap-2 sm:self-center">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onSave}
            className="flex items-center gap-1"
            title={saveLabel}
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">{saveLabel}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-1"
            title="Cancel"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {!viewMode && editingIndex === null && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowAddForm(true);
            setEditingIndex(null);
          }}
          className="flex items-center gap-2 mb-2"
          disabled={showAddForm}
        >
          <Plus className="w-4 h-4" />
          Add Opening Time
        </Button>
      )}

      {/* Opening Times List */}
      {openingTimes.length > 0 && (
        <div className="space-y-2">
          {openingTimes.map((time, index) => (
            editingIndex === index ? (
              <div key={index}>
                {renderEditableRow(
                  editFormData,
                  setEditFormData,
                  handleSaveEdit,
                  handleCancelEdit,
                  'Save'
                )}
              </div>
            ) : (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-brand-q rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-brand-k">
                    {getDayLabel(time.Day)}
                  </span>
                  <span className="text-sm text-brand-f ml-2">
                    {formatTime(time.StartTime)} - {formatTime(time.EndTime)}
                  </span>
                </div>
                {!viewMode && editingIndex === null && (
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(index)}
                      className="p-2"
                      title="Edit"
                    >
                      Edit
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
            )
          ))}
        </div>
      )}

      {/* Add New Opening Time Form */}
      {showAddForm && editingIndex === null && (
        <div ref={addFormRef}>
          {renderEditableRow(
            addFormData,
            setAddFormData,
            handleAddNew,
            handleCancelAdd,
            'Add'
          )}
        </div>
      )}

      {openingTimes.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-brand-f">
          <p className="text-sm">No opening times added yet</p>
          <p className="text-xs mt-1">Click &quot;Add Opening Time&quot; to get started</p>
        </div>
      )}
    </div>
  );
}
