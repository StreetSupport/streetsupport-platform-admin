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
  return async (req: NextRequest, context: { params: Promise<P> }) => {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params Promise and pass the resolved value to our handler
    const resolvedParams = await context.params;
    return handler(req, { params: resolvedParams }, { session, accessToken: session.accessToken });
  };
}
