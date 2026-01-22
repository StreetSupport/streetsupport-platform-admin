import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendInternalError, proxyResponse, sendError } from '@/utils/apiResponses';
import { UserAuthClaims } from '@/types/auth';
import { getUserLocationSlugs } from '@/utils/locationUtils';

const API_BASE_URL = process.env.API_BASE_URL;

const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/cities', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    // Add location filtering for CityAdmin users
    // Check if this request is from Users page (restrictVolunteerAdmin query param)
    const restrictVolunteerAdmin = req.nextUrl.searchParams.get('restrictVolunteerAdmin') === 'true';
    const isPublic = req.nextUrl.searchParams.get('isPublic');
    const userAuthClaims = auth.session.user.authClaims as UserAuthClaims;
    const locationSlugs = getUserLocationSlugs(userAuthClaims, restrictVolunteerAdmin);

    // Build query string
    const params = new URLSearchParams();

    // If locationSlugs is an array (CityAdmin with specific locations), add them to query
    if (locationSlugs && locationSlugs.length > 0) {
      params.set('locations', locationSlugs.join(','));
    }

    // Pass through isPublic filter
    if (isPublic === 'true' || isPublic === 'false') {
      params.set('isPublic', isPublic);
    }

    let url = `${API_BASE_URL}/api/cities`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to fetch cities');
    }

    data.data.sort((a: { Name: string }, b: { Name: string }) => a.Name.localeCompare(b.Name));

    return proxyResponse(data);
  } catch (error) {
    console.error('Locations API error:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
