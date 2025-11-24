import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { getUserLocationSlugs } from '@/utils/locationUtils';
import { UserAuthClaims } from '@/types/auth';
import { proxyResponse, sendError, sendForbidden, sendInternalError } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// GET /api/location-logos - Get all location logos with filtering
const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/location-logos', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    // Forward query parameters
    const searchParams = req.nextUrl.searchParams;

    // Add location filtering for CityAdmin users
    const userAuthClaims = auth.session.user.authClaims as UserAuthClaims;
    const locationSlugs = getUserLocationSlugs(userAuthClaims);
    const selectedLocation = searchParams.get('location');
    
    // If user has location restrictions AND no location selected, add their locations
    if (locationSlugs && locationSlugs.length > 0 && !selectedLocation) {
      searchParams.set('locations', locationSlugs.join(','));
    }

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/api/location-logos${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${auth.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();


    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to fetch location logo');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching location logos:', error);
    return sendInternalError('Failed to fetch location logo');
  }
};

// POST /api/location-logos - Create new location logo
const postHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/location-logos', HTTP_METHODS.POST)) {
      return sendForbidden();
    }

    const formData = await req.formData();

    const response = await fetch(`${API_BASE_URL}/api/location-logos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.session.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to create location logo');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error creating location logo:', error);
    return sendInternalError('Failed to create location logo');
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
