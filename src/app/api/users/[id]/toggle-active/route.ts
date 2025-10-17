import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendInternalError, proxyResponse, sendError } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const patchHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/users', HTTP_METHODS.PATCH)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/users/${id}/toggle-active`, {
      method: HTTP_METHODS.PATCH,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to toggle user status');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return sendInternalError();
  }
};

export const PATCH = withAuth(patchHandler);
