import { HTTP_METHODS } from '@/constants/httpMethods';
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse, sendError } from '@/utils/apiResponses';
import { ROLES } from '@/constants/roles';

const API_BASE_URL = process.env.API_BASE_URL;

const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/organisations', HTTP_METHODS.GET)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/organisations/${id}`, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to fetch organisation');
    }

    return proxyResponse(data);
  } catch (error) {    
    console.error('Error fetching organisation:', error);
    return sendInternalError();
  }
};

const putHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/organisations', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/organisations/${id}`, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to update organisation');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating organisation:', error);
    return sendInternalError();
  }
};

const patchHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/organisations', HTTP_METHODS.PATCH)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/organisations/${id}`, {
      method: HTTP_METHODS.PATCH,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to patch organisation');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error patching organisation:', error);
    return sendInternalError();
  }
};

const deleteHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    // Only SuperAdminPlus can delete organisations
    const userRoles = auth.session.user.authClaims.roles;
    if (!userRoles.includes(ROLES.SUPER_ADMIN_PLUS)) {
      return sendForbidden('Only SuperAdminPlus role can delete organisations');
    }

    const { id } = context.params;

    const response = await fetch(`${API_BASE_URL}/api/organisations/${id}`, {
      method: HTTP_METHODS.DELETE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to delete organisation');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error deleting organisation:', error);
    return sendInternalError();
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
