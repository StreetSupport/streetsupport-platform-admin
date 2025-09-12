'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

export default function Nav() {
  const { data: session } = useSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const resourcesCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleResourcesMouseEnter() {
    if (resourcesCloseTimeoutRef.current) {
      clearTimeout(resourcesCloseTimeoutRef.current);
    }
    setIsResourcesOpen(true);
  }

  function handleResourcesMouseLeave() {
    resourcesCloseTimeoutRef.current = setTimeout(() => {
      setIsResourcesOpen(false);
    }, 300);
  }

  function handleAboutClick() {
    setIsResourcesOpen(false);
    setMobileResourcesOpen(false);
    setMenuOpen(false);
  }

  function handleMenuClose() {
    setMenuOpen(false);
  }

  return (
    <nav className="nav-container">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center w-full">
          <div className="flex items-center">
            <Link href="/" onClick={handleMenuClose}>
              <Image
                src="/assets/img/StreetSupport_logo_land.png"
                alt="Street Support Network"
                width={240}
                height={60}
                className="h-10 w-auto"
              />
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-a"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="hamburger-icon">
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            </div>
          </button>

          <div className="hidden md:flex space-x-6 items-center justify-end flex-1">

            <Link href="/organisations" className="nav-link">Organisations</Link>
            <Link href="/content" className="nav-link">Content</Link>

            <div
              className="relative"
              onMouseEnter={handleResourcesMouseEnter}
              onMouseLeave={handleResourcesMouseLeave}
            >
              <button 
                className="nav-link focus:outline-none focus:ring-2 focus:ring-brand-a rounded flex items-center gap-1"
                onMouseEnter={handleResourcesMouseEnter}
                onMouseLeave={handleResourcesMouseLeave}
                onClick={() => window.location.href = '/resources'}
              >
                Resources
                <svg className={`w-4 h-4 transition-transform duration-200 ${isResourcesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isResourcesOpen && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 z-50"
                  onMouseEnter={handleResourcesMouseEnter}
                  onMouseLeave={handleResourcesMouseLeave}
                >
                  <div className="bg-white border border-brand-f rounded-md shadow-lg">
                  <ul className="py-2">
                    <li>
                      <Link
                        href="/resources"
                        className="block px-2 py-1 text-sm !text-black hover:bg-brand-i hover:text-brand-k transition-colors duration-200 rounded"
                        onClick={handleAboutClick}
                      >
                        All Resources
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/resources/resources2"
                        className="block px-2 py-1 text-sm !text-black hover:bg-brand-i hover:text-brand-k transition-colors duration-200 rounded"
                        onClick={handleAboutClick}
                      >
                        Resources 2
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/resources/resources3"
                        className="block px-2 py-1 text-sm !text-black hover:bg-brand-i hover:text-brand-k transition-colors duration-200 rounded"
                        onClick={handleAboutClick}
                      >
                        Resources 3
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/resources/resources4"
                        className="block px-2 py-1 text-sm !text-black hover:bg-brand-i hover:text-brand-k transition-colors duration-200 rounded"
                        onClick={handleAboutClick}
                      >
                        Resources 4
                      </Link>
                    </li>
                  </ul>
                  </div>
                </div>
              )}
            </div>
            <Link href="/cities" className="nav-link">Cities</Link>
            <Link href="/users" className="nav-link">Users</Link>
          </div>
          
          <div className="hidden md:flex items-center ml-6 md:ml-8">
            {session?.user ? (
              <div className="relative">
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="btn-base btn-secondary btn-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/api/auth/signin" className="btn-base btn-primary btn-sm">Sign In</Link>
            )}
          </div>
        </div>
      </div>

      <div className={`mobile-menu-container ${menuOpen ? 'mobile-menu-open' : 'mobile-menu-closed'}`}>
        <div className="mobile-menu px-4 pb-4 space-y-2">
          <Link href="/organisations" className="mobile-nav-link" onClick={handleMenuClose}>Organisations</Link>
          <Link href="/content" className="mobile-nav-link" onClick={handleMenuClose}>Content</Link>

          <button
            onClick={() => setMobileResourcesOpen(prev => !prev)}
            className="w-full text-left mobile-nav-link font-semibold mt-2 focus:outline-none focus:ring-2 focus:ring-brand-a rounded flex items-center justify-between"
            aria-expanded={mobileResourcesOpen}
            aria-controls="mobile-about-menu"
            aria-haspopup="menu"
          >
            Resources
            <svg className={`w-5 h-5 transition-transform duration-200 ${mobileResourcesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {mobileResourcesOpen && (
            <ul id="mobile-about-menu" role="menu" className="mobile-about-menu mt-1 space-y-1 ml-4">
              <li>
                <Link
                  href="/resources"
                  className="block py-2 px-3 text-sm text-brand-l hover:bg-brand-i hover:text-brand-k transition-colors duration-200 font-semibold border-b border-brand-q pb-3 mb-2"
                  onClick={handleAboutClick}
                >
                  All Resources
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/resources3"
                  className="block py-2 px-3 text-sm text-brand-l hover:bg-brand-i hover:text-brand-k transition-colors duration-200"
                  onClick={handleAboutClick}
                >
                  Resources 2
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/resources3"
                  className="block py-2 px-3 text-sm text-brand-l hover:bg-brand-i hover:text-brand-k transition-colors duration-200"
                  onClick={handleAboutClick}
                >
                  Resources 3
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/resources4"
                  className="block py-2 px-3 text-sm text-brand-l hover:bg-brand-i hover:text-brand-k transition-colors duration-200"
                  onClick={handleAboutClick}
                >
                  Resources 4
                </Link>
              </li>
            </ul>
          )}

          <Link href="/cities" className="mobile-nav-link" onClick={handleMenuClose}>Cities</Link>
          <Link href="/users" className="mobile-nav-link" onClick={handleMenuClose}>Users</Link>
          <div className="border-t border-brand-q mt-2 pt-2 ml-0 !ml-0">
            <Link href="/" className="mobile-nav-link block" onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
