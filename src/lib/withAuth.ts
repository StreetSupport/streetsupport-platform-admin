import { getServerSession, Session } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from './auth';

export interface AuthContext {
  session: Session;
  accessToken: string;
}

type RouteParams = Record<string, string | string[]>;

export type AuthenticatedApiHandler<P extends RouteParams = RouteParams> = (
  req: NextRequest,
  context: { params: P },
  auth: AuthContext
) => Promise<NextResponse>;

export function withAuth<P extends RouteParams = RouteParams>(handler: AuthenticatedApiHandler<P>) {
  return async (req: NextRequest, context: { params: P }) => {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, context, { session, accessToken: session.accessToken });
  };
}
