'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import RoleBasedNav from '@/components/navigation/RoleBasedNav';

import UserProfileModal from '@/components/users/UserProfileModal';

export default function Nav() {
    // Uncomment if you decide to have nested menu items approach
  // import { useRef } from 'react';
  // import { hasPageAccess } from '@/lib/userService';
  // const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  // const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  // const resourcesCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // // Check if user has access to resources
  // const hasResourcesAccess = session?.user?.authClaims 
  //   ? hasPageAccess(session.user.authClaims, '/resources')
  //   : false;

  // function handleResourcesMouseEnter() {
  //   if (resourcesCloseTimeoutRef.current) {
  //     clearTimeout(resourcesCloseTimeoutRef.current);
  //   }
  //   setIsResourcesOpen(true);
  // }

  // function handleResourcesMouseLeave() {
  //   resourcesCloseTimeoutRef.current = setTimeout(() => {
  //     setIsResourcesOpen(false);
  //   }, 300);
  // }

  // function handleAboutClick() {
  //   setIsResourcesOpen(false);
  //   setMobileResourcesOpen(false);
  //   setMenuOpen(false);
  // }

  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
            {/* Uncomment if you decide to have nested menu items approach */}
            {/* {hasResourcesAccess && (
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
            )} */}
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
          {/* Uncomment if you decide to have nested menu items approach */}
          {/* {hasResourcesAccess && (
            <>
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
                      href="/resources/resources2"
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
            </>
          )} */}

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
