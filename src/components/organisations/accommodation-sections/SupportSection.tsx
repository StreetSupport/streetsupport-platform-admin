'use client';

import { FormField } from '@/components/ui/FormField';
import { IAccommodationFormData, SUPPORT_OFFERED_OPTIONS, SupportOfferedType } from '@/types/organisations/IAccommodation';

interface SupportSectionProps {
  formData?: IAccommodationFormData['SupportProvidedInfo'] | null;
  onChange: (field: string, value: string | boolean | number | string[]) => void;
  viewMode?: boolean;
}

export function SupportSection({ formData, onChange, viewMode = false }: SupportSectionProps) {
  const safeFormData = (formData ?? {}) as IAccommodationFormData['SupportProvidedInfo'];

  const handleSupportToggle = (supportValue: SupportOfferedType) => {
    const currentSupport = safeFormData.SupportOffered || [];
    const newSupport = currentSupport.includes(supportValue)
      ? currentSupport.filter(s => s !== supportValue)
      : [...currentSupport, supportValue];
    onChange('SupportOffered', newSupport);
    onChange('SupportProvidedInfo.SupportOffered', newSupport);
  };

  return (
    <div className="space-y-4">
      <FormField label="Support Offered">
        <div className="space-y-2 bg-gray-50 p-4 rounded-md">
          {SUPPORT_OFFERED_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center">
              <input
                type="checkbox"
                id={`support-${option.value}`}
                checked={safeFormData.SupportOffered?.includes(option.value) || false}
                onChange={() => handleSupportToggle(option.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={viewMode}
              />
              <label htmlFor={`support-${option.value}`} className="ml-2 block text-sm text-gray-700">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </FormField>

      <FormField label="Support Information">
        <textarea
          id="support-info"
          value={safeFormData.SupportInfo || ''}
          onChange={(e) => onChange('SupportProvidedInfo.SupportInfo', e.target.value)}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={viewMode ? '' : 'Provide details about support services available'}
          disabled={viewMode}
        />
      </FormField>
    </div>
  );
}
