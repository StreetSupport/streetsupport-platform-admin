// TODO: Refactor it later
// import { NextRequest, NextResponse } from 'next/server';
// import { withAuth, AuthenticatedApiHandler } from '@/lib/withAuth';
// import { hasApiAccess } from '@/lib/userService';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// const getHandler: AuthenticatedApiHandler = async (req: NextRequest, context, auth) => {
//   try {
//     // Check if user has access to banners stats API
//     if (!hasApiAccess(auth.session.user.authClaims, '/api/banners', 'GET')) {
//       return NextResponse.json(
//         { success: false, error: 'Forbidden - insufficient permissions' },
//         { status: 403 }
//       );
//     }
    
//     const response = await fetch(`${API_BASE_URL}/api/banners/stats`, {
//       headers: {
//         'Authorization': `Bearer ${auth.accessToken}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`API responded with status: ${response.status}`);
//     }

//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error('Error fetching banner stats:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch banner stats' },
//       { status: 500 }
//     );
//   }
// };

// export const GET = withAuth(getHandler);
