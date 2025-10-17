import { HTTP_METHODS } from '@/constants/httpMethods';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const postHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/service-providers', HTTP_METHODS.POST)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/service-providers/${id}/notes`, {
      method: HTTP_METHODS.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: data?.message || 'Failed to add note' }, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error adding note:', error);
    return sendInternalError();
  }
};

const deleteHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/service-providers', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const { id } = context.params;

    const response = await fetch(`${API_BASE_URL}/api/service-providers/${id}/notes`, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: data?.message || 'Failed to clear notes' }, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error clearing notes:', error);
    return sendInternalError();
  }
};

export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);
