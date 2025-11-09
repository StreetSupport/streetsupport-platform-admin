import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';

/**
 * Format SWEP active period for display with appropriate status
 * Examples:
 * - "SWEP is currently active from 15 January until 18 January" (currently active)
 * - "SWEP will be active from 15 January until 18 January" (scheduled)
 * - "SWEP was active from 10 January until 12 January" (ended)
 * - "SWEP is scheduled to start on 15 January" (future start date)
 * - "SWEP was active until 12 January" (past end date)
 * - "Active period not specified" (no dates)
 */
export function formatSwepActivePeriod(swepData: ISwepBanner): string {
  // Show only dates without hours and minutes
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of day for date comparison

  // Handle different combinations of dates
  if (swepData.SwepActiveFrom && swepData.SwepActiveUntil) {
    const activeFrom = new Date(swepData.SwepActiveFrom);
    const activeUntil = new Date(swepData.SwepActiveUntil);
    activeFrom.setHours(0, 0, 0, 0);
    activeUntil.setHours(23, 59, 59, 999); // End of day
    
    const fromString = activeFrom.toLocaleDateString('en-GB', formatOptions);
    const untilString = activeUntil.toLocaleDateString('en-GB', formatOptions);
    
    if (now < activeFrom) {
      return `SWEP will be active from ${fromString} until ${untilString}`;
    } else if (now > activeUntil) {
      return `SWEP was active from ${fromString} until ${untilString}`;
    } else {
      return `SWEP is currently active from ${fromString} until ${untilString}`;
    }
  } else {
    return 'Active period not specified';
  }
}

/**
 * Parse HTML content - already sanitized by RichTextEditor
 */
export function parseSwepBody(body: string): string {
  // HTML is already sanitized by the RichTextEditor component
  // This function exists for consistency with the public site
  return body;
}
