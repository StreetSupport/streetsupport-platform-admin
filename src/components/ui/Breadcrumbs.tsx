"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function toTitleCase(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export type Crumb = { href?: string; label: string; current?: boolean };

export default function Breadcrumbs({ items: itemsProp }: { items?: Crumb[] }) {
  const pathname = usePathname();
  const segments = (pathname || "/").split("?")[0].split("#")[0].split("/").filter(Boolean);

  const autoItems: Crumb[] = [{ href: "/", label: "Home", current: segments.length === 0 }];
  let acc = "";
  segments.forEach((seg, idx) => {
    acc += `/${seg}`;
    autoItems.push({
      href: idx === segments.length - 1 ? undefined : acc,
      label: toTitleCase(seg),
      current: idx === segments.length - 1,
    });
  });

  const items = itemsProp && itemsProp.length > 0 ? itemsProp : autoItems;

  // Hide bar on homepage when auto-generated and only 'Home' exists
  // if (!itemsProp && segments.length === 0) return null;

  return (
    <div className="bg-brand-n py-4">
      <div className="content-container px-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {items.map((item, index) => (
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
