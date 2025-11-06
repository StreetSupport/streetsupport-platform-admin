import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendError, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/service-categories', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const url = `${API_BASE_URL}/api/service-categories`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to fetch service categories');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
