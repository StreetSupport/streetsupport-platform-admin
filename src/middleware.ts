import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Set this to false to disable the maintenance mode
const MAINTENANCE_MODE = true

export function middleware(request: NextRequest) {
  // Skip maintenance for non-banner routes when not in maintenance mode
  if (!MAINTENANCE_MODE) {
    return NextResponse.next()
  }

  // Block all banner-related routes
  if (request.nextUrl.pathname.startsWith('/banners') || 
      request.nextUrl.pathname.startsWith('/api/banners')) {
    
    // For API routes, return a 503 JSON response
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ 
          message: 'Banner API is currently under maintenance. Please try again later.',
          status: 'maintenance',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 503, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '3600' // 1 hour
          } 
        }
      )
    }
    
    // For page routes, redirect to maintenance page
    const url = request.nextUrl.clone()
    url.pathname = '/maintenance'
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/banners/:path*',
    '/api/banners/:path*',
  ],
}
