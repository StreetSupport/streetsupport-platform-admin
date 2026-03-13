/**
 * Determines whether a URL points to a domain outside streetsupport.net.
 * Used to decide if a link should open in a new tab with rel="noopener noreferrer".
 */
export function isExternalDomain(href: string): boolean {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }

  if (href.startsWith('/') || href.startsWith('#')) {
    return false;
  }

  try {
    const url = new URL(href, 'https://streetsupport.net');
    const hostname = url.hostname.toLowerCase();
    return hostname !== 'streetsupport.net' && hostname !== 'www.streetsupport.net';
  } catch {
    return false;
  }
}
