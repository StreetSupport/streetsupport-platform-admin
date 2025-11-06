'use client';

import { IAccommodationFormData } from "@/types";

interface SuitableForSectionProps {
  formData?: IAccommodationFormData['ResidentCriteriaInfo'] | null;
  onChange: (field: string, value: string | boolean | number) => void;
  viewMode?: boolean;
}

interface CheckboxRowProps {
  label: string;
  field: string;
  value: boolean | undefined;
  onChange: (field: string, value: boolean) => void;
  disabled?: boolean;
}

function CheckboxRow({ label, field, value, onChange, disabled = false }: CheckboxRowProps) {
  return (
    <div className="flex items-center py-2">
      <input
        type="checkbox"
        id={field}
        checked={value || false}
        onChange={(e) => onChange(field, e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        disabled={disabled}
      />
      <label htmlFor={field} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}

export function SuitableForSection({ formData, onChange, viewMode = false }: SuitableForSectionProps) {
  const safeFormData = (formData ?? {}) as IAccommodationFormData['ResidentCriteriaInfo'];
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Resident Criteria</h4>
        <div className="space-y-2">
          <CheckboxRow
            label="Men"
            field="ResidentCriteriaInfo.AcceptsMen"
            value={safeFormData.AcceptsMen}
            onChange={onChange}
            disabled={viewMode}
          />
          <CheckboxRow
            label="Women"
            field="ResidentCriteriaInfo.AcceptsWomen"
            value={safeFormData.AcceptsWomen}
            onChange={onChange}
            disabled={viewMode}
          />
          <CheckboxRow
            label="Couples"
            field="ResidentCriteriaInfo.AcceptsCouples"
            value={safeFormData.AcceptsCouples}
            onChange={onChange}
            disabled={viewMode}
          />
          <CheckboxRow
            label="Young People"
            field="ResidentCriteriaInfo.AcceptsYoungPeople"
            value={safeFormData.AcceptsYoungPeople}
            onChange={onChange}
            disabled={viewMode}
          />
          <CheckboxRow
            label="Families"
            field="ResidentCriteriaInfo.AcceptsFamilies"
            value={safeFormData.AcceptsFamilies}
            onChange={onChange}
            disabled={viewMode}
          />
          <CheckboxRow
            label="Housing Benefit Claimants"
            field="ResidentCriteriaInfo.AcceptsBenefitsClaimants"
            value={safeFormData.AcceptsBenefitsClaimants}
            onChange={onChange}
            disabled={viewMode}
          />
        </div>
      </div>
    </div>
  );
}

