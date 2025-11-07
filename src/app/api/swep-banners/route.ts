import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { getUserLocationSlugs } from '@/utils/locationUtils';
import { UserAuthClaims } from '@/types/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// GET /api/swep-banners - Get all SWEP banners with filtering
const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/swep-banners', HTTP_METHODS.GET)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Forward query parameters
    const searchParams = req.nextUrl.searchParams;

    // Add location filtering for CityAdmin users when dropdown is empty (showing all their locations)
    const userAuthClaims = auth.session.user.authClaims as UserAuthClaims;
    const locationSlugs = getUserLocationSlugs(userAuthClaims, true);
    const selectedLocation = searchParams.get('location');
    
    // If CityAdmin or SwepAdmin with specific locations AND no location selected in dropdown
    // Pass all their locations to show all users they have access to
    if (locationSlugs && locationSlugs.length > 0 && !selectedLocation) {
      searchParams.set('locations', locationSlugs.join(','));
    }

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/api/swep-banners${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch SWEP banners' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching SWEP banners:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const GET = withAuth(getHandler);
