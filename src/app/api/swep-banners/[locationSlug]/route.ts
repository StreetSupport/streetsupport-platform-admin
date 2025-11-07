import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// GET /api/swep-banners/[locationSlug] - Get single SWEP banner by location
const getHandler: AuthenticatedApiHandler<{ locationSlug: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/swep-banners', HTTP_METHODS.GET)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { locationSlug } = params;
    const url = `${API_BASE_URL}/api/swep-banners/${locationSlug}`;

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
        { success: false, error: data.error || 'Failed to fetch SWEP banner' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching SWEP banner:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// PUT /api/swep-banners/[locationSlug] - Update SWEP banner
const putHandler: AuthenticatedApiHandler<{ locationSlug: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/swep-banners', HTTP_METHODS.PUT)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { locationSlug } = params;
    const url = `${API_BASE_URL}/api/swep-banners/${locationSlug}`;

    // ALWAYS expect FormData (Banner approach) - simpler and more consistent
    const formData = await req.formData();
    
    const response = await fetch(url, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        // Don't set Content-Type for FormData - fetch will set it with boundary
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to update SWEP banner' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating SWEP banner:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// PATCH /api/swep-banners/[locationSlug] - Update SWEP banner activation with optional date range
const patchHandler: AuthenticatedApiHandler<{ locationSlug: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/swep-banners', HTTP_METHODS.PATCH)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { locationSlug } = params;
    const body = await req.json();
    const url = `${API_BASE_URL}/api/swep-banners/${locationSlug}/toggle-active`;

    const response = await fetch(url, {
      method: HTTP_METHODS.PATCH,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to update SWEP banner status' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating SWEP banner status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const PATCH = withAuth(patchHandler);
