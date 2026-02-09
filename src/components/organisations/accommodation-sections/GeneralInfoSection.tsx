'use client';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { RichTextEditor, DESCRIPTION_TOOLBAR_FEATURES, DESCRIPTION_ALLOWED_TAGS } from '@/components/ui/RichTextEditor';
import { getTextLengthFromHtml } from '@/utils/htmlUtils';
import { ACCOMMODATION_TYPES } from '@/types/organisations/IAccommodation';
import { IAccommodationFormData } from '@/types';

interface GeneralInfoSectionProps {
  formData: IAccommodationFormData['GeneralInfo'];
  onChange: (field: string, value: string | boolean | number) => void;
  viewMode?: boolean;
}

export function GeneralInfoSection({ formData, onChange, viewMode = false }: GeneralInfoSectionProps) {
  return (
    <div className="space-y-4">
      <FormField label="Accommodation Name" required>
        <Input
          type="text"
          id="accommodation-name"
          value={formData.Name}
          onChange={(e) => onChange('GeneralInfo.Name', e.target.value)}
          placeholder={viewMode ? '' : 'Accommodation name'}
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Accommodation Type" required>
        <Select
          options={ACCOMMODATION_TYPES}
          value={formData.AccommodationType}
          onChange={(e) => onChange('GeneralInfo.AccommodationType', e.target.value)}
          placeholder={viewMode ? '' : 'Select accommodation type'}
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Short Description">
        <textarea
          id="short-description"
          value={formData.Synopsis || ''}
          onChange={(e) => onChange('GeneralInfo.Synopsis', e.target.value)}
          rows={2}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-a focus:border-transparent sm:text-sm"
          placeholder={viewMode ? '' : 'Short description'}
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Description">
        <RichTextEditor
          value={formData.Description || ''}
          onChange={(value) => onChange('GeneralInfo.Description', value)}
          placeholder="Detailed description of the accommodation"
          minHeight="150px"
          toolbarFeatures={DESCRIPTION_TOOLBAR_FEATURES}
          allowedTags={DESCRIPTION_ALLOWED_TAGS}
          disabled={viewMode}
        />
        <p className="text-xs text-brand-f mt-1">
          {getTextLengthFromHtml(formData.Description || '')}/1,800 characters
        </p>
      </FormField>

      <Checkbox
        id="isOpenAccess"
        checked={formData.IsOpenAccess}
        onChange={(e) => onChange('GeneralInfo.IsOpenAccess', e.target.checked)}
        disabled={viewMode}
        label="Open Access (No referral required)"
      />
    </div>
  );
}
