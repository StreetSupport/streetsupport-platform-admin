import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';
import { IUser } from './IUser';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      role?: 'admin' | 'moderator' | 'user';
    } & DefaultSession['user'];
    accessToken?: string;
  }

  /**
   * Extend the built-in user types
   */
  interface User extends IUser {}
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT types
   */
  interface JWT extends NextAuthJWT {
    id: string;
    role?: 'admin' | 'moderator' | 'user';
    accessToken?: string;
  }
}
