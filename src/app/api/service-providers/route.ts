import { HTTP_METHODS } from '@/constants/httpMethods';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/service-providers', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    // Forward query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/api/service-providers${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: data?.message || 'Failed to fetch service providers' }, { status: response.status });
    }

    const data = await response.json();
    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching service providers:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
