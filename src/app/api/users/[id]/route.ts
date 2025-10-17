import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/users', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: HTTP_METHODS.GET,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch user' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching user:', error);
    return sendInternalError();
  }
};

const putHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/users', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const body = await req.json();
    const { id } = context.params;
    
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to update user' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating user:', error);
    return sendInternalError();
  }
};

const deleteHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/users', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to delete user' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting user:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
