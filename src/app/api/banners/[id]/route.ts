import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {

    return sendInternalError(`Failed to fetch banner: ${error}`);
  }
};

const putHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const formData = await req.formData();
    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    return sendInternalError(`Failed to update banner: ${error}`);
  }
};

const deleteHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting banner:', error);
    return sendInternalError('Failed to delete banner');
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
