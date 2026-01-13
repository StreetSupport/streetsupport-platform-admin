import { UserAuthClaims, UserRole, HttpMethod, ApiEndpointPermission } from '@/types/auth';
import { authenticatedFetch } from './api';
import { JWT } from 'next-auth/jwt';
import {
  ROLES,
  ROLE_PREFIXES,
  EXCLUSIVE_BASE_ROLES,
  isBaseRole,
  isLocationSpecificRole,
  isOrgSpecificRole
} from '@/constants/roles';

export interface ApiUser {
  _id: string;
  Auth0Id: string;
  UserName: string;
  Email: Buffer | string;
  AuthClaims: string[];
  AssociatedAreaId: string;
  AssociatedProviderLocationIds: string[];
  IsActive: boolean;
}

/**
 * Fetch user data from the API by Auth0 ID
 */
export async function fetchUserByAuth0Id(auth0Id: string, token: JWT): Promise<ApiUser | null> {
  try {
    const result = await authenticatedFetch(`/api/users/auth0/${auth0Id}`, token);
    return result.success ? result.data : null;
  } catch (error) {
    // Gracefully handle cases where the user is not authenticated yet
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      console.warn(`Authentication required to fetch user by Auth0 ID: ${auth0Id}`);
    } else {
      console.error('Error fetching user by Auth0 ID:', error);
    }
    return null;
  }
}

/**
 * Parse AuthClaims array into structured role information
 */
export function parseAuthClaims(authClaims: string[]): UserAuthClaims {
  const roles: UserRole[] = [];
  const specificClaims: string[] = [];

  for (const claim of authClaims) {
    // Check for base role claims
    if (isBaseRole(claim)) {
      roles.push(claim);
    } else if (isLocationSpecificRole(claim) || isOrgSpecificRole(claim)) {
      // Specific claims like "CityAdminFor:birmingham" or "AdminFor:org-slug" or "SwepAdminFor:birmingham"
      specificClaims.push(claim);
    }
  }

  return { roles, specificClaims };
}

/**
 * Interface for individual role display
 */
export interface RoleDisplay {
  id: string;
  label: string;
  type: 'base' | 'location' | 'org';
  baseRole?: string; // For location/org roles, the parent base role (e.g., 'CityAdmin')
  specificValue?: string; // For location/org roles, the specific value (e.g., 'birmingham')
  canRemove: boolean;
}

/**
 * Parse AuthClaims into individual role displays for UI
 * Each CityAdminFor:, SwepAdminFor:, AdminFor: shown separately
 */
