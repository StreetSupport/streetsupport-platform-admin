import { HTTP_METHODS } from '@/constants/httpMethods';
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse, sendError } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const postHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/organisations', HTTP_METHODS.POST)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/organisations/${id}/notes`, {
      method: HTTP_METHODS.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to add note');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error adding note:', error);
    return sendInternalError();
  }
};

const deleteHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/organisations', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const { id } = context.params;

    const response = await fetch(`${API_BASE_URL}/api/organisations/${id}/notes`, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to clear notes');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error clearing notes:', error);
    return sendInternalError();
  }
};

export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);
