import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendError, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const putHandler: AuthenticatedApiHandler<{ id: string; accommodationId: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/accommodations', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { accommodationId } = params;
    const body = await req.json();

    const url = `${API_BASE_URL}/api/accommodations/${accommodationId}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to update accommodation');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating accommodation:', error);
    return sendInternalError();
  }
};

const deleteHandler: AuthenticatedApiHandler<{ id: string; accommodationId: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/accommodations', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { accommodationId } = params;

    const url = `${API_BASE_URL}/api/accommodations/${accommodationId}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to delete accommodation');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    return sendInternalError();
  }
};

export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