export function parseAuthClaimsForDisplay(authClaims: string[]): RoleDisplay[] {
  const roleDisplays: RoleDisplay[] = [];
  
  // Parse claims
  const cityAdminClaims: string[] = [];
  const swepAdminClaims: string[] = [];
  const orgAdminClaims: string[] = [];
  let hasCityAdmin = false;
  let hasSwepAdmin = false;
  let hasOrgAdmin = false;
  let hasSuperAdmin = false;
  let hasVolunteerAdmin = false;

  for (const claim of authClaims) {
    if (claim === ROLES.SUPER_ADMIN) {
      hasSuperAdmin = true;
    } else if (claim === ROLES.CITY_ADMIN) {
      hasCityAdmin = true;
    } else if (claim === ROLES.SWEP_ADMIN) {
      hasSwepAdmin = true;
    } else if (claim === ROLES.ORG_ADMIN) {
      hasOrgAdmin = true;
    } else if (claim === ROLES.VOLUNTEER_ADMIN) {
      hasVolunteerAdmin = true;
    } else if (claim.startsWith(ROLE_PREFIXES.CITY_ADMIN_FOR)) {
      cityAdminClaims.push(claim);
    } else if (claim.startsWith(ROLE_PREFIXES.SWEP_ADMIN_FOR)) {
      swepAdminClaims.push(claim);
    } else if (claim.startsWith(ROLE_PREFIXES.ADMIN_FOR)) {
      orgAdminClaims.push(claim);
    }
  }

  // Add SuperAdmin
  if (hasSuperAdmin) {
    roleDisplays.push({
      id: ROLES.SUPER_ADMIN,
      label: 'Super Administrator',
      type: 'base',
      canRemove: true
    });
  }

  // Add VolunteerAdmin
  if (hasVolunteerAdmin) {
    roleDisplays.push({
      id: ROLES.VOLUNTEER_ADMIN,
      label: 'Volunteer Administrator',
      type: 'base',
      canRemove: true
    });
  }

  // Add CityAdmin (only if has CityAdminFor claims)
  if (hasCityAdmin && cityAdminClaims.length > 0) {
    roleDisplays.push({
      id: ROLES.CITY_ADMIN,
      label: 'Location Administrator',
      type: 'base',
      baseRole: ROLES.CITY_ADMIN,
      canRemove: false // Auto-managed based on CityAdminFor
    });
  }

  // Add individual CityAdminFor claims
  cityAdminClaims.forEach(claim => {
    const location = claim.replace(ROLE_PREFIXES.CITY_ADMIN_FOR, '');
    roleDisplays.push({
      id: claim,
      label: `Location Administrator: ${location}`,
      type: 'location',
      baseRole: ROLES.CITY_ADMIN,
      specificValue: location,
      canRemove: true
    });
  });

  // Add SwepAdmin (only if has SwepAdminFor claims)
  if (hasSwepAdmin && swepAdminClaims.length > 0) {
    roleDisplays.push({
      id: ROLES.SWEP_ADMIN,
      label: 'SWEP Administrator',
      type: 'base',
      baseRole: ROLES.SWEP_ADMIN,
      canRemove: false // Auto-managed based on SwepAdminFor
    });
  }

  // Add individual SwepAdminFor claims
  swepAdminClaims.forEach(claim => {
    const location = claim.replace(ROLE_PREFIXES.SWEP_ADMIN_FOR, '');
    roleDisplays.push({
      id: claim,
      label: `SWEP Administrator: ${location}`,
      type: 'location',
      baseRole: ROLES.SWEP_ADMIN,
      specificValue: location,
      canRemove: true
    });
  });

  // Add OrgAdmin (only if has AdminFor claims)
  if (hasOrgAdmin && orgAdminClaims.length > 0) {
    roleDisplays.push({
      id: ROLES.ORG_ADMIN,
      label: 'Organisation Administrator',
      type: 'base',
      baseRole: ROLES.ORG_ADMIN,
      canRemove: true // Can be removed in edit mode
    });
  }

  // Add individual AdminFor claims
  orgAdminClaims.forEach(claim => {
    const org = claim.replace(ROLE_PREFIXES.ADMIN_FOR, '');
    roleDisplays.push({
      id: claim,
      label: `Organisation Administrator: ${org}`,
      type: 'org',
      baseRole: ROLES.ORG_ADMIN,
      specificValue: org,
      canRemove: true
    });
  });

  return roleDisplays;
}

/**
 * Check if user has generic SwepAdmin role without specific location
 * These are legacy records that need to be updated
 * @param authClaims - User's auth claims array
 * @returns true if user has generic SwepAdmin without SwepAdminFor: claims
 */
export function hasGenericSwepAdmin(authClaims: string[]): boolean {
  const hasSwepAdmin = authClaims.includes(ROLES.SWEP_ADMIN);
  const hasSpecificSwepAdmin = authClaims.some(claim => claim.startsWith(ROLE_PREFIXES.SWEP_ADMIN_FOR));
  return hasSwepAdmin && !hasSpecificSwepAdmin;
}

/**
 * Check if a role can be removed based on business rules
 * @param roleId - The role ID to check
 * @param allRoles - All current role displays
 * @returns true if the role can be removed
 */
