import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendError, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const getHandler: AuthenticatedApiHandler<{ id: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/accommodations', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const params = await context.params;
    const { id } = params;
    const url = `${API_BASE_URL}/api/accommodations/provider/${id}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to fetch organisation accommodations');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching organisation accommodations:', error);
    return sendInternalError();
  }
};

const postHandler: AuthenticatedApiHandler<{ id: string }> = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/accommodations', HTTP_METHODS.POST)) {
      return sendForbidden();
    }

    const body = await req.json();

    const url = `${API_BASE_URL}/api/accommodations`;

    const response = await fetch(url, {
      method: HTTP_METHODS.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to create organisation accommodation');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error creating organisation accommodation:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
