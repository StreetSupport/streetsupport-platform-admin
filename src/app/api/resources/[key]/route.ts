import { NextRequest } from 'next/server';
import { sendForbidden, sendInternalError, proxyResponse, sendError, sendNotFound } from '@/utils/apiResponses';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  key: string;
};

// GET /api/resources/[key] - Get single resource
const getHandler: AuthenticatedApiHandler<RouteParams> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/resources', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { key } = params;

    const url = `${API_BASE_URL}/api/resources/${key}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return sendNotFound();
      }

      return sendError(response.status, data.error || 'Failed to fetch resource');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return sendInternalError();
  }
};

// PUT /api/resources/[key] - Update resource
const putHandler: AuthenticatedApiHandler<RouteParams> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/resources', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { key } = params;

    // Get the FormData from the request
    const formData = await req.formData();

    const url = `${API_BASE_URL}/api/resources/${key}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to update resource');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating resource:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
