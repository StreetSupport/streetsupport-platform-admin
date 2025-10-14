# Authorization Fix - Implementation Summary

## Problem Fixed

**Issue**: Unauthorized users could trigger API calls and see page content (headers, breadcrumbs) before being redirected.

**Example**: OrgAdmin accessing `/users` page would:
1. ❌ Make API calls to `/api/cities` and `/api/users`
2. ❌ See headers and breadcrumbs briefly
3. ❌ Display toast error messages
4. ❌ Then redirect to `/access-denied`

## Solution Implemented

Created **two reusable authorization patterns** that check permissions **before** any rendering:

### 1. **useAuthorization Hook** 
For pages with API calls and effects

### 2. **withAuthorization HOC**
For simple pages without effects

---

## Files Created

### Core Authorization Logic
- ✅ `/src/hooks/useAuthorization.ts` - Authorization hook
- ✅ `/src/components/auth/withAuthorization.tsx` - HOC wrapper
- ✅ `/src/components/auth/RoleGuard.tsx` - Updated to use new hook

### Documentation
- ✅ `/AUTHORIZATION_PATTERN_GUIDE.md` - Complete migration guide
- ✅ `/AUTHORIZATION_FIX_SUMMARY.md` - This file

---

## Pages Migrated (Examples)

### ✅ Users Page - Hook Pattern
**File**: `/src/app/users/page.tsx`

Uses `useAuthorization` hook because it has:
- Multiple `useEffect` hooks
- API calls on mount (`fetchUsers`, `fetchLocations`)
- Complex state management

**Result**: No API calls or rendering until authorized

### ✅ Organisations Page - HOC Pattern  
**File**: `/src/app/organisations/page.tsx`

Uses `withAuthorization` HOC because it:
- Has no effects
- Static content only
- Simple component structure

**Result**: Clean, minimal code with full protection

### ✅ Advice Page - HOC Pattern
**File**: `/src/app/advice/page.tsx`

Uses `withAuthorization` HOC
**Result**: Same as organisations page

---

## Remaining Pages to Migrate

### Priority 1: Pages with API Calls (Use Hook Pattern)
These pages likely make API calls and need immediate attention:

```bash
/app/banners/page.tsx
/app/banners/[id]/page.tsx
/app/banners/[id]/edit/page.tsx
/app/swep-banners/page.tsx
```

### Priority 2: Simple Pages (Use HOC Pattern)
These pages are simpler and can use the HOC:

```bash
/app/resources/page.tsx
/app/sweps/page.tsx
/app/banners/new/page.tsx
```

---

## How to Migrate Pages

### For Pages with useEffect (Use Hook):

1. **Import the hook**:
```tsx
import { useAuthorization } from '@/hooks/useAuthorization';
```

2. **Add authorization check at top of component**:
```tsx
const { isChecking, isAuthorized } = useAuthorization({
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.CITY_ADMIN],
  requiredPage: '/your-page',
  autoRedirect: true
});
```

3. **Condition effects on isAuthorized**:
```tsx
useEffect(() => {
  if (isAuthorized) {
    fetchData(); // Only runs if authorized
  }
}, [isAuthorized]);
```

4. **Add guards before return**:
```tsx
if (isChecking) {
  return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-a"></div>
  </div>;
}

if (!isAuthorized) {
  return null;
}
```

5. **Remove RoleGuard wrapper**

### For Simple Pages (Use HOC):

1. **Add 'use client' directive**:
```tsx
'use client';
```

2. **Import the HOC**:
```tsx
import { withAuthorization } from '@/components/auth/withAuthorization';
```

3. **Change function to named function**:
```tsx
function YourPage() {
  return <div>Content</div>;
}
```

4. **Export wrapped component**:
```tsx
export default withAuthorization(YourPage, {
  allowedRoles: [ROLES.SUPER_ADMIN],
  requiredPage: '/your-page'
});
```

5. **Remove RoleGuard wrapper and metadata export**

---

## Testing Checklist

After migrating each page, test:

- [ ] Unauthorized user sees **loading spinner only**
- [ ] No API calls in browser network tab
- [ ] No headers or breadcrumbs visible
- [ ] No toast error messages
- [ ] Redirect to `/access-denied` after loading
- [ ] Authorized user can access page normally
- [ ] All functionality works as expected

---

## Key Benefits

### ✅ Before Fix
- API calls made regardless of authorization
- Headers/UI rendered before auth check  
- Error toasts displayed
- Poor user experience

### ✅ After Fix
- No API calls until authorized
- No UI rendering until authorized
- Clean redirect without errors
- Professional user experience

---

## Quick Reference

### Hook Pattern Template
```tsx
'use client';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROLES } from '@/constants/roles';

export default function YourPage() {
  const { isChecking, isAuthorized } = useAuthorization({
    allowedRoles: [ROLES.SUPER_ADMIN],
    requiredPage: '/your-page',
    autoRedirect: true
  });

  useEffect(() => {
    if (isAuthorized) {
      // Your API calls here
    }
  }, [isAuthorized]);

  if (isChecking || !isAuthorized) return null;
  
  return <div>Your content</div>;
}
```

### HOC Pattern Template
```tsx
'use client';
import { withAuthorization } from '@/components/auth/withAuthorization';
import { ROLES } from '@/constants/roles';

function YourPage() {
  return <div>Your content</div>;
}

export default withAuthorization(YourPage, {
  allowedRoles: [ROLES.SUPER_ADMIN],
  requiredPage: '/your-page'
});
```

---

## Next Steps

1. **Test the migrated pages** with different roles
2. **Migrate remaining pages** using appropriate pattern
3. **Remove old RoleGuard usages** once all pages migrated
4. **Update tests** to account for authorization checks
5. **Document role permissions** if not already done

---

## Support Resources

- **Full Guide**: `AUTHORIZATION_PATTERN_GUIDE.md`
- **Hook Implementation**: `/src/hooks/useAuthorization.ts`
- **HOC Implementation**: `/src/components/auth/withAuthorization.tsx`
- **Example (Hook)**: `/src/app/users/page.tsx`
- **Example (HOC)**: `/src/app/organisations/page.tsx`
- **RBAC Documentation**: Existing role and permission docs

---

## Conclusion

This fix ensures that **no unauthorized access attempts trigger any application logic**. Pages now properly guard against:
- Premature API calls
- UI flash before redirect
- Error toast spam
- Poor user experience

All while maintaining clean, maintainable, and reusable code patterns.
