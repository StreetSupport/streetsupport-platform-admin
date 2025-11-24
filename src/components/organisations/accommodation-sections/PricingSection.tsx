'use client';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
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
      <Checkbox
        id="referralRequired"
        checked={formData.ReferralIsRequired}
        onChange={(e) => onChange('PricingAndRequirementsInfo.ReferralIsRequired', e.target.checked)}
        disabled={viewMode}
        label="Referral Required"
      />

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
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-transparent sm:text-sm"
              placeholder={viewMode ? '' : 'Provide details about referral requirements'}
              disabled={viewMode}
            />
          </FormField>
        </div>
      )}

      <FormField label="Price (£ p/w)" required>
        <Input
          type="number"
          id="price"
          value={formData.Price}
          onChange={(e) => onChange('PricingAndRequirementsInfo.Price', e.target.value)}
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Food Included">
        <Select
          id="food-included"
          value={formData.FoodIsIncluded?.toString() || ''}
          onChange={(e) => onChange('PricingAndRequirementsInfo.FoodIsIncluded', parseInt(e.target.value))}
          options={DISCRETIONARY_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Availability of Meals">
        <textarea
          id="availability-meals"
          value={formData.AvailabilityOfMeals || ''}
          onChange={(e) => onChange('PricingAndRequirementsInfo.AvailabilityOfMeals', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-transparent sm:text-sm"
          placeholder={viewMode ? '' : 'Describe meal availability'}
          disabled={viewMode}
        />
      </FormField>
    </div>
  );
}
