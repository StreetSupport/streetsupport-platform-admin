'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean; // When true, the multiselect is read-only
}

export function MultiSelect({ options, value, onChange, placeholder = "Select options...", className = '', disabled = false }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemoveOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`min-h-[42px] w-full px-3 py-2 border border-brand-f rounded-md shadow-sm flex items-center justify-between ${
          disabled 
            ? 'bg-brand-q cursor-not-allowed opacity-60' 
            : 'bg-white cursor-pointer focus-within:ring-2 focus-within:ring-brand-a focus-within:border-brand-a'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-brand-f">{placeholder}</span>
          ) : (
            selectedOptions.map((option, idx) => (
              <span
                key={`${option.value}-${idx}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-brand-a text-white text-xs rounded"
              >
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveOption(option.value, e)}
                    className="hover:bg-brand-b rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-brand-f transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-brand-f rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-brand-f text-sm">
              No options available
            </div>
          ) : (
            options.map((option, idx) => (
              <div
                key={`${option.value}-${idx}`}
                className={`px-3 py-2 cursor-pointer hover:bg-brand-i ${
                  value.includes(option.value) ? 'bg-brand-a text-white' : 'text-brand-k'
                }`}
                onClick={() => handleToggleOption(option.value)}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {value.includes(option.value) && (
                    <span className="text-xs">✓</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
