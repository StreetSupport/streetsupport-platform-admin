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
 * Get location slugs that a user has access to (for API query filtering)
 * 
 * @param userAuthClaims - User's authentication claims
 * @param restrictVolunteerAdmin - If true, VolunteerAdmin will be filtered by CityAdmin claims (for Users page only)
 * @returns Array of location slugs the user can access, or null for unrestricted access
 * 
 * @example
 * // SuperAdmin - returns null (no filter needed)
 * getUserLocationSlugs(superAdminClaims) // => null
 * 
 * // VolunteerAdmin on most pages - returns null (unrestricted)
 * getUserLocationSlugs(volunteerAdminClaims) // => null
 * 
 * // VolunteerAdmin on Users page - filtered by CityAdmin claims
 * getUserLocationSlugs(volunteerAdminClaims, true) // => ['birmingham'] (if they have CityAdmin)
 * 
 * // CityAdmin for specific cities - returns those city slugs
 * getUserLocationSlugs(cityAdminClaims) // => ['birmingham', 'manchester']
 */
export function getUserLocationSlugs(
  userAuthClaims: UserAuthClaims, 
  restrictVolunteerAdmin: boolean = false
): string[] | null {
  // SuperAdmin always has unrestricted location access
  if (isSuperAdmin(userAuthClaims.roles)) {
    return null;
  }
  
  // VolunteerAdmin has unrestricted access on all pages EXCEPT Users page
  if (!restrictVolunteerAdmin && hasRole(userAuthClaims.roles, ROLES.VOLUNTEER_ADMIN)) {
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
 * Get location slugs that a user has access to (for API query filtering)
 * 
 * @param userAuthClaims - User's authentication claims
 * @param restrictVolunteerAdmin - If true, VolunteerAdmin will be filtered by CityAdmin claims (for Users page only)
 * @returns Array of location slugs the user can access, or null for unrestricted access
 * 
 * @example
 * // SuperAdmin - returns null (no filter needed)
 * getUserLocationSlugs(superAdminClaims) // => null
 * 
 * // VolunteerAdmin on most pages - returns null (unrestricted)
 * getUserLocationSlugs(volunteerAdminClaims) // => null
 * 
 * // VolunteerAdmin on Users page - filtered by CityAdmin claims
 * getUserLocationSlugs(volunteerAdminClaims, true) // => ['birmingham'] (if they have CityAdmin)
 * 
 * // CityAdmin or SwepAdmin for specific cities - returns those city slugs
 * getUserLocationSlugs(cityAdminClaims) // => ['birmingham', 'manchester']
 */
export function getUserSwepLocationSlugs(
  userAuthClaims: UserAuthClaims
): string[] | null {
  // SuperAdmin always has unrestricted location access
  if (isSuperAdmin(userAuthClaims.roles) || hasRole(userAuthClaims.roles, ROLES.VOLUNTEER_ADMIN)) {
    return null;
  }

  // CityAdmin or SwepAdmin with location-specific claims
  if (hasRole(userAuthClaims.roles, ROLES.CITY_ADMIN) || hasRole(userAuthClaims.roles, ROLES.SWEP_ADMIN)) {
    const userCities = userAuthClaims.specificClaims
      .filter((claim: string) => claim.startsWith(ROLE_PREFIXES.CITY_ADMIN_FOR) || claim.startsWith(ROLE_PREFIXES.SWEP_ADMIN_FOR))
      .map((claim: string) => claim.replace(ROLE_PREFIXES.CITY_ADMIN_FOR, '').replace(ROLE_PREFIXES.SWEP_ADMIN_FOR, ''));
    
    // If CityAdmin or SwepAdmin has specific city claims, return them for filtering
    if (userCities.length > 0) {
      return userCities;
    }
    
    // If CityAdmin or SwepAdmin has no specific claims, no filtering needed
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
