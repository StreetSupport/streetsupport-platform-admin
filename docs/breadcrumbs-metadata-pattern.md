# Breadcrumbs & Page Metadata Pattern

## Overview

The breadcrumbs system uses a **React Context pattern** to share page metadata (like entity titles) without requiring additional API fetches. This eliminates redundant network requests and improves performance.

## Architecture

### Components

1. **PageMetadataContext** (`/src/contexts/PageMetadataContext.tsx`)
   - Provides shared state for page metadata
   - Available throughout the application via context

2. **Breadcrumbs Component** (`/src/components/ui/Breadcrumbs.tsx`)
   - Consumes metadata from context
   - Automatically generates breadcrumbs based on route and metadata

3. **useSetPageTitle Hook** (`/src/hooks/useSetPageTitle.ts`)
   - Convenience hook for setting page metadata
   - Simplifies integration in page components

### Data Flow

```
Page Component (fetches data)
    ↓
setPageMetadata({ id, type, title })
    ↓
PageMetadataContext (stores metadata)
    ↓
Breadcrumbs Component (reads metadata)
    ↓
Displays title in breadcrumbs
```

## Usage

### Method 1: Using the Hook (Recommended)

```tsx
'use client';

import { useSetPageTitle } from '@/hooks/useSetPageTitle';

export default function BannerViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [banner, setBanner] = useState<IBanner | null>(null);

  useEffect(() => {
    fetchBanner();
  }, [id]);

  const fetchBanner = async () => {
    const response = await fetch(`/api/banners/${id}`);
    const data = await response.json();
    setBanner(data.data);
  };

  // Set page title for breadcrumbs
  useSetPageTitle(id, 'banners', banner?.Title);

  return (
    <div>
      {/* Your page content */}
    </div>
  );
}
```

### Method 2: Using Context Directly

```tsx
'use client';

import { usePageMetadata } from '@/contexts/PageMetadataContext';

export default function UserViewPage() {
  const { setPageMetadata } = usePageMetadata();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(`/api/users/${id}`);
      const data = await response.json();
      const user = data.data;
      
      // Set metadata for breadcrumbs
      setPageMetadata({
        id: id,
        type: 'users',
        title: user.UserName
      });
    };

    fetchUser();
  }, [id, setPageMetadata]);

  return (
    <div>
      {/* Your page content */}
    </div>
  );
}
```

## Adding Support for New Entity Types

To add breadcrumb support for a new entity type (e.g., organisations, services):

### 1. View Page

```tsx
'use client';

import { useSetPageTitle } from '@/hooks/useSetPageTitle';

export default function OrganisationViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [organisation, setOrganisation] = useState(null);

  useEffect(() => {
    fetchOrganisation();
  }, [id]);

  const fetchOrganisation = async () => {
    const response = await fetch(`/api/organisations/${id}`);
    const data = await response.json();
    setOrganisation(data.data);
  };

  // Set page title for breadcrumbs
  useSetPageTitle(id, 'organisations', organisation?.Name);

  return <div>{/* Your content */}</div>;
}
```

### 2. Edit Page

```tsx
'use client';

import { usePageMetadata } from '@/contexts/PageMetadataContext';

export default function OrganisationEditPage() {
  const { setPageMetadata } = usePageMetadata();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchOrganisation = async () => {
      const response = await fetch(`/api/organisations/${id}`);
      const data = await response.json();
      const org = data.data;
      
      // Set metadata immediately after fetching
      setPageMetadata({
        id: id,
        type: 'organisations',
        title: org.Name
      });
    };

    fetchOrganisation();
  }, [id, setPageMetadata]);

  return <div>{/* Your edit form */}</div>;
}
```

## Breadcrumb Display Logic

The Breadcrumbs component automatically generates breadcrumbs based on:

1. **Custom items prop** (highest priority)
   - Pass explicit breadcrumb items if needed
   
2. **Metadata from context** (preferred)
   - Uses `metadata.title` if available and matches current route
   - Format: `Home > [EntityType] > [Title] > Edit`
   
3. **Auto-generated from URL** (fallback)
   - Converts URL segments to title case
   - Format: `Home > Banners > [ID] > Edit`

### Example Breadcrumb Outputs

**View Page with Metadata:**
```
Home > Banners > Winter Emergency Appeal
```

**Edit Page with Metadata:**
```
Home > Banners > Winter Emergency Appeal > Edit
```

