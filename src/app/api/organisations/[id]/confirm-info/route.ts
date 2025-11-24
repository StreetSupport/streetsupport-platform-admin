import { HTTP_METHODS } from '@/constants/httpMethods';
import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
import { hasApiAccess } from '@/lib/userService';
import { sendForbidden, sendInternalError, proxyResponse, sendError } from '@/utils/apiResponses';

const API_BASE_URL = process.env.API_BASE_URL;

// @desc    Confirm organisation information is up to date
// @route   POST /api/organisations/[id]/confirm-info
// @access  Private (OrgAdmin, CityAdmin, SuperAdmin)
const postHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
  try {
    if (!hasApiAccess(auth.session.user.authClaims, '/api/organisations', HTTP_METHODS.POST)) {
      return sendForbidden();
    }

    const { id } = context.params;
    const response = await fetch(`${API_BASE_URL}/api/organisations/${id}/confirm-info`, {
      method: HTTP_METHODS.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return sendError(response.status, data.error || 'Failed to confirm organisation information');
    }

    return proxyResponse(data);
  } catch (error) {
    console.error('Error confirming organisation information:', error);
    return sendInternalError();
  }
};

export const POST = withAuth(postHandler);
