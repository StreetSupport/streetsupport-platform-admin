import { NextAuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import Auth0Provider from 'next-auth/providers/auth0';
import { IUser } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER_BASE_URL!,
      authorization: {
        params: {
          audience: process.env.AUTH0_AUDIENCE!,
          scope: 'openid profile email',
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
        // Ensure the role is one of the allowed values
        const userRole = (user as IUser).role;
        if (userRole && ['admin', 'moderator', 'user'].includes(userRole)) {
          token.role = userRole as 'admin' | 'moderator' | 'user';
        } else {
          token.role = 'user'; // Default role
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'moderator' | 'user';
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  }
};
