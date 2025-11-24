import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendError, sendForbidden, sendInternalError, proxyResponse, sendNotFound } from '@/utils/apiResponses';
import { notFound } from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL;

type RouteParams = {
  id: string;
};

// GET /api/advice/[id] - Get single advice item
const getHandler: AuthenticatedApiHandler<RouteParams> = async (req: NextRequest, context, auth) => {
  try {
    // Check authorization
    if (!hasApiAccess(auth.session.user.authClaims, '/api/faqs', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { id } = params;
    const url = `${API_BASE_URL}/api/faqs/${id}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      debugger
      if (response.status === 404) {
        return sendNotFound();
      }
      return sendError(response.status, data.error || 'Failed to fetch advice');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching advice:', error);
    return sendInternalError();
  }
};

// PUT /api/advice/[id] - Update advice item
const putHandler: AuthenticatedApiHandler<RouteParams> = async (req: NextRequest, context, auth) => {
  try {
    // Check authorization
    if (!hasApiAccess(auth.session.user.authClaims, '/api/faqs', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    const url = `${API_BASE_URL}/api/faqs/${id}`;

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
      return sendError(response.status, data.error || 'Failed to update advice');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating advice:', error);
    return sendInternalError();
  }
};

// DELETE /api/advice/[id] - Delete advice item
const deleteHandler: AuthenticatedApiHandler<RouteParams> = async (req: NextRequest, context, auth) => {
  try {
    // Check authorization
    if (!hasApiAccess(auth.session.user.authClaims, '/api/advice', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { id } = params;
    const url = `${API_BASE_URL}/api/faqs/${id}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to delete advice');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting advice:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
