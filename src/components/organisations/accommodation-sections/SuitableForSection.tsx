'use client';

interface SuitableForSectionProps {
  formData: {
    AcceptsMen?: boolean;
    AcceptsWomen?: boolean;
    AcceptsCouples?: boolean;
    AcceptsYoungPeople?: boolean;
    AcceptsFamilies?: boolean;
    AcceptsBenefitsClaimants?: boolean;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

interface CheckboxRowProps {
  label: string;
  field: string;
  value: boolean | undefined;
  onChange: (field: string, value: boolean) => void;
}

function CheckboxRow({ label, field, value, onChange }: CheckboxRowProps) {
  return (
    <div className="flex items-center py-2">
      <input
        type="checkbox"
        id={field}
        checked={value || false}
        onChange={(e) => onChange(field, e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label htmlFor={field} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}

export function SuitableForSection({ formData, onChange, errors }: SuitableForSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Resident Criteria</h4>
        <div className="space-y-2">
          <CheckboxRow
            label="Men"
            field="ResidentCriteriaInfo.AcceptsMen"
            value={formData.AcceptsMen}
            onChange={onChange}
          />
          <CheckboxRow
            label="Women"
            field="ResidentCriteriaInfo.AcceptsWomen"
            value={formData.AcceptsWomen}
            onChange={onChange}
          />
          <CheckboxRow
            label="Couples"
            field="ResidentCriteriaInfo.AcceptsCouples"
            value={formData.AcceptsCouples}
            onChange={onChange}
          />
          <CheckboxRow
            label="Young People"
            field="ResidentCriteriaInfo.AcceptsYoungPeople"
            value={formData.AcceptsYoungPeople}
            onChange={onChange}
          />
          <CheckboxRow
            label="Families"
            field="ResidentCriteriaInfo.AcceptsFamilies"
            value={formData.AcceptsFamilies}
            onChange={onChange}
          />
          <CheckboxRow
            label="Housing Benefit Claimants"
            field="ResidentCriteriaInfo.AcceptsBenefitsClaimants"
            value={formData.AcceptsBenefitsClaimants}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}
