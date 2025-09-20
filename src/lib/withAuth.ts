import { getServerSession, Session } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from './auth';

export interface AuthContext {
  session: Session;
  accessToken: string;
}

export type AuthenticatedApiHandler = (
  req: NextRequest,
  context: { params: any }, 
  auth: AuthContext
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedApiHandler) {
  return async (req: NextRequest, context: { params: any }) => {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, context, { session, accessToken: session.accessToken });
  };
}
