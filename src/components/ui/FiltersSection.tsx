import React from 'react';
import { Search } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
}

interface FiltersSectionProps {
  // Search configuration
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  
  // Filters configuration
  filters?: FilterConfig[];
  
  // Optional className for additional styling
  className?: string;
}

export const FiltersSection: React.FC<FiltersSectionProps> = ({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  filters = [],
  className = '',
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-brand-q p-6 mb-6 mt-1 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Section */}
        <div className="flex-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-f w-4 h-4" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button
              variant="primary"
              onClick={onSearchSubmit}
              className="whitespace-nowrap"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {filters.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            {filters.map((filter) => (
              <select
                key={filter.id}
                id={filter.id}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="block w-full px-3 py-2 border border-brand-q rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-brand-k bg-white min-w-48"
              >
                <option value="" className="text-brand-k">
                  {filter.placeholder || 'All'}
                </option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value} className="text-brand-k">
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
