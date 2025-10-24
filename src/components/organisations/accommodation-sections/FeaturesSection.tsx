'use client';

import { FormField } from '@/components/ui/FormField';
import { IAccommodationFormData, DISCRETIONARY_OPTIONS, DiscretionaryValue } from '@/types/organisations/IAccommodation';

interface FeaturesSectionProps {
  formData: IAccommodationFormData['FeaturesWithDiscretionary'];
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

interface FeatureRowProps {
  label: string;
  field: string;
  value: number | undefined;
  onChange: (field: string, value: number) => void;
}

function FeatureRow({ label, field, value, onChange }: FeatureRowProps) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 sm:items-center py-2 border-b border-gray-200">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value ?? DiscretionaryValue.DontKnowAsk}
        onChange={(e) => onChange(field, parseInt(e.target.value))}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {DISCRETIONARY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FeaturesSection({ formData, onChange, errors }: FeaturesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="space-y-2">
          <FeatureRow
            label="Single Rooms"
            field="FeaturesWithDiscretionary.HasSingleRooms"
            value={formData.HasSingleRooms}
            onChange={onChange}
          />
          <FeatureRow
            label="Shared Rooms"
            field="FeaturesWithDiscretionary.HasSharedRooms"
            value={formData.HasSharedRooms}
            onChange={onChange}
          />
          <FeatureRow
            label="Disabled Access"
            field="FeaturesWithDiscretionary.HasDisabledAccess"
            value={formData.HasDisabledAccess}
            onChange={onChange}
          />
          <FeatureRow
            label="Allows Pets"
            field="FeaturesWithDiscretionary.AcceptsPets"
            value={formData.AcceptsPets}
            onChange={onChange}
          />
          <FeatureRow
            label="Allows Visitors"
            field="FeaturesWithDiscretionary.AllowsVisitors"
            value={formData.AllowsVisitors}
            onChange={onChange}
          />
          <FeatureRow
            label="Shower/Bathroom Facilities"
            field="FeaturesWithDiscretionary.HasShowerBathroomFacilities"
            value={formData.HasShowerBathroomFacilities}
            onChange={onChange}
          />
          <FeatureRow
            label="Access to Kitchen"
            field="FeaturesWithDiscretionary.HasAccessToKitchen"
            value={formData.HasAccessToKitchen}
            onChange={onChange}
          />
          <FeatureRow
            label="Communal/Social Area"
            field="FeaturesWithDiscretionary.HasLounge"
            value={formData.HasLounge}
            onChange={onChange}
          />
          <FeatureRow
            label="Laundry Facilities"
            field="FeaturesWithDiscretionary.HasLaundryFacilities"
            value={formData.HasLaundryFacilities}
            onChange={onChange}
          />
          <FeatureRow
            label="Accepts Housing Benefit"
            field="FeaturesWithDiscretionary.AcceptsHousingBenefit"
            value={formData.AcceptsHousingBenefit}
            onChange={onChange}
          />
          <FeatureRow
            label="Accepts Couples"
            field="FeaturesWithDiscretionary.AcceptsCouples"
            value={formData.AcceptsCouples}
            onChange={onChange}
          />
          <FeatureRow
            label="Suitable for Women"
            field="FeaturesWithDiscretionary.IsSuitableForWomen"
            value={formData.IsSuitableForWomen}
            onChange={onChange}
          />
          <FeatureRow
            label="Suitable for Young People"
            field="FeaturesWithDiscretionary.IsSuitableForYoungPeople"
            value={formData.IsSuitableForYoungPeople}
            onChange={onChange}
          />
          <FeatureRow
            label="Has On-Site Manager"
            field="FeaturesWithDiscretionary.HasOnSiteManager"
            value={formData.HasOnSiteManager}
            onChange={onChange}
          />
        </div>
      </div>
      <FormField label="Additional Features" error={errors['FeaturesWithDiscretionary.AdditionalFeatures']}>
        <textarea
          value={formData.AdditionalFeatures || ''}
          onChange={(e) => onChange('FeaturesWithDiscretionary.AdditionalFeatures', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Describe any additional features (optional)"
        />
      </FormField>
    </div>
  );
}
