import React from 'react';
import { getFieldErrors } from '@/schemas/bannerSchema';

interface BannerFormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'file';
  value?: string | number;
  onChange: (name: string, value: any) => void;
  errors?: Array<{ path: string; message: string; code: string }>;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  accept?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  helpText?: string;
}

export const BannerFormField: React.FC<BannerFormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  errors = [],
  required = false,
  placeholder,
  options,
  accept,
  maxLength,
  min,
  max,
  helpText
}) => {
  const fieldErrors = getFieldErrors(errors, name);
  const hasError = fieldErrors.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) : e.target.value;
    onChange(name, newValue);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onChange(name, file);
  };

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md transition-colors duration-200
    focus:ring-2 focus:ring-brand-a focus:border-brand-a
    ${hasError 
      ? 'border-brand-g focus:ring-brand-g focus:border-brand-g' 
      : 'border-brand-q hover:border-brand-f'
    }
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value as string || ''}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            className={`${baseInputClasses} min-h-[100px] resize-vertical`}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value as string || ''}
            onChange={handleChange}
            required={required}
            className={baseInputClasses}
          >
            <option value="">Select {label}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'file':
        return (
          <input
            type="file"
            id={name}
            name={name}
            onChange={handleFileChange}
            accept={accept}
            required={required}
            className={`${baseInputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-a file:text-white hover:file:bg-brand-b`}
          />
        );

      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={maxLength}
            min={min}
            max={max}
            required={required}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className="field-group">
      <label 
        htmlFor={name} 
        className={`field-label ${required ? 'required' : ''}`}
      >
        {label}
      </label>
      
      {renderInput()}
      
      {helpText && (
        <div className="field-help">
          {helpText}
        </div>
      )}
      
      {hasError && (
        <div className="field-error">
          {fieldErrors.map((error, index) => (
            <div key={index} className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
