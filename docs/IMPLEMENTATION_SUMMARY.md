# Breadcrumbs Metadata Pattern - Implementation Summary

## Problem Solved

**Before:** Breadcrumbs component was fetching banner data separately just to get the title, causing:
- Redundant API calls (page fetches data, breadcrumbs fetch same data again)
- Poor performance (unnecessary network requests)
- Inefficient resource usage

**After:** Pages share their already-fetched data with breadcrumbs via React Context:
- Zero additional API calls
- Instant breadcrumb updates
- Scalable pattern for all entity types

## Implementation

### Files Created

1. **`/src/contexts/PageMetadataContext.tsx`**
   - React Context for sharing page metadata
   - Provides `setPageMetadata()` and `clearPageMetadata()` functions
   - Stores `id`, `type`, `title`, and custom metadata

2. **`/src/hooks/useSetPageTitle.ts`**
   - Convenience hook: `useSetPageTitle(id, type, title)`
   - Simplifies metadata setting in page components

3. **`/docs/breadcrumbs-metadata-pattern.md`**
   - Complete documentation
   - Usage examples
   - Migration guide
   - Troubleshooting

### Files Modified

1. **`/src/app/layout.tsx`**
   - Added `PageMetadataProvider` wrapper
   - Makes context available throughout app

2. **`/src/components/ui/Breadcrumbs.tsx`**
   - Removed API fetch logic
   - Now reads metadata from context
   - Falls back to auto-generated breadcrumbs if no metadata

3. **`/src/app/banners/[id]/page.tsx`**
   - Sets metadata after fetching banner
   - Example: `setPageMetadata({ id, type: 'banners', title: banner.Title })`

4. **`/src/app/banners/[id]/edit/page.tsx`**
   - Sets metadata after fetching banner
   - Breadcrumbs show: `Home > Banners > [Title] > Edit`

## Usage Pattern

### Quick Start (using hook)

```tsx
import { useSetPageTitle } from '@/hooks/useSetPageTitle';

export default function EntityViewPage() {
  const params = useParams();
  const [entity, setEntity] = useState(null);

  useEffect(() => {
    fetchEntity();
  }, []);

  const fetchEntity = async () => {
    const data = await fetch(`/api/entities/${params.id}`);
    setEntity(data);
  };

  // Set page title for breadcrumbs
  useSetPageTitle(params.id, 'entities', entity?.Title);

  return <div>{/* content */}</div>;
}
```

### Alternative (using context directly) - RECOMMENDED

**✅ Best Practice Pattern:**

```tsx
import { usePageMetadata } from '@/contexts/PageMetadataContext';

export default function EntityEditPage() {
  const params = useParams();
  const { setPageMetadata } = usePageMetadata();
  const [entity, setEntity] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEntity = async () => {
      const response = await fetch(`/api/entities/${params.id}`);
      const data = await response.json();
      
      if (isMounted) {
        setEntity(data);
        
        // Set metadata inside useEffect to avoid re-renders
        setPageMetadata({
          id: params.id,
          type: 'entities',
          title: data.Title
        });
      }
    };

    if (params.id) {
      fetchEntity();
    }

    return () => {
      isMounted = false;
    };
  }, [params.id, setPageMetadata]); // setPageMetadata is stable (useCallback)

  return <div>{/* content */}</div>;
}
```

**Key Points:**
- ✅ Move fetch function inside `useEffect` to avoid recreating it
- ✅ Use `isMounted` flag to prevent state updates after unmount
- ✅ Include `setPageMetadata` in dependencies (it's stable via `useCallback`)
- ✅ Only fetch when ID changes, not on every render

## Benefits

### Performance
- ✅ Eliminates redundant API calls
- ✅ Faster page loads
- ✅ Reduced server load

### Developer Experience
- ✅ Simple, consistent pattern
- ✅ Easy to extend to new entity types
- ✅ Type-safe with TypeScript
- ✅ Well-documented

### User Experience
- ✅ Instant breadcrumb updates
- ✅ Meaningful titles instead of IDs
- ✅ Consistent navigation

## Next Steps

To add breadcrumb support for other entity types (users, organisations, services):

1. Import the hook or context in your page component
2. Call `setPageMetadata()` after fetching data
3. Pass the entity ID, type, and display title

Example for users:
```tsx
setPageMetadata({
  id: userId,
  type: 'users',
  title: user.UserName
});
```

## Testing

Test the implementation:

1. Navigate to `/banners/[id]` - breadcrumbs should show banner title
2. Navigate to `/banners/[id]/edit` - breadcrumbs should show title + "Edit"
3. Check Network tab - should see only ONE API call per page
4. Navigate between pages - breadcrumbs should update correctly

## Documentation

Full documentation available at:
- `/docs/breadcrumbs-metadata-pattern.md` - Complete guide with examples
- This file - Quick reference and summary
