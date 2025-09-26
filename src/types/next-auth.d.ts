import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';
import { UserAuthClaims } from './auth';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      auth0Id: string;
      authClaims: UserAuthClaims;
      userName: string;
    } & DefaultSession['user'];
    accessToken?: string;
  }

  /**
   * Extend the built-in user types
   */
  interface User extends DefaultUser {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT types
   */
  interface JWT extends NextAuthJWT {
    id: string;
    auth0Id: string;
    authClaims: UserAuthClaims;
    userName: string;
    accessToken?: string;
  }
}
