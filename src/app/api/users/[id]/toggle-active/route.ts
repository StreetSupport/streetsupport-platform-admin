import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendUnauthorized, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// PATCH /api/users/:id/toggle-active - Toggle user active status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return sendUnauthorized();
    }

    const { id } = await params;
    const response = await fetch(`${API_URL}/api/users/${id}/toggle-active`, {
      method: HTTP_METHODS.PATCH,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to toggle user status' },
        { status: response.status }
      );
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return sendInternalError();
  }
}
