import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendInternalError, proxyResponse, sendError, sendNotFound } from '@/utils/apiResponses';

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

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return sendNotFound();
      }

      return sendError(response.status, data.error || 'Failed to fetch banner');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return sendInternalError('Failed to fetch banner');
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

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to update banner');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating banner:', error);
    return sendInternalError('Failed to update banner');
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

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to delete banner');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting banner:', error);
    return sendInternalError('Failed to delete banner');
  }
};

// PATCH /api/banners/[id] - Update banner activation with optional date range
const patchHandler: AuthenticatedApiHandler<{ id: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', HTTP_METHODS.PATCH)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    const url = `${API_BASE_URL}/api/banners/${id}/toggle-active`;

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
      return sendError(response.status, data.error || 'Failed to update banner status');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating banner status:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
export const PATCH = withAuth(patchHandler);
