'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import RoleBasedNav from '@/components/navigation/RoleBasedNav';

import UserProfileModal from '@/components/users/UserProfileModal';
import { useRef } from 'react';
import { hasPageAccess } from '@/lib/userService';

export default function Nav() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [isContentOpen, setIsContentOpen] = useState(false);
  const [mobileContentOpen, setMobileContentOpen] = useState(false);
  const contentCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user info
  const userEmail = session?.user?.email || '';
  const userAuthClaims = session?.user?.authClaims || { roles: [], specificClaims: [] };
  
  // Get user initials from email
  const getUserInitials = (email: string): string => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };
  
  const userInitials = getUserInitials(userEmail);

  function handleMenuClose() {
    setMenuOpen(false);
  }

  const hasContentAccess = session?.user?.authClaims 
  // TODO: We should adjust this logic when advice, banners and supported by pages can be managed separately
    ? hasPageAccess(session.user.authClaims, '/advice') && hasPageAccess(session.user.authClaims, '/banners') && hasPageAccess(session.user.authClaims, '/supported-by')
    : false;

  function handleContentMouseEnter() {
    if (contentCloseTimeoutRef.current) {
      clearTimeout(contentCloseTimeoutRef.current);
    }
    setIsContentOpen(true);
  }

  function handleContentMouseLeave() {
    contentCloseTimeoutRef.current = setTimeout(() => {
      setIsContentOpen(false);
    }, 300);
  }

  function handleContentClick() {
    setIsContentOpen(false);
    setMobileContentOpen(false);
    setMenuOpen(false);
  }

  return (
    <nav className="nav-container fixed top-0 w-full z-50 bg-white">
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
            className="lg:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-a"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="hamburger-icon">
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            </div>
          </button>

          <div className="hidden lg:flex space-x-6 items-center justify-end flex-1">
            <RoleBasedNav />
            {hasContentAccess && (
              <div
                className="relative"
                onMouseEnter={handleContentMouseEnter}
                onMouseLeave={handleContentMouseLeave}
              >
              <button 
                className="nav-link focus:outline-none focus:ring-2 focus:ring-brand-a rounded flex items-center gap-1"
                onMouseEnter={handleContentMouseEnter}
                onMouseLeave={handleContentMouseLeave}
              >
                Content
                <svg className={`w-4 h-4 transition-transform duration-200 ${isContentOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isContentOpen && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 z-50"
                  onMouseEnter={handleContentMouseEnter}
                  onMouseLeave={handleContentMouseLeave}
                >
                  <div className="bg-white border border-brand-f rounded-md shadow-lg">
                  <ul className="py-2">
                    <li>
                      <Link
                        href="/advice"
                        className="block px-2 py-1 text-sm !text-black hover:bg-brand-i hover:text-brand-k transition-colors duration-200 rounded"
                        onClick={handleContentClick}
                      >
                        Advice
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/banners"
                        className="block px-2 py-1 text-sm !text-black hover:bg-brand-i hover:text-brand-k transition-colors duration-200 rounded"
                        onClick={handleContentClick}
                      >
                        Banners
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/supported-by"
                        className="block px-2 py-1 text-sm !text-black hover:bg-brand-i hover:text-brand-k transition-colors duration-200 rounded"
                        onClick={handleContentClick}
                      >
                        Supported By
                      </Link>
                    </li>
                  </ul>
                  </div>
                </div>
              )}
              </div>
            )}
          </div>
          
          <div className="hidden lg:flex items-center ml-6 lg:ml-8 gap-4">
            {session?.user ? (
              <>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-a text-white font-semibold text-sm hover:bg-brand-b transition-colors focus:outline-none focus:ring-2 focus:ring-brand-a focus:ring-offset-2 cursor-pointer"
                  aria-label="View profile"
                  title={userEmail}
                >
                  {userInitials}
                </button>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="btn-base btn-secondary btn-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/api/auth/signin" className="btn-base btn-primary btn-sm">Sign In</Link>
            )}
          </div>
        </div>
      </div>

      <div className={`mobile-menu-container ${menuOpen ? 'mobile-menu-open' : 'mobile-menu-closed'}`}>
        <div className="mobile-menu px-4 pb-4 space-y-2">
          <RoleBasedNav isMobile={true} onItemClick={handleMenuClose} />
          {hasContentAccess && (
            <>
              <button
                onClick={() => setMobileContentOpen(prev => !prev)}
                className="w-full text-left mobile-nav-link font-semibold mt-2 focus:outline-none focus:ring-2 focus:ring-brand-a rounded flex items-center justify-between"
                aria-expanded={mobileContentOpen}
                aria-controls="mobile-about-menu"
                aria-haspopup="menu"
              >
                Content
                <svg className={`w-5 h-5 transition-transform duration-200 ${mobileContentOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileContentOpen && (
                <ul id="mobile-about-menu" role="menu" className="mobile-about-menu mt-1 space-y-1 ml-4">
                  <li>
                    <Link
                      href="/advice"
                      className="block py-2 px-3 text-sm text-brand-l hover:bg-brand-i hover:text-brand-k transition-colors duration-200"
                      onClick={handleContentClick}
                    >
                      Advice
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/banners"
                      className="block py-2 px-3 text-sm text-brand-l hover:bg-brand-i hover:text-brand-k transition-colors duration-200"
                      onClick={handleContentClick}
                    >
                      Banners
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/supported-by"
                      className="block py-2 px-3 text-sm text-brand-l hover:bg-brand-i hover:text-brand-k transition-colors duration-200"
                      onClick={handleContentClick}
                    >
                      Supported By
                    </Link>
                  </li>
                </ul>
              )}
            </>
          )}

          <div className="border-t border-brand-q mt-2 pt-2 ml-0 !ml-0">
            {session?.user && (
              <button
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setMenuOpen(false);
                }}
                className="mobile-nav-link block w-full text-left mb-2 cursor-pointer"
              >
                {userEmail}
              </button>
            )}
            <Link href="/" className="mobile-nav-link block" onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</Link>
          </div>
        </div>
      </div>
      
      {/* User Profile Modal */}
      {session?.user && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          email={userEmail}
          authClaims={userAuthClaims}
        />
      )}
    </nav>
  );
}
