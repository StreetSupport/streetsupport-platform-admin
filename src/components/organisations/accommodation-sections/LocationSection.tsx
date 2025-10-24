'use client';

import { FormField } from '@/components/ui/FormField';

interface LocationSectionProps {
  formData: {
    Street1: string;
    Street2?: string;
    Street3?: string;
    City: string;
    Postcode: string;
    AssociatedCityId: string;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  availableCities: Array<{ _id: string; Name: string; Key: string }>;
}

export function LocationSection({ formData, onChange, errors, availableCities }: LocationSectionProps) {
  return (
    <div className="space-y-4">
      <FormField label="Street" required>
        <input
          type="text"
          value={formData.Street1}
          onChange={(e) => onChange('Address.Street1', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter street address"
        />
      </FormField>

      <FormField label="Street Line 2">
        <input
          type="text"
          value={formData.Street2 || ''}
          onChange={(e) => onChange('Address.Street2', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Apartment, suite, etc. (optional)"
        />
      </FormField>

      <FormField label="Street Line 3">
        <input
          type="text"
          value={formData.Street3 || ''}
          onChange={(e) => onChange('Address.Street3', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Additional address line (optional)"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="City" required>
          <input
            type="text"
            value={formData.City}
            onChange={(e) => onChange('Address.City', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="City name"
          />
        </FormField>

        <FormField label="Postcode" required>
          <input
            type="text"
            value={formData.Postcode}
            onChange={(e) => onChange('Address.Postcode', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Postcode"
          />
        </FormField>
      </div>

      <FormField label="Associated Location" required>
        <select
          value={formData.AssociatedCityId}
          onChange={(e) => onChange('Address.AssociatedCityId', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Select a location</option>
          {availableCities.map((city) => (
            <option key={city._id} value={city.Key}>
              {city.Name}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
