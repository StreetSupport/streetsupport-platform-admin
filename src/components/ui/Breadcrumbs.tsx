"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { usePageMetadata } from "@/contexts/PageMetadataContext";

function toTitleCase(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export type Crumb = { href?: string; label: string; current?: boolean };

export default function Breadcrumbs({ items: itemsProp }: { items?: Crumb[] }) {
  const pathname = usePathname();
  const { metadata } = usePageMetadata();
  
  const segments = useMemo(
    () => (pathname || "/").split("?")[0].split("#")[0].split("/").filter(Boolean),
    [pathname]
  );

  // Auto-generate default items from path
  const baseItems: Crumb[] = useMemo(() => {
    const items: Crumb[] = [{ href: "/", label: "Home", current: segments.length === 0 }];
    let acc = "";
    segments.forEach((seg, idx) => {
      acc += `/${seg}`;
      items.push({
        href: idx === segments.length - 1 ? undefined : acc,
        label: toTitleCase(seg),
        current: idx === segments.length - 1,
      });
    });
    return items;
  }, [segments]);

  const computedItems: Crumb[] = useMemo(() => {
    if (itemsProp && itemsProp.length > 0) return itemsProp;

    // Check if we have metadata for the current route
    const entityType = segments[0]; // e.g., 'banners', 'users', 'organisations'
    const entityId = segments[1];
    const isEdit = segments[2] === "edit";

    // If we have metadata with a title and it matches the current route
    if (metadata.title && metadata.id === entityId && metadata.type === entityType) {
      const items: Crumb[] = [
        { href: "/", label: "Home" },
        { href: `/${entityType}`, label: toTitleCase(entityType) },
        { 
          href: isEdit ? `/${entityType}/${entityId}` : undefined, 
          label: metadata.title, 
          current: !isEdit 
        },
      ];
      if (isEdit) items.push({ label: "Edit", current: true });
      return items;
    }

    // Fall back to base items for routes without metadata or "new" routes
    return baseItems;
  }, [itemsProp, baseItems, metadata, segments]);

  return (
    <div className="bg-brand-n py-4">
      <div className="content-container px-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {computedItems.map((item, index) => (
              <li key={index} className={index === 0 ? "inline-flex items-center" : ""}>
                <div className="flex items-center">
                  {index > 0 && <span className="mx-2 text-white">/</span>}
                  {item.href && !item.current ? (
                    <Link href={item.href} className="!text-brand-e hover:!text-brand-e">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-white" aria-current={item.current ? "page" : undefined}>
                      {item.label}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
