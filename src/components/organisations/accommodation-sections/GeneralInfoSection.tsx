'use client';

import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { ACCOMMODATION_TYPES } from '@/types/organisations/IAccommodation';

interface GeneralInfoSectionProps {
  formData: {
    Name: string;
    Synopsis?: string;
    Description?: string;
    AccommodationType: string;
    IsOpenAccess: boolean;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function GeneralInfoSection({ formData, onChange, errors }: GeneralInfoSectionProps) {
  return (
    <div className="space-y-4">
      <FormField label="Accommodation Name" required>
        <input
          type="text"
          value={formData.Name}
          onChange={(e) => onChange('GeneralInfo.Name', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Accommodation name"
        />
      </FormField>

      <FormField label="Accommodation Type" required>
        <Select
          options={ACCOMMODATION_TYPES}
          value={formData.AccommodationType}
          onChange={(e) => onChange('GeneralInfo.AccommodationType', e.target.value)}
          placeholder="Select accommodation type"
        />
      </FormField>

      <FormField label="Short Description">
        <input
          type="text"
          value={formData.Synopsis || ''}
          onChange={(e) => onChange('GeneralInfo.Synopsis', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Short description"
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={formData.Description || ''}
          onChange={(e) => onChange('GeneralInfo.Description', e.target.value)}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Detailed description of the accommodation"
        />
      </FormField>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isOpenAccess"
          checked={formData.IsOpenAccess}
          onChange={(e) => onChange('GeneralInfo.IsOpenAccess', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isOpenAccess" className="ml-2 block text-sm text-gray-700">
          Open Access (No referral required)
        </label>
      </div>
    </div>
  );
}
