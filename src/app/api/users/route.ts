import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendUnauthorized, sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { UserAuthClaims } from '@/types/auth';
import { getUserLocationSlugs } from '@/utils/locationUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// GET /api/users - Get all users with filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return sendUnauthorized();
    }

    // Optional RBAC check (mirrors other routes)
    const canAccess = hasApiAccess(session.user.authClaims, '/api/users', HTTP_METHODS.GET);
    if (!canAccess) {
      return sendForbidden();
    }

    // Forward query parameters
    const searchParams = req.nextUrl.searchParams;
    
    // Add location filtering for CityAdmin users when dropdown is empty (showing all their locations)
    const userAuthClaims = session.user.authClaims as UserAuthClaims;
    const locationSlugs = getUserLocationSlugs(userAuthClaims);
    const selectedLocation = searchParams.get('location');
    
    // If CityAdmin with specific locations AND no location selected in dropdown
    // Pass all their locations to show all users they have access to
    if (locationSlugs && locationSlugs.length > 0 && !selectedLocation) {
      searchParams.set('locations', locationSlugs.join(','));
    }
    
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/api/users${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch users' },
        { status: response.status }
      );
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return sendInternalError();
  }
}

// POST /api/users - Create new user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return sendUnauthorized();
    }

    const body = await req.json();
    
    // Optional RBAC check
    const canCreate = hasApiAccess(session.user.authClaims, '/api/users', HTTP_METHODS.POST);
    if (!canCreate) {
      return sendForbidden();
    }

    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: HTTP_METHODS.POST,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to create user' },
        { status: response.status }
      );
    }

    return proxyResponse(data, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return sendInternalError();
  }
}
