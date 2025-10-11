import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const patchHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/users', HTTP_METHODS.PATCH)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_URL}/api/users/${id}/toggle-active`, {
      method: HTTP_METHODS.PATCH,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to toggle user status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return sendInternalError();
  }
};

export const PATCH = withAuth(patchHandler);
