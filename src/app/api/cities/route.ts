import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';
import { UserAuthClaims } from '@/types/auth';
import { getUserLocationSlugs } from '@/utils/locationUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/cities', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    // Add location filtering for CityAdmin users
    const userAuthClaims = auth.session.user.authClaims as UserAuthClaims;
    const locationSlugs = getUserLocationSlugs(userAuthClaims);
    
    // Build query string
    let url = `${API_BASE_URL}/api/cities`;
    
    // If locationSlugs is an array (CityAdmin with specific locations), add them to query
    if (locationSlugs && locationSlugs.length > 0) {
      const params = new URLSearchParams();
      params.set('locations', locationSlugs.join(','));
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Cities API error:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
