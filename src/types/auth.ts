// Role definitions for RBAC system
export type UserRole = 
  | 'SuperAdmin'
  | 'CityAdmin' 
  | 'VolunteerAdmin'
  | 'OrgAdmin'
  | 'SwepAdmin';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | '*';

export interface ApiEndpointPermission {
  path: string;
  methods: HttpMethod[];
  params?: {
    [key: string]: string | string[];
  };
}

export interface RolePermissions {
  pages: string[];

  apiEndpoints: ApiEndpointPermission[];
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SuperAdmin: {
    pages: ['*'],
    apiEndpoints: [{ path: '*', methods: ['*'] }]
  },
  CityAdmin: {
    pages: ['/cities', '/organisations', '/advice', '/banners', '/swep-banners', '/users', '/resources'],
    apiEndpoints: [
      { path: '/api/cities', methods: ['*'] },
      { path: '/api/service-providers', methods: ['*'] },
      { path: '/api/services', methods: ['*'] },
      { path: '/api/faqs', methods: ['*'] },
      { path: '/api/banners', methods: ['*'] },
      { path: '/api/swep-banners', methods: ['*'] },
      { path: '/api/resources', methods: ['*'] },
      { path: '/api/users', methods: ['*'] }
    ]
  },
  VolunteerAdmin: {
    pages: ['/cities', '/organisations', '/advice', '/banners', '/swep-banners', '/users', '/resources'],
    apiEndpoints: [
      { path: '/api/cities', methods: ['GET', 'POST', 'PUT', 'PATCH'] },
      { path: '/api/service-providers', methods: ['GET', 'POST', 'PUT', 'PATCH'] },
      { path: '/api/services', methods: ['GET', 'POST', 'PUT', 'PATCH'] },
      { path: '/api/faqs', methods: ['GET', 'POST', 'PUT', 'PATCH'] },
      { path: '/api/banners', methods: ['GET', 'POST', 'PUT', 'PATCH'] },
      { path: '/api/swep-banners', methods: ['GET', 'POST', 'PUT', 'PATCH'] },
      { path: '/api/resources', methods: ['GET', 'POST', 'PUT', 'PATCH'] },
      { path: '/api/users', methods: ['GET', 'POST', 'PUT', 'PATCH'] }
    ]
  },
  OrgAdmin: {
    pages: ['/organisations'],
    apiEndpoints: [
      { path: '/api/service-providers', methods: ['*'] },
      { path: '/api/services', methods: ['*'] },
      { path: '/api/users', methods: ['POST'] },
    ]
  },
  SwepAdmin: {
    pages: ['/swep-banners'],
    apiEndpoints: [{ path: '/api/swep-banners', methods: ['*'] }]
  }
};

export interface UserAuthClaims {
  roles: UserRole[];
  specificClaims: string[]; // e.g., "CityAdminFor:birmingham", "AdminFor:org-slug", "SwepAdminFor:birmingham"
}

export interface ExtendedUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  authClaims: UserAuthClaims;
  auth0Id: string;
}
