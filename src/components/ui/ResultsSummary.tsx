import React from 'react';

interface ResultsSummaryProps {
  /** Whether data is currently loading */
  Loading: boolean;
  /** Total number of items found */
  Total: number;
  /** Singular form of the item name (e.g., "user", "banner", "organisation") */
  ItemName: string;
  /** Additional CSS classes */
  ClassName?: string;
  /** If true, only renders the text without wrapper div (for custom layouts) */
  NoWrapper?: boolean;
}

/**
 * ResultsSummary Component
 * 
 * Displays a summary of search/filter results with proper pluralization.
 * Shows nothing while loading, then displays count with singular/plural item name.
 * 
 * @example
 * <ResultsSummary Loading={false} Total={5} ItemName="user" />
 * // Renders: "5 users found"
 * 
 * @example
 * <ResultsSummary Loading={false} Total={1} ItemName="organisation" />
 * // Renders: "1 organisation found"
 * 
 * @example
 * <div className="custom-wrapper">
 *   <ResultsSummary Loading={false} Total={5} ItemName="user" NoWrapper />
 *   <Button>Export</Button>
 * </div>
 */
export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  Loading,
  Total,
  ItemName,
  ClassName = '',
  NoWrapper = false,
}) => {
  const content = (
    <p className="text-base text-brand-f">
      {Loading ? '' : `${Total} ${ItemName}${Total !== 1 ? 's' : ''} found`}
    </p>
  );

  if (NoWrapper) {
    return content;
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${ClassName}`}>
      {content}
    </div>
  );
};
