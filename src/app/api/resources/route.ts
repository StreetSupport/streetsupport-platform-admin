import { NextRequest } from 'next/server';
import { sendForbidden, sendInternalError, proxyResponse, sendError } from '@/utils/apiResponses';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';

const API_BASE_URL = process.env.API_BASE_URL;

// GET /api/resources - Get all resources
const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/resources', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    // Forward query parameters to backend API
    const queryString = req.nextUrl.search;
    const url = `${API_BASE_URL}/api/resources${queryString}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to fetch resources');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
