# Performance Best Practices - Preventing Repeated API Calls

## Problem: Repeated API Fetches

If you see the admin panel making repeated API calls every second, it's usually caused by:

1. **Unstable useEffect dependencies**
2. **Function recreated on every render**
3. **Missing cleanup in useEffect**

## ❌ Anti-Patterns (Don't Do This)

### Anti-Pattern 1: Function Outside useEffect

```tsx
// ❌ BAD: Function recreated on every render
export default function BadPage() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const response = await fetch('/api/data');
    setData(await response.json());
  };

  useEffect(() => {
    fetchData(); // This causes infinite loop!
  }, [fetchData]); // fetchData changes every render

  return <div>{/* content */}</div>;
}
```

**Problem:** `fetchData` is recreated on every render, causing `useEffect` to run repeatedly.

### Anti-Pattern 2: Missing Dependencies

```tsx
// ❌ BAD: Missing dependencies
export default function BadPage() {
  const { setPageMetadata } = usePageMetadata();

  useEffect(() => {
    fetchData();
  }, [id]); // Missing setPageMetadata dependency!

  const fetchData = async () => {
    const data = await fetch(`/api/data/${id}`);
    setPageMetadata({ title: data.title }); // Using setPageMetadata but not in deps
  };

  return <div>{/* content */}</div>;
}
```

**Problem:** ESLint warnings ignored, potential stale closures.

### Anti-Pattern 3: No Cleanup

```tsx
// ❌ BAD: No cleanup for async operations
export default function BadPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/data');
      setData(await response.json()); // Might update unmounted component!
    };
    fetchData();
  }, []);

  return <div>{/* content */}</div>;
}
```

**Problem:** If component unmounts before fetch completes, you'll get React warnings.

## ✅ Best Practices (Do This)

### Pattern 1: Function Inside useEffect

```tsx
// ✅ GOOD: Function defined inside useEffect
export default function GoodPage() {
  const params = useParams();
  const { setPageMetadata } = usePageMetadata();
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/data/${params.id}`);
        const result = await response.json();
        
        if (isMounted) {
          setData(result);
          setPageMetadata({
            id: params.id,
            type: 'data',
            title: result.title
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error('Fetch error:', error);
        }
      }
    };

    if (params.id) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [params.id, setPageMetadata]); // Only re-run when ID changes

  return <div>{/* content */}</div>;
}
```

**Benefits:**
- ✅ Function not recreated on every render
- ✅ Only fetches when `params.id` changes
- ✅ Cleanup prevents state updates after unmount
- ✅ `setPageMetadata` is stable (memoized with useCallback)

### Pattern 2: useCallback for Stable Functions

```tsx
// ✅ GOOD: Using useCallback for functions used in multiple places
export default function GoodPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/data/${id}`);
      setData(await response.json());
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies = stable function

  useEffect(() => {
    fetchData(params.id);
  }, [params.id, fetchData]); // fetchData is stable

  const handleRefresh = () => {
    fetchData(params.id); // Can reuse the same function
  };

  return <div>{/* content */}</div>;
}
```

### Pattern 3: Proper Cleanup

```tsx
// ✅ GOOD: AbortController for fetch cancellation
export default function GoodPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch('/api/data', {
          signal: abortController.signal
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
        }
      }
    };

    fetchData();

    return () => {
      abortController.abort(); // Cancel fetch on unmount
    };
  }, []);

  return <div>{/* content */}</div>;
}
```

## Context Best Practices

### Stable Context Functions

Our `PageMetadataContext` uses `useCallback` to ensure functions don't change:

```tsx
// In PageMetadataContext.tsx
const setPageMetadata = useCallback((newMetadata: PageMetadata) => {
  setMetadata(prev => ({ ...prev, ...newMetadata }));
}, []); // Empty deps = never changes

const value = useMemo(
  () => ({ metadata, setPageMetadata, clearPageMetadata }),
  [metadata, setPageMetadata, clearPageMetadata]
);
```

**This means you can safely include `setPageMetadata` in useEffect dependencies!**

## Debugging Repeated Fetches

### Step 1: Check Network Tab

Open Chrome DevTools → Network tab:
- Filter by "Fetch/XHR"
- Look for repeated requests to the same endpoint
- Check the timing - are they happening every second?

### Step 2: Add Console Logs

```tsx
useEffect(() => {
  console.log('useEffect running', { id: params.id });
  
  const fetchData = async () => {
    console.log('Fetching data for', params.id);
    // ... fetch logic
  };

  fetchData();
}, [params.id, setPageMetadata]);
```

If you see logs repeating rapidly, check your dependencies.

### Step 3: Use React DevTools Profiler

1. Install React DevTools extension
2. Open Profiler tab
3. Start recording
4. Look for components re-rendering repeatedly

### Step 4: Check ESLint Warnings

Don't ignore ESLint warnings about missing dependencies:

```
React Hook useEffect has a missing dependency: 'setPageMetadata'.
Either include it or remove the dependency array.
```

**Always fix these warnings!**

## Common Fixes

### Fix 1: Move Function Inside useEffect

**Before:**
```tsx
const fetchData = async () => { /* ... */ };

useEffect(() => {
  fetchData();
}, [fetchData]); // ❌ fetchData changes every render
```

**After:**
```tsx
useEffect(() => {
  const fetchData = async () => { /* ... */ };
  fetchData();
}, [id]); // ✅ Only depends on id
```

### Fix 2: Add Missing Dependencies

**Before:**
```tsx
useEffect(() => {
  fetchData();
}, [id]); // ❌ Missing setPageMetadata
```

**After:**
```tsx
useEffect(() => {
  fetchData();
}, [id, setPageMetadata]); // ✅ All dependencies included
```

### Fix 3: Add Cleanup

**Before:**
```tsx
useEffect(() => {
  fetchData().then(data => setData(data));
}, [id]); // ❌ No cleanup
```

**After:**
```tsx
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) setData(data);
  });
  
  return () => {
    isMounted = false;
  };
}, [id]); // ✅ Cleanup prevents state updates after unmount
```

## Performance Checklist

When creating a new page with data fetching:

- [ ] Define fetch function inside `useEffect`
- [ ] Include all dependencies in dependency array
- [ ] Add `isMounted` flag for cleanup
- [ ] Use `useCallback` for functions used in multiple places
- [ ] Test in Network tab - should see only ONE fetch per navigation
- [ ] Check console for React warnings
- [ ] Verify no repeated renders in React DevTools

## Tools & Resources

### Browser DevTools
- **Network Tab**: Monitor API calls
- **Console**: Check for warnings
- **React DevTools**: Profile component renders

### ESLint Rules
- `react-hooks/exhaustive-deps`: Enforces correct dependencies
- Always fix these warnings, don't disable them!

### React Documentation
- [useEffect Hook](https://react.dev/reference/react/useEffect)
- [useCallback Hook](https://react.dev/reference/react/useCallback)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

## Summary

**Golden Rules:**
1. **Define fetch functions inside useEffect** (or use useCallback)
2. **Include all dependencies** in the dependency array
3. **Add cleanup** to prevent state updates after unmount
4. **Use stable context functions** (our context already does this)
5. **Test thoroughly** - check Network tab for repeated calls

Following these patterns ensures your admin panel makes efficient API calls and provides a smooth user experience!
