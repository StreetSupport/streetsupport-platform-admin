import { HTTP_METHODS } from "@/constants/httpMethods";
import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const patchHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', HTTP_METHODS.PATCH)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/banners/${id}/toggle`, {
      method: HTTP_METHODS.PATCH,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: data?.message || 'Failed to toggle banner status' }, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error toggling banner status:', error);
    return sendInternalError('Failed to toggle banner status');
  }
};

export const PATCH = withAuth(patchHandler);
