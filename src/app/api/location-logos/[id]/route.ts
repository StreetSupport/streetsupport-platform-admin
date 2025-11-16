import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// GET /api/location-logos/[id] - Get single location logo
const getHandler: AuthenticatedApiHandler<{ id: string }> = async (req, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/location-logos', HTTP_METHODS.GET)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const response = await fetch(`${API_BASE_URL}/api/location-logos/${id}`, {
      headers: {
        'Authorization': `Bearer ${auth.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch location logo' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching location logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location logo' },
      { status: 500 }
    );
  }
};

// PUT /api/location-logos/[id] - Update location logo
const putHandler: AuthenticatedApiHandler<{ id: string }> = async (req, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/location-logos', HTTP_METHODS.PUT)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = context.params;
    const formData = await req.formData();

    const response = await fetch(`${API_BASE_URL}/api/location-logos/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${auth.session.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to update location logo' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating location logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update location logo' },
      { status: 500 }
    );
  }
};

// DELETE /api/location-logos/[id] - Delete location logo
const deleteHandler: AuthenticatedApiHandler<{ id: string }> = async (req, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/location-logos', HTTP_METHODS.DELETE)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = context.params;

    const response = await fetch(`${API_BASE_URL}/api/location-logos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to delete location logo' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting location logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete location logo' },
      { status: 500 }
    );
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
