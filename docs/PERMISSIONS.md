# Permission System Documentation

This document describes the role-based access control (RBAC) system used across the Street Support Admin and API platforms.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Role Definitions](#role-definitions)
3. [User Creation Flow](#user-creation-flow)
4. [Authentication Flow](#authentication-flow)
5. [Admin-Side Access Control](#admin-side-access-control)
6. [API-Side Access Control](#api-side-access-control)
7. [Environment Variables](#environment-variables)
8. [Related Files](#related-files)

---

## Overview

The permission system uses a **claims-based model** stored in MongoDB. Users have an `AuthClaims` array containing:
- **Base roles**: `SuperAdmin`, `CityAdmin`, `VolunteerAdmin`, `OrgAdmin`, `SwepAdmin`
- **Specific claims**: `CityAdminFor:manchester`, `AdminFor:org-slug`, `SwepAdminFor:birmingham`

Both Admin (NextAuth) and API (Express middleware) validate these claims for access control.

---

## Role Definitions

### Base Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `SuperAdmin` | Full platform access | All pages, all API endpoints |
| `SuperAdminPlus` | SuperAdmin with extended privileges | All SuperAdmin access + organisation deletion |
| `CityAdmin` | Location-specific administrator | Pages/APIs for assigned locations |
| `VolunteerAdmin` | Volunteer management | Organisation management, content creation |
| `OrgAdmin` | Organisation-specific administrator | Own organisation only |
| `SwepAdmin` | SWEP banner management | SWEP banners for assigned locations |

### Special Notes on SuperAdminPlus

- **Cannot be created through UI**: This role must be manually assigned in MongoDB and Auth0
- **Organisation Deletion**: Only SuperAdminPlus can delete organisations and their related data
- **Cannot be removed through UI**: The role removal is disabled in the Edit User modal

### Role Prefixes (Specific Claims)

| Prefix | Format | Example |
|--------|--------|---------|
| `CityAdminFor:` | `CityAdminFor:{locationSlug}` | `CityAdminFor:manchester` |
| `AdminFor:` | `AdminFor:{organisationKey}` | `AdminFor:shelter-org` |
| `SwepAdminFor:` | `SwepAdminFor:{locationSlug}` | `SwepAdminFor:birmingham` |

### Role Hierarchy

```
SuperAdminPlus (SuperAdmin + organisation deletion)
    ↓
SuperAdmin
    ↓ (Full access)
VolunteerAdmin
    ↓ (Organisation management across all locations)
CityAdmin + CityAdminFor:*
    ↓ (Location-specific access)
SwepAdmin + SwepAdminFor:*
    ↓ (SWEP banners for specific locations)
OrgAdmin + AdminFor:*
    ↓ (Single organisation access)
```

### Page Access by Role

| Page | SuperAdmin | SuperAdminPlus | CityAdmin | VolunteerAdmin | OrgAdmin | SwepAdmin |
|------|------------|----------------|-----------|----------------|----------|-----------|
| `/cities` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/organisations` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/users` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/banners` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/swep-banners` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/advice` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/location-logos` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/resources` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

### Organisation Actions by Role

| Action | SuperAdmin | SuperAdminPlus | CityAdmin | VolunteerAdmin | OrgAdmin |
|--------|------------|----------------|-----------|----------------|----------|
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publish/Disable | ✅ | ✅ | ✅ | ✅ | ❌ |
| Verify | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Delete** | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## User Creation Flow

### Step 1: Create User in Auth0

The API creates users in Auth0 using the Management API:

```typescript
// auth0Service.ts
export async function createAuth0User(
  email: string,
  authClaims: string[]
): Promise<Auth0UserResponse> {
  // 1. Get Management API token
  const accessToken = await getAuth0ManagementToken();
  
  // 2. Generate temporary password
  const password = generateTempPassword();
  
  // 3. Create user in Auth0
  const createUserRequest = {
    connection: AUTH0_USER_DB_CONNECTION,
    email: email,
    name: email,
    password: password,
    email_verified: false,
    verify_email: true,  // Sends verification email
    app_metadata: {
      authorization: {
        roles: authClaims  // Store roles in Auth0
      }
    }
  };
  
  const response = await fetch(`https://${domain}/api/v2/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createUserRequest)
  });
  
  return response.json();
}
```

### Step 2: Create User in MongoDB

After Auth0 user creation, the API creates a corresponding MongoDB document:

```typescript
// userController.ts
const userData = {
  Auth0Id: auth0User.user_id.replace('auth0|', ''),
  UserName: email,
  Email: encryptEmail(email),  // Email is encrypted
  AuthClaims: authClaims,
  CreatedBy: req.user?._id,
  IsActive: true,
  AssociatedProviderLocationIds: []  // Populated for OrgAdmin users
};

const user = await User.create(userData);
```

### Step 3: Email Verification

1. Auth0 sends verification email automatically (`verify_email: true`)
2. User clicks verification link
3. User sets their password via Auth0 password reset
4. User can now log in to the Admin panel

### Role Validation During User Creation

The API validates role assignments based on the creator's permissions:

```typescript
// authMiddleware.ts - requireUserCreationAccess
// SuperAdmin can assign any role
if (userAuthClaims.includes(ROLES.SUPER_ADMIN) || userAuthClaims.includes(ROLES.SUPER_ADMIN_PLUS)) {
  return next();
}

// CityAdmin cannot assign SuperAdmin or VolunteerAdmin
if (userAuthClaims.includes(ROLES.CITY_ADMIN)) {
  if (newUserClaims.includes(ROLES.SUPER_ADMIN) || 
      newUserClaims.includes(ROLES.VOLUNTEER_ADMIN) ||
      newUserClaims.includes(ROLES.VOLUNTEER_ADMIN_PLUS)) {
    return sendForbidden(res, 'CityAdmin cannot assign SuperAdmin or VolunteerAdmin roles');
  }
}

// OrgAdmin can only create users for their own organisation
if (userAuthClaims.includes(ROLES.ORG_ADMIN)) {
  const userOrgClaims = userAuthClaims.filter(c => c.startsWith('AdminFor:'));
  if (!userOrgClaims.includes(newAdminForClaims[0])) {
    return sendForbidden(res, 'OrgAdmin can only create users for organizations they manage');
  }
}
```

---

## Authentication Flow

### Admin Panel (NextAuth)

```
User → Auth0 Login → NextAuth → JWT Token → Session
                                    ↓
                         Fetch user from MongoDB
                                    ↓
                         Parse AuthClaims → Session
```

**Implementation** (`src/lib/auth.ts`):

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER_BASE_URL!,
      authorization: {
        params: {
          audience: process.env.AUTH0_AUDIENCE!,
          scope: 'openid profile email',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        // Fetch user from MongoDB
        const apiUser = await fetchUserByAuth0Id(token.auth0Id, token);
        
        if (apiUser) {
          // Check if user is active
          if (apiUser.IsActive === false) {
            throw new Error('User account is deactivated');
          }
          
          // Parse claims into structured format
          token.authClaims = parseAuthClaims(apiUser.AuthClaims);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.authClaims = token.authClaims as UserAuthClaims;
      session.accessToken = token.accessToken as string;
      return session;
    },
  }
};
```

### API (Express Middleware)

```
Request → Bearer Token → JWT Decode → Find User in MongoDB → Validate IsActive → Attach to req.user
```

**Implementation** (`src/middleware/authMiddleware.ts`):

```typescript
export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'Access token required');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.decode(token) as JwtPayload;
  
  if (!decoded || !decoded.sub) {
    return sendUnauthorized(res, 'Invalid token');
  }

  // Find user in MongoDB
  const user = await User.findOne({ 
    Auth0Id: decoded.sub.replace('auth0|', '') 
  }).lean();

  if (!user) {
    return sendUnauthorized(res, 'User not found');
  }

  // Check if user is active
  if (user.IsActive === false) {
    return sendUnauthorized(res, 'User account is deactivated');
  }

  req.user = user;
  next();
});
```

---

## Admin-Side Access Control

### Page-Level Protection

Using the `useAuthorization` hook:

```typescript
// Example: Banners page
export default function BannersPage() {
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SUPER_ADMIN_PLUS, ROLES.CITY_ADMIN, ROLES.VOLUNTEER_ADMIN],
    requiredPage: '/banners',
    autoRedirect: true
  });

  if (isChecking) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return null; // Redirect handled by hook
  }

  return <BannersContent />;
}
```

### API Access Control

Using `hasApiAccess` function:

```typescript
// src/lib/userService.ts
export function hasApiAccess(
  userAuthClaims: UserAuthClaims, 
  endpoint: string, 
  method: HttpMethod
): boolean {
  // SuperAdmin has access to everything
  if (userAuthClaims.roles.includes(ROLES.SUPER_ADMIN) || userAuthClaims.roles.includes(ROLES.SUPER_ADMIN_PLUS)) {
    return true;
  }
  
  // Check role-based API access
  for (const role of userAuthClaims.roles) {
    const permissions = getRolePermissions(role);
    for (const p of permissions.apiEndpoints) {
      if (p.path === endpoint || p.path === '*') {
        if (p.methods.includes(method) || p.methods.includes('*')) {
          return true;
        }
      }
    }
  }

  return false;
}
```

### Role Permissions Configuration

```typescript
// src/types/auth.ts
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [ROLES.SUPER_ADMIN_PLUS]: {
    pages: ['*'],
    apiEndpoints: [{ path: '*', methods: ['*'] }]
  },
  [ROLES.SUPER_ADMIN]: {
    pages: ['*'],
    apiEndpoints: [
      { path: '/api/cities', methods: ['*'] },
      { path: '/api/organisations', methods: [HTTP_METHODS.GET, HTTP_METHODS.POST, HTTP_METHODS.PUT, HTTP_METHODS.PATCH] },
      { path: '/api/services', methods: ['*'] },
      { path: '/api/accommodations', methods: ['*'] },
      { path: '/api/faqs', methods: ['*'] },
      { path: '/api/banners', methods: ['*'] },
      { path: '/api/location-logos', methods: ['*'] },
      { path: '/api/swep-banners', methods: ['*'] },
      { path: '/api/resources', methods: ['*'] },
      { path: '/api/users', methods: ['*'] },
      { path: '/api/service-categories', methods: ['*'] },
    ]
  },
  [ROLES.CITY_ADMIN]: {
    pages: ['/cities', '/organisations', '/advice', '/banners', '/location-logos', '/swep-banners', '/users'],
    apiEndpoints: [
      { path: '/api/cities', methods: ['*'] },
      { path: '/api/organisations', methods: ['*'] },
      { path: '/api/banners', methods: ['*'] },
      // ... more endpoints
    ]
  },
  // ... other roles
};
```

---

## API-Side Access Control

### authMiddleware.ts Overview

The `src/middleware/authMiddleware.ts` file centralises all API-side authentication and authorisation logic:

- **Global helpers**
  - `handleSuperAdminAccess` / `handleVolunteerAdminAccess` – grant full access shortcuts for `SuperAdmin` and `VolunteerAdmin`
  - `ensureAuthenticated` – returns a 401 response if `req.user` is missing
  - `validateUserRoles` – validates that new users have a consistent `AuthClaims` configuration
  - Location/org helpers: `hasOrgAdminAccess`, `hasCityAdminLocationAccess`, `validateCityAdminLocationsAccess`, `validateSwepAndCityAdminLocationsAccess`
- **Authentication**
  - `authenticate` – decodes the Auth0 JWT, loads the MongoDB user, enforces `IsActive`, then attaches the full user document to `req.user`
- **Generic role middleware**
  - `requireRole(allowedRoles)` – checks that the current user has at least one of the allowed base roles
- **Resource-specific access control**
  - Organisations: `requireOrganisationAccess`, `requireVerifyOrganisationAccess`, `requireOrganisationByKeyAccess`
  - Services & grouped services: `requireServiceAccess`, `requireServicesByProviderAccess`
  - Accommodations: `requireAccommodationsAccess`, `requireAccommodationsByProviderAccess`
  - FAQs: `requireFaqAccess`, `requireFaqLocationAccess`
- **User creation rules**
  - `requireUserCreationAccess` – enforces which roles can create which other roles, and validates that:
    - `SuperAdmin` can create any user
    - `CityAdmin` cannot create `SuperAdmin` or `VolunteerAdmin`
    - `OrgAdmin` can only create users for organisations they manage and cannot assign admin-level roles
    - `VolunteerAdmin` can only create organisation-specific users (for example `OrgAdmin` with `AdminFor:*` claims)

Each public middleware exported from this file is designed to be **composed** with `authenticate` so that every protected route:

- Validates the JWT and `IsActive` flag
- Ensures a user is present on `req.user`
- Applies role- and resource-specific checks before calling the controller

### Combined Middleware Pattern

```typescript
// Example: Organisations endpoint
export const organisationsAuth = [
  authenticate,              // Verify JWT and load user
  requireOrganisationAccess  // Check role-based access
];

// Usage in routes
router.get('/', organisationsAuth, getAllOrganisations);
router.post('/', organisationsAuth, createOrganisation);
```

### Location-Based Access Check

```typescript
// authMiddleware.ts
const hasCityAdminLocationAccess = (
  userAuthClaims: string[], 
  locationIds: string[]
): boolean => {
  if (!userAuthClaims.includes(ROLES.CITY_ADMIN)) {
    return false;
  }
  return locationIds.some(locationId =>
    userAuthClaims.includes(`${ROLE_PREFIXES.CITY_ADMIN_FOR}${locationId}`)
  );
};
```

### Organisation-Based Access Check

```typescript
const hasOrgAdminAccess = (
  userAuthClaims: string[], 
  orgKey: string
): boolean => {
  if (!userAuthClaims.includes(ROLES.ORG_ADMIN)) {
    return false;
  }
  const orgAdminClaim = `${ROLE_PREFIXES.ADMIN_FOR}${orgKey}`;
  return userAuthClaims.includes(orgAdminClaim);
};
```

---

## Environment Variables

### API Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `AUTH0_DOMAIN` | Auth0 tenant domain | Auth0 Dashboard → Settings |
| `AUTH0_AUDIENCE` | API identifier | Auth0 Dashboard → APIs |
| `AUTH0_USER_DB_CONNECTION` | Database connection name | Auth0 Dashboard → Connections → Database |
| `AUTH0_MANAGEMENT_CLIENT_ID` | Management API client ID | Auth0 Dashboard → Applications → API Explorer |
| `AUTH0_MANAGEMENT_CLIENT_SECRET` | Management API client secret | Auth0 Dashboard → Applications → API Explorer |
| `AUTH0_MANAGEMENT_AUDIENCE` | Management API audience | `https://{domain}/api/v2/` |

### Admin Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `AUTH0_SECRET` | NextAuth encryption secret | Generate with `openssl rand -base64 32` |
| `AUTH0_BASE_URL` | Admin panel base URL | Your deployment URL |
| `NEXTAUTH_URL` | NextAuth callback URL | Same as AUTH0_BASE_URL |
| `AUTH0_ISSUER_BASE_URL` | Auth0 issuer URL | `https://{AUTH0_DOMAIN}` |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | Auth0 Dashboard → Applications |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | Auth0 Dashboard → Applications |
| `AUTH0_AUDIENCE` | API identifier | Auth0 Dashboard → APIs |

---

## Related Files

### Admin Side

| File | Description |
|------|-------------|
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/userService.ts` | User fetching and role parsing |
| `src/types/auth.ts` | Role permissions configuration |
| `src/constants/roles.ts` | Role constants and helpers |
| `src/hooks/useAuthorization.ts` | Authorization hook for pages |
| `src/components/RoleGuard.tsx` | Role-based component wrapper |

### API Side

| File | Description |
|------|-------------|
| `src/middleware/authMiddleware.ts` | Authentication and authorization middleware |
| `src/config/auth0.ts` | Auth0 configuration |
| `src/services/auth0Service.ts` | Auth0 Management API service |
| `src/controllers/userController.ts` | User CRUD operations |
| `src/models/userModel.ts` | User MongoDB model |
| `src/constants/roles.ts` | Role constants (mirrored from Admin) |

---

## Security Considerations

### Deactivated User Handling

Users can be deactivated (`IsActive: false`), which:
1. Prevents API access immediately (middleware check)
2. Prevents new sign-ins (NextAuth callback check)
3. Auto-signs out active sessions on next API call

### Email Encryption

User emails are encrypted in MongoDB using AES encryption:
```typescript
const encryptEmail = (email: string): Buffer => {
  // Encryption logic
};
```

### Role Validation

- Roles are validated on creation to prevent privilege escalation
- CityAdmin cannot create SuperAdmin users
- OrgAdmin can only create users for their own organisation
- VolunteerAdmin can create OrgAdmin users for any organisation

---

## Troubleshooting

### User Cannot Log In
1. Check `IsActive` flag in MongoDB
2. Verify Auth0 user exists and is not blocked
3. Check AuthClaims array is not empty

### 403 Forbidden Errors
1. Verify user has required role for the endpoint
2. Check location-specific claims match the resource
3. Verify RBAC middleware is correctly applied to route

### Session Not Updating After Role Change
1. User needs to log out and log back in
2. JWT token contains cached role information
3. Clear browser session storage if needed
