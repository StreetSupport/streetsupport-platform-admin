'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

interface AuthContextType {
  user: Session['user'] | null;
  isLoading: boolean;
  error?: Error;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
