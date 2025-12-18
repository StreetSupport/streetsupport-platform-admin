/**
 * Role Constants for Street Support Admin Platform
 * 
 * This file defines all predefined roles and role-related utilities.
 * These constants should be used throughout the application instead of hardcoded strings.
 */

// ============================================================================
// BASE ROLES
// ============================================================================

/**
 * Base role types (without location/org specific suffixes)
 */
export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  SUPER_ADMIN_PLUS: 'SuperAdminPlus',
  CITY_ADMIN: 'CityAdmin',
  VOLUNTEER_ADMIN: 'VolunteerAdmin',
  ORG_ADMIN: 'OrgAdmin',
  SWEP_ADMIN: 'SwepAdmin',
} as const;

/**
 * Role prefixes for location/org-specific roles
 */
export const ROLE_PREFIXES = {
  CITY_ADMIN_FOR: 'CityAdminFor:',
  ADMIN_FOR: 'AdminFor:',
  SWEP_ADMIN_FOR: 'SwepAdminFor:',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Base role type (without location/org suffixes)
 */
export type BaseRole = typeof ROLES[keyof typeof ROLES];

/**
 * All possible role types including location/org-specific roles
 * Examples: 'SuperAdmin', 'CityAdminFor:birmingham', 'AdminFor:org-slug'
 */
export type Role = BaseRole | `${typeof ROLE_PREFIXES.CITY_ADMIN_FOR}${string}` | `${typeof ROLE_PREFIXES.ADMIN_FOR}${string}` | `${typeof ROLE_PREFIXES.SWEP_ADMIN_FOR}${string}`;

/**
 * Array of base roles for dropdowns and validation
 */
export const BASE_ROLES_ARRAY: readonly BaseRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.SUPER_ADMIN_PLUS,
  ROLES.CITY_ADMIN,
  ROLES.VOLUNTEER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.SWEP_ADMIN,
] as const;

/**
 * Role labels for UI display
 */
export const ROLE_LABELS: Record<BaseRole, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.SUPER_ADMIN_PLUS]: 'Super Admin Plus',
  [ROLES.CITY_ADMIN]: 'Location Admin',
  [ROLES.VOLUNTEER_ADMIN]: 'Volunteer Admin',
  [ROLES.ORG_ADMIN]: 'Organisation Admin',
  [ROLES.SWEP_ADMIN]: 'SWEP Admin',
} as const;

/**
 * Role descriptions for UI tooltips
 */
export const ROLE_DESCRIPTIONS: Record<BaseRole, string> = {
  [ROLES.SUPER_ADMIN]: 'Full access to all features and settings',
  [ROLES.SUPER_ADMIN_PLUS]: 'Super Admin with additional privileges (e.g., organisation removal)',
  [ROLES.CITY_ADMIN]: 'Manage location-specific content and services',
  [ROLES.VOLUNTEER_ADMIN]: 'Manage volunteers and volunteer-related content',
  [ROLES.ORG_ADMIN]: 'Manage specific organisation content',
  [ROLES.SWEP_ADMIN]: 'Manage SWEP (Severe Weather Emergency Protocol) banners and content',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role is a base role (without location/org suffix)
 */
export function isBaseRole(role: string): role is BaseRole {
  return BASE_ROLES_ARRAY.includes(role as BaseRole);
}

/**
 * Check if a role is a location-specific role (CityAdminFor:* or SwepAdminFor:*)
 */
export function isLocationSpecificRole(role: string): boolean {
  return role.startsWith(ROLE_PREFIXES.CITY_ADMIN_FOR) || role.startsWith(ROLE_PREFIXES.SWEP_ADMIN_FOR);
}

/**
 * Check if a role is an org-specific role (AdminFor:*)
 */
export function isOrgSpecificRole(role: string): boolean {
  return role.startsWith(ROLE_PREFIXES.ADMIN_FOR);
}

/**
 * Validate if a role string matches the expected format
 */
export function isValidRole(role: string): boolean {
  // Check if it's a base role
  if (isBaseRole(role)) {
    return true;
  }
  
  // Check if it's a valid location/org-specific role
  const rolePatterns = [
    new RegExp(`^${ROLE_PREFIXES.CITY_ADMIN_FOR}.+$`),
    new RegExp(`^${ROLE_PREFIXES.SWEP_ADMIN_FOR}.+$`),
    new RegExp(`^${ROLE_PREFIXES.ADMIN_FOR}.+$`),
  ];
  
  return rolePatterns.some(pattern => pattern.test(role));
}

/**
 * Check if user has a specific base role
 */
export function hasRole(authClaims: string[], role: BaseRole): boolean {
  return authClaims.includes(role);
}

/**
 * Check if user has SuperAdmin role
 */
export function isSuperAdmin(authClaims: string[]): boolean {
  return hasRole(authClaims, ROLES.SUPER_ADMIN);
}

/**
 * Get role options for dropdown/select components
 */
export function getRoleOptions() {
  return BASE_ROLES_ARRAY.map(role => ({
    value: role,
    label: ROLE_LABELS[role],
    description: ROLE_DESCRIPTIONS[role],
  }));
}

// ============================================================================
// UI DISPLAY HELPERS (shared)
// ============================================================================

/**
 * Format a base role value for UI display without changing the underlying value
 * Example: 'CityAdmin' -> 'Location Administrator'
 */
export function formatRoleDisplay(role: string): string {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'Super Administrator';
    case ROLES.SUPER_ADMIN_PLUS:
      return 'Super Administrator Plus';
    case ROLES.VOLUNTEER_ADMIN:
      return 'Volunteer Administrator';
    case ROLES.CITY_ADMIN:
      return 'Location Administrator';
    case ROLES.SWEP_ADMIN:
      return 'SWEP Administrator';
    case ROLES.ORG_ADMIN:
      return 'Organisation Administrator';
    default:
      return role;
  }
}

/**
 * Format a specific claim value for UI display without changing the underlying value
 * Examples:
 *  - 'CityAdminFor:manchester' -> 'Location Administrator: manchester'
 *  - 'SwepAdminFor:birmingham' -> 'SWEP Administrator: birmingham'
 *  - 'AdminFor:org-slug' -> 'Organisation Administrator: org-slug'
 */
export function formatClaimDisplay(claim: string): string {
  if (claim.startsWith(ROLE_PREFIXES.CITY_ADMIN_FOR)) {
    return claim.replace(ROLE_PREFIXES.CITY_ADMIN_FOR, 'Location Administrator: ');
  }
  if (claim.startsWith(ROLE_PREFIXES.SWEP_ADMIN_FOR)) {
    return claim.replace(ROLE_PREFIXES.SWEP_ADMIN_FOR, 'SWEP Administrator: ');
  }
  if (claim.startsWith(ROLE_PREFIXES.ADMIN_FOR)) {
    return claim.replace(ROLE_PREFIXES.ADMIN_FOR, 'Organisation Administrator: ');
  }
  return claim;
}

// ============================================================================
// VALIDATION REGEX
// ============================================================================

/**
 * Regular expression pattern for validating role formats
 * Matches: SuperAdmin, CityAdmin, CityAdminFor:*, AdminFor:*, SwepAdmin, SwepAdminFor:*, OrgAdmin, VolunteerAdmin
 */
export const ROLE_VALIDATION_PATTERN = /^(SuperAdmin|SuperAdminPlus|CityAdmin|CityAdminFor:.+|VolunteerAdmin|SwepAdmin|SwepAdminFor:.+|OrgAdmin|AdminFor:.+)$/;