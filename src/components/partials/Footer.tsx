'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-k text-white">
      <div className="border-t border-brand-l py-8">
        <div className="page-container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-brand-f">
            <div className="text-center md:text-left">
              <p className="text-sm">
                © {new Date().getFullYear()} Street Support Network Ltd.
              </p>
              <p className="text-xs mt-1">
                Registered Charity 1177546
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-xs">
              <Link href="https://streetsupport-platform-web-staging.vercel.app/about/privacy-and-data/privacy-policy" className="hover:text-brand-a transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="https://streetsupport-platform-web-staging.vercel.app/about/privacy-and-data/terms-and-conditions" className="hover:text-brand-a transition-colors duration-200">
                Terms & Conditions
              </Link>
              <Link href="https://streetsupport-platform-web-staging.vercel.app/about/privacy-and-data/cookie-policy" className="hover:text-brand-a transition-colors duration-200">
                Cookie Policy
              </Link>
              <Link href="https://streetsupport-platform-web-staging.vercel.app/about/accessibility" className="hover:text-brand-a transition-colors duration-200">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
