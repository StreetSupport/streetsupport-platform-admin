// TODO: Refactor it later
// import { NextRequest, NextResponse } from 'next/server';
// import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
// import { hasApiAccess } from '@/lib/userService';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// const patchHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
//   try {
//     if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', 'PATCH')) {
//       return NextResponse.json(
//         { success: false, error: 'Forbidden - insufficient permissions' },
//         { status: 403 }
//       );
//     }

//     const { id } = context.params;
//     const response = await fetch(`${API_BASE_URL}/api/banners/${id}/toggle`, {
//       method: 'PATCH',
//       headers: {
//         'Authorization': `Bearer ${auth.accessToken}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       return NextResponse.json(errorData, { status: response.status });
//     }

//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error('Error toggling banner status:', error);
//     return NextResponse.json(
//       { error: 'Failed to toggle banner status' },
//       { status: 500 }
//     );
//   }
// };

// export const PATCH = withAuth(patchHandler);
