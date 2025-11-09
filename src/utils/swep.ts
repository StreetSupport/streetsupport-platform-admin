import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';

/**
 * Format SWEP active period for display
 * e.g. "SWEP is currently active from 15 January until 18 January"
 * or "SWEP is currently active from 15 January"
 * or "SWEP is currently active until 18 January"
 */
export function formatSwepActivePeriod(swepData: ISwepBanner): string {
  // Show only dates without hours and minutes
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long'
  };
  
  // Handle different combinations of dates
  if (swepData.SwepActiveFrom && swepData.SwepActiveUntil) {
    // Both dates present
    const activeFrom = new Date(swepData.SwepActiveFrom);
    const activeUntil = new Date(swepData.SwepActiveUntil);
    const fromString = activeFrom.toLocaleDateString('en-GB', formatOptions);
    const untilString = activeUntil.toLocaleDateString('en-GB', formatOptions);
    return `SWEP is currently active from ${fromString} until ${untilString}`;
  } else if (swepData.SwepActiveFrom) {
    // Only start date present
    const activeFrom = new Date(swepData.SwepActiveFrom);
    const fromString = activeFrom.toLocaleDateString('en-GB', formatOptions);
    return `SWEP is currently active from ${fromString}`;
  } else if (swepData.SwepActiveUntil) {
    // Only end date present
    const activeUntil = new Date(swepData.SwepActiveUntil);
    const untilString = activeUntil.toLocaleDateString('en-GB', formatOptions);
    return `SWEP is currently active until ${untilString}`;
  } else {
    // No dates specified
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
