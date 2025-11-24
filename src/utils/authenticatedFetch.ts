import { signOut } from 'next-auth/react';
import { errorToast } from './toast';

/**
 * Authenticated fetch wrapper that automatically handles 401 errors
 * by signing out the user and redirecting to login
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  // If 401 Unauthorized, sign out the user
  if (response.status === 401) {
    errorToast.generic('Your session has expired. Please sign in again.');
    
    // Sign out and redirect to login page
    await signOut({ 
      callbackUrl: '/'
    });
    
    // Throw error to prevent further processing
    throw new Error('Session expired');
  }

  return response;
}
