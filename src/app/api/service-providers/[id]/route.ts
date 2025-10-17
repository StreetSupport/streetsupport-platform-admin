import { HTTP_METHODS } from '@/constants/httpMethods';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/service-providers', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const { id } = context.params;

    const response = await fetch(`${API_BASE_URL}/api/service-providers/${id}`, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: data?.message || 'Failed to fetch service provider' }, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching service provider:', error);
    return sendInternalError();
  }
};

const putHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/service-providers', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/service-providers/${id}`, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: data?.message || 'Failed to update service provider' }, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating service provider:', error);
    return sendInternalError();
  }
};

const deleteHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/service-providers', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const { id } = context.params;

    const response = await fetch(`${API_BASE_URL}/api/service-providers/${id}`, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: data?.message || 'Failed to delete service provider' }, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting service provider:', error);
    return sendInternalError();
  }
};

const patchHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/service-providers', HTTP_METHODS.PATCH)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/service-providers/${id}`, {
      method: HTTP_METHODS.PATCH,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: data?.message || 'Failed to patch service provider' }, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error patching service provider:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
export const PATCH = withAuth(patchHandler);
