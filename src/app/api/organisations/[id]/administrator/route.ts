import { HTTP_METHODS } from '@/constants/httpMethods';
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse, sendError } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

// @desc    Update selected administrator for organisation
// @route   PUT /api/organisations/[id]/administrator
// @access  Private (OrgAdmin, CityAdmin, SuperAdmin)
const putHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/organisations', HTTP_METHODS.PUT)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/organisations/${id}/administrator`, {
      method: HTTP_METHODS.PUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to update administrator');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error updating administrator:', error);
    return sendInternalError();
  }
};

export const PUT = withAuth(putHandler);
