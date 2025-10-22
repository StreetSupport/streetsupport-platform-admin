'use client';

import { useState } from 'react';
import { Plus, Trash, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { IOpeningTimeFormData, DAYS_OF_WEEK } from '@/types/organisations/IOrganisation';
import { ValidationError } from '@/components/ui/ErrorDisplay';

interface OpeningTimesManagerProps {
  openingTimes: IOpeningTimeFormData[];
  onChange: (openingTimes: IOpeningTimeFormData[]) => void;
  validationErrors?: ValidationError[];
}

export function OpeningTimesManager({ openingTimes, onChange, validationErrors = [] }: OpeningTimesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newOpeningTime, setNewOpeningTime] = useState<IOpeningTimeFormData>({
    Day: 1, // Monday
    StartTime: '09:00',
    EndTime: '17:00'
  });

  const handleAdd = () => {
    onChange([...openingTimes, { ...newOpeningTime }]);
    setNewOpeningTime({
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

  const handleDuplicate = (index: number) => {
    const itemToDuplicate = openingTimes[index];
    onChange([...openingTimes, { ...itemToDuplicate }]);
  };

  const getDayLabel = (dayNumber: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayNumber)?.label || 'Unknown';
  };

  const formatTime = (time: string) => {
    return time;
  };

  return (
    <div className="space-y-4">
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
              <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      )}

      {/* Add Opening Time Form */}
      {showForm && (
        <div className="p-4 bg-brand-i rounded-lg border border-brand-a">
          <h5 className="heading-6 mb-4">Add Opening Time</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-k mb-2">
                Day of Week
              </label>
              <Select
                value={newOpeningTime.Day.toString()}
                onChange={(e) => setNewOpeningTime({
                  ...newOpeningTime,
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
                value={newOpeningTime.StartTime}
                onChange={(e) => setNewOpeningTime({
                  ...newOpeningTime,
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
                value={newOpeningTime.EndTime}
                onChange={(e) => setNewOpeningTime({
                  ...newOpeningTime,
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
              onClick={() => setShowForm(false)}
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
              Add Opening Time
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
