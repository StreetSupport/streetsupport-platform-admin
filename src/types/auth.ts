// Role definitions for RBAC system
export type UserRole = 
  | 'SuperAdmin'
  | 'CityAdmin' 
  | 'VolunteerAdmin'
  | 'OrgAdmin'
  | 'SwepAdmin';

export interface RolePermissions {
  pages: string[];
  apiEndpoints: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SuperAdmin: {
    pages: ['/', '/cities', '/organisations', '/content', '/users', '/resources'],
    apiEndpoints: ['/api/categories', '/api/cities', '/api/service-providers', '/api/faqs', '/api/users']
  },
  CityAdmin: {
    pages: ['/cities', '/resources'],
    apiEndpoints: ['/api/cities']
  },
  VolunteerAdmin: {
    pages: ['/content'],
    apiEndpoints: ['/api/faqs']
  },
  OrgAdmin: {
    pages: ['/organisations'],
    apiEndpoints: ['/api/service-providers']
  },
  SwepAdmin: {
    pages: ['/users'],
    apiEndpoints: ['/api/users']
  }
};

export interface UserAuthClaims {
  roles: UserRole[];
  specificClaims: string[]; // e.g., "CityAdminFor:birmingham", "AdminFor:org-slug"
}

export interface ExtendedUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  authClaims: UserAuthClaims;
  auth0Id: string;
}
