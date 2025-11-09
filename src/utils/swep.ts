import { ISwepBanner } from '@/types/swep-banners/ISwepBanner';

/**
 * Format SWEP active period for display
 * e.g. "SWEP is currently active from 15 January at 20:00 until 18 January at 11:00"
 */
export function formatSwepActivePeriod(swepData: ISwepBanner): string {
  if (!swepData.swepActiveFrom || !swepData.swepActiveUntil) {
    return 'Active period not specified';
  }

  const activeFrom = new Date(swepData.swepActiveFrom);
  const activeUntil = new Date(swepData.swepActiveUntil);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const fromString = activeFrom.toLocaleDateString('en-GB', formatOptions).replace(',', ' at');
  const untilString = activeUntil.toLocaleDateString('en-GB', formatOptions).replace(',', ' at');
  
  return `SWEP is currently active from ${fromString} until ${untilString}`;
}

/**
 * Parse HTML content - already sanitized by RichTextEditor
 */
export function parseSwepBody(body: string): string {
  // HTML is already sanitized by the RichTextEditor component
  // This function exists for consistency with the public site
  return body;
}
