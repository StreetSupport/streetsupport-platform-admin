import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasApiAccess } from '@/lib/userService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to banners toggle API
    if (!hasApiAccess(session.user.authClaims, '/api/banners', 'PATCH')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/banners/${params.id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error toggling banner status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle banner status' },
      { status: 500 }
    );
  }
}
