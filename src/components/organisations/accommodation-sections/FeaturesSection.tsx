'use client';

import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { IAccommodationFormData, DISCRETIONARY_OPTIONS, DiscretionaryValue } from '@/types/organisations/IAccommodation';

interface FeaturesSectionProps {
  formData?: IAccommodationFormData['FeaturesWithDiscretionary'] | null;
  onChange: (field: string, value: string | boolean | number) => void;
  errors: Record<string, string>;
  viewMode?: boolean;
}

interface FeatureRowProps {
  label: string;
  field: string;
  value: number | undefined;
  onChange: (field: string, value: number) => void;
  disabled?: boolean;
}

function FeatureRow({ label, field, value, onChange, disabled = false }: FeatureRowProps) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 sm:items-center py-2 border-b border-gray-200">
      <label htmlFor={field} className="text-sm font-medium text-gray-700">{label}</label>
      <Select
        id={field}
        value={(value ?? DiscretionaryValue.DontKnowAsk).toString()}
        onChange={(e) => onChange(field, parseInt(e.target.value))}
        options={DISCRETIONARY_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
        disabled={disabled}
      />
    </div>
  );
}

export function FeaturesSection({ formData, onChange, errors, viewMode = false }: FeaturesSectionProps) {
  const safeFormData = (formData ?? {}) as IAccommodationFormData['FeaturesWithDiscretionary'];
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="space-y-2">
          <FeatureRow
            label="Single Rooms"
            field="FeaturesWithDiscretionary.HasSingleRooms"
            value={safeFormData.HasSingleRooms}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Shared Rooms"
            field="FeaturesWithDiscretionary.HasSharedRooms"
            value={safeFormData.HasSharedRooms}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Disabled Access"
            field="FeaturesWithDiscretionary.HasDisabledAccess"
            value={safeFormData.HasDisabledAccess}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Allows Pets"
            field="FeaturesWithDiscretionary.AcceptsPets"
            value={safeFormData.AcceptsPets}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Allows Visitors"
            field="FeaturesWithDiscretionary.AllowsVisitors"
            value={safeFormData.AllowsVisitors}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Shower/Bathroom Facilities"
            field="FeaturesWithDiscretionary.HasShowerBathroomFacilities"
            value={safeFormData.HasShowerBathroomFacilities}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Access to Kitchen"
            field="FeaturesWithDiscretionary.HasAccessToKitchen"
            value={safeFormData.HasAccessToKitchen}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Communal/Social Area"
            field="FeaturesWithDiscretionary.HasLounge"
            value={safeFormData.HasLounge}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Laundry Facilities"
            field="FeaturesWithDiscretionary.HasLaundryFacilities"
            value={safeFormData.HasLaundryFacilities}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Accepts Housing Benefit"
            field="FeaturesWithDiscretionary.AcceptsHousingBenefit"
            value={safeFormData.AcceptsHousingBenefit}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Accepts Couples"
            field="FeaturesWithDiscretionary.AcceptsCouples"
            value={safeFormData.AcceptsCouples}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Suitable for Women"
            field="FeaturesWithDiscretionary.IsSuitableForWomen"
            value={safeFormData.IsSuitableForWomen}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Suitable for Young People"
            field="FeaturesWithDiscretionary.IsSuitableForYoungPeople"
            value={safeFormData.IsSuitableForYoungPeople}
            onChange={onChange}
            disabled={viewMode}
          />
          <FeatureRow
            label="Has On-Site Manager"
            field="FeaturesWithDiscretionary.HasOnSiteManager"
            value={safeFormData.HasOnSiteManager}
            onChange={onChange}
            disabled={viewMode}
          />
        </div>
      </div>
      <FormField label="Additional Features" error={errors['FeaturesWithDiscretionary.AdditionalFeatures']}>
        <textarea
          id="additional-features"
          value={safeFormData.AdditionalFeatures || ''}
          onChange={(e) => onChange('FeaturesWithDiscretionary.AdditionalFeatures', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-transparent sm:text-sm"
          placeholder={viewMode ? '' : 'Describe any additional features (optional)'}
          disabled={viewMode}
        />
      </FormField>
    </div>
  );
}

