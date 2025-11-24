'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Nav from './Nav';

export default function Header() {
  useSession(); // Session is kept for potential auth side effects

  return (
    <header className="nav-container relative w-full md:fixed md:top-0 md:z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Nav />
        </div>
      </div>
    </header>
  );
}
