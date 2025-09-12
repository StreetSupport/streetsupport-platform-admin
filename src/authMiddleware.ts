import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JWT } from 'next-auth/jwt';

// Extend the JWT type to include our custom fields
type ExtendedJWT = JWT & {
  role?: 'admin' | 'moderator' | 'user';
  id?: string;
  accessToken?: string;
};

type WithAuthRequest = NextRequest & {
  nextauth?: {
    token: ExtendedJWT | null;
  };
};

// Define public paths that don't require authentication
const publicPaths = [
  '/api/auth/signin',
  '/api/auth/error',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/images',
];

// Define admin paths that require admin role
const adminPaths = ['/admin'];

// Define moderator paths that require at least moderator role
const moderatorPaths = ['/moderator'];

export default withAuth(
  function middleware(request: WithAuthRequest) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth?.token;
    
    // Check role-based access
    if (token?.role) {
      // Check admin routes
      if (adminPaths.some(path => pathname.startsWith(path)) && token.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // Check moderator routes
      if (moderatorPaths.some(path => pathname.startsWith(path)) && 
          !['admin', 'moderator'].includes(token.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = new URL(req.url);
        
        // Allow access to public paths
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true;
        }
        
        // Require authentication for all other paths
        return !!token;
      },
    },
    pages: {
      signIn: '/api/auth/signin',
      error: '/api/auth/error',
    },
  }
);

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
