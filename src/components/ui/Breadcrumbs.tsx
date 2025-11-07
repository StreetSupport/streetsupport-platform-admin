"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getHomePageForUser } from "@/lib/roleHomePages";
import { authenticatedFetch } from "@/utils/authenticatedFetch";

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

export default function Breadcrumbs({ items: itemsProp }: { items?: Crumb[] }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const segments = useMemo(
    () => (pathname || "/").split("?")[0].split("#")[0].split("/").filter(Boolean),
    [pathname]
  );

  const [bannerTitle, setBannerTitle] = useState<string | null>(null);

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

  // Enrich breadcrumbs for banner routes: /banners/[id] and /banners/[id]/edit
  // Note: SWEP banners use location slug instead of ID, so they use default breadcrumbs
  useEffect(() => {
    const isBannerRoute = segments[0] === "banners" && segments.length >= 2;
    const id = isBannerRoute ? segments[1] : null;
    if (!isBannerRoute || !id) {
      setBannerTitle(null);
      return;
    }

    // TODO: update this logic to avoid this request
    let aborted = false;
    // Fetch banner title and support both response shapes
    (async () => {
      try {
        // Skip fetching when creating a new banner or when id isn't a MongoDB ObjectId
        const isNewRoute = id === "new";
        const looksLikeObjectId = /^[a-fA-F0-9]{24}$/.test(id);
        if (isNewRoute || !looksLikeObjectId) {
          return;
        }
        const res = await authenticatedFetch(`/api/banners/${id}`);
        if (!res.ok) return;
        const json = await res.json();
        const banner = json?.data ?? json; // handle {data: banner} or banner
        const title = banner?.Title as string | undefined;
        if (!aborted && title) setBannerTitle(title);
      } catch {
        // ignore failures and keep default ID-based crumb
      }
    })();

    return () => {
      aborted = true;
    };
  }, [segments]);

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
    if (isEdit) items.push({ label: "Edit", current: true });
    return items;
  }, [itemsProp, baseItems, bannerTitle, segments, homePageUrl]);

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
