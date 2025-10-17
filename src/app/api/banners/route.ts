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
    if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const { searchParams } = new URL(req.url);
    
    // Add location filtering for CityAdmin users when dropdown is empty (showing all their locations)
    const userAuthClaims = auth.session.user.authClaims as UserAuthClaims;
    const locationSlugs = getUserLocationSlugs(userAuthClaims);
    const selectedLocation = searchParams.get('location');
    
    // If CityAdmin with specific locations AND no location selected in dropdown
    // Pass all their locations to show all banners they have access to
    if (locationSlugs && locationSlugs.length > 0 && !selectedLocation) {
      searchParams.set('locations', locationSlugs.join(','));
    }
    
    const queryString = searchParams.toString();
    
    const response = await fetch(`${API_BASE_URL}/api/banners?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to fetch banners');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return sendInternalError('Failed to fetch banners');
  }
};

const postHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', HTTP_METHODS.POST)) {
      return sendForbidden();
    }

    const formData = await req.formData();
    
    const response = await fetch(`${API_BASE_URL}/api/banners`, {
      method: HTTP_METHODS.POST,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to create banner');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error creating banner:', error);  
    return sendInternalError('Failed to create banner');
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
