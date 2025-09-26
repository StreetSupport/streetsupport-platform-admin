'use client';

import { useState } from 'react';
import Link from 'next/link';

type MenuItem = {
  name: string;
  href?: string;
  children?: { name: string; href: string }[];
};

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/',
  },
  {
    name: 'Organisations',
    href: '/organisations',
    children: [
      { name: 'All Organisations', href: '/organisations' },
      { name: 'Create Organisation', href: '/organisations/new' },
      { name: 'Pending Approvals', href: '/organisations/pending' },
    ],
  },
  {
    name: 'Advice',
    href: '/advice',
    children: [
      { name: 'All Pages', href: '/advice' },
      { name: 'Create Page', href: '/advice/new' },
      { name: 'Drafts', href: '/advice/drafts' },
    ],
  },
  {
    name: 'Resources',
    href: '/resources',
    children: [
      { name: 'All Resources', href: '/resources' },
      { name: 'Upload Resource', href: '/resources/new' },
      { name: 'Categories', href: '/resources/categories' },
    ],
  },
  {
    name: 'Cities',
    href: '/cities',
    children: [
      { name: 'All Cities', href: '/cities' },
      { name: 'Add City', href: '/cities/new' },
      { name: 'Assignments', href: '/cities/assignments' },
    ],
  },
  {
    name: 'Users',
    href: '/users',
  },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDesktop, setOpenDesktop] = useState<string | null>(null);
  const [openMobile, setOpenMobile] = useState<Record<string, boolean>>({});

  const handleLinkClick = () => {
    setMenuOpen(false);
    setOpenDesktop(null);
    setOpenMobile({});
  };

  const toggleMobileSection = (name: string) => {
    setOpenMobile(prev => (prev[name] ? {} : { [name]: true }));
  };

  return (
    <nav className="flex-1 flex items-center justify-end md:justify-end">
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-6">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className="relative"
            onMouseEnter={() => setOpenDesktop(item.name)}
            onMouseLeave={() => setOpenDesktop(current => (current === item.name ? null : current))}
          >
            <Link href={item.href || '#'} className="nav-link flex items-center gap-1">
              {item.name}
              {item.children && (
                <svg className={`w-4 h-4 transition-transform duration-200 ${openDesktop === item.name ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>

            {item.children && openDesktop === item.name && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 min-w-[220px]">
                <div className="bg-white border border-brand-f rounded-md shadow-lg overflow-hidden">
                  <ul className="py-2">
                    {item.children.map((child) => (
                      <li key={child.name}>
                        <Link
                          href={child.href}
                          className="block px-3 py-2 text-sm !text-black hover:bg-brand-i hover:text-brand-k transition-colors duration-200"
                          onClick={handleLinkClick}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden ml-2">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-a"
        >
          <div className="hamburger-icon">
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <div className={`mobile-menu-container md:hidden ${menuOpen ? 'mobile-menu-open' : 'mobile-menu-closed'}`}>
        <div className="mobile-menu px-4 pb-4">
          {menuItems.map((item) => (
            <div key={item.name} className="mb-1">
              {item.children && item.children.length > 0 ? (
                <button
                  onClick={() => toggleMobileSection(item.name)}
                  className={`w-full text-left mobile-nav-link font-semibold ${openMobile[item.name] ? 'ring-2 ring-brand-a border border-brand-a rounded-md' : ''}`}
                  aria-expanded={!!openMobile[item.name]}
                  aria-controls={`mobile-sub-${item.name}`}
                >
                  <span>{item.name}</span>
                  <svg className={`w-5 h-5 transition-transform duration-200 text-brand-k ${openMobile[item.name] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="mobile-nav-link font-medium"
                  onClick={handleLinkClick}
                >
                  {item.name}
                </Link>
              )}

              {openMobile[item.name] && item.children && (
                <div id={`mobile-sub-${item.name}`} className="mt-1 ml-2 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className="block py-2 px-3 text-sm text-brand-l hover:bg-brand-i hover:text-brand-a transition-colors duration-200 rounded"
                      onClick={handleLinkClick}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
