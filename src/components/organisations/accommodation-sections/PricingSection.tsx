'use client';

import { FormField } from '@/components/ui/FormField';
import { IAccommodationFormData, DISCRETIONARY_OPTIONS } from '@/types/organisations/IAccommodation';

interface PricingSectionProps {
  formData: IAccommodationFormData['PricingAndRequirementsInfo'];
  onChange: (field: string, value: string | boolean | number) => void;
  errors: Record<string, string>;
  viewMode?: boolean;
}

export function PricingSection({ formData, onChange, errors, viewMode = false }: PricingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="referralRequired"
          checked={formData.ReferralIsRequired}
          onChange={(e) => onChange('PricingAndRequirementsInfo.ReferralIsRequired', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={viewMode}
        />
        <label htmlFor="referralRequired" className="ml-2 block text-sm text-gray-700">
          Referral Required
        </label>
      </div>

      {formData.ReferralIsRequired && (
        <div className="space-y-2">
          <p className="text-sm text-brand-f">
            Please describe how someone gets a referral – e.g. &quot;ask your key worker&quot; or &quot;speak to the council&apos;s housing team&quot;
          </p>
          <FormField label="Referral Notes" error={errors['PricingAndRequirementsInfo.ReferralNotes']}>
            <textarea
              id="referral-notes"
              value={formData.ReferralNotes || ''}
              onChange={(e) => onChange('PricingAndRequirementsInfo.ReferralNotes', e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder={viewMode ? '' : 'Provide details about referral requirements'}
              disabled={viewMode}
            />
          </FormField>
        </div>
      )}

      <FormField label="Price (£ p/w)" required>
        <input
          type="number"
          id="price"
          value={formData.Price}
          onChange={(e) => onChange('PricingAndRequirementsInfo.Price', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Food Included">
        <select
          id="food-included"
          value={formData.FoodIsIncluded}
          onChange={(e) => onChange('PricingAndRequirementsInfo.FoodIsIncluded', parseInt(e.target.value))}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          disabled={viewMode}
        >
          {DISCRETIONARY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Availability of Meals">
        <textarea
          id="availability-meals"
          value={formData.AvailabilityOfMeals || ''}
          onChange={(e) => onChange('PricingAndRequirementsInfo.AvailabilityOfMeals', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={viewMode ? '' : 'Describe meal availability'}
          disabled={viewMode}
        />
      </FormField>
    </div>
  );
}
