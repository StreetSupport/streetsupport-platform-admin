import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { HTTP_METHODS } from '@/constants/httpMethods';
import { proxyResponse, sendError, sendForbidden, sendInternalError, sendNotFound } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// GET /api/location-logos/[id] - Get single location logo
const getHandler: AuthenticatedApiHandler<{ id: string }> = async (req, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/location-logos', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const { id } = await context.params;

    const response = await fetch(`${API_BASE_URL}/api/location-logos/${id}`, {
      headers: {
        'Authorization': `Bearer ${auth.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return sendNotFound();
      }

      return sendError(response.status, data.error || 'Failed to fetch location logo');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error fetching location logo:', error);
    return sendInternalError('Failed to fetch location logo');
  }
};

// PUT /api/location-logos/[id] - Update location logo
const putHandler: AuthenticatedApiHandler<{ id: string }> = async (req, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/location-logos', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const formData = await req.formData();

    const response = await fetch(`${API_BASE_URL}/api/location-logos/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${auth.session.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to update location logo');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating location logo:', error);
    return sendInternalError('Failed to update location logo');
  }
};

// DELETE /api/location-logos/[id] - Delete location logo
const deleteHandler: AuthenticatedApiHandler<{ id: string }> = async (req, context, auth) => {
  try {
    // Check RBAC permissions
    if (!hasApiAccess(auth.session.user.authClaims, '/api/location-logos', HTTP_METHODS.DELETE)) {
      return sendForbidden();
    }

    const { id } = context.params;

    const response = await fetch(`${API_BASE_URL}/api/location-logos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth.session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to delete location logo');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting location logo:', error);
    return sendInternalError('Failed to delete location logo');
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
