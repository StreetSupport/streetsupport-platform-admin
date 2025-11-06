'use client';

import { FormField } from '@/components/ui/FormField';
import { IAccommodationFormData } from '@/types';

interface ContactDetailsSectionProps {
  formData: IAccommodationFormData['ContactInformation'];
  onChange: (field: string, value: string | boolean | number) => void;
  viewMode?: boolean;
}

export function ContactDetailsSection({ formData, onChange, viewMode = false }: ContactDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <FormField label="Contact Name" required>
        <input
          type="text"
          id="contact-name"
          value={formData.Name}
          onChange={(e) => onChange('ContactInformation.Name', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={viewMode ? '' : 'Enter contact person name'}
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Email" required>
        <input
          type="email"
          id="contact-email"
          value={formData.Email}
          onChange={(e) => onChange('ContactInformation.Email', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={viewMode ? '' : 'contact@example.com'}
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Telephone">
        <input
          type="tel"
          id="contact-telephone"
          value={formData.Telephone || ''}
          onChange={(e) => onChange('ContactInformation.Telephone', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={viewMode ? '' : 'Telephone number'}
          disabled={viewMode}
        />
      </FormField>

      <FormField label="Additional Information">
        <textarea
          id="contact-additional-info"
          value={formData.AdditionalInfo || ''}
          onChange={(e) => onChange('ContactInformation.AdditionalInfo', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={viewMode ? '' : 'Any additional contact information'}
          disabled={viewMode}
        />
      </FormField>
    </div>
  );
}
