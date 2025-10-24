'use client';

import { FormField } from '@/components/ui/FormField';

interface ContactDetailsSectionProps {
  formData: {
    Name: string;
    Email: string;
    Telephone?: string;
    AdditionalInfo?: string;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function ContactDetailsSection({ formData, onChange, errors }: ContactDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <FormField label="Contact Name" required>
        <input
          type="text"
          value={formData.Name}
          onChange={(e) => onChange('ContactInformation.Name', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter contact person name"
        />
      </FormField>

      <FormField label="Email" required>
        <input
          type="email"
          value={formData.Email}
          onChange={(e) => onChange('ContactInformation.Email', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="contact@example.com"
        />
      </FormField>

      <FormField label="Telephone">
        <input
          type="tel"
          value={formData.Telephone || ''}
          onChange={(e) => onChange('ContactInformation.Telephone', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Telephone number"
        />
      </FormField>

      <FormField label="Additional Information">
        <textarea
          value={formData.AdditionalInfo || ''}
          onChange={(e) => onChange('ContactInformation.AdditionalInfo', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Any additional contact information"
        />
      </FormField>
    </div>
  );
}
