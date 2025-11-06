import { IOrganisation } from '@/types/organisations/IOrganisation';

/**
 * Escapes special characters in pipe-delimited fields
 */
function escapeCsvField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) return '';
  
  const value = String(field);
  
  // If field contains pipe, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes('|') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

/**
 * Formats a date for CSV export
 */
function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB');
}

/**
 * Formats an address object into a comma-separated string
 */
function formatAddress(address: IOrganisation['Addresses'][0] | undefined): string {
  if (!address) return 'NOT_INITIALISED';
  
  const parts = [
    address.Street || '',
    address.Street1 || '',
    address.Street2 || '',
    address.Street3 || '',
    address.City || '',
    address.Postcode || '',
    address.Telephone || ''
  ].filter(part => part.trim() !== '');
  
  return parts.length > 0 ? parts.join(', ') : 'NOT_INITIALISED';
}

/**
 * Formats administrators array into a string
 */
function formatAdministrators(administrators: IOrganisation['Administrators'] | undefined): string {
  if (!administrators || administrators.length === 0) return 'NOT_INITIALISED';
  
  return administrators
    .map(admin => `${admin.Email} (${admin.IsSelected ? 'Selected' : 'Not Selected'})`)
    .join('; ');
}

/**
 * Converts array of organisations to CSV string
 */
export function organisationsToCsv(organisations: IOrganisation[]): string {
  // Find the maximum number of addresses across all organisations
  const maxAddresses = organisations.reduce((max, org) => {
    const addressCount = org.Addresses?.length || 0;
    return Math.max(max, addressCount);
  }, 0);

  // Build dynamic headers with address columns
  const headers = [
    'Name',
    'Key',
    'Created Date',
    'Modified Date',
    'Short Description',
    'Verified',
    'Published',
    'Associated Locations',
    'Administrators',
  ];

  // Add remaining static headers
  headers.push(
    'Email',
    'Telephone',
    'Website',
    'Facebook',
    'Twitter',
    'Bluesky',
    'Tags'
  );

  // Add dynamic address columns
  for (let i = 1; i <= maxAddresses; i++) {
    headers.push(`Address ${i}`);
  }

  // Create header row with pipe delimiter
  const csvRows = [headers.join('|')];

  // Add data rows
  organisations.forEach(org => {
    const row = [
      escapeCsvField(org.Name || 'NOT_INITIALISED'),
      escapeCsvField(org.Key || 'NOT_INITIALISED'),
      escapeCsvField(formatDate(org.DocumentCreationDate) || 'NOT_INITIALISED'),
      escapeCsvField(formatDate(org.DocumentModifiedDate) || 'NOT_INITIALISED'),
      escapeCsvField(org.ShortDescription || 'NOT_INITIALISED'),
      escapeCsvField(org.IsVerified ? 'Yes' : 'No'),
      escapeCsvField(org.IsPublished ? 'Yes' : 'No'),
      escapeCsvField(org.AssociatedLocationIds && org.AssociatedLocationIds.length > 0 
        ? org.AssociatedLocationIds.join(', ') 
        : 'NOT_INITIALISED'),
      escapeCsvField(formatAdministrators(org.Administrators)),
    ];

    // Add remaining static fields
    row.push(
      escapeCsvField(org.Email || 'NOT_INITIALISED'),
      escapeCsvField(org.Telephone || 'NOT_INITIALISED'),
      escapeCsvField(org.Website || 'NOT_INITIALISED'),
      escapeCsvField(org.Facebook || 'NOT_INITIALISED'),
      escapeCsvField(org.Twitter || 'NOT_INITIALISED'),
      escapeCsvField(org.Bluesky || 'NOT_INITIALISED'),
      escapeCsvField(org.Tags || 'NOT_INITIALISED')
    );

    // Add dynamic address columns
    for (let i = 0; i < maxAddresses; i++) {
      row.push(escapeCsvField(formatAddress(org.Addresses?.[i])));
    }

    csvRows.push(row.join('|'));
  });

  return csvRows.join('\n');
}

/**
 * Triggers browser download of CSV file
 */
export function downloadCsv(csvContent: string, filename: string = 'organisations.csv'): void {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Exports organisations to CSV and triggers download
 */
export function exportOrganisationsToCsv(
  organisations: IOrganisation[],
  filename?: string
): void {
  const csvContent = organisationsToCsv(organisations);
  const defaultFilename = `organisations_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCsv(csvContent, filename || defaultFilename);
}