export function canRemoveRole(roleId: string, allRoles: RoleDisplay[]): boolean {
  // Count role groups
  const cityAdminRoles = allRoles.filter(r => r.baseRole === ROLES.CITY_ADMIN || r.id === ROLES.CITY_ADMIN);
  const swepAdminRoles = allRoles.filter(r => r.baseRole === ROLES.SWEP_ADMIN || r.id === ROLES.SWEP_ADMIN);
  const orgAdminRoles = allRoles.filter(r => r.baseRole === ROLES.ORG_ADMIN || r.id === ROLES.ORG_ADMIN);
  const otherRoles = allRoles.filter(r => 
    r.type === 'base' && 
    r.id !== ROLES.CITY_ADMIN && 
    r.id !== ROLES.SWEP_ADMIN && 
    r.id !== ROLES.ORG_ADMIN
  );

  // Calculate effective role groups (treating related roles as one group)
  const roleGroups: number[] = [];
  if (cityAdminRoles.length > 0) roleGroups.push(cityAdminRoles.length);
  if (swepAdminRoles.length > 0) roleGroups.push(swepAdminRoles.length);
  if (orgAdminRoles.length > 0) roleGroups.push(orgAdminRoles.length);
  roleGroups.push(...otherRoles.map(() => 1));

  const totalGroups = roleGroups.length;

  // CityAdmin and SwepAdmin and OrgAdmin base roles can't be manually removed (they're auto-managed)
  if (roleId === ROLES.CITY_ADMIN || roleId === ROLES.SWEP_ADMIN || roleId === ROLES.ORG_ADMIN) {
    return false;
  }

  // For location-specific roles, check if there are multiple of the same type
  const roleToCheck = allRoles.find(r => r.id === roleId);
  if (roleToCheck?.type === 'location') {
    // Get all location roles of the same base type
    const sameTypeRoles = allRoles.filter(r => 
      r.type === 'location' && r.baseRole === roleToCheck.baseRole
    );
    
    // If this is the only location role of its type AND it's the only role group, can't remove
    if (sameTypeRoles.length === 1 && totalGroups === 1) {
      return false;
    }
    
    // Can remove if there are other location roles of the same type OR other role groups
    return true;
  }

  // For org-specific roles, check if there are multiple of the same type
  if (roleToCheck?.type === 'org') {
    // Get all org roles
    const sameTypeRoles = allRoles.filter(r => 
      r.type === 'org' && r.baseRole === ROLES.ORG_ADMIN
    );
    
    // If this is the only org role AND it's the only role group, can't remove
    if (sameTypeRoles.length === 1 && totalGroups === 1) {
      return false;
    }
    
    // Can remove if there are other org roles OR other role groups
    return true;
  }

  // Can't remove if it's the last role group
  if (totalGroups === 1) {
    return false;
  }

  return true;
}

/**
 * Get the unique base role types from role displays
 * Used to detect role conflicts (users can only have one exclusive base role type)
 * @param roleDisplays - Array of role displays from the UI
 * @returns Array of unique base role types found
 */
export function getBaseRoleTypes(roleDisplays: RoleDisplay[]): string[] {
  const baseTypes = new Set<string>();

  for (const role of roleDisplays) {
    // For base roles like SuperAdmin, VolunteerAdmin (which don't have a baseRole property)
    if (role.type === 'base' && EXCLUSIVE_BASE_ROLES.includes(role.id as typeof EXCLUSIVE_BASE_ROLES[number])) {
      baseTypes.add(role.id);
    }
    // For location/org roles, use the baseRole property
    else if (role.baseRole && EXCLUSIVE_BASE_ROLES.includes(role.baseRole as typeof EXCLUSIVE_BASE_ROLES[number])) {
      baseTypes.add(role.baseRole);
    }
  }

  return Array.from(baseTypes);
}

/**
 * Check if user has access to a specific page
 */
export function hasPageAccess(userAuthClaims: UserAuthClaims, page: string): boolean {
  // SuperAdmin has access to everything
  if (userAuthClaims.roles.includes(ROLES.SUPER_ADMIN)) {
    return true;
  }

  // Check role-based page access
  for (const role of userAuthClaims.roles) {
    const permissions = getRolePermissions(role);
    if (permissions.pages.includes(page) || permissions.pages.includes('*')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has access to a specific API endpoint
 */
export function hasApiAccess(
  userAuthClaims: UserAuthClaims, 
  endpoint: string, 
  method: HttpMethod
): boolean {
  // SuperAdmin has access to everything if configured with a wildcard
  if (userAuthClaims.roles.includes(ROLES.SUPER_ADMIN)) {
    return true;
  }
  
  // Check role-based API access
  for (const role of userAuthClaims.roles) {
    const permissions = getRolePermissions(role);
    for (const p of permissions.apiEndpoints) {
      const permission = p as ApiEndpointPermission;
        if (permission.path === endpoint || permission.path === '*') {
          if (permission.methods.includes(method) || permission.methods.includes('*')) {
            // TODO: Add logic for params check if needed in the future
            return true;
          }
        }
    }
  }

  return false;
}

import { ROLE_PERMISSIONS } from '@/types/auth';

function getRolePermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role] || { pages: [], apiEndpoints: [] };
}
