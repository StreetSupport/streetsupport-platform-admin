import { UserAuthClaims, UserRole, HttpMethod, ApiEndpointPermission } from '@/types/auth';
import { authenticatedFetch } from './api';
import { JWT } from 'next-auth/jwt';

export interface ApiUser {
  _id: string;
  Auth0Id: string;
  UserName: string;
  Email: Buffer | string;
  AuthClaims: string[];
  AssociatedAreaId: string;
  AssociatedProviderLocationIds: string[];
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
    // Check for general role claims
    if (claim === 'SuperAdmin') {
      roles.push('SuperAdmin');
    } else if (claim === 'CityAdmin') {
      roles.push('CityAdmin');
    } else if (claim === 'VolunteerAdmin') {
      roles.push('VolunteerAdmin');
    } else if (claim === 'OrgAdmin') {
      roles.push('OrgAdmin');
    } else if (claim === 'SwepAdmin') {
      roles.push('SwepAdmin');
    } else if (claim.includes('AdminFor:') || claim.includes('CityAdminFor:')|| claim.includes('SwepAdminFor:')) {
      // Specific claims like "CityAdminFor:birmingham" or "AdminFor:org-slug" or "SwepAdminFor:birmingham"
      specificClaims.push(claim);
    }
  }

  return { roles, specificClaims };
}

/**
 * Check if user has access to a specific page
 */
export function hasPageAccess(userAuthClaims: UserAuthClaims, page: string): boolean {
  // SuperAdmin has access to everything
  if (userAuthClaims.roles.includes('SuperAdmin')) {
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
  if (userAuthClaims.roles.includes('SuperAdmin')) {
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
