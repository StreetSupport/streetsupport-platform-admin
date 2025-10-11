/**
 * Role-based home page utilities
 * 
 * Determines the appropriate home page URL based on user roles.
 * This logic is centralized here to ensure consistency across the application.
 */

import { ROLES, ROLE_PREFIXES } from '@/constants/roles';

/**
 * Determines the home page URL based on user roles
 * 
 * Logic:
 * - If user has ONLY SwepAdmin role (and SwepAdminFor: claims) → /swep-banners
 * - All other roles (SuperAdmin, CityAdmin, OrgAdmin, VolunteerAdmin) → /organisations
 * 
 * @param authClaims - Array of all auth claims (roles + specific claims)
 * @returns The appropriate home page URL for the user
 * 
 * @example
 * // User with only SwepAdmin + SwepAdminFor:manchester
 * getHomePageForUser(['SwepAdmin', 'SwepAdminFor:manchester']) // Returns '/swep-banners'
 * 
 * @example
 * // User with CityAdmin
 * getHomePageForUser(['CityAdmin', 'CityAdminFor:birmingham']) // Returns '/organisations'
 * 
 * @example
 * // User with multiple roles
 * getHomePageForUser(['SwepAdmin', 'CityAdmin']) // Returns '/organisations'
 */
export function getHomePageForUser(authClaims: string[]): string {
  // Filter out location/org-specific claims to get only base roles
  const baseRoles = authClaims.filter(claim => !claim.includes(':'));
  
  // Check if user has only SwepAdmin role
  const hasOnlySwepAdmin = baseRoles.length === 1 && baseRoles[0] === ROLES.SWEP_ADMIN;
  
  // Check if user has any SwepAdminFor: claims
  const hasSwepAdminForClaims = authClaims.some(claim => 
    claim.startsWith(ROLE_PREFIXES.SWEP_ADMIN_FOR)
  );
  
  // If user has only SwepAdmin role and SwepAdminFor: claims, redirect to swep-banners
  if (hasOnlySwepAdmin && hasSwepAdminForClaims) {
    return '/swep-banners';
  }
  
  // Default home page for all other roles
  return '/organisations';
}

/**
 * Gets the home page label based on the URL
 * Used for breadcrumbs and navigation
 */
export function getHomePageLabel(homePageUrl: string): string {
  switch (homePageUrl) {
    case '/swep-banners':
      return 'SWEP Banners';
    case '/organisations':
      return 'Organisations';
    default:
      return 'Home';
  }
}
