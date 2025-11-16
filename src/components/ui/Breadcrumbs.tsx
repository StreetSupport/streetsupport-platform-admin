"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { getHomePageForUser } from "@/lib/roleHomePages";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

function toTitleCase(slug: string) {
  // Special case for SWEP
  if (slug === "swep-banners") {
    return "SWEP";
  }
  
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export type Crumb = { href?: string; label: string; current?: boolean };

export default function Breadcrumbs({ 
  items: itemsProp
}: { 
  items?: Crumb[]; 
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { bannerTitle, adviceTitle } = useBreadcrumb();
  
  const segments = useMemo(
    () => (pathname || "/").split("?")[0].split("#")[0].split("/").filter(Boolean),
    [pathname]
  );

  // Determine home page URL based on user roles
  const homePageUrl = useMemo(() => {
    if (!session?.user?.authClaims) {
      return '/organisations'; // Default fallback
    }
    
    const allAuthClaims = [
      ...session.user.authClaims.roles,
      ...session.user.authClaims.specificClaims
    ];
    
    return getHomePageForUser(allAuthClaims);
  }, [session]);

  // Auto-generate default items from path
  const baseItems: Crumb[] = useMemo(() => {
    const items: Crumb[] = [{ href: homePageUrl, label: "Home", current: segments.length === 0 }];
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
  }, [segments, homePageUrl]);

  // Use bannerTitle from context (set by banner pages to avoid duplicate API call)

  const computedItems: Crumb[] = useMemo(() => {
    if (itemsProp && itemsProp.length > 0) return itemsProp;

    // Special handling for SWEP banner routes - exclude 'Edit' from breadcrumbs
    if (segments[0] === "swep-banners" && segments.length >= 2) {
      const locationSlug = segments[1];
      const isEdit = segments[2] === "edit";
      
      const items: Crumb[] = [
        { href: homePageUrl, label: "Home" },
        { href: "/swep-banners", label: "SWEP" },
        { href: isEdit ? `/swep-banners/${locationSlug}` : undefined, label: toTitleCase(locationSlug), current: true },
      ];
      // Note: We don't add "Edit" breadcrumb for SWEP banners
      return items;
    }

    // Special handling for resources routes - exclude 'Edit' from breadcrumbs
    if (segments[0] === "resources" && segments.length >= 2) {
      const resourceKey = segments[1];
      const isEdit = segments[2] === "edit";
      
      const items: Crumb[] = [
        { href: homePageUrl, label: "Home" },
        { href: "/resources", label: "Resources" },
        { href: isEdit ? `/resources/${resourceKey}` : undefined, label: toTitleCase(resourceKey), current: true },
      ];
      // Note: We don't add "Edit" breadcrumb for resources
      return items;
    }

    // Special handling for advice routes - show title instead of ID
    // Exclude 'Edit' from breadcrumbs (same as SWEP and Resources)
    if (segments[0] === "advice" && segments.length >= 2 && adviceTitle) {
      const id = segments[1];
      const isEdit = segments[2] === "edit";
      
      const items: Crumb[] = [
        { href: homePageUrl, label: "Home" },
        { href: "/advice", label: "Advice" },
        { href: isEdit ? `/advice/${id}` : undefined, label: adviceTitle, current: true },
      ];
      // Note: We don't add "Edit" breadcrumb for advice (consistent with SWEP and Resources)
      return items;
    }

    // If not a banner route or no fetched title, fall back to base items
    if (!(segments[0] === "banners" && segments.length >= 2) || !bannerTitle) {
      return baseItems;
    }

    const id = segments[1];
    const isEdit = segments[2] === "edit";

    const items: Crumb[] = [
      { href: homePageUrl, label: "Home" },
      { href: "/banners", label: "Banners" },
      { href: isEdit ? `/banners/${id}` : undefined, label: bannerTitle, current: !isEdit },
    ];
    return items;
  }, [itemsProp, baseItems, bannerTitle, adviceTitle, segments, homePageUrl]);

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
