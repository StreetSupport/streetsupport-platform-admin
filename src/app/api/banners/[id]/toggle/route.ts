import { HTTP_METHODS } from "@/constants/httpMethods";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { sendUnauthorized, sendInternalError, proxyResponse } from '@/utils/apiResponses';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // Next.js dynamic API params must be awaited

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    return sendInternalError('API base URL is not configured');
  }

  const token = await getToken({ req });
  if (!token) {
    return sendUnauthorized();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/banners/${id}/toggle`, {
      method: HTTP_METHODS.PATCH,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data?.message || 'Failed to toggle banner status' }, { status: response.status });
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error toggling banner status:', error);
    return sendInternalError('Failed to toggle banner status');
  }
}
