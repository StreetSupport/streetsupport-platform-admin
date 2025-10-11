import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { sendUnauthorized, sendInternalError, proxyResponse } from '@/utils/apiResponses';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// GET /api/users/:id - Get single user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return sendUnauthorized();
    }

    const { id } = await params;
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: HTTP_METHODS.GET,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch user' },
        { status: response.status }
      );
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching user:', error);
    return sendInternalError();
  }
}

// PUT /api/users/:id - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return sendUnauthorized();
    }

    const body = await req.json();
    const { id } = await params;
    
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to update user' },
        { status: response.status }
      );
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating user:', error);
    return sendInternalError();
  }
}

// DELETE /api/users/:id - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return sendUnauthorized();
    }

    const { id } = await params;
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to delete user' },
        { status: response.status }
      );
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting user:', error);
    return sendInternalError();
  }
}
