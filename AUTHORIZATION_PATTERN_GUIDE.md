# Authorization Pattern Guide

## Problem Statement

The previous `RoleGuard` component used `useEffect` for authorization checks, which meant:
- ❌ Page components rendered immediately
- ❌ API calls were made before authorization was verified
- ❌ UI (headers, breadcrumbs) was visible briefly before redirect
- ❌ Error toasts displayed from failed API calls
- ❌ Poor user experience with flashing content

## Solution

We now provide **two authorization patterns** that check permissions **before** rendering any content:

### 1. **useAuthorization Hook** (For Complex Pages)
Best for pages with `useEffect`, API calls, and complex state management.

### 2. **withAuthorization HOC** (For Simple Pages)
Best for simple pages without effects or minimal logic.

---

## Pattern 1: useAuthorization Hook

### When to Use
- ✅ Pages with `useEffect` hooks
- ✅ Pages making API calls on mount
- ✅ Complex state management
- ✅ Need fine-grained control over authorization logic

### Implementation Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';

export default function UsersPage() {
  // 1. Check authorization FIRST before any other logic
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
    requiredPage: '/users',
    autoRedirect: true
  });

  // 2. State and other hooks
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. Effects run ONLY if authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
    }
  }, [isAuthorized]);

  // 4. Show loading during authorization check
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 brand-a"></div>
      </div>
    );
  }

  // 5. Return null if not authorized (redirect handled by hook)
  if (!isAuthorized) {
    return null;
  }

  // 6. Render protected content - API calls safe here
  return (
    <div>
      <h1>Users Page</h1>
      {/* Your content here */}
    </div>
  );
}
```

### Key Points
- ✅ No `RoleGuard` wrapper needed
- ✅ No API calls until `isAuthorized === true`
- ✅ No UI rendering until authorization complete
- ✅ Clean separation of authorization and business logic

---

## Pattern 2: withAuthorization HOC

### When to Use
- ✅ Simple pages without effects
- ✅ Minimal or no API calls
- ✅ Static or mostly static content
- ✅ Cleaner code with less boilerplate

### Implementation Example

```tsx
'use client';

import { withAuthorization } from '@/components/auth/withAuthorization';
import { ROLES } from '@/constants/roles';

function OrganisationsPage() {
  // Your component logic here
  return (
    <div>
      <h1>Organisations</h1>
      {/* Your content here */}
    </div>
  );
}

// Export wrapped component with authorization
export default withAuthorization(OrganisationsPage, {
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN, ROLES.ORG_ADMIN],
  requiredPage: '/organisations'
});
```

### Key Points
- ✅ Cleaner than hook pattern for simple pages
- ✅ Authorization logic separated from component
- ✅ Good TypeScript inference
- ✅ Reusable and testable

---

## Migration Guide

### From RoleGuard to useAuthorization Hook

**Before:**
```tsx
import RoleGuard from '@/components/auth/RoleGuard';

export default function UsersPage() {
  useEffect(() => {
    fetchData(); // ⚠️ Runs immediately!
  }, []);

  return (
    <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]} requiredPage="/users">
      <div>Content</div>
    </RoleGuard>
  );
}
```

**After:**
```tsx
import { useAuthorization } from '@/hooks/useAuthorization';

export default function UsersPage() {
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN],
    requiredPage: '/users',
    autoRedirect: true
  });

  useEffect(() => {
    if (isAuthorized) {
      fetchData(); // ✅ Only runs if authorized
    }
  }, [isAuthorized]);

  if (isChecking || !isAuthorized) {
    return null; // Or loading spinner
  }

  return <div>Content</div>;
}
```

### From RoleGuard to withAuthorization HOC

**Before:**
```tsx
import RoleGuard from '@/components/auth/RoleGuard';

export default function OrganisationsPage() {
  return (
    <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]} requiredPage="/organisations">
      <div>Content</div>
    </RoleGuard>
  );
}
```

**After:**
```tsx
import { withAuthorization } from '@/components/auth/withAuthorization';

function OrganisationsPage() {
  return <div>Content</div>;
}

export default withAuthorization(OrganisationsPage, {
  allowedRoles: [ROLES.SUPER_ADMIN],
  requiredPage: '/organisations'
});
```

---

## Pages Requiring Migration

### Priority 1: Pages with API Calls (Use Hook Pattern)
- ✅ `/app/users/page.tsx` - **COMPLETED**
- [ ] `/app/banners/page.tsx`
- [ ] `/app/banners/[id]/page.tsx`
- [ ] `/app/banners/[id]/edit/page.tsx`
- [ ] `/app/swep-banners/page.tsx`

### Priority 2: Simple Pages (Use HOC Pattern)
- ✅ `/app/organisations/page.tsx` - **COMPLETED**
- [ ] `/app/advice/page.tsx`
- [ ] `/app/resources/page.tsx`
- [ ] `/app/sweps/page.tsx`
- [ ] `/app/banners/new/page.tsx`

---

## Testing Checklist

After migration, verify:
- [ ] Authorization check happens before any rendering
- [ ] No API calls made for unauthorized users
- [ ] No headers/breadcrumbs visible before redirect
- [ ] No toast errors from unauthorized API calls
- [ ] Loading spinner shows during auth check
- [ ] Redirect to `/access-denied` works correctly
- [ ] Authorized users can access page normally

---

## Best Practices

### ✅ DO
- Check authorization before any effects
- Condition API calls on `isAuthorized`
- Return loading spinner during `isChecking`
- Return `null` when not authorized
- Use hook pattern for pages with effects
- Use HOC pattern for simple pages

### ❌ DON'T
- Make API calls before authorization
- Render UI before authorization check
- Use `RoleGuard` wrapper for new pages
- Mix authorization patterns in same component
- Forget to add dependency on `isAuthorized`

---

## API Reference

### useAuthorization Hook

```typescript
function useAuthorization(options: UseAuthorizationOptions): AuthorizationResult

interface UseAuthorizationOptions {
  allowedRoles?: UserRole[];
  requiredPage?: string;
  fallbackPath?: string;
  autoRedirect?: boolean;
}

interface AuthorizationResult {
  isChecking: boolean;
  isAuthorized: boolean;
  isAuthenticated: boolean;
}
```

### withAuthorization HOC

```typescript
function withAuthorization<P extends object>(
  Component: ComponentType<P>,
  options: UseAuthorizationOptions
): ComponentType<P>
```

---

## Troubleshooting

### Issue: "Page still makes API calls before redirect"
**Solution**: Ensure effects depend on `isAuthorized`:
```tsx
useEffect(() => {
  if (isAuthorized) {
    fetchData();
  }
}, [isAuthorized]);
```

### Issue: "Loading spinner flashes too quickly"
**Solution**: This is normal behavior - authorization should be fast.

### Issue: "TypeScript errors with HOC"
**Solution**: Ensure component function is declared before export:
```tsx
function MyPage() { /* ... */ }
export default withAuthorization(MyPage, { /* ... */ });
```

---

## Related Files

- `/src/hooks/useAuthorization.ts` - Authorization hook implementation
- `/src/components/auth/withAuthorization.tsx` - HOC implementation
- `/src/components/auth/RoleGuard.tsx` - Legacy component (uses hook internally)
- `/src/lib/userService.ts` - Permission checking logic
- `/src/types/auth.ts` - Type definitions

---

## Support

For questions or issues:
1. Check this guide first
2. Review example implementations in `/app/users/page.tsx` and `/app/organisations/page.tsx`
3. Consult `/src/hooks/useAuthorization.ts` for hook details
4. Refer to RBAC documentation for role configuration
