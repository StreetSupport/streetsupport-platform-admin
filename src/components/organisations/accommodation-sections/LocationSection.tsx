'use client';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { IAccommodationFormData } from '@/types';

interface LocationSectionProps {
  formData: IAccommodationFormData['Address'];
  onChange: (field: string, value: string | boolean | number) => void;
  availableCities: Array<{ _id: string; Name: string; Key: string }>;
  viewMode?: boolean;
}

export function LocationSection({ formData, onChange, availableCities, viewMode = false }: LocationSectionProps) {
  return (
    <div className="space-y-4">
      <FormField label="Street" required>
        {viewMode ? (
          <p className="text-base text-brand-k bg-brand-q px-3 py-2 rounded-md break-words">
            {formData.Street1 || '-'}
          </p>
        ) : (
          <Input
            type="text"
            id="street1"
            value={formData.Street1}
            onChange={(e) => onChange('Address.Street1', e.target.value)}
            placeholder="Enter street address"
          />
        )}
      </FormField>

      <FormField label="Street Line 2">
        {viewMode ? (
          <p className="text-base text-brand-k bg-brand-q px-3 py-2 rounded-md break-words">
            {formData.Street2 || '-'}
          </p>
        ) : (
          <Input
            type="text"
            id="street2"
            value={formData.Street2 || ''}
            onChange={(e) => onChange('Address.Street2', e.target.value)}
            placeholder="Apartment, suite, etc. (optional)"
          />
        )}
      </FormField>

      <FormField label="Street Line 3">
        {viewMode ? (
          <p className="text-base text-brand-k bg-brand-q px-3 py-2 rounded-md break-words">
            {formData.Street3 || '-'}
          </p>
        ) : (
          <Input
            type="text"
            id="street3"
            value={formData.Street3 || ''}
            onChange={(e) => onChange('Address.Street3', e.target.value)}
            placeholder="Additional address line (optional)"
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="City" required>
          <Input
            type="text"
            id="city"
            value={formData.City}
            onChange={(e) => onChange('Address.City', e.target.value)}
            placeholder={viewMode ? '' : 'City name'}
            disabled={viewMode}
          />
        </FormField>

        <FormField label="Postcode" required>
          <Input
            type="text"
            id="postcode"
            value={formData.Postcode}
            onChange={(e) => onChange('Address.Postcode', e.target.value)}
            placeholder={viewMode ? '' : 'Postcode'}
            disabled={viewMode}
          />
        </FormField>
      </div>

      <FormField label="Associated Location" required>
        <select
          id="associated-location"
          name="associatedLocation"
          value={formData.AssociatedCityId}
          onChange={(e) => onChange('Address.AssociatedCityId', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          disabled={viewMode}
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