**Fallback (no metadata):**
```
Home > Banners > 507f1f77bcf86cd799439011 > Edit
```

## Benefits

### ✅ Performance
- **No redundant API calls** - Breadcrumbs use already-fetched data
- **Instant updates** - Title appears as soon as page data loads
- **Reduced server load** - Fewer requests to API

### ✅ Maintainability
- **Single source of truth** - Page component owns the data
- **Consistent pattern** - Same approach for all entity types
- **Easy to extend** - Add new entity types with minimal code

### ✅ User Experience
- **Faster page loads** - No additional network requests
- **Consistent behavior** - Breadcrumbs update with page data
- **Better navigation** - Meaningful titles instead of IDs

## Implementation Checklist

When adding breadcrumb support to a new page:

- [ ] Import `useSetPageTitle` hook or `usePageMetadata` context
- [ ] Call `useSetPageTitle(id, type, title)` after fetching data
- [ ] Ensure `id` matches the URL parameter
- [ ] Use correct `type` matching the URL segment (e.g., 'banners', 'users')
- [ ] Pass the display title (e.g., `banner.Title`, `user.UserName`)

## Advanced Usage

### Custom Metadata

You can add custom metadata fields beyond `id`, `type`, and `title`:

```tsx
setPageMetadata({
  id: bannerId,
  type: 'banners',
  title: banner.Title,
  status: banner.IsActive ? 'active' : 'inactive',
  priority: banner.Priority,
  // Any custom fields you need
});
```

### Clearing Metadata

Metadata is automatically cleared when navigating between pages, but you can manually clear it:

```tsx
const { clearPageMetadata } = usePageMetadata();

useEffect(() => {
  return () => {
    clearPageMetadata();
  };
}, []);
```

## Troubleshooting

### Breadcrumbs showing ID instead of title

**Cause:** Metadata not set or doesn't match current route

**Solution:** Ensure you're calling `setPageMetadata` with correct `id` and `type`:
```tsx
setPageMetadata({
  id: params.id,           // Must match URL parameter
  type: 'banners',         // Must match first URL segment
  title: banner.Title      // Display title
});
```

### Breadcrumbs not updating

**Cause:** Metadata set before data is loaded

**Solution:** Set metadata inside the fetch function after data is received:
```tsx
const fetchData = async () => {
  const data = await fetch(...);
  const entity = data.data;
  
  // Set metadata AFTER data is fetched
  setPageMetadata({
    id: id,
    type: 'banners',
    title: entity.Title
  });
};
```

### Context error: "usePageMetadata must be used within a PageMetadataProvider"

**Cause:** Component is outside the PageMetadataProvider

**Solution:** Ensure your component is rendered within the app layout that includes PageMetadataProvider. This should already be configured in `/src/app/layout.tsx`.

## Migration from Old Pattern

### Old Pattern (❌ Don't use)
```tsx
// Breadcrumbs component fetching data
useEffect(() => {
  const fetchBanner = async () => {
    const res = await fetch(`/api/banners/${id}`);
    const data = await res.json();
    setBannerTitle(data.Title);
  };
  fetchBanner();
}, [id]);
```

### New Pattern (✅ Use this)
```tsx
// Page component sets metadata after fetching
const fetchBanner = async () => {
  const res = await fetch(`/api/banners/${id}`);
  const data = await res.json();
  setBanner(data);
  
  setPageMetadata({
    id: id,
    type: 'banners',
    title: data.Title
  });
};
```

## Future Enhancements

Potential improvements to consider:

1. **Type-safe entity types** - Use enum or union type for entity types
2. **Metadata persistence** - Store metadata in session storage for back navigation
3. **Loading states** - Show skeleton breadcrumbs while data loads
4. **Error handling** - Display fallback breadcrumbs on fetch errors
5. **Localization** - Support for translated entity type labels

## Related Files

- `/src/contexts/PageMetadataContext.tsx` - Context provider and types
- `/src/hooks/useSetPageTitle.ts` - Convenience hook
- `/src/components/ui/Breadcrumbs.tsx` - Breadcrumbs component
- `/src/app/layout.tsx` - PageMetadataProvider setup
- `/src/app/banners/[id]/page.tsx` - Example implementation (view)
- `/src/app/banners/[id]/edit/page.tsx` - Example implementation (edit)
