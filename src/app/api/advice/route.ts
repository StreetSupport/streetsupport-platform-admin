import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendError, sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';
import { getUserLocationSlugs } from '@/utils/locationUtils';
import { UserAuthClaims } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// GET /api/advice - Get all advice items with filtering and pagination
const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    // Check authorization
    if (!hasApiAccess(auth.session.user.authClaims, '/api/faqs', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    // Forward query parameters
    const searchParams = req.nextUrl.searchParams;

    // Add location filtering for CityAdmin users when dropdown is empty (showing all their locations)
    const userAuthClaims = auth.session.user.authClaims as UserAuthClaims;
    const locationSlugs = getUserLocationSlugs(userAuthClaims);
    const selectedLocation = searchParams.get('location');

    // If CityAdmin or SwepAdmin with specific locations AND no location selected in dropdown
    // Pass all their locations to show all users they have access to
    if (locationSlugs && locationSlugs.length > 0 && !selectedLocation) {
      searchParams.set('locations', locationSlugs.join(','));
    }

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/api/faqs${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to fetch advice');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching advice:', error);
    return sendInternalError();
  }
};

// POST /api/advice - Create new advice item
const postHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    // Check authorization
    if (!hasApiAccess(auth.session.user.authClaims, '/api/faqs', HTTP_METHODS.POST)) {
      return sendForbidden();
    }

    const body = await req.json();
    const url = `${API_BASE_URL}/api/faqs`;

    const response = await fetch(url, {
      method: HTTP_METHODS.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to create advice');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error creating advice:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
