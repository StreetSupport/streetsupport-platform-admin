/**
 * Location Utilities
 * 
 * Reusable functions for location-based filtering based on user roles
 */

import { ROLES, ROLE_PREFIXES, isSuperAdmin, hasRole } from '@/constants/roles';
import { UserAuthClaims } from '@/types/auth';

export interface Location {
  Key: string;
  Name: string;
}

/**
 * Get available locations based on current user's permissions
 * 
 * @param userAuthClaims - User's authentication claims with roles and specific claims
 * @param locations - Full list of available locations
 * @returns Filtered array of locations the user has access to
 * 
 * @example
 * // SuperAdmin or VolunteerAdmin - returns all locations
 * getAvailableLocations(superAdminClaims, allLocations) // => all locations
 * 
 * // CityAdmin with specific cities - returns only allowed cities
 * getAvailableLocations(cityAdminClaims, allLocations) // => filtered locations
 */
export function getAvailableLocations(
  userAuthClaims: UserAuthClaims,
  locations: Location[]
): Location[] {
  // SuperAdmin and VolunteerAdmin have access to all locations
  if (isSuperAdmin(userAuthClaims.roles) || hasRole(userAuthClaims.roles, ROLES.VOLUNTEER_ADMIN)) {
    return locations;
  }

  // CityAdmin (base role or location-specific) - filter by their assigned cities
  if (hasRole(userAuthClaims.roles, ROLES.CITY_ADMIN)) {
    const userCities = userAuthClaims.specificClaims
      .filter((claim: string) => claim.startsWith(ROLE_PREFIXES.CITY_ADMIN_FOR))
      .map((claim: string) => claim.replace(ROLE_PREFIXES.CITY_ADMIN_FOR, ''));
    
    // If CityAdmin has specific claims, filter by them
    if (userCities.length > 0) {
      return locations.filter(loc => userCities.includes(loc.Key));
    }
    
    // If CityAdmin has no specific claims, they have access to all locations
    return locations;
  }
  
  // Default: no locations accessible
  return [];
}

/**
 * Get location slugs that a user has access to (for API query filtering)
 * 
 * @param userAuthClaims - User's authentication claims
 * @returns Array of location slugs the user can access, or null for unrestricted access
 * 
 * @example
 * // SuperAdmin - returns null (no filter needed)
 * getUserLocationSlugs(superAdminClaims) // => null
 * 
 * // CityAdmin for specific cities - returns those city slugs
 * getUserLocationSlugs(cityAdminClaims) // => ['birmingham', 'manchester']
 */
export function getUserLocationSlugs(userAuthClaims: UserAuthClaims): string[] | null {
  // SuperAdmin and VolunteerAdmin - no location filtering needed
  if (isSuperAdmin(userAuthClaims.roles) || hasRole(userAuthClaims.roles, ROLES.VOLUNTEER_ADMIN)) {
    return null;
  }

  // CityAdmin with location-specific claims
  if (hasRole(userAuthClaims.roles, ROLES.CITY_ADMIN)) {
    const userCities = userAuthClaims.specificClaims
      .filter((claim: string) => claim.startsWith(ROLE_PREFIXES.CITY_ADMIN_FOR))
      .map((claim: string) => claim.replace(ROLE_PREFIXES.CITY_ADMIN_FOR, ''));
    
    // If CityAdmin has specific city claims, return them for filtering
    if (userCities.length > 0) {
      return userCities;
    }
    
    // If CityAdmin has no specific claims, no filtering needed
    return null;
  }
  
  // Other roles - return empty array (no access)
  return [];
}

/**
 * Check if user should have location filter applied
 * 
 * @param userAuthClaims - User's authentication claims
 * @returns true if location filtering should be applied
 */
export function shouldApplyLocationFilter(userAuthClaims: UserAuthClaims): boolean {
  const slugs = getUserLocationSlugs(userAuthClaims);
  return slugs !== null && slugs.length > 0;
}

/**
 * Check if user has access to a specific location
 * 
 * @param userAuthClaims - User's authentication claims
 * @param locationSlug - Location slug to check access for
 * @returns true if user has access to the location
 */
export function hasAccessToLocation(
  userAuthClaims: UserAuthClaims,
  locationSlug: string
): boolean {
  const allowedSlugs = getUserLocationSlugs(userAuthClaims);
  
  // null means unrestricted access
  if (allowedSlugs === null) {
    return true;
  }
  
  // Empty array means no access
  if (allowedSlugs.length === 0) {
    return false;
  }
  
  // Check if location is in allowed list
  return allowedSlugs.includes(locationSlug);
}
