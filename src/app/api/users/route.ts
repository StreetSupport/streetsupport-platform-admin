import { HTTP_METHODS } from '@/constants/httpMethods';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';
import { UserAuthClaims } from '@/types/auth';
import { getUserLocationSlugs } from '@/utils/locationUtils';

const API_BASE_URL = process.env.API_BASE_URL;

// GET /api/users - Get all users with filtering
const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/users', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    // Forward query parameters
    const searchParams = req.nextUrl.searchParams;
    
    // Add location filtering for CityAdmin users when dropdown is empty (showing all their locations)
    const userAuthClaims = auth.session.user.authClaims as UserAuthClaims;
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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch users' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return sendInternalError();
  }
};

// POST /api/users - Create new user
const postHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/users', HTTP_METHODS.POST)) {
      return sendForbidden();
    }

    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: HTTP_METHODS.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to create user' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return proxyResponse(data, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
