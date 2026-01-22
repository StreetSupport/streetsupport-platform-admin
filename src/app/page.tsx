import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getHomePageForUser } from '@/lib/roleHomePages';

// Metadata for the admin dashboard
export const metadata: Metadata = {
  title: 'Main Page | Street Support',
  description: 'Main page for Street Support platform',
};

/**
 * Main page that redirects users to their role-specific home page
 * 
 * - SwepAdmin (only role with SwepAdminFor: claims) → /swep-banners
 * - All other roles → /organisations
 */
export default async function MainPage() {
  const session = await getServerSession(authOptions);
  
  // If no session, redirect to sign in (this shouldn't happen due to middleware)
  if (!session?.user?.authClaims) {
    redirect('/api/auth/signin/auth0');
  }
  
  // Get all auth claims (roles + specific claims)
  const allAuthClaims = [
    ...session.user.authClaims.roles,
    ...session.user.authClaims.specificClaims
  ];
  
  // Determine home page based on user roles
  const homePage = getHomePageForUser(allAuthClaims);
  
  redirect(homePage);
}
