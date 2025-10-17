import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendInternalError, proxyResponse, sendError } from '@/utils/apiResponses';

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
      return sendError(response.status, errorData.error || 'Failed to fetch banner');
    }

    const data = await response.json();
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

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
