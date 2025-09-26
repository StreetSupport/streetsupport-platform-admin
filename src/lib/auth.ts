import { NextAuthOptions } from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';
import { UserAuthClaims } from '@/types/auth';
import { fetchUserByAuth0Id, parseAuthClaims } from './userService';

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
        const formattedUserId = user.id.replace('auth0|', '');
        token.id = formattedUserId;
        token.auth0Id = formattedUserId;
        
        // Fetch user data from MongoDB to get AuthClaims
        try {
          const apiUser = await fetchUserByAuth0Id(token.auth0Id, token);
          if (apiUser) {
            token.authClaims = parseAuthClaims(apiUser.AuthClaims);
            token.userName = apiUser.UserName;
            token.associatedAreaId = apiUser.AssociatedAreaId;
          } else {
            // Default empty claims for new users
            token.authClaims = { roles: [], specificClaims: [] };
          }
        } catch (error) {
          console.error('Error fetching user claims:', error);
          token.authClaims = { roles: [], specificClaims: [] };
        }
      } 
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.auth0Id = token.auth0Id as string;
        session.user.authClaims = token.authClaims as UserAuthClaims;
        session.user.userName = token.userName as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  }
};
