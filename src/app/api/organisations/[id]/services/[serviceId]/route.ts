import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendError, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const putHandler: AuthenticatedApiHandler<{ id: string; serviceId: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/services', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const { serviceId } = context.params;
    const body = await req.json();

    const url = `${API_BASE_URL}/api/services/${serviceId}`;

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
      return sendError(response.status, data.error || 'Failed to update organisation service');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating organisation service:', error);
    return sendInternalError();
  }
};

const deleteHandler: AuthenticatedApiHandler<{ id: string; serviceId: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/services', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const { serviceId } = context.params;
    const url = `${API_BASE_URL}/api/services/${serviceId}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to delete organisation service');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting organisation service:', error);
    return sendInternalError();
  }
};

export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
